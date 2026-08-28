import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ControlsModule } from '../controls/controls.module';
import { CostingModule } from '../costing/costing.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AutoTransfersService } from './auto-transfers.service';
import { ManifestsController } from './manifests.controller';
import { TransferShipService } from './transfer-ship.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, ControlsModule, CostingModule],
  controllers: [TransfersController, ManifestsController],
  providers: [AutoTransfersService, TransferShipService],
  exports: [AutoTransfersService, TransferShipService],
})
export class TransfersModule {}
