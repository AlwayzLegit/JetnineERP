import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { BillingController } from './billing.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [BillingController],
})
export class BillingModule {}
