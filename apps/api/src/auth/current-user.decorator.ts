import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestTenantContext } from '../tenancy/request-context';

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

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestTenantContext | null => {
    const req = ctx.switchToHttp().getRequest<Request & { tenant?: RequestTenantContext }>();
    return req.tenant ?? null;
  },
);
