import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { and, asc, eq, sql, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import {
  CurrentTenant,
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import {
  assertNotReserved,
  DefinitionValidationError,
  RESERVED_PREFIX,
  validateDefinition,
  validateFormulaDictionary,
  type ReportDefinitionDoc,
  type ReportFilterDef,
  type UserDictionaryShape,
} from './definition';
import { evaluateFormula, FormulaError, parseFormula } from './formula';
import {
  getSource,
  getSystemDictionary,
  joinedExpr,
  REPORT_SOURCES,
  type ReportSource,
  type SystemDictionary,
} from './report-sources';

/** Row cap (pack 12 rec #7): announced, never silent. */
const ROW_CAP = 5000;

type CellValue = string | number | boolean | null;

interface RunColumn {
  name: string;
  heading: string;
  width: number;
  justification: string;
  type: string;
  masked: boolean;
}

interface DictionaryRow {
  id: string;
  sourceId: string;
  name: string;
  description: string | null;
  columnHeading: string;
  width: number;
  justification: string;
  kind: string;
  formula: string | null;
  joinSourceId: string | null;
  joinFieldName: string | null;
  maskPermission: string | null;
}

/**
 * Self-service report builder (docs/handoffs/storis-report-builder;
 * owner chose the full builder, 2026-08-28). Slice 1: source catalog,
 * user dictionaries (formula + joined), definition CRUD with the pack
 * 02 validation checklist, clone, and the runner with prompts, date
 * codes, break/total groups, Summary Only, field masking, the row cap,
 * and run-time provenance (pack 04: options are part of the output).
 */
@TenantScoped()
@Controller('v1/report-builder')
export class ReportBuilderController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------ catalog

  @Get('sources')
  @RequirePermission('reports.builder.run')
  async sources(@CurrentTenant() tenant: RequestTenantContext): Promise<{
    sources: {
      id: string;
      name: string;
      description: string;
      dictionaries: {
        name: string;
        columnHeading: string;
        width: number;
        justification: string;
        type: string;
        kind: string;
        masked: boolean;
        selectable: boolean;
      }[];
      relations: { sourceId: string; name: string }[];
    }[];
  }> {
    const userDicts = await this.db
      .select()
      .from(schema.reportDictionaries)
      .orderBy(asc(schema.reportDictionaries.name));
    const visible = REPORT_SOURCES.filter((s) => hasPermission(tenant, s.requiredPermission));
    return {
      sources: visible.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        dictionaries: [
          ...s.dictionaries.map((d) => ({
            name: d.name,
            columnHeading: d.columnHeading,
            width: d.width,
            justification: d.justification,
            type: d.type,
            kind: 'system',
            masked: Boolean(d.maskPermission && !hasPermission(tenant, d.maskPermission)),
            selectable: d.selectableInBuilder !== false,
          })),
          ...userDicts
            .filter((d) => d.sourceId === s.id)
            .map((d) => ({
              name: d.name,
              columnHeading: d.columnHeading,
              width: d.width,
              justification: d.justification,
              type: 'text',
              kind: d.kind,
              masked: Boolean(d.maskPermission && !hasPermission(tenant, d.maskPermission)),
              selectable: true,
            })),
        ].sort((a, b) => a.name.localeCompare(b.name)),
        relations: s.relations
          .map((r) => ({ sourceId: r.sourceId, name: getSource(r.sourceId)?.name ?? r.sourceId }))
          .filter((r) => hasPermission(tenant, getSource(r.sourceId)?.requiredPermission ?? '')),
      })),
    };
  }

  // ------------------------------------------------------- dictionaries

  @Post('dictionaries')
  @RequirePermission('reports.builder.author')
  async createDictionary(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body()
    body: {
      sourceId?: string;
      name?: string;
      description?: string | null;
      columnHeading?: string | null;
      width?: number;
      justification?: string;
      kind?: string;
      formula?: string | null;
      joinSourceId?: string | null;
      joinFieldName?: string | null;
    },
  ): Promise<DictionaryRow> {
    const source = this.requireSource(tenant, body.sourceId);
    const name = (body.name ?? '').trim().toUpperCase();
    if (!name) throw new BadRequestException('name is required');
    if (name.length > 15) {
      // Pack 03: dictionary names cap at 15 characters.
      throw new BadRequestException('Dictionary names are limited to 15 characters');
    }
    if (getSystemDictionary(source, name)) {
      // Pack 03: never collide with an original dictionary of the file.
      throw new BadRequestException(
        `'${name}' is a system dictionary of '${source.id}' — pick a new name`,
      );
    }
    const kind = body.kind === 'joined' ? 'joined' : body.kind === 'formula' ? 'formula' : null;
    if (!kind) throw new BadRequestException("kind must be 'formula' or 'joined'");

    const existing = (await this.userDicts(source.id)).map(toShape);
    if (kind === 'formula') {
      if (!body.formula?.trim()) throw new BadRequestException('formula is required');
      if (body.joinSourceId || body.joinFieldName) {
        throw new BadRequestException('A formula dictionary cannot carry join fields');
      }
      try {
        validateFormulaDictionary(body.formula, source, existing, name);
      } catch (err) {
        if (err instanceof DefinitionValidationError) throw new BadRequestException(err.message);
        throw err;
      }
    } else {
      if (body.formula?.trim()) {
        throw new BadRequestException('A joined dictionary cannot carry a formula');
      }
      if (!body.joinSourceId || !body.joinFieldName) {
        throw new BadRequestException('joinSourceId and joinFieldName are required');
      }
      const resolved = joinedExpr(source, body.joinSourceId, body.joinFieldName);
      if (!resolved) {
        throw new BadRequestException(
          `Source '${source.id}' has no relation to '${body.joinSourceId}' carrying '${body.joinFieldName}'`,
        );
      }
    }

    const [row] = await this.db
      .insert(schema.reportDictionaries)
      .values({
        businessId: tenant.businessId!,
        sourceId: source.id,
        name,
        description: body.description ?? null,
        columnHeading: body.columnHeading?.trim() || name,
        width: clampWidth(body.width),
        justification: parseJustification(body.justification),
        kind,
        formula: kind === 'formula' ? body.formula!.trim() : null,
        joinSourceId: kind === 'joined' ? body.joinSourceId! : null,
        joinFieldName: kind === 'joined' ? body.joinFieldName! : null,
        createdByUserId: actor.id,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to create dictionary');
    await this.audit.log({
      action: 'report_dictionary.create',
      targetType: 'report_dictionary',
      targetId: row.id,
      after: { sourceId: source.id, name, kind },
    });
    return row as DictionaryRow;
  }

  @Delete('dictionaries/:id')
  @RequirePermission('reports.builder.author')
  async deleteDictionary(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true; affectedReports: string[] }> {
    const [dict] = await this.db
      .select()
      .from(schema.reportDictionaries)
      .where(eq(schema.reportDictionaries.id, id))
      .limit(1);
    if (!dict) throw new NotFoundException('Dictionary not found');
    // Pack 01 invariant 2: degradation must be visible — report back
    // which definitions still reference the name.
    const defs = await this.db
      .select({
        name: schema.reportDefinitions.name,
        json: schema.reportDefinitions.definitionJson,
      })
      .from(schema.reportDefinitions)
      .where(eq(schema.reportDefinitions.sourceId, dict.sourceId));
    const affected = defs
      .filter((d) => JSON.stringify(d.json).includes(`"${dict.name}"`))
      .map((d) => d.name);
    await this.db.delete(schema.reportDictionaries).where(eq(schema.reportDictionaries.id, id));
    await this.audit.log({
      action: 'report_dictionary.delete',
      targetType: 'report_dictionary',
      targetId: id,
      before: { sourceId: dict.sourceId, name: dict.name },
      after: { affectedReports: affected },
    });
    return { deleted: true, affectedReports: affected };
  }

  // -------------------------------------------------------- definitions

  @Get('reports')
  @RequirePermission('reports.builder.run')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
  ): Promise<{
    reports: {
      id: string;
      name: string;
      description: string | null;
      sourceId: string;
      access: string;
      systemOwned: boolean;
      ownerUserId: string | null;
      canEdit: boolean;
    }[];
  }> {
    const rows = await this.db
      .select()
      .from(schema.reportDefinitions)
      .orderBy(asc(schema.reportDefinitions.name));
    const visible = [];
    for (const r of rows) {
      if (!(await this.canRun(tenant, actor, r))) continue;
      visible.push({
        id: r.id,
        name: r.name,
        description: r.description,
        sourceId: r.sourceId,
        access: r.access,
        systemOwned: r.systemOwned,
        ownerUserId: r.ownerUserId,
        canEdit: !r.systemOwned && (await this.canEdit(tenant, actor, r)),
      });
    }
    return { reports: visible };
  }

  @Get('reports/:id')
  @RequirePermission('reports.builder.run')
  async get(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.load(id);
    if (!(await this.canRun(tenant, actor, row))) {
      throw new ForbiddenException('You cannot run this report');
    }
    const doc = row.definitionJson as unknown as ReportDefinitionDoc;
    const source = getSource(row.sourceId);
    let summaryOnlyAvailable = false;
    if (source) {
      try {
        summaryOnlyAvailable = validateDefinition(
          row.name,
          doc,
          source,
          (await this.userDicts(row.sourceId)).map(toShape),
          { title: row.title, subTitle: row.subTitle, footer: row.footer },
        ).summaryOnlyAvailable;
      } catch {
        // A stale definition still loads; the run will surface the error.
      }
    }
    return { ...row, summaryOnlyAvailable };
  }

  @Post('reports')
  @RequirePermission('reports.builder.author')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const parsed = await this.parseDefinitionBody(tenant, body);
    const [row] = await this.db
      .insert(schema.reportDefinitions)
      .values({
        businessId: tenant.businessId!,
        name: parsed.name,
        description: parsed.description,
        sourceId: parsed.source.id,
        title: parsed.title,
        subTitle: parsed.subTitle,
        footer: parsed.footer,
        runTimeInformation: parsed.runTimeInformation,
        addToSchedule: parsed.addToSchedule,
        access: parsed.access,
        definitionJson: parsed.doc as never,
        ownerUserId: actor.id,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to create report');
    await this.audit.log({
      action: 'report_definition.create',
      targetType: 'report_definition',
      targetId: row.id,
      after: { name: parsed.name, sourceId: parsed.source.id },
    });
    return { ...row, warnings: parsed.warnings };
  }

  @Patch('reports/:id')
  @RequirePermission('reports.builder.author')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const row = await this.load(id);
    if (row.systemOwned) {
      // Pack 01: vendor-standard reports are cloneable, never editable.
      throw new ForbiddenException('System reports cannot be edited — clone it instead');
    }
    if (!(await this.canEdit(tenant, actor, row))) {
      throw new ForbiddenException('You cannot edit this report');
    }
    const parsed = await this.parseDefinitionBody(
      tenant,
      { name: row.name, sourceId: row.sourceId, ...body },
      { allowExistingName: true },
    );
    const [updated] = await this.db
      .update(schema.reportDefinitions)
      .set({
        description: parsed.description,
        title: parsed.title,
        subTitle: parsed.subTitle,
        footer: parsed.footer,
        runTimeInformation: parsed.runTimeInformation,
        addToSchedule: parsed.addToSchedule,
        access: parsed.access,
        definitionJson: parsed.doc as never,
        updatedAt: new Date(),
      })
      .where(eq(schema.reportDefinitions.id, id))
      .returning();
    await this.audit.log({
      action: 'report_definition.update',
      targetType: 'report_definition',
      targetId: id,
      after: { name: row.name },
    });
    return { ...updated, warnings: parsed.warnings };
  }

  @Delete('reports/:id')
  @RequirePermission('reports.builder.author')
  async delete(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const row = await this.load(id);
    if (row.systemOwned) throw new ForbiddenException('System reports cannot be deleted');
    if (!(await this.canEdit(tenant, actor, row))) {
      throw new ForbiddenException('You cannot delete this report');
    }
    await this.db.delete(schema.reportDefinitions).where(eq(schema.reportDefinitions.id, id));
    await this.audit.log({
      action: 'report_definition.delete',
      targetType: 'report_definition',
      targetId: id,
      before: { name: row.name },
    });
    return { deleted: true };
  }

  /** Pack 04: the sanctioned path to customise a system report. */
  @Post('reports/:id/clone')
  @RequirePermission('reports.builder.author')
  async clone(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { name?: string },
  ): Promise<Record<string, unknown>> {
    const row = await this.load(id);
    if (!(await this.canRun(tenant, actor, row))) {
      throw new ForbiddenException('You cannot run this report');
    }
    const name = (body.name ?? '').trim();
    if (!name) throw new BadRequestException('name is required');
    if (name.toUpperCase().startsWith(RESERVED_PREFIX)) {
      throw new BadRequestException('Clones must not use the reserved system prefix');
    }
    const [copy] = await this.db
      .insert(schema.reportDefinitions)
      .values({
        businessId: tenant.businessId!,
        name,
        description: row.description,
        sourceId: row.sourceId,
        title: row.title,
        subTitle: row.subTitle,
        footer: row.footer,
        runTimeInformation: row.runTimeInformation,
        addToSchedule: false,
        access: 'anyone',
        systemOwned: false,
        definitionJson: row.definitionJson as never,
        ownerUserId: actor.id,
      })
      .returning();
    if (!copy) throw new BadRequestException('failed to clone report');
    await this.audit.log({
      action: 'report_definition.create',
      targetType: 'report_definition',
      targetId: copy.id,
      after: { name, clonedFrom: row.name },
    });
    return copy as unknown as Record<string, unknown>;
  }

  // -------------------------------------------------------------- runner

  @Post('reports/:id/run')
  @RequirePermission('reports.builder.run')
  async run(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      answers?: Record<string, unknown>;
      summaryOnly?: boolean;
      format?: 'json' | 'csv';
    },
    @Query('format') formatQ?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<unknown> {
    const row = await this.load(id);
    if (!(await this.canRun(tenant, actor, row))) {
      throw new ForbiddenException('You cannot run this report');
    }
    const source = this.requireSource(tenant, row.sourceId);
    const userDicts = await this.userDicts(source.id);
    const doc = row.definitionJson as unknown as ReportDefinitionDoc;
    let validated;
    try {
      validated = validateDefinition(row.name, doc, source, userDicts.map(toShape), {
        title: row.title,
        subTitle: row.subTitle,
        footer: row.footer,
      });
    } catch (err) {
      if (err instanceof DefinitionValidationError) {
        throw new BadRequestException(`Definition no longer valid: ${err.message}`);
      }
      throw err;
    }
    const summaryOnly = body.summaryOnly === true && validated.summaryOnlyAvailable;
    const answers = body.answers ?? {};
    const now = new Date();

    // Resolve every dictionary the run needs into a select expression.
    const userByName = new Map(userDicts.map((d) => [d.name, d]));
    const formulaDicts = new Map<string, string>(); // name -> formula
    const selectMap: Record<string, SQL | ReturnType<typeof sql>> = {};
    const need = new Set<string>();
    for (const c of doc.columns) need.add(c.dictionary);
    for (const f of doc.filters ?? []) need.add(f.dictionary);
    for (const s of doc.sorts ?? []) need.add(s.dictionary);
    for (const p of doc.prompts ?? []) need.add(p.dictionary);
    // Formula refs pull in their inputs.
    for (const name of [...need]) {
      const ud = userByName.get(name);
      if (ud?.kind === 'formula' && ud.formula) {
        for (const ref of parseFormula(ud.formula).refs) need.add(ref);
      }
    }
    for (const name of need) {
      const sys = getSystemDictionary(source, name);
      if (sys) {
        selectMap[name] = sql`${sys.expr}`;
        continue;
      }
      const ud = userByName.get(name);
      if (!ud) throw new BadRequestException(`Dictionary '${name}' no longer exists`);
      if (ud.kind === 'joined') {
        const resolved = joinedExpr(source, ud.joinSourceId!, ud.joinFieldName!);
        if (!resolved) {
          throw new BadRequestException(`Joined dictionary '${name}' no longer resolves`);
        }
        selectMap[name] = resolved.expr;
      } else {
        formulaDicts.set(name, ud.formula!);
      }
    }

    // WHERE: static filters (AND-only, pack 12 rec #1) + prompts (AND).
    const conds: (SQL | undefined)[] = [];
    for (const f of doc.filters ?? []) {
      conds.push(this.filterCond(source, userByName, f));
    }
    const promptEcho: Record<string, unknown> = {};
    for (const p of doc.prompts ?? []) {
      const raw = answers[p.dictionary];
      if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
        if (p.required) {
          throw new BadRequestException(`Prompt '${p.label}' is required`);
        }
        continue;
      }
      const expr = this.dictExpr(source, userByName, p.dictionary);
      const resolved = p.dateCode ? resolveDateCode(raw, now) : null;
      promptEcho[p.dictionary] = resolved ? `${raw} → ${resolved.echo}` : raw;
      if (resolved) {
        conds.push(sql`${expr} >= ${resolved.start}::date AND ${expr} <= ${resolved.end}::date`);
      } else if (p.promptType === 'range') {
        const [from, to] = Array.isArray(raw) ? raw : [raw, raw];
        if (from != null && from !== '') conds.push(sql`${expr} >= ${from}`);
        if (to != null && to !== '') conds.push(sql`${expr} <= ${to}`);
      } else if (p.promptType === 'multi_select') {
        const values = Array.isArray(raw) ? raw : [raw];
        const list = sql.join(
          values.map((v) => sql`${v}`),
          sql`, `,
        );
        conds.push(
          p.includeExclude === 'exclude'
            ? sql`(${expr} IS NULL OR ${expr} NOT IN (${list}))`
            : sql`${expr} IN (${list})`,
        );
      } else {
        conds.push(sql`${expr} = ${raw}`);
      }
    }

    // ORDER BY sorts + pk tiebreaker (pack 12 rec #5).
    const orderBy: SQL[] = (doc.sorts ?? []).map(
      (s) => sql`${this.dictExpr(source, userByName, s.dictionary)} ASC`,
    );
    orderBy.push(sql`${source.tiebreaker} ASC`);

    let q = source.from(this.db.select(selectMap as never));
    const where = and(...conds.filter((c): c is SQL => Boolean(c)));
    if (where) q = q.where(where);
    q = q.orderBy(...orderBy).limit(ROW_CAP + 1);
    const raw: Record<string, CellValue>[] = await q;
    const truncated = raw.length > ROW_CAP;
    const fetched = truncated ? raw.slice(0, ROW_CAP) : raw;

    // Post-fetch: formulas, then masking (pack 07: a rendering rule).
    const rows = fetched.map((r) => {
      const out: Record<string, CellValue> = { ...r };
      for (const [name, formula] of formulaDicts) {
        try {
          out[name] = evaluateFormula(formula, out) as CellValue;
        } catch (err) {
          out[name] = err instanceof FormulaError ? null : null;
        }
      }
      return out;
    });
    const columns: RunColumn[] = doc.columns.map((c) => {
      const sys = getSystemDictionary(source, c.dictionary);
      const ud = userByName.get(c.dictionary);
      const maskPerm = sys?.maskPermission ?? ud?.maskPermission ?? null;
      return {
        name: c.dictionary,
        heading: sys?.columnHeading ?? ud?.columnHeading ?? c.dictionary,
        width: c.width ?? sys?.width ?? ud?.width ?? 12,
        justification: sys?.justification ?? ud?.justification ?? 'left',
        type: sys?.type ?? 'text',
        masked: Boolean(maskPerm && !hasPermission(tenant, maskPerm)),
      };
    });
    for (const col of columns) {
      if (!col.masked) continue;
      for (const r of rows) r[col.name] = null; // header stays, data goes
    }

    // Breaks + totals.
    const breakCol = doc.columns.find((c) => c.break)?.dictionary ?? null;
    const totalCols = doc.columns.filter((c) => c.total).map((c) => c.dictionary);
    const grandTotals: Record<string, number> = {};
    const groups: { key: CellValue; rows: number; totals: Record<string, number> }[] = [];
    if (totalCols.length > 0) {
      for (const t of totalCols) grandTotals[t] = 0;
      let current: (typeof groups)[number] | null = null;
      for (const r of rows) {
        if (breakCol) {
          const key = r[breakCol] ?? null;
          if (!current || current.key !== key) {
            current = { key, rows: 0, totals: Object.fromEntries(totalCols.map((t) => [t, 0])) };
            groups.push(current);
          }
          current.rows += 1;
        }
        for (const t of totalCols) {
          const v = r[t];
          const n = typeof v === 'number' ? v : Number(v ?? 0);
          if (!Number.isNaN(n)) {
            grandTotals[t]! += n;
            if (current) current.totals[t]! += n;
          }
        }
      }
    }

    // Pack 04: run-time options are part of the output.
    const provenance = {
      report: row.name,
      generatedAt: now.toISOString(),
      runBy: actor.email ?? actor.id,
      answers: promptEcho,
      summaryOnly,
      truncated,
      rowCap: ROW_CAP,
    };

    const header = renderTokens(row.title, promptEcho);
    const subTitle = renderTokens(row.subTitle, promptEcho);
    const footer = renderTokens(row.footer, promptEcho);

    const format = (body.format ?? formatQ) === 'csv' ? 'csv' : 'json';
    if (format === 'csv') {
      if (!hasPermission(tenant, 'reports.export')) {
        throw new ForbiddenException('reports.export permission required for CSV download');
      }
      const csv = toCsv(columns, summaryOnly ? [] : rows, groups, grandTotals, provenance);
      res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res?.setHeader(
        'Content-Disposition',
        `attachment; filename="${row.name.replace(/[^A-Za-z0-9_-]+/g, '-')}-${now.toISOString().slice(0, 10)}.csv"`,
      );
      return csv;
    }
    return {
      title: header,
      subTitle,
      footer,
      runTimeInformation: row.runTimeInformation,
      columns,
      rows: summaryOnly ? [] : rows,
      groups: breakCol ? groups : [],
      grandTotals,
      summaryOnly,
      truncated,
      warnings: validated.warnings,
      provenance,
    };
  }

  // ------------------------------------------------------------- helpers

  private requireSource(tenant: RequestTenantContext, id?: string | null): ReportSource {
    if (!id) throw new BadRequestException('sourceId is required');
    const source = getSource(id);
    if (!source) throw new NotFoundException(`Unknown source '${id}'`);
    if (!hasPermission(tenant, source.requiredPermission)) {
      // Pack 07 layer 2: restriction denies the whole source.
      throw new ForbiddenException(`You do not have access to source '${id}'`);
    }
    return source;
  }

  private async load(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.reportDefinitions)
      .where(eq(schema.reportDefinitions.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Report not found');
    return row;
  }

  private async userDicts(sourceId: string) {
    return this.db
      .select()
      .from(schema.reportDictionaries)
      .where(eq(schema.reportDictionaries.sourceId, sourceId))
      .orderBy(asc(schema.reportDictionaries.name));
  }

  /** Pack 07 layer 1 + 2, evaluated before a report shows anywhere. */
  private async canRun(
    tenant: RequestTenantContext,
    actor: CurrentUserPayload,
    row: { access: string; ownerUserId: string | null; sourceId: string },
  ): Promise<boolean> {
    const source = getSource(row.sourceId);
    if (!source || !hasPermission(tenant, source.requiredPermission)) return false;
    if (tenant.isSuperAdmin) return true;
    if (row.access === 'owner_only') return row.ownerUserId === actor.id;
    if (row.access === 'same_role') {
      if (row.ownerUserId === actor.id) return true;
      const ownerRole = await this.ownerRoleId(row.ownerUserId);
      return ownerRole != null && ownerRole === tenant.roleId;
    }
    return true;
  }

  /** Layer 1: 'anyone' means anyone may also edit (pack 07). */
  private async canEdit(
    tenant: RequestTenantContext,
    actor: CurrentUserPayload,
    row: { access: string; ownerUserId: string | null; sourceId: string },
  ): Promise<boolean> {
    return this.canRun(tenant, actor, row);
  }

  private async ownerRoleId(ownerUserId: string | null): Promise<string | null> {
    if (!ownerUserId) return null;
    const [m] = await this.db
      .select({ roleId: schema.memberships.roleId })
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, ownerUserId))
      .limit(1);
    return m?.roleId ?? null;
  }

  private dictExpr(
    source: ReportSource,
    userByName: Map<
      string,
      { kind: string; joinSourceId: string | null; joinFieldName: string | null }
    >,
    name: string,
  ): SQL {
    const sys = getSystemDictionary(source, name);
    if (sys) return sql`${sys.expr}`;
    const ud = userByName.get(name);
    if (ud?.kind === 'joined') {
      const resolved = joinedExpr(source, ud.joinSourceId!, ud.joinFieldName!);
      if (resolved) return resolved.expr;
    }
    throw new BadRequestException(`'${name}' cannot be used in filters/sorts/prompts`);
  }

  private filterCond(
    source: ReportSource,
    userByName: Map<
      string,
      { kind: string; joinSourceId: string | null; joinFieldName: string | null }
    >,
    f: ReportFilterDef,
  ): SQL | undefined {
    const expr = this.dictExpr(source, userByName, f.dictionary);
    const sys = getSystemDictionary(source, f.dictionary);
    // Pack 02 blank idiom: "" means the empty string.
    const isBlankLiteral = f.value === '""';
    switch (f.operator) {
      case 'EQ':
        return isBlankLiteral
          ? sql`(${expr} IS NULL OR ${expr}::text = '')`
          : sql`${expr} = ${coerce(sys, f.value)}`;
      case 'NE':
        return isBlankLiteral
          ? sql`(${expr} IS NOT NULL AND ${expr}::text <> '')`
          : sql`${expr} IS DISTINCT FROM ${coerce(sys, f.value)}`;
      case 'LT':
        return sql`${expr} < ${coerce(sys, f.value)}`;
      case 'GT':
        return sql`${expr} > ${coerce(sys, f.value)}`;
      case 'LE':
        return sql`${expr} <= ${coerce(sys, f.value)}`;
      case 'GE':
        return sql`${expr} >= ${coerce(sys, f.value)}`;
      case 'TR':
        return sql`${expr} = true`;
      case 'FL':
        return sql`${expr} = false`;
      default:
        return undefined;
    }
  }

  private async parseDefinitionBody(
    tenant: RequestTenantContext,
    body: Record<string, unknown>,
    opts: { allowExistingName?: boolean } = {},
  ) {
    const name = String(body.name ?? '').trim();
    if (!name) throw new BadRequestException('name is required');
    if (!opts.allowExistingName) {
      try {
        assertNotReserved(name);
      } catch (err) {
        if (err instanceof DefinitionValidationError) throw new BadRequestException(err.message);
        throw err;
      }
    }
    const source = this.requireSource(tenant, body.sourceId as string | undefined);
    const userDicts = (await this.userDicts(source.id)).map(toShape);
    const doc: ReportDefinitionDoc = {
      columns: (body.columns as ReportDefinitionDoc['columns']) ?? [],
      prompts: (body.prompts as ReportDefinitionDoc['prompts']) ?? [],
      filters: (body.filters as ReportDefinitionDoc['filters']) ?? [],
      sorts: (body.sorts as ReportDefinitionDoc['sorts']) ?? [],
    };
    const title = (body.title as string | null) ?? null;
    const subTitle = (body.subTitle as string | null) ?? null;
    const footer = (body.footer as string | null) ?? null;
    let warnings: string[];
    try {
      warnings = validateDefinition(name, doc, source, userDicts, {
        title,
        subTitle,
        footer,
      }).warnings;
    } catch (err) {
      if (err instanceof DefinitionValidationError) throw new BadRequestException(err.message);
      throw err;
    }
    const access = ['anyone', 'same_role', 'owner_only'].includes(String(body.access))
      ? String(body.access)
      : 'anyone';
    return {
      name,
      source,
      doc,
      title,
      subTitle,
      footer,
      description: (body.description as string | null) ?? null,
      runTimeInformation: (body.runTimeInformation as string | null) ?? null,
      addToSchedule: body.addToSchedule === true,
      access,
      warnings,
    };
  }
}

function hasPermission(tenant: RequestTenantContext, permission: string): boolean {
  if (tenant.isSuperAdmin) return true;
  return tenant.permissions.has(permission as never);
}

function clampWidth(w: unknown): number {
  const n = typeof w === 'number' && Number.isInteger(w) ? w : 12;
  return Math.min(60, Math.max(2, n));
}

function parseJustification(j: unknown): string {
  return j === 'right' || j === 'centered' ? j : 'left';
}

function toShape(d: {
  name: string;
  kind: string;
  width: number;
  maskPermission: string | null;
  formula?: string | null;
  joinSourceId?: string | null;
  joinFieldName?: string | null;
}): UserDictionaryShape & {
  formula?: string | null;
  joinSourceId?: string | null;
  joinFieldName?: string | null;
} {
  return {
    name: d.name,
    kind: d.kind as 'formula' | 'joined',
    width: d.width,
    maskPermission: d.maskPermission,
    formula: d.formula,
    joinSourceId: d.joinSourceId,
    joinFieldName: d.joinFieldName,
  };
}

/**
 * Relative date codes (pack 02): stored as the code, resolved at
 * execution — a scheduled report follows the calendar. Periods are
 * calendar months (presumed fiscal calendar; flagged to the owner in
 * the cash-balancing reconcile).
 */
function resolveDateCode(
  raw: unknown,
  now: Date,
): { start: string; end: string; echo: string } | null {
  const code = String(Array.isArray(raw) ? raw[0] : raw).toUpperCase();
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  switch (code) {
    case 'TDAY':
      return { start: day(today), end: day(today), echo: day(today) };
    case 'YDAY': {
      const y = new Date(today.getTime() - 86_400_000);
      return { start: day(y), end: day(y), echo: day(y) };
    }
    case 'CPTD': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { start: day(start), end: day(today), echo: `${day(start)}–${day(today)}` };
    }
    case 'LPTD': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(
        Math.min(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()),
        ),
      );
      return { start: day(start), end: day(end), echo: `${day(start)}–${day(end)}` };
    }
    default:
      return null;
  }
}

function coerce(sys: SystemDictionary | undefined, value: string | null | undefined): unknown {
  if (value == null) return null;
  if (sys && (sys.type === 'number' || sys.type === 'money')) {
    const n = Number(value);
    if (Number.isNaN(n)) throw new BadRequestException(`'${value}' is not a number`);
    return n;
  }
  return value;
}

function renderTokens(text: string | null, answers: Record<string, unknown>): string | null {
  if (!text) return text;
  // Unresolved tokens render literally so authors notice (pack 02).
  return text.replace(/\{([A-Z0-9_.]+)\}/gi, (whole, name: string) =>
    name in answers ? String(answers[name]) : whole,
  );
}

function csvCell(v: CellValue): string {
  if (v == null) return '';
  let s = String(v);
  // CSV-injection guard (house convention since PR #48).
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(
  columns: RunColumn[],
  rows: Record<string, CellValue>[],
  groups: { key: CellValue; rows: number; totals: Record<string, number> }[],
  grandTotals: Record<string, number>,
  provenance: Record<string, unknown>,
): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(provenance)) {
    lines.push(`# ${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  }
  lines.push(columns.map((c) => csvCell(c.heading)).join(','));
  for (const r of rows) {
    lines.push(columns.map((c) => csvCell(r[c.name] ?? null)).join(','));
  }
  for (const g of groups) {
    lines.push(
      columns
        .map((c, i) =>
          i === 0
            ? csvCell(`TOTAL ${String(g.key ?? '')}`)
            : c.name in g.totals
              ? csvCell(g.totals[c.name]!)
              : '',
        )
        .join(','),
    );
  }
  if (Object.keys(grandTotals).length > 0) {
    lines.push(
      columns
        .map((c, i) =>
          i === 0 ? 'GRAND TOTAL' : c.name in grandTotals ? csvCell(grandTotals[c.name]!) : '',
        )
        .join(','),
    );
  }
  return lines.join('\n');
}
