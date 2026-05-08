import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CategoriesController } from './categories.controller';
import { CsvImportController } from './csv-import.controller';
import { ImagesController } from './images.controller';
import { CatalogProductsController } from './products.controller';
import { VariantsController } from './variants.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [
    CategoriesController,
    CatalogProductsController,
    VariantsController,
    ImagesController,
    CsvImportController,
  ],
})
export class CatalogModule {}
