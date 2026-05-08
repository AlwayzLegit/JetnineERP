import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OnboardingController } from './onboarding.controller';

/**
 * Self-service onboarding for fresh signups. Lives outside the
 * tenant pipeline because the very point is "the user has no
 * tenant yet" — every other tenant-scoped controller would 412
 * before they could create one.
 */
@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
