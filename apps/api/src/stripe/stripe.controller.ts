import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import type { Response } from 'express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { Public, RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { StripeService } from './stripe.service';

interface ConnectionStatus {
  connected: boolean;
  stripeAccountId: string | null;
  accountEmail: string | null;
  livemode: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  publishableKey: string | null;
  stubMode: boolean;
}

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Controller()
export class StripeController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(StripeService) private readonly stripe: StripeService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  /**
   * Returns the URL the merchant should be redirected to so they can
   * authenticate with Stripe. We mint a short-lived state token that
   * ties the OAuth callback back to this business.
   */
  @TenantScoped()
  @Get('v1/business/stripe/connect-url')
  @RequirePermission('business.billing.update')
  async connectUrl(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
  ): Promise<{ url: string; state: string }> {
    const state = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + STATE_TTL_MS);
    await this.db.insert(schema.stripeOauthStates).values({
      state,
      businessId: tenant.businessId!,
      userId: actor.id,
      expiresAt,
    });
    return { url: this.stripe.authorizeUrl(state), state };
  }

  /**
   * Stripe redirects here after the merchant authenticates. Validates
   * the state token, exchanges the auth code for a stripe_user_id,
   * persists the merchant_stripe_accounts row, and bounces the user
   * back to /settings/billing on the web app.
   *
   * Public so the callback can land without our session cookie; the
   * state token is what binds the callback to a business.
   */
  @Public()
  @Get('v1/stripe/oauth/callback')
  async oauthCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') errorParam: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const webBase = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
    const settingsUrl = (status: 'connected' | 'error', message?: string) => {
      const params = new URLSearchParams({ stripe: status });
      if (message) params.set('message', message);
      return `${webBase}/settings/billing?${params.toString()}`;
    };

    try {
      if (errorParam) {
        return res.redirect(settingsUrl('error', errorDescription ?? errorParam));
      }
      if (!code || !state) {
        return res.redirect(settingsUrl('error', 'missing code or state'));
      }
      // Drop expired states proactively so the table doesn't grow.
      await this.db
        .delete(schema.stripeOauthStates)
        .where(lt(schema.stripeOauthStates.expiresAt, new Date()));

      const [row] = await this.db
        .select()
        .from(schema.stripeOauthStates)
        .where(eq(schema.stripeOauthStates.state, state))
        .limit(1);
      if (!row) {
        return res.redirect(settingsUrl('error', 'invalid or expired state'));
      }
      // Single-use: delete it immediately.
      await this.db
        .delete(schema.stripeOauthStates)
        .where(eq(schema.stripeOauthStates.state, state));

      const result = await this.stripe.exchangeOauthCode(code);
      const account = await this.stripe.fetchAccount(result.stripeAccountId);

      const now = new Date();
      await this.db
        .insert(schema.merchantStripeAccounts)
        .values({
          businessId: row.businessId,
          stripeAccountId: result.stripeAccountId,
          scope: result.scope,
          livemode: result.livemode,
          accountEmail: account.email,
          defaultCurrency: account.defaultCurrency,
          chargesEnabled: account.chargesEnabled,
          payoutsEnabled: account.payoutsEnabled,
          connectedByUserId: row.userId,
        })
        .onConflictDoUpdate({
          target: schema.merchantStripeAccounts.businessId,
          set: {
            stripeAccountId: result.stripeAccountId,
            scope: result.scope,
            livemode: result.livemode,
            accountEmail: account.email,
            defaultCurrency: account.defaultCurrency,
            chargesEnabled: account.chargesEnabled,
            payoutsEnabled: account.payoutsEnabled,
            connectedByUserId: row.userId,
            connectedAt: now,
            disconnectedAt: null,
          },
        });

      // The callback runs without AsyncLocalStorage (it's @Public),
      // so we write the audit row directly instead of going through
      // AuditService.
      await this.db.insert(schema.auditLogs).values({
        businessId: row.businessId,
        actorUserId: row.userId,
        actorType: 'user',
        action: 'stripe.connect',
        targetType: 'business',
        targetId: row.businessId,
        changesJson: {
          after: {
            stripeAccountId: result.stripeAccountId,
            livemode: result.livemode,
            chargesEnabled: account.chargesEnabled,
          },
        },
      });

      return res.redirect(settingsUrl('connected'));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return res.redirect(settingsUrl('error', message));
    }
  }

  @TenantScoped()
  @Get('v1/business/stripe')
  @RequirePermission('business.billing.view')
  async status(@CurrentTenant() tenant: RequestTenantContext): Promise<ConnectionStatus> {
    const [row] = await this.db
      .select()
      .from(schema.merchantStripeAccounts)
      .where(and(eq(schema.merchantStripeAccounts.businessId, tenant.businessId!)))
      .limit(1);
    return {
      connected: Boolean(row && !row.disconnectedAt),
      stripeAccountId: row?.stripeAccountId ?? null,
      accountEmail: row?.accountEmail ?? null,
      livemode: row?.livemode ?? false,
      chargesEnabled: row?.chargesEnabled ?? false,
      payoutsEnabled: row?.payoutsEnabled ?? false,
      publishableKey: this.stripe.publishableKey,
      stubMode: this.stripe.stub,
    };
  }

  @TenantScoped()
  @Post('v1/business/stripe/disconnect')
  @RequirePermission('business.billing.update')
  async disconnect(@CurrentTenant() tenant: RequestTenantContext): Promise<{ disconnected: true }> {
    const [row] = await this.db
      .select()
      .from(schema.merchantStripeAccounts)
      .where(eq(schema.merchantStripeAccounts.businessId, tenant.businessId!))
      .limit(1);
    if (!row) throw new NotFoundException('No Stripe account connected');
    if (row.disconnectedAt) throw new BadRequestException('Stripe account already disconnected');

    try {
      await this.stripe.disconnect(row.stripeAccountId);
    } catch (err) {
      // Stripe returns 401 if the account already revoked us — that's
      // still a successful disconnect from our side, so don't fail.
      const message = err instanceof Error ? err.message : String(err);
      if (!/not.*authorized|already.*revoked/i.test(message)) {
        throw new ForbiddenException(`Stripe disconnect failed: ${message}`);
      }
    }
    await this.db
      .update(schema.merchantStripeAccounts)
      .set({ disconnectedAt: new Date() })
      .where(eq(schema.merchantStripeAccounts.businessId, tenant.businessId!));

    await this.audit.log({
      action: 'stripe.disconnect',
      targetType: 'business',
      targetId: tenant.businessId!,
      before: { stripeAccountId: row.stripeAccountId },
    });
    return { disconnected: true };
  }
}
