import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { MoneyModule } from '../money/money.module';
import { StripeModule } from '../stripe/stripe.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { SalesController } from './sales.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, StripeModule, MoneyModule],
  controllers: [SalesController],
})
export class SalesModule {}
