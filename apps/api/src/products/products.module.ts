import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ProductsController } from './products.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [ProductsController],
})
export class ProductsModule {}
