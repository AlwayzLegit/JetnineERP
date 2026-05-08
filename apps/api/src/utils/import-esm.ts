/**
 * TypeScript with `module: "CommonJS"` transpiles `import(specifier)` into a
 * `require(specifier)` call wrapped in a Promise. That breaks for packages
 * that ship ESM only (better-auth, resend, etc.) — at runtime Node throws
 * `ERR_REQUIRE_ESM` because it can't `require()` an `.mjs` file.
 *
 * Wrapping the dynamic import in `new Function(...)` hides it from the TS
 * compiler so the generated JavaScript keeps a native `import(...)` that
 * Node executes as a real dynamic import. Use this everywhere we need to
 * load an ESM-only module from the CJS-compiled apps/api output (which is
 * what runs in the Vercel function).
 */
export const importESM = <T = unknown>(specifier: string): Promise<T> =>
  (Function('s', 'return import(s)') as (s: string) => Promise<T>)(specifier);
