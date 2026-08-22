/**
 * Load an ESM-only package (better-auth, resend, …) from the CJS-compiled
 * apps/api output.
 *
 * Two runtimes have to be satisfied at once, and they want opposite things:
 *
 * 1. **Production** (`tsc` → CommonJS, run by Node). TypeScript rewrites a
 *    literal `import(specifier)` into `require(specifier)`, which throws
 *    `ERR_REQUIRE_ESM` on an ESM-only package. Hiding the import inside
 *    `Function(...)` keeps a native `import(...)` in the emitted JS.
 *
 * 2. **Tests** (vitest, which evaluates modules in a VM context). A function
 *    built by the `Function` constructor does not inherit the host's
 *    dynamic-import callback, so the very same trick throws
 *    `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`. There the *literal* form is
 *    what works: the runner transforms this call site and resolves the
 *    import itself.
 *
 * So: try the constructed import, and fall back to the literal one only on
 * that specific error. The fallback is unreachable in production (Node's
 * CJS loader always installs an import callback), and the primary path is
 * unreachable under vitest — each runtime takes the branch that works for
 * it, and neither silently degrades.
 *
 * Do not "simplify" this to one branch. Dropping the fallback makes every
 * integration test fail at Nest bootstrap; dropping the constructed import
 * breaks the production bundle. That failure mode stayed invisible for a
 * while because CI was dying earlier in setup — hence `import-esm.spec.ts`,
 * which pins both halves.
 */

const NO_IMPORT_CALLBACK = 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING';

export const importESM = async <T = unknown>(specifier: string): Promise<T> => {
  try {
    return await (Function('s', 'return import(s)') as (s: string) => Promise<T>)(specifier);
  } catch (err) {
    if ((err as NodeJS.ErrnoException | null)?.code !== NO_IMPORT_CALLBACK) throw err;
    return (await import(specifier)) as T;
  }
};
