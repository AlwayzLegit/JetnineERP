import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { SpecialOrdersModule } from '../special-orders/special-orders.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { VendorInvoicesController } from './vendor-invoices.controller';
import { VendorsController } from './vendors.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, SpecialOrdersModule, EmailModule],
  controllers: [VendorsController, PurchaseOrdersController, VendorInvoicesController],
})
export class PurchasingModule {}
