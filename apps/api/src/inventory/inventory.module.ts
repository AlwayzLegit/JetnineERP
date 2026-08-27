import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ControlsModule } from '../controls/controls.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { InventoryController } from './inventory.controller';
import { PhysicalCountsController } from './physical-counts.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, ControlsModule],
  controllers: [InventoryController, PhysicalCountsController],
})
export class InventoryModule {}
