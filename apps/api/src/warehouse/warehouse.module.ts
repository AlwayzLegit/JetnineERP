import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { WarehouseDashboardController } from './warehouse-dashboard.controller';

@Module({
  imports: [AuthModule, TenancyModule],
  controllers: [WarehouseDashboardController],
})
export class WarehouseModule {}
