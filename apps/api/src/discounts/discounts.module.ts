import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { DiscountCodesController } from './discount-codes.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [DiscountCodesController],
})
export class DiscountsModule {}
