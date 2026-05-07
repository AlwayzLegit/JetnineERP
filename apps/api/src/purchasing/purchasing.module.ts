import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { VendorsController } from './vendors.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [VendorsController, PurchaseOrdersController],
})
export class PurchasingModule {}
