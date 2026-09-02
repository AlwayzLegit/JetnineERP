import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CostingModule } from '../costing/costing.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CashDrawerBalancingController } from './cash-drawer-balancing.controller';
import { MorningDashboardController } from './morning-dashboard.controller';
import { ReportsController } from './reports.controller';

@Module({
  imports: [AuthModule, TenancyModule, CostingModule],
  controllers: [ReportsController, MorningDashboardController, CashDrawerBalancingController],
})
export class ReportsModule {}
