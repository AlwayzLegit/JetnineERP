import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CostingModule } from '../costing/costing.module';
import { AuthModule } from '../auth/auth.module';
import { ControlsModule } from '../controls/controls.module';
import { MoneyModule } from '../money/money.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AsIsController } from './as-is.controller';
import { OrderReturnsController } from './order-returns.controller';
import { OrderReturnsService } from './order-returns.service';
import { StoreCreditController } from './store-credit.controller';
import { StoreCreditService } from './store-credit.service';
import { WriteOffsController } from './write-offs.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, ControlsModule, MoneyModule, CostingModule],
  controllers: [AsIsController, OrderReturnsController, StoreCreditController, WriteOffsController],
  providers: [StoreCreditService, OrderReturnsService],
  exports: [StoreCreditService, OrderReturnsService],
})
export class ReturnsModule {}
