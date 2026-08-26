import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { randomBytes } from 'node:crypto';
import { schema } from '@jetnine/db';
import { DRIZZLE, ROOT_DRIZZLE } from '../database/database.module';
import { EmailService } from '../email/email.service';

export interface InviteInput {
  businessId: string;
  businessName: string;
  email: string;
  name?: string | null;
  roleId: string;
  invitedByUserId: string;
}

export interface InviteResult {
  userId: string;
  membershipId: string;
  token: string;
  /** The accept-invite URL the email carries. Empty for `alreadyMember`. */
  link: string;
  /**
   * False when the configured transport only captured the mail (no Resend
   * key). The invite is still valid — it just has no way of reaching the
   * invitee, so the caller has to hand `link` to whoever is inviting.
   */
  emailDelivered: boolean;
  alreadyMember: boolean;
}

const INVITE_PREFIX = 'invite:';
const INVITE_TTL_HOURS = 72;

/**
 * Shared invitation logic used both by the super-admin "create business +
 * invite owner" path and the per-business "invite a member" path.
 *
 *   1. Find or create the user (unverified, password-less).
 *   2. Insert a membership with status='invited' (or refresh an existing
 *      invited/disabled membership in place).
 *   3. Insert a verifications row with identifier="invite:<email>".
 *   4. Send an invitation email with the token-bound link.
 *
 * If the user already has an *active* membership in this business the
 * caller gets `alreadyMember: true` and no new invite is created.
 */
@Injectable()
export class InvitationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(ROOT_DRIZZLE) private readonly rootDb: PostgresJsDatabase,
    @Inject(EmailService) private readonly email: EmailService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async invite(input: InviteInput): Promise<InviteResult> {
    const email = input.email.trim().toLowerCase();
    const name = input.name?.trim() ?? null;

    // 1. Find or create the user. Deliberately on the root connection:
    // the invitee is not a member yet, so under RLS the inviting tenant
    // can neither see nor create their `users` row.
    let userId: string;
    const existingUser = await this.rootDb
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (existingUser[0]) {
      userId = existingUser[0].id;
    } else {
      const [u] = await this.rootDb
        .insert(schema.users)
        .values({ email, emailVerified: false, name })
        .returning();
      if (!u) throw new Error('failed to create invited user');
      userId = u.id;
    }

    // 2. Find any existing membership in THIS business.
    const existing = await this.db
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, userId),
          eq(schema.memberships.businessId, input.businessId),
        ),
      )
      .limit(1);

    let membershipId: string;
    if (existing[0]) {
      if (existing[0].status === 'active') {
        return {
          userId,
          membershipId: existing[0].id,
          token: '',
          link: '',
          emailDelivered: false,
          alreadyMember: true,
        };
      }
      const [updated] = await this.db
        .update(schema.memberships)
        .set({
          roleId: input.roleId,
          status: 'invited',
          invitedByUserId: input.invitedByUserId,
          invitedAt: new Date(),
          acceptedAt: null,
        })
        .where(eq(schema.memberships.id, existing[0].id))
        .returning();
      if (!updated) throw new Error('failed to reinvite');
      membershipId = updated.id;
    } else {
      const [m] = await this.db
        .insert(schema.memberships)
        .values({
          businessId: input.businessId,
          userId,
          roleId: input.roleId,
          status: 'invited',
          invitedByUserId: input.invitedByUserId,
          invitedAt: new Date(),
        })
        .returning();
      if (!m) throw new Error('failed to create membership');
      membershipId = m.id;
    }

    // 3. Token + 4. Email.
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);
    // Root connection: verifications is a better-auth platform table whose
    // RLS policy (rightly) has no tenant path.
    await this.rootDb.insert(schema.verifications).values({
      identifier: `${INVITE_PREFIX}${email}`,
      value: token,
      expiresAt,
    });

    const baseURL = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
    const link = `${baseURL}/accept-invite?token=${encodeURIComponent(token)}`;
    await this.email.send({
      to: email,
      subject: `You've been invited to ${input.businessName} on LA Mattress ERP`,
      text: `Accept your invitation: ${link}`,
      html: inviteEmail(input.businessName, link),
    });

    return {
      userId,
      membershipId,
      token,
      link,
      emailDelivered: this.email.delivers,
      alreadyMember: false,
    };
  }
}

function inviteEmail(businessName: string, link: string): string {
  return `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px;">You've been invited</h1>
  <p>You've been invited to <strong>${escapeHtml(businessName)}</strong> on LA Mattress ERP.</p>
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
