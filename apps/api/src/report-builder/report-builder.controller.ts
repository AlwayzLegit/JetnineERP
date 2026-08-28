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
import { asc, desc, eq } from 'drizzle-orm';
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
  type UserDictionaryShape,
} from './definition';
import { applyMasking, executeReportRun, toCsv, type RunResult } from './report-runner';
import {
  getSource,
  getSystemDictionary,
  joinedExpr,
  REPORT_SOURCES,
  type ReportSource,
} from './report-sources';

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
      format?: 'json' | 'csv' | 'archive';
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
    const result = await executeReportRun(this.db, {
      row,
      source,
      userDicts: userDicts.map(toShape),
      answers: body.answers ?? {},
      summaryOnly: body.summaryOnly,
      runBy: actor.email ?? actor.id,
    });

    const format =
      (body.format ?? formatQ) === 'csv'
        ? 'csv'
        : (body.format ?? formatQ) === 'archive'
          ? 'archive'
          : 'json';

    if (format === 'archive') {
      // Pack 05: no immediate render — one archive record, storing the
      // UNMASKED result + a definition snapshot; masking re-applies per
      // viewer at read time (pack 07: view-time entitlement checks).
      const [archive] = await this.db
        .insert(schema.reportArchives)
        .values({
          businessId: tenant.businessId!,
          reportDefinitionId: row.id,
          reportName: row.name,
          sourceId: row.sourceId,
          access: row.access,
          ownerUserId: row.ownerUserId,
          runSource: 'regular',
          definitionSnapshotJson: row.definitionJson as never,
          resultJson: result as never,
          rowCount: result.rows.length,
          createdByUserId: actor.id,
        })
        .returning({ id: schema.reportArchives.id });
      await this.audit.log({
        action: 'report_archive.create',
        targetType: 'report_archive',
        targetId: archive!.id,
        after: { reportName: row.name, rowCount: result.rows.length, runSource: 'regular' },
      });
      return { archiveId: archive!.id, reportName: row.name, rowCount: result.rows.length };
    }

    applyMasking(result, (perm) => hasPermission(tenant, perm));
    if (format === 'csv') {
      if (!hasPermission(tenant, 'reports.export')) {
        throw new ForbiddenException('reports.export permission required for CSV download');
      }
      const csv = toCsv(result);
      res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res?.setHeader(
        'Content-Disposition',
        `attachment; filename="${row.name.replace(/[^A-Za-z0-9_-]+/g, '-')}-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      );
      return csv;
    }
    return result;
  }

  // ------------------------------------------------------------ archives

  @Get('archives')
  @RequirePermission('reports.builder.run')
  async listArchives(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
  ): Promise<{
    archives: {
      id: string;
      reportName: string;
      runSource: string;
      rowCount: number;
      createdAt: Date;
    }[];
  }> {
    const rows = await this.db
      .select({
        id: schema.reportArchives.id,
        reportName: schema.reportArchives.reportName,
        sourceId: schema.reportArchives.sourceId,
        access: schema.reportArchives.access,
        ownerUserId: schema.reportArchives.ownerUserId,
        runSource: schema.reportArchives.runSource,
        rowCount: schema.reportArchives.rowCount,
        createdAt: schema.reportArchives.createdAt,
      })
      .from(schema.reportArchives)
      .orderBy(desc(schema.reportArchives.createdAt))
      .limit(200);
    const visible = [];
    for (const r of rows) {
      // View-time entitlement re-check (pack 07 checklist / test #61).
      if (!(await this.canRun(tenant, actor, r))) continue;
      visible.push({
        id: r.id,
        reportName: r.reportName,
        runSource: r.runSource,
        rowCount: r.rowCount,
        createdAt: r.createdAt,
      });
    }
    return { archives: visible };
  }

  @Get('archives/:id')
  @RequirePermission('reports.builder.run')
  async getArchive(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<unknown> {
    const [row] = await this.db
      .select()
      .from(schema.reportArchives)
      .where(eq(schema.reportArchives.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Archive not found');
    // Test #61: revoked access denies the archive even after generation.
    if (!(await this.canRun(tenant, actor, row))) {
      throw new ForbiddenException('You cannot view this archive');
    }
    const result = row.resultJson as unknown as RunResult;
    applyMasking(result, (perm) => hasPermission(tenant, perm));
    if (format === 'csv') {
      if (!hasPermission(tenant, 'reports.export')) {
        throw new ForbiddenException('reports.export permission required for CSV download');
      }
      const csv = toCsv(result);
      res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res?.setHeader(
        'Content-Disposition',
        `attachment; filename="${row.reportName.replace(/[^A-Za-z0-9_-]+/g, '-')}-archive.csv"`,
      );
      return csv;
    }
    return { ...result, runSource: row.runSource, createdAt: row.createdAt };
  }

  @Delete('archives/:id')
  @RequirePermission('reports.builder.author')
  async deleteArchive(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [row] = await this.db
      .select()
      .from(schema.reportArchives)
      .where(eq(schema.reportArchives.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Archive not found');
    if (!(await this.canRun(tenant, actor, row))) {
      throw new ForbiddenException('You cannot delete this archive');
    }
    await this.db.delete(schema.reportArchives).where(eq(schema.reportArchives.id, id));
    await this.audit.log({
      action: 'report_archive.delete',
      targetType: 'report_archive',
      targetId: id,
      before: { reportName: row.reportName },
    });
    return { deleted: true };
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
