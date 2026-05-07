import { schema } from '@jetnine/db';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins';
import type { Redis } from 'ioredis';
import type { EmailService } from '../email/email.service';

export interface AuthDeps {
  db: unknown; // Drizzle DB instance
  email: EmailService;
  redis: Redis | null;
  baseURL: string;
  trustedOrigins: string[];
  secret: string;
  productionMode: boolean;
}

export type AuthInstance = ReturnType<typeof createAuth>;

export function createAuth(deps: AuthDeps) {
  const { db, email, redis, baseURL, trustedOrigins, secret, productionMode } = deps;

  const adapter = drizzleAdapter(db as Record<string, unknown>, {
    provider: 'pg',
    usePlural: true,
    transaction: false,
    // We pass our Drizzle tables explicitly so the adapter binds against the
    // exact instances rather than re-introspecting via reflection.
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
      twoFactors: schema.twoFactors,
    },
  });

  const options = {
    appName: 'Jetnine ERP',
    baseURL,
    secret,
    trustedOrigins,
    database: adapter,

    // Cookies. Cross-site (Lax) is fine for our single-domain setup.
    advanced: {
      cookiePrefix: 'jetnine',
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: productionMode,
        httpOnly: true,
      },
      // Our schema uses uuid PKs everywhere; tell better-auth to emit UUIDs
      // instead of its default nanoid-style strings.
      database: {
        generateId: 'uuid',
      },
    },

    // Per-user identity columns we own; better-auth treats them as
    // additional fields it must not touch. is_super_admin is set by the
    // platform; the user shouldn't be able to flip it via update calls.
    user: {
      additionalFields: {
        isSuperAdmin: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
          returned: true,
        },
      },
    },

    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        await email.send({
          to: user.email,
          subject: 'Reset your Jetnine password',
          text: `Click to reset your password: ${url}`,
          html: passwordResetEmail(url),
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await email.send({
          to: user.email,
          subject: 'Verify your Jetnine email',
          text: `Click to verify your email: ${url}`,
          html: verificationEmail(url),
        });
      },
    },

    plugins: [
      twoFactor({
        issuer: 'Jetnine ERP',
        otpOptions: {
          period: 30,
          digits: 6,
        },
      }),
    ],

    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      // Tighter limits on the auth-specific endpoints (PLAN §10.6: 5/min).
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 5 },
        '/forget-password': { window: 60, max: 5 },
        '/reset-password': { window: 60, max: 5 },
        '/two-factor/verify-totp': { window: 60, max: 10 },
      },
      storage: redis ? 'secondary-storage' : 'memory',
    },

    secondaryStorage: redis ? makeRedisStorage(redis) : undefined,
  } satisfies BetterAuthOptions;

  return betterAuth(options);
}

function makeRedisStorage(redis: Redis) {
  return {
    get: async (key: string) => {
      const value = await redis.get(key);
      return value;
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) {
        await redis.set(key, value, 'EX', ttl);
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key: string) => {
      await redis.del(key);
    },
  };
}

function verificationEmail(url: string): string {
  return `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px;">Verify your email</h1>
  <p>Click the button below to confirm this email address is yours.</p>
  <p>
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">Verify email</a>
  </p>
  <p style="color:#666;font-size:12px;">If you didn't create a Jetnine account, you can ignore this email.</p>
</body></html>`;
}

function passwordResetEmail(url: string): string {
  return `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px;">Reset your password</h1>
  <p>Click the button below to choose a new password. The link expires in one hour.</p>
  <p>
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">Reset password</a>
  </p>
  <p style="color:#666;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
