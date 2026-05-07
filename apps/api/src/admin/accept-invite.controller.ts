import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { and, eq, gte, like } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { Public } from '../tenancy/decorators';

const INVITE_PREFIX = 'invite:';

interface AcceptInviteBody {
  token?: string;
  password?: string;
}

/**
 * Public endpoint the invited user hits with their token and chosen
 * password. Activates the user (verifies email, sets password, marks
 * membership active) and consumes the verification row so the link can't
 * be reused.
 */
@Public()
@Controller('v1/auth')
export class AcceptInviteController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Post('accept-invite')
  async accept(@Body() body: AcceptInviteBody): Promise<{ userId: string; email: string }> {
    const token = body.token?.trim();
    const password = body.password ?? '';
    if (!token) throw new BadRequestException('token is required');
    if (password.length < 12) {
      throw new BadRequestException('password must be at least 12 characters');
    }

    // Look up the invitation. The identifier is "invite:<email>"; rows
    // expire after 72h.
    const now = new Date();
    const matches = await this.db
      .select()
      .from(schema.verifications)
      .where(
        and(
          eq(schema.verifications.value, token),
          like(schema.verifications.identifier, `${INVITE_PREFIX}%`),
          gte(schema.verifications.expiresAt, now),
        ),
      )
      .limit(1);
    const verification = matches[0];
    if (!verification) {
      throw new UnauthorizedException('Invitation token is invalid or has expired');
    }

    const email = verification.identifier.slice(INVITE_PREFIX.length);
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (!user) throw new NotFoundException('Invited user no longer exists');

    const passwordHash = await hashPassword(password);

    // Upsert the credential. better-auth uses (provider_id='credential',
    // account_id=<user.id>) as its unique key.
    const existingAccount = await this.db
      .select()
      .from(schema.accounts)
      .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, 'credential')))
      .limit(1);
    if (existingAccount[0]) {
      await this.db
        .update(schema.accounts)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(schema.accounts.id, existingAccount[0].id));
    } else {
      await this.db.insert(schema.accounts).values({
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: passwordHash,
      });
    }

    // Activate the user + memberships.
    await this.db
      .update(schema.users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
    await this.db
      .update(schema.memberships)
      .set({ status: 'active', acceptedAt: new Date() })
      .where(and(eq(schema.memberships.userId, user.id), eq(schema.memberships.status, 'invited')));

    // Burn the token so the same link can't be reused.
    await this.db.delete(schema.verifications).where(eq(schema.verifications.id, verification.id));

    return { userId: user.id, email };
  }
}
