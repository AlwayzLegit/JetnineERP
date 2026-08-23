import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { and, eq, inArray, lt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE } from '../database/database.module';
import { EmailService } from '../email/email.service';

/**
 * Nightly layaway sweep (deploy hardening, D10): the in-process
 * scheduler behind `POST /v1/payment-plans/run-overdue`. Runs once per
 * UTC day at OVERDUE_SWEEP_UTC_HOUR (default 09:00 UTC ≈ 2am Pacific)
 * across every business, on the root connection — the sweep is a
 * platform chore, not a request.
 *
 * Same rules as the endpoint: idempotent (already-overdue rows never
 * re-mail), one reminder per plan per sweep, imported orders excluded
 * (D8). Disable with OVERDUE_SWEEP_ENABLED=false (tests, one-off
 * scripts); a run is also skipped automatically under NODE_ENV=test.
 */
@Injectable()
export class OverdueSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OverdueSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastRunDate: string | null = null;

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(EmailService) private readonly email: EmailService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test' || process.env.OVERDUE_SWEEP_ENABLED === 'false') return;
    // Check every 15 minutes; fire once per day in the configured hour.
    this.timer = setInterval(() => void this.tick(), 15 * 60 * 1000);
    this.timer.unref?.();
    this.logger.log(
      `Overdue sweep scheduled daily at ${this.sweepHour().toString().padStart(2, '0')}:00 UTC`,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private sweepHour(): number {
    const h = Number(process.env.OVERDUE_SWEEP_UTC_HOUR ?? '9');
    return Number.isInteger(h) && h >= 0 && h <= 23 ? h : 9;
  }

  private async tick() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getUTCHours() !== this.sweepHour() || this.lastRunDate === today) return;
    this.lastRunDate = today;
    try {
      const result = await this.runSweep();
      this.logger.log(
        `Overdue sweep: ${result.marked} installment(s) marked, ${result.reminded} reminder(s) sent across ${result.businesses} business(es)`,
      );
    } catch (err) {
      this.logger.error(`Overdue sweep failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** Cross-tenant sweep. Exposed for tests; the timer is just a caller. */
  async runSweep(): Promise<{ marked: number; reminded: number; businesses: number }> {
    const today = new Date().toISOString().slice(0, 10);
    const marked = await this.db
      .update(schema.paymentPlanInstallments)
      .set({ status: 'overdue', updatedAt: new Date() })
      .where(
        and(
          eq(schema.paymentPlanInstallments.status, 'due'),
          lt(schema.paymentPlanInstallments.dueDate, today),
        ),
      )
      .returning({
        planId: schema.paymentPlanInstallments.planId,
        businessId: schema.paymentPlanInstallments.businessId,
      });

    const planIds = [...new Set(marked.map((m) => m.planId))];
    const businesses = new Map<string, { marked: number; reminded: number }>();
    for (const m of marked) {
      const b = businesses.get(m.businessId) ?? { marked: 0, reminded: 0 };
      b.marked += 1;
      businesses.set(m.businessId, b);
    }

    let reminded = 0;
    if (planIds.length > 0) {
      const plans = await this.db
        .select({
          id: schema.paymentPlans.id,
          businessId: schema.paymentPlans.businessId,
          orderId: schema.paymentPlans.orderId,
          status: schema.paymentPlans.status,
        })
        .from(schema.paymentPlans)
        .where(inArray(schema.paymentPlans.id, planIds));
      for (const plan of plans) {
        if (plan.status !== 'active') continue;
        const [order] = await this.db
          .select({
            number: schema.orders.number,
            customerId: schema.orders.customerId,
            importedAt: schema.orders.importedAt,
          })
          .from(schema.orders)
          .where(eq(schema.orders.id, plan.orderId))
          .limit(1);
        if (!order || order.importedAt) continue; // D8
        const [customer] = await this.db
          .select({ email: schema.customers.email, firstName: schema.customers.firstName })
          .from(schema.customers)
          .where(eq(schema.customers.id, order.customerId))
          .limit(1);
        if (!customer?.email) continue;
        const overdueRows = await this.db
          .select({ amountCents: schema.paymentPlanInstallments.amountCents })
          .from(schema.paymentPlanInstallments)
          .where(
            and(
              eq(schema.paymentPlanInstallments.planId, plan.id),
              eq(schema.paymentPlanInstallments.status, 'overdue'),
            ),
          );
        const cents = overdueRows.reduce((s, i) => s + i.amountCents, 0);
        if (cents <= 0) continue;
        const greeting = `Hi${customer.firstName ? ` ${customer.firstName}` : ''}`;
        const amount = `$${(cents / 100).toFixed(2)}`;
        const sent = await this.email
          .send({
            to: customer.email,
            subject: `Payment reminder — ${order.number}`,
            text: `${greeting},\n\nA payment of ${amount} on your plan for order ${order.number} is past due. Please visit us or call to bring the plan current.\n`,
            html: `<p>${greeting},</p><p>A payment of <strong>${amount}</strong> on your plan for order <strong>${order.number}</strong> is past due. Please visit us or call to bring the plan current.</p>`,
          })
          .then(
            () => true,
            () => false,
          );
        if (sent) {
          reminded += 1;
          const b = businesses.get(plan.businessId) ?? { marked: 0, reminded: 0 };
          b.reminded += 1;
          businesses.set(plan.businessId, b);
        }
      }
    }

    for (const [businessId, counts] of businesses) {
      await this.audit
        .log({
          action: 'payment_plans.run_overdue',
          targetType: 'payment_plan',
          businessId,
          metadata: { ...counts, scheduler: true },
        })
        .catch(() => undefined);
    }
    return { marked: marked.length, reminded, businesses: businesses.size };
  }
}
