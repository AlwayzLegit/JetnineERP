import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ControlsModule } from '../controls/controls.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, ControlsModule],
  controllers: [TransfersController],
})
export class TransfersModule {}
