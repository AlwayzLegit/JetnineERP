import { BadRequestException, Body, Controller, Inject, Post } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { DRIZZLE } from '../database/database.module';
import { Public } from '../tenancy/decorators';

interface SeedBody {
  ownerEmail?: string;
  businessSlug?: string;
}

/**
 * Dev-only seed endpoint for the Playwright e2e suite. Given a freshly
 * verified user (via the better-auth signup flow), wires up a business,
 * an Owner membership, a single location, and one product/variant with
 * inventory — the minimum a POS test needs.
 *
 * Only registered when NODE_ENV !== 'production' (see EmailModule). Not
 * tenant-scoped or auth-gated; the endpoint is harmless on a real
 * database (it requires an existing user) but obviously inappropriate
 * for prod, hence the same gate as the dev email inbox.
 */
@Public()
@Controller('v1/dev/e2e-seed')
export class DevSeedController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Post()
  async seed(@Body() body: SeedBody): Promise<{
    businessId: string;
    locationId: string;
    variantId: string;
    variantSku: string;
  }> {
    const email = body.ownerEmail?.trim();
    const slug = body.businessSlug?.trim();
    if (!email || !slug) {
      throw new BadRequestException('ownerEmail and businessSlug are required');
    }
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (!user) throw new BadRequestException(`No user with email ${email}`);

    const [biz] = await this.db
      .insert(schema.businesses)
      .values({ slug, name: `E2E ${slug}`, status: 'active', defaultTaxRateBps: 0 })
      .returning();
    if (!biz) throw new BadRequestException('failed to create business');

    const ownerRole = SYSTEM_ROLES.find((r) => r.name === 'Owner');
    if (!ownerRole) throw new BadRequestException('Owner role not in catalog');
    const [role] = await this.db
      .insert(schema.roles)
      .values({
        businessId: biz.id,
        name: ownerRole.name,
        description: ownerRole.description,
        isSystem: true,
      })
      .returning();
    if (!role) throw new BadRequestException('failed to create role');
    if (ownerRole.permissions.length > 0) {
      await this.db
        .insert(schema.rolePermissions)
        .values(ownerRole.permissions.map((permission) => ({ roleId: role.id, permission })));
    }

    await this.db.insert(schema.memberships).values({
      businessId: biz.id,
      userId: user.id,
      roleId: role.id,
      status: 'active',
      acceptedAt: new Date(),
    });

    const [loc] = await this.db
      .insert(schema.locations)
      .values({ businessId: biz.id, name: 'Main', timezone: 'America/New_York' })
      .returning();
    if (!loc) throw new BadRequestException('failed to create location');

    const variantSku = `E2E-${Date.now()}`;
    const [product] = await this.db
      .insert(schema.products)
      .values({ businessId: biz.id, sku: 'E2E-PROD', name: 'Widget' })
      .returning();
    if (!product) throw new BadRequestException('failed to create product');
    const [variant] = await this.db
      .insert(schema.productVariants)
      .values({
        businessId: biz.id,
        productId: product.id,
        sku: variantSku,
        priceCents: 1000,
      })
      .returning();
    if (!variant) throw new BadRequestException('failed to create variant');
    await this.db.insert(schema.inventoryLevels).values({
      businessId: biz.id,
      variantId: variant.id,
      locationId: loc.id,
      onHand: 100,
    });

    return {
      businessId: biz.id,
      locationId: loc.id,
      variantId: variant.id,
      variantSku,
    };
  }
}
