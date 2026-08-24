import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { DeliveriesController } from './deliveries.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, OrdersModule],
  controllers: [DeliveriesController],
})
export class DeliveriesModule {}
