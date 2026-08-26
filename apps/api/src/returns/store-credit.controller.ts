import { Controller, Get, Inject, Param } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { StoreCreditService } from './store-credit.service';

/**
 * Customer store credit (§10): the balance + ledger, read by the
 * customer page and by New Sale so credit auto-surfaces at checkout.
 */
@TenantScoped()
@Controller('v1/customers/:customerId/store-credit')
export class StoreCreditController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(StoreCreditService) private readonly storeCredit: StoreCreditService,
  ) {}

  @Get()
  @RequirePermission('customers.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('customerId') customerId: string,
  ): Promise<{
    balanceCents: number;
    entries: {
      id: string;
      deltaCents: number;
      reason: string | null;
      referenceType: string | null;
      createdAt: Date;
    }[];
  }> {
    const balanceCents = await this.storeCredit.balanceCents(this.db, customerId);
    const entries = await this.db
      .select({
        id: schema.storeCreditEntries.id,
        deltaCents: schema.storeCreditEntries.deltaCents,
        reason: schema.storeCreditEntries.reason,
        referenceType: schema.storeCreditEntries.referenceType,
        createdAt: schema.storeCreditEntries.createdAt,
      })
      .from(schema.storeCreditEntries)
      .where(eq(schema.storeCreditEntries.customerId, customerId))
      .orderBy(desc(schema.storeCreditEntries.createdAt))
      .limit(100);
    return { balanceCents, entries };
  }
}
