import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ControlsModule } from '../controls/controls.module';
import { ReturnsModule } from '../returns/returns.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ExchangesController } from './exchanges.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, ControlsModule, ReturnsModule],
  controllers: [ExchangesController],
})
export class ExchangesModule {}
