import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from './platform';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('categories_business_id_idx').on(t.businessId),
    parentIdx: index('categories_parent_id_idx').on(t.parentId),
  }),
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    sku: text('sku'),
    name: text('name').notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessSkuUnique: uniqueIndex('products_business_sku_uniq').on(t.businessId, t.sku),
    businessIdx: index('products_business_id_idx').on(t.businessId),
    categoryIdx: index('products_category_id_idx').on(t.categoryId),
  }),
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Denormalized from product_id so RLS can use it without an extra join.
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku'),
    name: text('name'),
    attributesJson: jsonb('attributes_json'),
    priceCents: integer('price_cents').notNull(),
    costCents: integer('cost_cents'),
    barcode: text('barcode'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index('product_variants_product_id_idx').on(t.productId),
    businessIdx: index('product_variants_business_id_idx').on(t.businessId),
    barcodeIdx: index('product_variants_barcode_idx').on(t.businessId, t.barcode),
    skuIdx: index('product_variants_sku_idx').on(t.businessId, t.sku),
  }),
);
