import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CustomerActivityController } from './customer-activity.controller';
import { CustomersController } from './customers.controller';
import { GlobalSearchController } from './global-search.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [CustomersController, CustomerActivityController, GlobalSearchController],
})
export class CustomersModule {}
