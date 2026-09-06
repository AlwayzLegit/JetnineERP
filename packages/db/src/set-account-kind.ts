/**
 * Ops CLI: flip a business between the owner's own operation (`agency`,
 * PLAN §15 — never billed, never read-only) and a paying `saas` tenant,
 * or list every business with its current kind.
 *
 * Runs wherever DATABASE_URL points; on production that is a Render
 * one-off job in the API's environment, dispatched by
 * .github/workflows/ops-set-account-kind.yml:
 *
 *   pnpm --filter @jetnine/db exec tsx src/set-account-kind.ts --list
 *   pnpm --filter @jetnine/db exec tsx src/set-account-kind.ts --slug la-mattress --kind agency
 *
 * Mirrors AdminAccountsController.setKind exactly (businesses + subscriptions
 * rows, audit row with actor_type 'system') so the result is indistinguishable
 * from clicking "Mark as agency" in the console.
 */
import { eq } from 'drizzle-orm';
import { createClient } from './client';
import { auditLogs, businesses, subscriptions } from './schema';

type Kind = 'agency' | 'saas';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }
  const list = process.argv.includes('--list');
  const slug = arg('--slug');
  const kind = arg('--kind') as Kind | undefined;

  if (!list && (!slug || (kind !== 'agency' && kind !== 'saas'))) {
    console.error('Usage: set-account-kind --list | --slug <slug> --kind agency|saas');
    process.exit(2);
  }

  const { db, sql } = createClient({ url, max: 1 });
  try {
    if (list) {
      const rows = await db
        .select({
          slug: businesses.slug,
          name: businesses.name,
          accountKind: businesses.accountKind,
          status: businesses.status,
          plan: businesses.plan,
          trialEndsAt: businesses.trialEndsAt,
          subStatus: subscriptions.status,
          subTrialEndsAt: subscriptions.trialEndsAt,
        })
        .from(businesses)
        .leftJoin(subscriptions, eq(subscriptions.businessId, businesses.id))
        .orderBy(businesses.createdAt);
      for (const r of rows) {
        console.log(
          [
            r.slug,
            JSON.stringify(r.name),
            `kind=${r.accountKind}`,
            `status=${r.status}`,
            `plan=${r.plan ?? '-'}`,
            `sub=${r.subStatus ?? '(no row)'}`,
            `trial_ends=${(r.subTrialEndsAt ?? r.trialEndsAt)?.toISOString() ?? '-'}`,
          ].join('  '),
        );
      }
      console.log(`${rows.length} business(es).`);
      return;
    }

    const [biz] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        accountKind: businesses.accountKind,
        status: businesses.status,
      })
      .from(businesses)
      .where(eq(businesses.slug, slug!))
      .limit(1);
    if (!biz) {
      console.error(`No business with slug "${slug}". Run with --list to see slugs.`);
      process.exit(3);
    }

    const now = new Date();
    if (kind === 'agency') {
      await db
        .update(businesses)
        .set({ accountKind: 'agency', status: 'active', trialEndsAt: null, updatedAt: now })
        .where(eq(businesses.id, biz.id));
      await db
        .update(subscriptions)
        .set({ status: 'active', trialEndsAt: null, cancelAtPeriodEnd: null, updatedAt: now })
        .where(eq(subscriptions.businessId, biz.id));
    } else {
      await db
        .update(businesses)
        .set({ accountKind: 'saas', updatedAt: now })
        .where(eq(businesses.id, biz.id));
    }
    await db.insert(auditLogs).values({
      businessId: biz.id,
      actorType: 'system',
      action: 'business.account_kind.update',
      targetType: 'business',
      targetId: biz.id,
      changesJson: {
        before: { accountKind: biz.accountKind, status: biz.status },
        after: { accountKind: kind, status: kind === 'agency' ? 'active' : biz.status },
        via: 'set-account-kind.ts',
      },
    });
    console.log(
      `${biz.name} (${slug}): ${biz.accountKind} → ${kind}` +
        (kind === 'agency' ? ' — status active, trial cleared, subscription active.' : '.'),
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
