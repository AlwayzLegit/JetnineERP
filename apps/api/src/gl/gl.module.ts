import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { GlController } from './gl.controller';
import { GlService } from './gl.service';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [GlController],
  providers: [GlService],
  exports: [GlService],
})
export class GlModule {}
