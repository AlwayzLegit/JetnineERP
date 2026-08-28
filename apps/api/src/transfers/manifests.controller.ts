import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { TransferShipService } from './transfer-ship.service';

/**
 * Q1 (owner 2026-08-28): manifests without scanning. A manifest is one
 * truck run on one lane — building against the same open (to-location,
 * route, date) key APPENDS (STORIS 08-manifests). Complete ships every
 * draft on it through the ONE ship path; receiving stays tap-based per
 * transfer at the destination.
 */

interface BuildBody {
  fromLocationId?: string;
  toLocationId?: string;
  /** YYYY-MM-DD — the truck run's date. */
  manifestDate?: string;
  routeName?: string | null;
  transferIds?: string[];
  /** 0-99; lower loads first. Defaults to the manifest's last-used load. */
  loadNumber?: number;
  notes?: string | null;
}

interface ManifestRow {
  id: string;
  number: string;
  status: string;
  manifestDate: string;
  routeName: string | null;
  fromLocationId: string;
  fromLocationName: string | null;
  toLocationId: string;
  toLocationName: string | null;
  transferCount: number;
  notes: string | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
}

interface ManifestTransferRow {
  id: string;
  number: string;
  status: string;
  transferType: string;
  loadNumber: number | null;
  ticketPrintedAt: Date | null;
  lineCount: number;
  unitCount: number;
}

interface ManifestDetail extends ManifestRow {
  businessName: string | null;
  fromLocationAddressJson: unknown;
  toLocationAddressJson: unknown;
  transfers: ManifestTransferRow[];
}

const MANIFEST_STATUSES = ['open', 'completed', 'canceled'];

@TenantScoped()
@Controller('v1/stock-manifests')
export class ManifestsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(TransferShipService) private readonly shipSvc: TransferShipService,
  ) {}

  @Get()
  @RequirePermission('inventory.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('status') status?: string,
  ): Promise<{ rows: ManifestRow[] }> {
    const conditions: SQL[] = [eq(schema.stockManifests.businessId, tenant.businessId!)];
    if (status) {
      if (!MANIFEST_STATUSES.includes(status)) {
        throw new BadRequestException(`status must be one of ${MANIFEST_STATUSES.join(', ')}`);
      }
      conditions.push(eq(schema.stockManifests.status, status));
    }
    const fromLoc = alias(schema.locations, 'from_loc');
    const toLoc = alias(schema.locations, 'to_loc');
    const rows = await this.db
      .select({
        id: schema.stockManifests.id,
        number: schema.stockManifests.number,
        status: schema.stockManifests.status,
        manifestDate: schema.stockManifests.manifestDate,
        routeName: schema.stockManifests.routeName,
        fromLocationId: schema.stockManifests.fromLocationId,
        fromLocationName: fromLoc.name,
        toLocationId: schema.stockManifests.toLocationId,
        toLocationName: toLoc.name,
        transferCount: sql<number>`(SELECT COUNT(*) FROM stock_transfers st WHERE st.manifest_id = ${schema.stockManifests.id})::int`,
        notes: schema.stockManifests.notes,
        completedAt: schema.stockManifests.completedAt,
        canceledAt: schema.stockManifests.canceledAt,
        createdAt: schema.stockManifests.createdAt,
      })
      .from(schema.stockManifests)
      .leftJoin(fromLoc, eq(fromLoc.id, schema.stockManifests.fromLocationId))
      .leftJoin(toLoc, eq(toLoc.id, schema.stockManifests.toLocationId))
      .where(and(...conditions))
      .orderBy(desc(schema.stockManifests.manifestDate), desc(schema.stockManifests.createdAt))
      .limit(200);
    return { rows };
  }

  /**
   * Build: append the given draft transfers to the open manifest keyed
   * by (to-location, route, date) — creating it when none exists.
   */
  @Post()
  @RequirePermission('inventory.transfer')
  async build(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: BuildBody,
  ): Promise<ManifestDetail> {
    if (!body.fromLocationId) throw new BadRequestException('fromLocationId is required');
    if (!body.toLocationId) throw new BadRequestException('toLocationId is required');
    if (!body.manifestDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.manifestDate)) {
      throw new BadRequestException('manifestDate must be YYYY-MM-DD');
    }
    if (!body.transferIds || body.transferIds.length === 0) {
      throw new BadRequestException('transferIds must contain at least one entry');
    }
    if (new Set(body.transferIds).size !== body.transferIds.length) {
      throw new BadRequestException('transferIds must not repeat');
    }
    if (
      body.loadNumber !== undefined &&
      (!Number.isInteger(body.loadNumber) || body.loadNumber < 0 || body.loadNumber > 99)
    ) {
      throw new BadRequestException('loadNumber must be an integer 0-99');
    }
    const routeName = body.routeName?.trim() || null;

    // 08-manifests §2 validation: surface the specific reason per
    // transfer, not a generic error.
    const transfers = await this.db
      .select()
      .from(schema.stockTransfers)
      .where(inArray(schema.stockTransfers.id, body.transferIds));
    const byId = new Map(transfers.map((t) => [t.id, t]));
    for (const id of body.transferIds) {
      const t = byId.get(id);
      if (!t) throw new NotFoundException(`Transfer not found: ${id}`);
      if (t.fromLocationId !== body.fromLocationId) {
        throw new BadRequestException(
          `Transfer ${t.number} does not ship from the manifest's from-location`,
        );
      }
      if (t.toLocationId !== body.toLocationId) {
        throw new BadRequestException(
          `Transfer ${t.number} does not ship to the manifest's to-location`,
        );
      }
      if (t.status !== 'draft') {
        throw new BadRequestException(
          `Transfer ${t.number} is ${t.status} — only drafts can be manifested`,
        );
      }
      if (t.manifestId !== null) {
        throw new BadRequestException(`Transfer ${t.number} is already on a manifest`);
      }
    }

    // Same open key appends; otherwise create.
    const [existing] = await this.db
      .select()
      .from(schema.stockManifests)
      .where(
        and(
          eq(schema.stockManifests.businessId, tenant.businessId!),
          eq(schema.stockManifests.toLocationId, body.toLocationId),
          eq(schema.stockManifests.fromLocationId, body.fromLocationId),
          eq(schema.stockManifests.manifestDate, body.manifestDate),
          routeName === null
            ? sql`${schema.stockManifests.routeName} IS NULL`
            : eq(schema.stockManifests.routeName, routeName),
          eq(schema.stockManifests.status, 'open'),
        ),
      )
      .limit(1);

    let manifestId: string;
    let created = false;
    if (existing) {
      manifestId = existing.id;
    } else {
      const number = await this.generateNumber(tenant.businessId!);
      const [row] = await this.db
        .insert(schema.stockManifests)
        .values({
          businessId: tenant.businessId!,
          fromLocationId: body.fromLocationId,
          toLocationId: body.toLocationId,
          number,
          manifestDate: body.manifestDate,
          routeName,
          notes: body.notes ?? null,
          createdByUserId: actor.id,
        })
        .returning();
      if (!row) throw new BadRequestException('failed to create manifest');
      manifestId = row.id;
      created = true;
    }

    // Load-number semantics (08-manifests §1): explicit wins; otherwise
    // reuse the manifest's last assigned load, or start at 1.
    let loadNumber = body.loadNumber;
    if (loadNumber === undefined) {
      const [last] = await this.db
        .select({
          max: sql<number | null>`MAX(${schema.stockTransfers.loadNumber})`,
        })
        .from(schema.stockTransfers)
        .where(eq(schema.stockTransfers.manifestId, manifestId));
      loadNumber = last?.max ?? 1;
    }

    await this.db
      .update(schema.stockTransfers)
      .set({ manifestId, loadNumber, updatedAt: new Date() })
      .where(inArray(schema.stockTransfers.id, body.transferIds));

    await this.audit.log({
      action: created ? 'stock_manifest.create' : 'stock_manifest.append',
      targetType: 'stock_manifest',
      targetId: manifestId,
      after: {
        transferIds: body.transferIds,
        loadNumber,
        manifestDate: body.manifestDate,
        routeName,
      },
    });
    return this.hydrate(manifestId);
  }

  @Get(':id')
  @RequirePermission('inventory.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<ManifestDetail> {
    return this.hydrate(id);
  }

  /**
   * F178 (lean): removal from an existing manifest is the auditable
   * exception — the reason lands in the audit register.
   */
  @Post(':id/remove-transfer')
  @RequirePermission('inventory.transfer')
  async removeTransfer(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: { transferId?: string; reason?: string | null },
  ): Promise<ManifestDetail> {
    if (!body.transferId) throw new BadRequestException('transferId is required');
    const manifest = await this.mustGet(id);
    if (manifest.status !== 'open') {
      throw new ForbiddenException(`Cannot modify a ${manifest.status} manifest`);
    }
    const [transfer] = await this.db
      .select()
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.id, body.transferId))
      .limit(1);
    if (!transfer || transfer.manifestId !== id) {
      throw new NotFoundException('Transfer is not on this manifest');
    }
    await this.db
      .update(schema.stockTransfers)
      .set({ manifestId: null, loadNumber: null, updatedAt: new Date() })
      .where(eq(schema.stockTransfers.id, body.transferId));
    await this.audit.log({
      action: 'stock_manifest.remove_transfer',
      targetType: 'stock_manifest',
      targetId: id,
      after: {
        transferId: body.transferId,
        transferNumber: transfer.number,
        reason: body.reason ?? null,
      },
    });
    return this.hydrate(id);
  }

  /**
   * Complete: the truck leaves — ship every draft on the manifest
   * through the ONE ship path (print gate and stock checks included).
   * Any failure aborts the whole completion so the truck document and
   * the system never disagree about what left.
   */
  @Post(':id/complete')
  @RequirePermission('inventory.transfer')
  async complete(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { notes?: string | null },
  ): Promise<ManifestDetail> {
    const manifest = await this.mustGet(id);
    if (manifest.status !== 'open') {
      throw new ForbiddenException(`Cannot complete a ${manifest.status} manifest`);
    }
    const transfers = await this.db
      .select({
        id: schema.stockTransfers.id,
        status: schema.stockTransfers.status,
        loadNumber: schema.stockTransfers.loadNumber,
      })
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.manifestId, id));
    if (transfers.length === 0) {
      throw new BadRequestException('Manifest has no transfers — cancel it instead');
    }
    const ops = await this.shipSvc.transferOps(tenant.businessId!);
    // Lower loads first — the physical loading order is the ship order.
    const drafts = transfers
      .filter((t) => t.status === 'draft')
      .sort((a, b) => (a.loadNumber ?? 100) - (b.loadNumber ?? 100));
    for (const t of drafts) {
      await this.shipSvc.ship(tenant.businessId!, actor.id, t.id, body.notes ?? null, ops, true);
    }
    await this.db
      .update(schema.stockManifests)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.stockManifests.id, id));
    await this.audit.log({
      action: 'stock_manifest.complete',
      targetType: 'stock_manifest',
      targetId: id,
      after: { shipped: drafts.length, transferCount: transfers.length },
    });
    return this.hydrate(id);
  }

  /** Cancel an open manifest: transfers detach and stay drafts. */
  @Post(':id/cancel')
  @RequirePermission('inventory.transfer')
  async cancel(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<ManifestDetail> {
    const manifest = await this.mustGet(id);
    if (manifest.status !== 'open') {
      throw new ForbiddenException(`Cannot cancel a ${manifest.status} manifest`);
    }
    const detached = await this.db
      .update(schema.stockTransfers)
      .set({ manifestId: null, loadNumber: null, updatedAt: new Date() })
      .where(eq(schema.stockTransfers.manifestId, id))
      .returning({ id: schema.stockTransfers.id });
    await this.db
      .update(schema.stockManifests)
      .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.stockManifests.id, id));
    await this.audit.log({
      action: 'stock_manifest.cancel',
      targetType: 'stock_manifest',
      targetId: id,
      after: { detachedTransfers: detached.length },
    });
    return this.hydrate(id);
  }

  private async mustGet(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.stockManifests)
      .where(eq(schema.stockManifests.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Manifest not found');
    return row;
  }

  private async hydrate(id: string): Promise<ManifestDetail> {
    const fromLoc = alias(schema.locations, 'from_loc');
    const toLoc = alias(schema.locations, 'to_loc');
    const [row] = await this.db
      .select({
        id: schema.stockManifests.id,
        number: schema.stockManifests.number,
        status: schema.stockManifests.status,
        manifestDate: schema.stockManifests.manifestDate,
        routeName: schema.stockManifests.routeName,
        fromLocationId: schema.stockManifests.fromLocationId,
        fromLocationName: fromLoc.name,
        fromLocationAddressJson: fromLoc.addressJson,
        toLocationId: schema.stockManifests.toLocationId,
        toLocationName: toLoc.name,
        toLocationAddressJson: toLoc.addressJson,
        businessName: schema.businesses.name,
        notes: schema.stockManifests.notes,
        completedAt: schema.stockManifests.completedAt,
        canceledAt: schema.stockManifests.canceledAt,
        createdAt: schema.stockManifests.createdAt,
      })
      .from(schema.stockManifests)
      .leftJoin(fromLoc, eq(fromLoc.id, schema.stockManifests.fromLocationId))
      .leftJoin(toLoc, eq(toLoc.id, schema.stockManifests.toLocationId))
      .leftJoin(schema.businesses, eq(schema.businesses.id, schema.stockManifests.businessId))
      .where(eq(schema.stockManifests.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Manifest not found');

    const transfers = await this.db
      .select({
        id: schema.stockTransfers.id,
        number: schema.stockTransfers.number,
        status: schema.stockTransfers.status,
        transferType: schema.stockTransfers.transferType,
        loadNumber: schema.stockTransfers.loadNumber,
        ticketPrintedAt: schema.stockTransfers.ticketPrintedAt,
        lineCount: sql<number>`(SELECT COUNT(*) FROM stock_transfer_lines l WHERE l.transfer_id = ${schema.stockTransfers.id})::int`,
        unitCount: sql<number>`(SELECT COALESCE(SUM(l.quantity_shipped), 0) FROM stock_transfer_lines l WHERE l.transfer_id = ${schema.stockTransfers.id})::int`,
      })
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.manifestId, id))
      .orderBy(schema.stockTransfers.loadNumber, schema.stockTransfers.number);

    return { ...row, transferCount: transfers.length, transfers };
  }

  private async generateNumber(businessId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(schema.stockManifests)
        .where(
          and(
            eq(schema.stockManifests.businessId, businessId),
            sql`${schema.stockManifests.number} LIKE ${`MAN-${year}-%`}`,
          ),
        );
      const seq = (rows[0]?.count ?? 0) + 1 + attempt;
      const candidate = `MAN-${year}-${String(seq).padStart(4, '0')}`;
      const [existing] = await this.db
        .select({ id: schema.stockManifests.id })
        .from(schema.stockManifests)
        .where(
          and(
            eq(schema.stockManifests.businessId, businessId),
            eq(schema.stockManifests.number, candidate),
          ),
        )
        .limit(1);
      if (!existing) return candidate;
    }
    throw new BadRequestException('failed to allocate a manifest number');
  }
}
