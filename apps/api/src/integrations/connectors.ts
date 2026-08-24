/**
 * Platform connectors (one per provider). Each knows how to test a
 * credential set and pull customers / products / completed orders,
 * normalized into the import pipeline's entity field shapes (see
 * import-spec.ts) — so a sync is just "stage structured rows, validate,
 * commit", with all of D7's idempotency and the recon gates for free.
 *
 * Legacy ids are prefixed per provider (shp-/woo-/wix-) so identity
 * spaces never collide with each other or with the STORIS numbers in
 * `legacy_refs`.
 *
 * All HTTP goes through an injected fetch so tests can substitute a
 * fake platform.
 */

export type FetchImpl = typeof fetch;

/**
 * Injection token for the fetch implementation connectors use — the
 * integrations int spec swaps in a fake platform here. Lives here (not
 * in the module) so the controller's import of it cannot be circular.
 */
export const INTEGRATION_FETCH = Symbol('INTEGRATION_FETCH');

export interface ConnectorPull {
  entity: 'customer' | 'product' | 'sale';
  rows: Record<string, string>[];
}

export interface ConnectorContext {
  credentials: Record<string, string>;
  config: { locationName?: string };
  fetchImpl: FetchImpl;
}

export interface Connector {
  provider: string;
  label: string;
  /** Which credential fields the connect form collects. */
  credentialFields: { name: string; label: string; secret?: boolean }[];
  test(ctx: ConnectorContext): Promise<{ ok: boolean; detail: string }>;
  pull(ctx: ConnectorContext): Promise<ConnectorPull[]>;
}

const MAX_PAGES = 20;

function centsString(v: unknown): string {
  // Providers send money as dollar strings ("19.99") or numbers; the
  // import pipeline's money parser takes dollars, so pass through.
  if (v == null) return '';
  return String(v);
}

function s(v: unknown): string {
  return v == null ? '' : String(v);
}

// ---------------------------------------------------------------- Shopify

async function shopifyGet(
  ctx: ConnectorContext,
  path: string,
): Promise<{ body: unknown; nextPageInfo: string | null }> {
  const domain = (ctx.credentials.shopDomain ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const res = await ctx.fetchImpl(`https://${domain}/admin/api/2024-10/${path}`, {
    headers: { 'X-Shopify-Access-Token': ctx.credentials.accessToken ?? '' },
  });
  if (!res.ok) {
    throw new Error(`Shopify ${path.split('?')[0]} responded ${res.status}`);
  }
  const link = res.headers.get('link') ?? '';
  const next = /<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/.exec(link);
  return { body: await res.json(), nextPageInfo: next ? next[1]! : null };
}

async function shopifyPaged(
  ctx: ConnectorContext,
  resource: string,
  extra = '',
): Promise<unknown[]> {
  const out: unknown[] = [];
  let pageInfo: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = pageInfo ? `limit=250&page_info=${pageInfo}` : `limit=250${extra}`;
    const { body, nextPageInfo } = await shopifyGet(ctx, `${resource}.json?${qs}`);
    const items = (body as Record<string, unknown[]>)[resource] ?? [];
    out.push(...items);
    if (!nextPageInfo) break;
    pageInfo = nextPageInfo;
  }
  return out;
}

const shopify: Connector = {
  provider: 'shopify',
  label: 'Shopify',
  credentialFields: [
    { name: 'shopDomain', label: 'Shop domain (your-store.myshopify.com)' },
    { name: 'accessToken', label: 'Admin API access token', secret: true },
  ],
  async test(ctx) {
    const { body } = await shopifyGet(ctx, 'shop.json');
    const shop = (body as { shop?: { name?: string } }).shop;
    return { ok: true, detail: `Connected to ${shop?.name ?? 'shop'}` };
  },
  async pull(ctx) {
    const customers = (await shopifyPaged(ctx, 'customers')) as Record<string, unknown>[];
    const products = (await shopifyPaged(ctx, 'products')) as Record<string, unknown>[];
    const orders = (await shopifyPaged(
      ctx,
      'orders',
      '&status=any&financial_status=paid',
    )) as Record<string, unknown>[];

    const customerRows = customers.map((c) => {
      const email = s(c.email);
      let firstName = s(c.first_name);
      // Shopify guest checkouts often carry no name at all — fall back
      // to the email's local part so CRM lists aren't rows of "—".
      if (!firstName && !s(c.last_name) && email.includes('@')) {
        firstName = email.split('@')[0]!;
      }
      return {
        accountNo: `shp-${s(c.id)}`,
        firstName,
        lastName: s(c.last_name),
        email,
        phone: s(c.phone),
      };
    });

    const productRows = products.flatMap((p) => {
      const variants = (p.variants as Record<string, unknown>[] | undefined) ?? [];
      return variants.map((v) => ({
        sku: s(v.sku) || `shp-${s(v.id)}`,
        name:
          variants.length > 1 && s(v.title) !== 'Default Title'
            ? `${s(p.title)} — ${s(v.title)}`
            : s(p.title),
        category: s(p.product_type),
        priceCents: centsString(v.price),
        barcode: s(v.barcode),
      }));
    });

    const location = ctx.config.locationName ?? '';
    const saleRows = orders.map((o) => ({
      invoiceNo: `shp-${s(o.order_number ?? o.id)}`,
      customerAccountNo: o.customer ? `shp-${s((o.customer as Record<string, unknown>).id)}` : '',
      location,
      saleDate: s(o.created_at).slice(0, 10),
      totalCents: centsString(o.total_price),
      taxCents: centsString(o.total_tax),
      method: 'card',
    }));

    return [
      { entity: 'customer', rows: customerRows },
      { entity: 'product', rows: productRows },
      { entity: 'sale', rows: saleRows },
    ];
  },
};

// ------------------------------------------------------------ WooCommerce

async function wooGet(ctx: ConnectorContext, path: string, page: number): Promise<unknown[]> {
  const base = (ctx.credentials.siteUrl ?? '').replace(/\/$/, '');
  const auth = `consumer_key=${encodeURIComponent(ctx.credentials.consumerKey ?? '')}&consumer_secret=${encodeURIComponent(ctx.credentials.consumerSecret ?? '')}`;
  const res = await ctx.fetchImpl(
    `${base}/wp-json/wc/v3/${path}?per_page=100&page=${page}&${auth}`,
  );
  if (!res.ok) throw new Error(`WooCommerce /${path} responded ${res.status}`);
  return (await res.json()) as unknown[];
}

async function wooPaged(ctx: ConnectorContext, path: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = (await wooGet(ctx, path, page)) as Record<string, unknown>[];
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

const woocommerce: Connector = {
  provider: 'woocommerce',
  label: 'WooCommerce (WordPress)',
  credentialFields: [
    { name: 'siteUrl', label: 'Site URL (https://yourstore.com)' },
    { name: 'consumerKey', label: 'REST API consumer key' },
    { name: 'consumerSecret', label: 'REST API consumer secret', secret: true },
  ],
  async test(ctx) {
    await wooGet(ctx, 'system_status', 1);
    return { ok: true, detail: 'Connected to WooCommerce' };
  },
  async pull(ctx) {
    const customers = await wooPaged(ctx, 'customers');
    const products = await wooPaged(ctx, 'products');
    const orders = await wooPaged(ctx, 'orders');

    const customerRows = customers.map((c) => ({
      accountNo: `woo-${s(c.id)}`,
      firstName: s(c.first_name),
      lastName: s(c.last_name),
      email: s(c.email),
      phone: s((c.billing as Record<string, unknown> | undefined)?.phone),
    }));

    const productRows = products.map((p) => ({
      sku: s(p.sku) || `woo-${s(p.id)}`,
      name: s(p.name),
      category: s(((p.categories as Record<string, unknown>[] | undefined) ?? [])[0]?.name),
      priceCents: centsString(p.price),
    }));

    const location = ctx.config.locationName ?? '';
    const saleRows = orders
      .filter((o) => ['completed', 'processing'].includes(s(o.status)))
      .map((o) => ({
        invoiceNo: `woo-${s(o.number ?? o.id)}`,
        customerAccountNo: Number(o.customer_id) > 0 ? `woo-${s(o.customer_id)}` : '',
        location,
        saleDate: s(o.date_created).slice(0, 10),
        totalCents: centsString(o.total),
        taxCents: centsString(o.total_tax),
        method: 'card',
      }));

    return [
      { entity: 'customer', rows: customerRows },
      { entity: 'product', rows: productRows },
      { entity: 'sale', rows: saleRows },
    ];
  },
};

// ------------------------------------------------------------------- Wix

async function wixPost(ctx: ConnectorContext, path: string, body: unknown): Promise<unknown> {
  const res = await ctx.fetchImpl(`https://www.wixapis.com/${path}`, {
    method: 'POST',
    headers: {
      Authorization: ctx.credentials.apiKey ?? '',
      'wix-site-id': ctx.credentials.siteId ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Wix /${path} responded ${res.status}`);
  return res.json();
}

const wix: Connector = {
  provider: 'wix',
  label: 'Wix Stores',
  credentialFields: [
    { name: 'apiKey', label: 'API key', secret: true },
    { name: 'siteId', label: 'Site ID' },
  ],
  async test(ctx) {
    await wixPost(ctx, 'stores/v1/products/query', { query: { paging: { limit: 1 } } });
    return { ok: true, detail: 'Connected to Wix Stores' };
  },
  async pull(ctx) {
    const productsRes = (await wixPost(ctx, 'stores/v1/products/query', {
      query: { paging: { limit: 100 } },
    })) as { products?: Record<string, unknown>[] };
    const ordersRes = (await wixPost(ctx, 'stores/v2/orders/query', {
      query: { paging: { limit: 100 } },
    })) as { orders?: Record<string, unknown>[] };

    const productRows = (productsRes.products ?? []).map((p) => ({
      sku: s(p.sku) || `wix-${s(p.id)}`,
      name: s(p.name),
      priceCents: centsString((p.price as Record<string, unknown> | undefined)?.price),
    }));

    const location = ctx.config.locationName ?? '';
    const saleRows = (ordersRes.orders ?? [])
      .filter((o) => s(o.paymentStatus) === 'PAID')
      .map((o) => {
        const totals = (o.totals as Record<string, unknown> | undefined) ?? {};
        const buyer = (o.buyerInfo as Record<string, unknown> | undefined) ?? {};
        return {
          invoiceNo: `wix-${s(o.number ?? o.id)}`,
          customerAccountNo: '',
          location,
          saleDate: s(o.dateCreated).slice(0, 10),
          totalCents: centsString(totals.total),
          taxCents: centsString(totals.tax),
          method: 'card',
          _buyerEmail: s(buyer.email),
        };
      })
      .map(({ _buyerEmail, ...row }) => row);

    return [
      { entity: 'product', rows: productRows },
      { entity: 'sale', rows: saleRows },
    ];
  },
};

export const CONNECTORS: Record<string, Connector> = {
  shopify,
  woocommerce,
  wix,
};
