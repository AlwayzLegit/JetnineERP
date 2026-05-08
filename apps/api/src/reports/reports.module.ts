import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ReportsController } from './reports.controller';

@Module({
  imports: [AuthModule, TenancyModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
