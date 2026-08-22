import { describe, expect, it } from 'vitest';
import { importESM } from './import-esm';

/**
 * `importESM` is the seam every ESM-only dependency comes through, and it
 * is loaded during Nest bootstrap — so when it breaks, all 23 integration
 * specs fail at once with a stack trace that points at Nest's injector
 * rather than at the real cause.
 *
 * These tests exist because exactly that happened: the constructed-import
 * path throws under vitest's VM context, and nothing caught it until CI
 * stopped failing earlier for an unrelated reason. They run in the same
 * VM context the integration specs do, so they fail the same way the
 * bootstrap would.
 */
describe('importESM', () => {
  it('loads an ESM-only package', async () => {
    // better-auth is ESM-only and is what auth.config.ts pulls in at boot.
    const mod = await importESM<{ betterAuth: unknown }>('better-auth');
    expect(mod.betterAuth).toBeTypeOf('function');
  });

  it('loads a nested ESM-only entrypoint', async () => {
    const mod = await importESM<{ drizzleAdapter: unknown }>('better-auth/adapters/drizzle');
    expect(mod.drizzleAdapter).toBeTypeOf('function');
  });

  it('loads a CJS package too', async () => {
    // Not every caller passes an ESM-only specifier; the shim must stay
    // transparent for ordinary packages.
    const mod = await importESM<Record<string, unknown>>('node:path');
    expect(mod).toBeTruthy();
  });

  it('propagates a genuine resolution failure instead of masking it', async () => {
    // The fallback triggers only on ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING.
    // A missing module must still surface as a missing module, not as a
    // confusing dynamic-import error.
    await expect(importESM('@jetnine/definitely-not-a-real-package')).rejects.toThrow();
  });
});
