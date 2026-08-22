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
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { InvitationService } from './invitation.service';

interface MemberRow {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  status: string;
  roleId: string;
  roleName: string;
  invitedAt: Date | null;
  acceptedAt: Date | null;
}

interface InviteBody {
  email?: string;
  name?: string;
  roleId?: string;
  roleName?: string;
}

interface UpdateMemberBody {
  roleId?: string;
  status?: 'active' | 'disabled';
}

const VALID_STATUS_TARGETS = new Set(['active', 'disabled']);

@TenantScoped()
@Controller('v1/business/members')
export class MembersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(InvitationService) private readonly invitations: InvitationService,
  ) {}

  @Get()
  @RequirePermission('users.view')
  async list(@CurrentTenant() tenant: RequestTenantContext): Promise<MemberRow[]> {
    const rows = await this.db
      .select({
        membershipId: schema.memberships.id,
        userId: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        emailVerified: schema.users.emailVerified,
        status: schema.memberships.status,
        roleId: schema.roles.id,
        roleName: schema.roles.name,
        invitedAt: schema.memberships.invitedAt,
        acceptedAt: schema.memberships.acceptedAt,
      })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(eq(schema.memberships.businessId, tenant.businessId!));
    return rows;
  }

  @Post('invite')
  @RequirePermission('users.invite')
  async invite(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: InviteBody,
  ): Promise<{ membershipId: string; userId: string; alreadyMember: boolean }> {
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('email is required');
    }

    const roleId = await this.resolveRoleId(tenant.businessId!, body.roleId, body.roleName);
    const business = await this.loadBusinessName(tenant.businessId!);

    const result = await this.invitations.invite({
      businessId: tenant.businessId!,
      businessName: business,
      email,
      name: body.name ?? null,
      roleId,
      invitedByUserId: actor.id,
    });

    await this.audit.log({
      action: result.alreadyMember ? 'membership.invite.skipped' : 'membership.invite',
      targetType: 'membership',
      targetId: result.membershipId,
      metadata: { email, roleId, alreadyMember: result.alreadyMember },
    });

    return {
      membershipId: result.membershipId,
      userId: result.userId,
      alreadyMember: result.alreadyMember,
    };
  }

  @Post(':id/resend-invite')
  @RequirePermission('users.invite')
  async resend(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') membershipId: string,
  ): Promise<{ resent: true }> {
    const [m] = await this.db
      .select({
        id: schema.memberships.id,
        userId: schema.memberships.userId,
        roleId: schema.memberships.roleId,
        status: schema.memberships.status,
        email: schema.users.email,
        name: schema.users.name,
      })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(
        and(
          eq(schema.memberships.id, membershipId),
          eq(schema.memberships.businessId, tenant.businessId!),
        ),
      )
      .limit(1);
    if (!m) throw new NotFoundException('Membership not found');
    if (m.status === 'active') {
      throw new ConflictException('Member is already active');
    }
    const business = await this.loadBusinessName(tenant.businessId!);
    await this.invitations.invite({
      businessId: tenant.businessId!,
      businessName: business,
      email: m.email,
      name: m.name,
      roleId: m.roleId,
      invitedByUserId: actor.id,
    });
    await this.audit.log({
      action: 'membership.invite.resend',
      targetType: 'membership',
      targetId: m.id,
      metadata: { email: m.email },
    });
    return { resent: true };
  }

  @Patch(':id')
  @RequirePermission('users.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') membershipId: string,
    @Body() body: UpdateMemberBody,
  ): Promise<{ updated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.id, membershipId),
          eq(schema.memberships.businessId, tenant.businessId!),
        ),
      )
      .limit(1);
    if (!existing) throw new NotFoundException('Membership not found');

    const update: Partial<typeof schema.memberships.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.roleId && body.roleId !== existing.roleId) {
      const [role] = await this.db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(
          and(eq(schema.roles.id, body.roleId), eq(schema.roles.businessId, tenant.businessId!)),
        )
        .limit(1);
      if (!role) throw new NotFoundException('Role not found in this business');
      update.roleId = body.roleId;
      before.roleId = existing.roleId;
      after.roleId = body.roleId;
    }

    if (body.status && body.status !== existing.status) {
      if (!VALID_STATUS_TARGETS.has(body.status)) {
        throw new BadRequestException('status must be active or disabled');
      }
      update.status = body.status;
      before.status = existing.status;
      after.status = body.status;
    }

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    await this.db
      .update(schema.memberships)
      .set(update)
      .where(eq(schema.memberships.id, membershipId));

    await this.audit.log({
      action: 'membership.update',
      targetType: 'membership',
      targetId: membershipId,
      before,
      after,
    });

    return { updated: true };
  }

  @Post(':id/disable')
  @RequirePermission('users.disable')
  async disable(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') membershipId: string,
  ): Promise<{ disabled: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.id, membershipId),
          eq(schema.memberships.businessId, tenant.businessId!),
        ),
      )
      .limit(1);
    if (!existing) throw new NotFoundException('Membership not found');
    if (existing.status === 'disabled') return { disabled: true };

    await this.db
      .update(schema.memberships)
      .set({ status: 'disabled' })
      .where(eq(schema.memberships.id, membershipId));

    await this.audit.log({
      action: 'membership.disable',
      targetType: 'membership',
      targetId: membershipId,
      before: { status: existing.status },
      after: { status: 'disabled' },
    });

    return { disabled: true };
  }

  private async resolveRoleId(
    businessId: string,
    roleId: string | undefined,
    roleName: string | undefined,
  ): Promise<string> {
    if (roleId) {
      const [r] = await this.db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(and(eq(schema.roles.id, roleId), eq(schema.roles.businessId, businessId)))
        .limit(1);
      if (!r) throw new NotFoundException('Role not found in this business');
      return r.id;
    }
    if (roleName) {
      const [r] = await this.db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(and(eq(schema.roles.name, roleName), eq(schema.roles.businessId, businessId)))
        .limit(1);
      if (!r) throw new NotFoundException(`Role "${roleName}" not found in this business`);
      return r.id;
    }
    throw new BadRequestException('roleId or roleName is required');
  }

  private async loadBusinessName(businessId: string): Promise<string> {
    const [b] = await this.db
      .select({ name: schema.businesses.name })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    return b?.name ?? 'LA Mattress ERP';
  }
}
