import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import type { Permission, ReasonUsageClass } from '@jetnine/shared';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE, ROOT_DRIZZLE } from '../database/database.module';
import { getRequestContext } from '../tenancy/request-context';
import { importESM } from '../utils/import-esm';
import { ExceptionsService } from './exceptions.service';

/**
 * Second-user credentials + reason supplied by the client when retrying
 * an action that came back 403 OVERRIDE_REQUIRED.
 */
export interface OverrideCredentials {
  email?: string;
  password?: string;
  reasonCodeId?: string;
  reason?: string;
}

export interface RequireOverrideInput {
  /** The permission that gates the action. */
  permission: Permission;
  /** Human description shown on the override screen ("Unlock a printed order"). */
  action: string;
  entityType?: string;
  entityId?: string;
  /** Snapshot of what the override is letting change, for the register. */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** Credentials from the retry; absent on the first attempt. */
  override?: OverrideCredentials;
  /**
   * Segregation-of-duties mode (G11): demand a second user even when
   * the actor holds the permission — e.g. approving an invoice you
   * keyed yourself.
   */
  force?: boolean;
}

export interface OverrideResult {
  overridden: boolean;
  authorizingUserId: string | null;
  overrideId: string | null;
}

export interface ResolvedReason {
  reasonCodeId: string | null;
  reasonCode: string | null;
  reasonText: string | null;
}

/**
 * The STORIS Security Override primitive (PLAN-STORIS-GAP §0.1).
 *
 * `require()` gates an action on a permission at the *point of action*:
 * an actor holding the permission passes untouched; an actor without it
 * gets 403 `OVERRIDE_REQUIRED` (the client opens the override dialog),
 * and a retry carrying a different, authorized user's credentials plus
 * an exception reason code passes with the override stamped into the
 * `security_overrides` register under both identities.
 */
@Injectable()
export class SecurityOverrideService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    // Credential verification must read another user's accounts row —
    // exactly what the accounts owner-only RLS policy (rightly) blocks
    // on the request connection. It runs on the root connection instead,
    // the same trust level better-auth's own sign-in uses.
    @Inject(ROOT_DRIZZLE) private readonly rootDb: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ExceptionsService) private readonly exceptions: ExceptionsService,
  ) {}

  async require(input: RequireOverrideInput): Promise<OverrideResult> {
    const ctx = getRequestContext();
    if (!input.force && (ctx.isSuperAdmin || ctx.permissions.has(input.permission))) {
      return { overridden: false, authorizingUserId: null, overrideId: null };
    }

    const cred = input.override;
    if (!cred?.email || !cred.password) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'OVERRIDE_REQUIRED',
        permission: input.permission,
        action: input.action,
        message: `${input.action} requires the "${input.permission}" permission. An authorized user can approve it with their credentials.`,
      });
    }

    const authorizer = await this.verifyAuthorizer(
      cred.email.trim().toLowerCase(),
      cred.password,
      input.permission,
      ctx.userId,
      ctx.businessId!,
    );
    // The override records the *action's* reason — whatever class the
    // consuming flow prompts for (a scrap carries a write_off code, an
    // unlock an exception code). Class enforcement stays with the
    // consumer; here any active code, or free text, is accepted.
    const reason = await this.lookupReason(cred.reasonCodeId, cred.reason);

    const [row] = await this.db
      .insert(schema.securityOverrides)
      .values({
        businessId: ctx.businessId!,
        actorUserId: ctx.userId,
        authorizingUserId: authorizer.id,
        permission: input.permission,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        reasonCodeId: reason.reasonCodeId,
        reason: reason.reasonText,
        beforeJson: input.before ?? null,
        afterJson: input.after ?? null,
      })
      .returning({ id: schema.securityOverrides.id });

    await this.audit.log({
      action: 'security.override',
      targetType: input.entityType ?? 'security_override',
      targetId: input.entityId ?? row!.id,
      metadata: {
        permission: input.permission,
        overrideAction: input.action,
        authorizingUserId: authorizer.id,
        authorizingEmail: authorizer.email,
        reasonCode: reason.reasonCode,
        reason: reason.reasonText,
      },
    });

    await this.exceptions.record({
      type: 'security_override',
      severity: 'warning',
      entityType: input.entityType,
      entityId: input.entityId,
      summary: `${input.action} — approved by ${authorizer.email}`,
      metadata: {
        permission: input.permission,
        authorizingUserId: authorizer.id,
        reasonCode: reason.reasonCode,
        reason: reason.reasonText,
      },
    });

    return { overridden: true, authorizingUserId: authorizer.id, overrideId: row!.id };
  }

  /** Class-agnostic reason lookup for the override stamp itself. */
  private async lookupReason(
    reasonCodeId: string | null | undefined,
    reasonText: string | null | undefined,
  ): Promise<ResolvedReason> {
    if (reasonCodeId) {
      const [code] = await this.db
        .select()
        .from(schema.reasonCodes)
        .where(eq(schema.reasonCodes.id, reasonCodeId))
        .limit(1);
      if (!code || !code.active) {
        throw new BadRequestException('reasonCodeId must name an active reason code');
      }
      return {
        reasonCodeId: code.id,
        reasonCode: code.code,
        reasonText: reasonText?.trim() || code.description,
      };
    }
    const text = reasonText?.trim() ?? '';
    return { reasonCodeId: null, reasonCode: null, reasonText: text || null };
  }

  /**
   * Validate a reason against the coded registry (PLAN-STORIS-GAP §0.2).
   * A `reasonCodeId` must exist, be active, and carry the asked-for usage
   * class. While the business has no active codes for the class, free
   * text is accepted as a transitional fallback (amendment A9); once
   * codes exist, a code is required.
   */
  async resolveReason(
    usageClass: ReasonUsageClass,
    input: { reasonCodeId?: string | null; reason?: string | null },
    opts: { required?: boolean } = {},
  ): Promise<ResolvedReason> {
    const required = opts.required ?? true;
    if (input.reasonCodeId) {
      const [code] = await this.db
        .select()
        .from(schema.reasonCodes)
        .where(eq(schema.reasonCodes.id, input.reasonCodeId))
        .limit(1);
      if (!code || code.usageClass !== usageClass || !code.active) {
        throw new BadRequestException(
          `reasonCodeId must name an active reason code of class "${usageClass}"`,
        );
      }
      return {
        reasonCodeId: code.id,
        reasonCode: code.code,
        reasonText: input.reason?.trim() || code.description,
      };
    }

    const ctx = getRequestContext();
    const [anyCode] = await this.db
      .select({ id: schema.reasonCodes.id })
      .from(schema.reasonCodes)
      .where(
        and(
          eq(schema.reasonCodes.businessId, ctx.businessId!),
          eq(schema.reasonCodes.usageClass, usageClass),
          eq(schema.reasonCodes.active, true),
        ),
      )
      .limit(1);
    if (anyCode) {
      throw new BadRequestException(
        `A coded reason (class "${usageClass}") is required — pass reasonCodeId`,
      );
    }
    const text = input.reason?.trim() ?? '';
    if (!text && required) {
      throw new BadRequestException('A reason is required');
    }
    return { reasonCodeId: null, reasonCode: null, reasonText: text || null };
  }

  private async verifyAuthorizer(
    email: string,
    password: string,
    permission: Permission,
    actorUserId: string | null,
    businessId: string,
  ): Promise<{ id: string; email: string }> {
    const denied = (detail: string) =>
      new ForbiddenException({
        statusCode: 403,
        code: 'OVERRIDE_DENIED',
        message: detail,
      });

    const [user] = await this.db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (!user) throw denied('Authorizer credentials are invalid');
    if (actorUserId && user.id === actorUserId) {
      throw denied('A different user must authorize the override');
    }

    const [account] = await this.rootDb
      .select({ password: schema.accounts.password })
      .from(schema.accounts)
      .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, 'credential')))
      .limit(1);
    if (!account?.password) throw denied('Authorizer credentials are invalid');
    const { verifyPassword } = await importESM<{
      verifyPassword: (args: { hash: string; password: string }) => Promise<boolean>;
    }>('better-auth/crypto');
    const ok = await verifyPassword({ hash: account.password, password });
    if (!ok) throw denied('Authorizer credentials are invalid');

    const [membership] = await this.db
      .select({ id: schema.memberships.id, roleId: schema.memberships.roleId })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, user.id),
          eq(schema.memberships.businessId, businessId),
          eq(schema.memberships.status, 'active'),
        ),
      )
      .limit(1);
    if (!membership) throw denied('Authorizer is not an active member of this business');

    // Effective permissions = role defaults, then per-user overrides —
    // the same stack the TenancyGuard applies to a normal request.
    const rolePerms = await this.db
      .select({ permission: schema.rolePermissions.permission })
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, membership.roleId));
    const effective = new Set(rolePerms.map((r) => r.permission));
    const userOverrides = await this.db
      .select({
        permission: schema.membershipPermissionOverrides.permission,
        allowed: schema.membershipPermissionOverrides.allowed,
      })
      .from(schema.membershipPermissionOverrides)
      .where(eq(schema.membershipPermissionOverrides.membershipId, membership.id));
    for (const o of userOverrides) {
      if (o.allowed) effective.add(o.permission);
      else effective.delete(o.permission);
    }
    if (!effective.has(permission)) {
      throw denied(`Authorizing user does not hold "${permission}"`);
    }
    return user;
  }
}
