import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { OrdersModule } from '../orders/orders.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { SerialsController } from './serials.controller';
import { SpecialOrdersController } from './special-orders.controller';
import { SpecialOrdersService } from './special-orders.service';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, EmailModule, OrdersModule],
  controllers: [SpecialOrdersController, SerialsController],
  providers: [SpecialOrdersService],
  // The purchasing receive flow walks allocations through this service.
  exports: [SpecialOrdersService],
})
export class SpecialOrdersModule {}
