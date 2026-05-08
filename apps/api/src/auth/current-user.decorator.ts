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
  // When a super admin is impersonating a business user, this is the
  // super admin's id; the rest of the fields describe the *effective*
  // user (the one being impersonated). Null in normal operation.
  impersonatorUserId: string | null;
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
