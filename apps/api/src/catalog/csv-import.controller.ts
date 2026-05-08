import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface CsvRow {
  name: string;
  sku: string;
  priceCents: number;
  barcode: string | null;
  rowIndex: number;
}

interface PreviewBody {
  csv: string;
}

interface PreviewResponse {
  rows: CsvRow[];
  errors: { rowIndex: number; reason: string }[];
  conflicts: { rowIndex: number; sku: string; existingProductId: string }[];
}

interface CommitBody {
  csv: string;
}

interface CommitResponse {
  inserted: number;
  skipped: number;
  productIds: string[];
}

@TenantScoped()
@Controller('v1/products/import')
export class CsvImportController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Post('preview')
  @RequirePermission('products.create')
  async preview(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: PreviewBody,
  ): Promise<PreviewResponse> {
    const { rows, errors } = parseCsv(body.csv);
    const skus = rows.map((r) => r.sku).filter(Boolean);
    const existing =
      skus.length > 0
        ? await this.db
            .select({ id: schema.products.id, sku: schema.products.sku })
            .from(schema.products)
        : [];
    const conflictMap = new Map(existing.filter((e) => e.sku).map((e) => [e.sku!, e.id]));
    const conflicts = rows
      .filter((r) => conflictMap.has(r.sku))
      .map((r) => ({
        rowIndex: r.rowIndex,
        sku: r.sku,
        existingProductId: conflictMap.get(r.sku)!,
      }));
    void tenant;
    return { rows, errors, conflicts };
  }

  @Post('commit')
  @RequirePermission('products.create')
  async commit(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CommitBody,
  ): Promise<CommitResponse> {
    const { rows, errors } = parseCsv(body.csv);
    if (errors.length > 0) {
      throw new BadRequestException(
        `${errors.length} row(s) had errors; fix or remove them before committing`,
      );
    }
    if (rows.length === 0) throw new BadRequestException('No rows to import');

    // Find existing SKUs in one shot.
    const skus = new Set(rows.map((r) => r.sku));
    const existing = await this.db.select({ sku: schema.products.sku }).from(schema.products);
    const existingSet = new Set(existing.map((e) => e.sku).filter(Boolean) as string[]);

    const toInsert = rows.filter((r) => !existingSet.has(r.sku));
    const skipped = rows.length - toInsert.length;
    if (toInsert.length === 0) {
      throw new ConflictException(
        `All ${rows.length} rows have SKUs that already exist; nothing to import.`,
      );
    }

    // Insert products + a single default variant per row.
    const productIds: string[] = [];
    for (const r of toInsert) {
      const [p] = await this.db
        .insert(schema.products)
        .values({
          businessId: tenant.businessId!,
          name: r.name,
          sku: r.sku,
        })
        .returning({ id: schema.products.id });
      if (!p) throw new BadRequestException(`failed to insert SKU ${r.sku}`);
      await this.db.insert(schema.productVariants).values({
        businessId: tenant.businessId!,
        productId: p.id,
        sku: r.sku,
        priceCents: r.priceCents,
        barcode: r.barcode,
      });
      productIds.push(p.id);
    }

    await this.audit.log({
      action: 'product.import.commit',
      targetType: 'product',
      metadata: { inserted: toInsert.length, skipped, totalRows: rows.length },
    });

    void skus;
    return { inserted: toInsert.length, skipped, productIds };
  }
}

/**
 * Minimal CSV parser tailored to a known header row of
 *   name,sku,price,barcode
 *
 * Real-world CSVs need quoted fields and escapes; once Phase 2 ships a
 * file-upload UI we'll swap in `papaparse`. For Phase 1 the input is
 * pasted into a textarea so this keeps the dependency surface narrow.
 */
export function parseCsv(input: string): {
  rows: CsvRow[];
  errors: { rowIndex: number; reason: string }[];
} {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: [] };

  const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const idxName = header.indexOf('name');
  const idxSku = header.indexOf('sku');
  const idxPrice = header.indexOf('price');
  const idxBarcode = header.indexOf('barcode');
  if (idxName < 0 || idxSku < 0 || idxPrice < 0) {
    return {
      rows: [],
      errors: [{ rowIndex: 0, reason: 'header must include name, sku, price (barcode optional)' }],
    };
  }

  const rows: CsvRow[] = [];
  const errors: { rowIndex: number; reason: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = (lines[i] ?? '').split(',').map((c) => c.trim());
    const name = cols[idxName] ?? '';
    const sku = cols[idxSku] ?? '';
    const priceRaw = cols[idxPrice] ?? '';
    const barcode = idxBarcode >= 0 ? (cols[idxBarcode] ?? '') : '';
    if (!name) {
      errors.push({ rowIndex: i, reason: 'name is required' });
      continue;
    }
    if (!sku) {
      errors.push({ rowIndex: i, reason: 'sku is required' });
      continue;
    }
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) {
      errors.push({ rowIndex: i, reason: `price "${priceRaw}" must be a non-negative number` });
      continue;
    }
    rows.push({
      name,
      sku,
      priceCents: Math.round(price * 100),
      barcode: barcode || null,
      rowIndex: i,
    });
  }
  return { rows, errors };
}
