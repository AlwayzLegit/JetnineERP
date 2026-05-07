import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserPayload {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  isSuperAdmin: boolean;
  twoFactorEnabled: boolean;
  sessionId: string;
  sessionToken: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | null => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: CurrentUserPayload }>();
    return req.user ?? null;
  },
);
