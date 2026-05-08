import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';

/**
 * Cards are the kind of value that "looks like an ID". We need:
 *   - case-insensitive match (citext at the DB layer)
 *   - low collision rate (16 chars from a 30-symbol alphabet)
 *   - no ambiguous glyphs (skip 0/O/1/I/L)
 *
 * 30^16 ≈ 1.4e23 keyspace; for any realistic merchant catalog the
 * birthday-collision risk is negligible. The unique constraint
 * `(business_id, code)` is the ultimate guard.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LEN = 16;

export interface GiftCardChargeArg {
  code: string;
  amountCents: number;
  saleId: string;
  actorUserId: string | null;
}

export interface GiftCardRefundArg {
  giftCardId: string;
  amountCents: number;
  refundId: string;
  actorUserId: string | null;
}

@Injectable()
export class GiftCardsService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  generateCode(): string {
    const bytes = randomBytes(CODE_LEN);
    let out = '';
    for (let i = 0; i < CODE_LEN; i++) {
      out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
    }
    return out;
  }

  /**
   * Look up a card by case-insensitive code. Caller is responsible for
   * passing the right business — the WHERE includes business_id so a
   * stolen code can't be used to spend at someone else's store.
   */
  async findByCode(
    db: PostgresJsDatabase,
    businessId: string,
    code: string,
  ): Promise<typeof schema.giftCards.$inferSelect | null> {
    const trimmed = code.trim();
    if (trimmed.length === 0) return null;
    const rows = await db
      .select()
      .from(schema.giftCards)
      .where(and(eq(schema.giftCards.businessId, businessId), eq(schema.giftCards.code, trimmed)))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Charge a gift card for a sale. Validates state + balance, decrements
   * the cached balance, writes a `redeem` ledger row. Throws 400 with
   * a clear message if the card is unusable; the caller (sales create)
   * surfaces that to the client without rolling back the rest of the
   * sale logic — but if any payment validation fails the whole tx
   * rolls back, so failed charges don't leak partial debits.
   *
   * Must be called from within the request's RLS transaction (`db`
   * arg) so the gift_card_transactions insert participates in the same
   * commit as the sale.
   */
  async charge(
    db: PostgresJsDatabase,
    businessId: string,
    args: GiftCardChargeArg,
  ): Promise<{ giftCardId: string; balanceAfterCents: number }> {
    const card = await this.findByCode(db, businessId, args.code);
    if (!card) throw new BadRequestException('Gift card not found.');
    if (card.status !== 'active') {
      throw new BadRequestException(`Gift card is ${card.status}.`);
    }
    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('Gift card has expired.');
    }
    if (args.amountCents <= 0) {
      throw new BadRequestException('Gift card charge amount must be positive.');
    }
    if (card.currentBalanceCents < args.amountCents) {
      throw new BadRequestException(
        `Gift card balance is ${card.currentBalanceCents} cents; cannot charge ${args.amountCents}.`,
      );
    }

    const newBalance = card.currentBalanceCents - args.amountCents;
    const nextStatus = newBalance === 0 ? 'redeemed' : card.status;

    await db
      .update(schema.giftCards)
      .set({
        currentBalanceCents: newBalance,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.giftCards.id, card.id));

    await db.insert(schema.giftCardTransactions).values({
      businessId,
      giftCardId: card.id,
      kind: 'redeem',
      amountCents: -args.amountCents,
      balanceAfterCents: newBalance,
      saleId: args.saleId,
      actorUserId: args.actorUserId,
    });

    return { giftCardId: card.id, balanceAfterCents: newBalance };
  }

  /**
   * Credit a gift card on refund. Used when a sale paid (in part) with
   * a gift card is refunded; the refunded portion goes back onto the
   * same card. Resurrects the card from 'redeemed' to 'active' if a
   * positive credit lands on a zero-balance card.
   */
  async credit(db: PostgresJsDatabase, businessId: string, args: GiftCardRefundArg): Promise<void> {
    if (args.amountCents <= 0) {
      throw new BadRequestException('Gift card refund amount must be positive.');
    }
    const rows = await db
      .select()
      .from(schema.giftCards)
      .where(
        and(eq(schema.giftCards.id, args.giftCardId), eq(schema.giftCards.businessId, businessId)),
      )
      .limit(1);
    const card = rows[0];
    if (!card) throw new BadRequestException('Gift card not found.');
    if (card.status === 'cancelled') {
      throw new ForbiddenException('Cannot refund onto a cancelled gift card.');
    }
    const newBalance = card.currentBalanceCents + args.amountCents;
    await db
      .update(schema.giftCards)
      .set({
        currentBalanceCents: newBalance,
        status: card.status === 'redeemed' ? 'active' : card.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.giftCards.id, card.id));
    await db.insert(schema.giftCardTransactions).values({
      businessId,
      giftCardId: card.id,
      kind: 'refund',
      amountCents: args.amountCents,
      balanceAfterCents: newBalance,
      refundId: args.refundId,
      actorUserId: args.actorUserId,
    });
  }

  /** Replay invariant for tests: cached balance == sum(transactions). */
  async assertCachedBalanceMatchesLedger(
    db: PostgresJsDatabase,
    giftCardId: string,
  ): Promise<void> {
    const [{ sum }] = (await db.execute(
      sql`SELECT COALESCE(SUM(amount_cents), 0)::int AS sum FROM gift_card_transactions WHERE gift_card_id = ${giftCardId}`,
    )) as unknown as [{ sum: number }];
    const [card] = await db
      .select({ b: schema.giftCards.currentBalanceCents })
      .from(schema.giftCards)
      .where(eq(schema.giftCards.id, giftCardId))
      .limit(1);
    if (!card) throw new Error(`gift card ${giftCardId} missing`);
    if (card.b !== sum) {
      throw new Error(`balance drift: cached=${card.b}, ledger=${sum}`);
    }
  }
}
