import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { DatabaseModule } from '../database/database.module';
import { ActiveBusinessController } from './active-business.controller';
import { AgencyController } from './agency.controller';
import { PermissionGuard } from './permission.guard';
import { RlsContextInterceptor } from './rls-context.interceptor';
import { TenancyGuard } from './tenancy.guard';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [TenancyGuard, PermissionGuard, RlsContextInterceptor, SubscriptionGuard],
  controllers: [ActiveBusinessController, AgencyController],
  exports: [TenancyGuard, PermissionGuard, RlsContextInterceptor, SubscriptionGuard],
})
export class TenancyModule {}
