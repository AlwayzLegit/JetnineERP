import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ProductsController } from './products.controller';

@Module({
  imports: [AuthModule, TenancyModule],
  controllers: [ProductsController],
})
export class ProductsModule {}
