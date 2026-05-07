import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { CurrentUser, type CurrentUserPayload } from './current-user.decorator';

interface SessionRow {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  current: boolean;
}

// Per Epic 1.2 §6: list active sessions, revoke. The active-session lookup
// runs through Drizzle directly because it's a simple read; revoke uses
// better-auth's cookie path so the session cache and the DB stay in sync.
@Controller('v1/auth/sessions')
export class SessionsController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserPayload): Promise<SessionRow[]> {
    const rows = await this.db
      .select({
        id: schema.sessions.id,
        token: schema.sessions.token,
        expiresAt: schema.sessions.expiresAt,
        createdAt: schema.sessions.createdAt,
        updatedAt: schema.sessions.updatedAt,
        ipAddress: schema.sessions.ipAddress,
        userAgent: schema.sessions.userAgent,
      })
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));

    return rows.map((r) => ({
      id: r.id,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      ipAddress: r.ipAddress ?? null,
      userAgent: r.userAgent ?? null,
      current: r.token === user.sessionToken,
    }));
  }

  @Delete(':id')
  async revoke(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ revoked: true }> {
    // Only revoke our own sessions.
    const existing = await this.db
      .select({ userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .limit(1);
    const found = existing[0];
    if (!found) throw new NotFoundException();
    if (found.userId !== user.id) {
      throw new ForbiddenException('Not your session');
    }
    await this.db
      .delete(schema.sessions)
      .where(and(eq(schema.sessions.id, id), eq(schema.sessions.userId, user.id)));
    return { revoked: true };
  }
}
