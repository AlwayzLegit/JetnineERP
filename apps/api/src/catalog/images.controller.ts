import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { randomBytes } from 'node:crypto';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

const MAX_IMAGES_PER_PRODUCT = 4;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

@TenantScoped()
@Controller('v1/products')
export class ImagesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  /**
   * Returns an upload target for the client to PUT the image bytes to.
   *
   * In production this issues a presigned URL against R2 (S3-compatible);
   * here we just mint a unique storage key and a placeholder URL when no
   * R2 credentials are configured. The client uploads the file out-of-
   * band, then calls POST /v1/products/:productId/images with the
   * returned storageKey to register the image row.
   */
  @Post(':productId/images/upload-url')
  @RequirePermission('products.update')
  async uploadUrl(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('productId') productId: string,
    @Body() body: { contentType?: string; filename?: string },
  ): Promise<{ uploadUrl: string; storageKey: string; method: 'PUT' | 'POST' }> {
    const contentType = body.contentType?.trim();
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new BadRequestException(
        `contentType must be one of ${[...ALLOWED_CONTENT_TYPES].join(', ')}`,
      );
    }
    await this.assertCapacity(productId);

    const ext = contentType.split('/')[1] ?? 'bin';
    const storageKey = `businesses/${tenant.businessId}/products/${productId}/${randomBytes(
      12,
    ).toString('hex')}.${ext}`;

    const r2 = this.r2Config();
    if (!r2) {
      // No R2 configured — clients can either re-implement the direct
      // POST below, or skip transferring bytes (used in tests).
      return {
        uploadUrl: `data:placeholder;${storageKey}`,
        storageKey,
        method: 'PUT',
      };
    }
    // Real signed-URL generation lands when AWS SDK + R2 creds are wired.
    // For now we surface the key so callers can wire up the upload step
    // themselves; once @aws-sdk/s3-request-presigner is added this branch
    // can call presigner.getSignedUrl().
    return {
      uploadUrl: `${r2.endpoint}/${r2.bucket}/${storageKey}?placeholder-signature`,
      storageKey,
      method: 'PUT',
    };
  }

  @Post(':productId/images')
  @RequirePermission('products.update')
  async register(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('productId') productId: string,
    @Body()
    body: { storageKey?: string; altText?: string | null; position?: number },
  ): Promise<{ id: string; storageKey: string }> {
    if (!body.storageKey || !body.storageKey.startsWith(`businesses/${tenant.businessId}/`)) {
      throw new BadRequestException('storageKey is required and must match this business');
    }
    await this.assertCapacity(productId);
    const [row] = await this.db
      .insert(schema.productImages)
      .values({
        businessId: tenant.businessId!,
        productId,
        storageKey: body.storageKey,
        altText: body.altText ?? null,
        position: body.position ?? 0,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to register image');
    await this.audit.log({
      action: 'product.image.add',
      targetType: 'product_image',
      targetId: row.id,
      after: { productId, storageKey: row.storageKey },
    });
    return { id: row.id, storageKey: row.storageKey };
  }

  @Delete('images/:id')
  @RequirePermission('products.update')
  async delete(@Param('id') id: string): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Image not found');
    await this.db.delete(schema.productImages).where(eq(schema.productImages.id, id));
    await this.audit.log({
      action: 'product.image.remove',
      targetType: 'product_image',
      targetId: id,
      before: { storageKey: existing.storageKey },
    });
    return { deleted: true };
  }

  private async assertCapacity(productId: string): Promise<void> {
    const existing = await this.db
      .select({ id: schema.productImages.id })
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, productId));
    if (existing.length >= MAX_IMAGES_PER_PRODUCT) {
      throw new ConflictException(`A product may have at most ${MAX_IMAGES_PER_PRODUCT} images`);
    }
  }

  private r2Config(): { endpoint: string; bucket: string } | null {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const bucket = this.config.get<string>('R2_BUCKET');
    if (!accountId || !bucket) return null;
    return {
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      bucket,
    };
  }
}
