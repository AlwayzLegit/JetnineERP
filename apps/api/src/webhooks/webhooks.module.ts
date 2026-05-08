import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { WebhookDispatcher } from './webhook-dispatcher.service';
import { WebhooksController } from './webhooks.controller';

// @Global so any controller can inject `WebhookDispatcher` to fire
// events without re-importing the module.
@Global()
@Module({
  imports: [ConfigModule, AuthModule, TenancyModule, AuditModule],
  controllers: [WebhooksController],
  providers: [WebhookDispatcher],
  exports: [WebhookDispatcher],
})
export class WebhooksModule {}
