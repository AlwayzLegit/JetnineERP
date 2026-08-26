import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ControlsModule } from '../controls/controls.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AsIsController } from './as-is.controller';
import { OrderReturnsController } from './order-returns.controller';
import { OrderReturnsService } from './order-returns.service';
import { StoreCreditController } from './store-credit.controller';
import { StoreCreditService } from './store-credit.service';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, ControlsModule],
  controllers: [AsIsController, OrderReturnsController, StoreCreditController],
  providers: [StoreCreditService, OrderReturnsService],
  exports: [StoreCreditService, OrderReturnsService],
})
export class ReturnsModule {}
