import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ReasonCodesController } from './reason-codes.controller';
import { SecurityOverrideService } from './security-override.service';
import { SecurityOverridesController } from './security-overrides.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [ReasonCodesController, SecurityOverridesController],
  providers: [SecurityOverrideService],
  exports: [SecurityOverrideService],
})
export class ControlsModule {}
