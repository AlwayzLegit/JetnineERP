import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ActiveBusinessController } from './active-business.controller';
import { PermissionGuard } from './permission.guard';
import { RlsContextInterceptor } from './rls-context.interceptor';
import { TenancyGuard } from './tenancy.guard';

@Module({
  imports: [AuthModule],
  providers: [TenancyGuard, PermissionGuard, RlsContextInterceptor],
  controllers: [ActiveBusinessController],
  exports: [TenancyGuard, PermissionGuard, RlsContextInterceptor],
})
export class TenancyModule {}
