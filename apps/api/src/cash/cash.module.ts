import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CashShiftsController } from './cash-shifts.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [CashShiftsController],
})
export class CashModule {}
