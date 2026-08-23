import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MoneyModule } from '../money/money.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, MoneyModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  // Deliveries (Day 3) reserve, release, and reprice through the same
  // service rather than reimplementing the stock math.
  exports: [OrdersService],
})
export class OrdersModule {}
