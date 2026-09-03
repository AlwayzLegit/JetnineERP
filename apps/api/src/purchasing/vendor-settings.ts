import { BadRequestException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';

/**
 * Advanced Vendor Settings (owner 2026-09-02, STORIS): the Shipping tab's
 * landed-cost lines and the PO Cutting Date tab's collection exceptions.
 * The Auto PO Replen tab lives in the replenishment document
 * (replenishment-data.ts); the General tab is the vendor master.
 */

export type LandedCostType = 'percent' | 'dollar' | 'calculate';

export interface LandedCostLine {
  active: boolean;
  type: LandedCostType;
  /** Percent of the PO subtotal, two decimals (5.5 = 5.5%). */
  percent: number | null;
  /** Flat amount per PO, integer cents. */
  cents: number | null;
  /** Custom lines only: what the fee is called. */
  label: string | null;
}

export interface LandedCostSettings {
  freight: LandedCostLine;
  importFee: LandedCostLine;
  miscFee: LandedCostLine;
  custom: [LandedCostLine, LandedCostLine];
}

export const LANDED_COST_KEYS = ['freight', 'importFee', 'miscFee'] as const;

function emptyLine(): LandedCostLine {
  return { active: false, type: 'percent', percent: null, cents: null, label: null };
}

function parseLine(raw: unknown, fallback: LandedCostLine): LandedCostLine {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  const type: LandedCostType =
    r.type === 'dollar' || r.type === 'calculate' || r.type === 'percent' ? r.type : fallback.type;
  return {
    active: r.active === true,
    type,
    percent: typeof r.percent === 'number' && Number.isFinite(r.percent) ? r.percent : null,
    cents: typeof r.cents === 'number' && Number.isInteger(r.cents) ? r.cents : null,
    label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : null,
  };
}

/** Parse the stored document; anything missing is an inactive percent line. */
export function parseLandedCost(raw: unknown): LandedCostSettings {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const custom = Array.isArray(r.custom) ? r.custom : [];
  return {
    freight: parseLine(r.freight, emptyLine()),
    importFee: parseLine(r.importFee, emptyLine()),
    miscFee: parseLine(r.miscFee, emptyLine()),
    custom: [parseLine(custom[0], emptyLine()), parseLine(custom[1], emptyLine())],
  };
}

/** Merge a partial body over the current document (per line). */
export function mergeLandedCost(
  current: LandedCostSettings,
  body: Partial<Record<keyof LandedCostSettings, unknown>>,
): LandedCostSettings {
  const next: LandedCostSettings = {
    freight:
      body.freight === undefined ? current.freight : parseLine(body.freight, current.freight),
    importFee:
      body.importFee === undefined
        ? current.importFee
        : parseLine(body.importFee, current.importFee),
    miscFee:
      body.miscFee === undefined ? current.miscFee : parseLine(body.miscFee, current.miscFee),
    custom: [current.custom[0], current.custom[1]],
  };
  if (Array.isArray(body.custom)) {
    next.custom = [
      body.custom[0] === undefined
        ? current.custom[0]
        : parseLine(body.custom[0], current.custom[0]),
      body.custom[1] === undefined
        ? current.custom[1]
        : parseLine(body.custom[1], current.custom[1]),
    ];
  }
  return next;
}

export function validateLandedCost(s: LandedCostSettings): void {
  const check = (name: string, l: LandedCostLine, allowCalculate: boolean) => {
    if (l.type === 'calculate' && !allowCalculate) {
      throw new BadRequestException(`${name}: type must be percent or dollar`);
    }
    if (!l.active) return;
    if (l.type === 'percent') {
      if (l.percent == null || l.percent < 0 || l.percent > 100) {
        throw new BadRequestException(`${name}: percent must be 0–100`);
      }
      if (Math.round(l.percent * 100) !== l.percent * 100) {
        throw new BadRequestException(`${name}: percent allows two decimals`);
      }
    } else if (l.type === 'dollar') {
      if (l.cents == null || l.cents < 0) {
        throw new BadRequestException(`${name}: cost must be a non-negative amount`);
      }
    }
    if (l.label && l.label.length > 40) {
      throw new BadRequestException(`${name}: label must be 40 characters or fewer`);
    }
  };
  check('Landed freight', s.freight, false);
  check('Import fee', s.importFee, true);
  check('Misc. fee', s.miscFee, true);
  check('Custom landed cost 1', s.custom[0], true);
  check('Custom landed cost 2', s.custom[1], true);
  if (s.custom.some((l) => l.active && !l.label)) {
    throw new BadRequestException('Custom landed cost lines need a label when active');
  }
}

export function activeLandedCostLines(
  s: LandedCostSettings,
): { name: string; line: LandedCostLine }[] {
  const out: { name: string; line: LandedCostLine }[] = [];
  if (s.freight.active) out.push({ name: 'Landed freight', line: s.freight });
  if (s.importFee.active) out.push({ name: 'Import fee', line: s.importFee });
  if (s.miscFee.active) out.push({ name: 'Misc. fee', line: s.miscFee });
  s.custom.forEach((l, i) => {
    if (l.active) out.push({ name: l.label ?? `Landed cost ${i + 1}`, line: l });
  });
  return out;
}

/**
 * The freight a new PO carries by default (landed cost lean, Q1: one
 * whole-PO amount spread per unit at receipt): every active percent or
 * dollar line summed; "calculate" lines contribute nothing until the
 * invoice arrives. Null when no line is active.
 */
export function defaultFreightCents(s: LandedCostSettings, subtotalCents: number): number | null {
  let total = 0;
  let any = false;
  for (const { line } of activeLandedCostLines(s)) {
    if (line.type === 'percent' && line.percent != null) {
      total += Math.round((subtotalCents * line.percent) / 100);
      any = true;
    } else if (line.type === 'dollar' && line.cents != null) {
      total += line.cents;
      any = true;
    }
  }
  return any ? total : null;
}

export async function loadLandedCost(
  db: PostgresJsDatabase,
  vendorId: string,
): Promise<LandedCostSettings> {
  const [row] = await db
    .select({ landedCostJson: schema.vendors.landedCostJson })
    .from(schema.vendors)
    .where(eq(schema.vendors.id, vendorId))
    .limit(1);
  return parseLandedCost(row?.landedCostJson);
}

export interface CuttingViolation {
  variantId: string;
  collectionId: string;
  collectionName: string;
  cuttingDate: string;
}

/**
 * Which of these variants belong to a collection whose PO cutting date
 * for this vendor has passed (strictly before `today`, YYYY-MM-DD).
 */
export async function pastCuttingDate(
  db: PostgresJsDatabase,
  vendorId: string,
  variantIds: string[],
  today: string,
): Promise<CuttingViolation[]> {
  if (variantIds.length === 0) return [];
  const rows = await db
    .select({
      variantId: schema.productVariants.id,
      collectionId: schema.collections.id,
      collectionName: schema.collections.name,
      cuttingDate: schema.vendorPoCuttingDates.cuttingDate,
    })
    .from(schema.productVariants)
    .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
    .innerJoin(schema.collections, eq(schema.collections.id, schema.products.collectionId))
    .innerJoin(
      schema.vendorPoCuttingDates,
      and(
        eq(schema.vendorPoCuttingDates.collectionId, schema.collections.id),
        eq(schema.vendorPoCuttingDates.vendorId, vendorId),
      ),
    )
    .where(inArray(schema.productVariants.id, variantIds));
  return rows
    .filter((r) => r.cuttingDate < today)
    .map((r) => ({
      variantId: r.variantId,
      collectionId: r.collectionId,
      collectionName: r.collectionName,
      cuttingDate: r.cuttingDate,
    }));
}

export function cuttingDateMessage(violations: CuttingViolation[]): string {
  const byCollection = new Map<string, CuttingViolation>();
  for (const v of violations) byCollection.set(v.collectionId, v);
  return `Past the vendor's PO cutting date: ${[...byCollection.values()]
    .map((v) => `${v.collectionName} (cut ${v.cuttingDate})`)
    .join(', ')}. Remove those lines or move the cutting date in Advanced Vendor Settings.`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
