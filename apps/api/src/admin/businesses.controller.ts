import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { count, desc, eq, max, sql as raw } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE } from '../database/database.module';
import { EmailService } from '../email/email.service';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { SuperAdminOnly, TenantScoped } from '../tenancy/decorators';
import { ConfigService } from '@nestjs/config';

const VALID_STATUSES = new Set(['active', 'suspended', 'trial', 'cancelled']);
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  createdAt: Date;
  userCount: number;
  locationCount: number;
  lastActivityAt: Date | null;
}

interface CreateBusinessBody {
  name?: string;
  slug?: string;
  ownerEmail?: string;
  ownerName?: string;
  plan?: string;
}

@SuperAdminOnly()
@TenantScoped()
@Controller('v1/admin/businesses')
export class AdminBusinessesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(EmailService) private readonly email: EmailService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Get()
  async list(): Promise<BusinessSummary[]> {
    const memberSubq = this.db
      .select({
        businessId: schema.memberships.businessId,
        userCount: count().as('member_count'),
      })
      .from(schema.memberships)
      .groupBy(schema.memberships.businessId)
      .as('m');

    const locationSubq = this.db
      .select({
        businessId: schema.locations.businessId,
        locationCount: count().as('location_count'),
      })
      .from(schema.locations)
      .groupBy(schema.locations.businessId)
      .as('l');

    const auditSubq = this.db
      .select({
        businessId: schema.auditLogs.businessId,
        lastActivityAt: max(schema.auditLogs.createdAt).as('last_activity_at'),
      })
      .from(schema.auditLogs)
      .groupBy(schema.auditLogs.businessId)
      .as('a');

    const rows = await this.db
      .select({
        id: schema.businesses.id,
        slug: schema.businesses.slug,
        name: schema.businesses.name,
        status: schema.businesses.status,
        plan: schema.businesses.plan,
        createdAt: schema.businesses.createdAt,
        userCount: memberSubq.userCount,
        locationCount: locationSubq.locationCount,
        lastActivityAt: auditSubq.lastActivityAt,
      })
      .from(schema.businesses)
      .leftJoin(memberSubq, eq(memberSubq.businessId, schema.businesses.id))
      .leftJoin(locationSubq, eq(locationSubq.businessId, schema.businesses.id))
      .leftJoin(auditSubq, eq(auditSubq.businessId, schema.businesses.id))
      .orderBy(desc(schema.businesses.createdAt));

    return rows.map((r) => ({
      ...r,
      userCount: Number(r.userCount ?? 0),
      locationCount: Number(r.locationCount ?? 0),
      lastActivityAt: r.lastActivityAt ?? null,
    }));
  }

  @Post()
  async create(
    @Body() body: CreateBusinessBody,
    @CurrentUser() actor: CurrentUserPayload,
  ): Promise<{ businessId: string; ownerUserId: string; inviteToken: string }> {
    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase();
    const ownerEmail = body.ownerEmail?.trim().toLowerCase();
    const ownerName = body.ownerName?.trim() ?? null;
    if (!name) throw new BadRequestException('name is required');
    if (!slug || !SLUG_RE.test(slug)) {
      throw new BadRequestException(
        'slug must be 1-64 chars, lowercase alphanumeric, may contain inner hyphens',
      );
    }
    if (!ownerEmail || !ownerEmail.includes('@')) {
      throw new BadRequestException('ownerEmail must be a valid email');
    }

    // 1. Create the business.
    const [biz] = await this.db
      .insert(schema.businesses)
      .values({ slug, name, status: body.plan ? 'active' : 'trial', plan: body.plan ?? null })
      .returning()
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('businesses_slug_uniq')) {
          throw new ConflictException(`A business with slug "${slug}" already exists`);
        }
        throw err;
      });
    if (!biz) throw new UnprocessableEntityException('failed to create business');

    // 2. Seed system roles + their permissions for this business.
    const roleIdByName = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await this.db
        .insert(schema.roles)
        .values({
          businessId: biz.id,
          name: role.name,
          description: role.description,
          isSystem: true,
        })
        .returning();
      if (!r) throw new UnprocessableEntityException(`failed to insert role ${role.name}`);
      roleIdByName.set(role.name, r.id);
      if (role.permissions.length > 0) {
        await this.db
          .insert(schema.rolePermissions)
          .values(role.permissions.map((permission) => ({ roleId: r.id, permission })));
      }
    }
    const ownerRoleId = roleIdByName.get('Owner');
    if (!ownerRoleId) throw new UnprocessableEntityException('Owner role missing after seed');

    // 3. Find or create the owner user. The user account starts unverified
    // with no password; the invite flow promotes them to active.
    let ownerUserId: string;
    const existingUsers = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, ownerEmail))
      .limit(1);
    if (existingUsers[0]) {
      ownerUserId = existingUsers[0].id;
    } else {
      const [u] = await this.db
        .insert(schema.users)
        .values({ email: ownerEmail, emailVerified: false, name: ownerName })
        .returning();
      if (!u) throw new UnprocessableEntityException('failed to create owner user');
      ownerUserId = u.id;
    }

    // 4. Membership in the new business as Owner, status invited.
    await this.db.insert(schema.memberships).values({
      businessId: biz.id,
      userId: ownerUserId,
      roleId: ownerRoleId,
      status: 'invited',
      invitedByUserId: actor.id,
      invitedAt: new Date(),
    });

    // 5. Persist an invite token in the verifications table. Identifier is
    // namespaced "invite:<email>" so it doesn't collide with better-auth's
    // own email-verification + password-reset entries.
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.db.insert(schema.verifications).values({
      identifier: `invite:${ownerEmail}`,
      value: token,
      expiresAt,
    });

    // 6. Send the invitation email.
    const baseURL = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
    const link = `${baseURL}/accept-invite?token=${encodeURIComponent(token)}`;
    await this.email.send({
      to: ownerEmail,
      subject: `You've been invited to ${name} on Jetnine`,
      text: `Accept your invitation: ${link}`,
      html: inviteEmail(name, link),
    });

    await this.audit.log({
      action: 'business.create',
      targetType: 'business',
      targetId: biz.id,
      after: { slug, name, status: biz.status, ownerEmail },
    });

    return { businessId: biz.id, ownerUserId, inviteToken: token };
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: string | undefined,
  ): Promise<BusinessSummary> {
    if (!status || !VALID_STATUSES.has(status)) {
      throw new BadRequestException(`status must be one of: ${[...VALID_STATUSES].join(', ')}`);
    }

    const [existing] = await this.db
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Business not found');

    const [updated] = await this.db
      .update(schema.businesses)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.businesses.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Business not found after update');

    await this.audit.log({
      action: 'business.status.update',
      targetType: 'business',
      targetId: updated.id,
      before: { status: existing.status },
      after: { status: updated.status },
    });

    return {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      status: updated.status,
      plan: updated.plan ?? null,
      createdAt: updated.createdAt,
      userCount: 0,
      locationCount: 0,
      lastActivityAt: null,
    };
  }
}

function inviteEmail(businessName: string, link: string): string {
  return `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px;">You've been invited</h1>
  <p>You've been invited to manage <strong>${escapeHtml(businessName)}</strong> on Jetnine.</p>
  <p>
    <a href="${escapeHtml(link)}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">Accept invitation</a>
  </p>
  <p style="color:#666;font-size:12px;">This invitation expires in 72 hours.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Suppress unused-import lint warnings for the count/raw helpers if a future
// refactor drops them.
void raw;
