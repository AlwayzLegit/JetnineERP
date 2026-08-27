import { Module } from '@nestjs/common';
import { ControlsModule } from '../controls/controls.module';
import { CostingService } from './costing.service';

@Module({
  imports: [ControlsModule],
  providers: [CostingService],
  exports: [CostingService],
})
export class CostingModule {}
