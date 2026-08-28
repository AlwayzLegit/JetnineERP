import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ReportBuilderController } from './report-builder.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [ReportBuilderController],
})
export class ReportBuilderModule {}
