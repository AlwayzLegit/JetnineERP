import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AsIsController } from './as-is.controller';
import { StoreCreditController } from './store-credit.controller';
import { StoreCreditService } from './store-credit.service';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [AsIsController, StoreCreditController],
  providers: [StoreCreditService],
  exports: [StoreCreditService],
})
export class ReturnsModule {}
