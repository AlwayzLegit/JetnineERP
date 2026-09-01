import { api } from './api';

export interface ZipHit {
  city: string;
  /** Two-letter state code, e.g. "CA". */
  state: string;
}

const cache = new Map<string, Promise<ZipHit | null>>();

/** True once the field holds something the server could resolve. */
export function looksLikeZip(raw: string): boolean {
  const v = raw.trim().toUpperCase();
  return /^\d{5}(-\d{4})?$/.test(v) || /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(v);
}

/**
 * City/state for a ZIP, from the API's bundled table. Cached per session
 * so retyping a ZIP is free; resolves null (never throws) when nothing
 * is on file, so a form can simply leave the fields alone.
 */
export function lookupZip(raw: string): Promise<ZipHit | null> {
  const zip = raw.trim().toUpperCase();
  if (!looksLikeZip(zip)) return Promise.resolve(null);
  const hit = cache.get(zip);
  if (hit) return hit;
  const pending = api<ZipHit>(`/v1/geo/zip/${encodeURIComponent(zip)}`)
    .then((r) => ({ city: r.city, state: r.state }))
    .catch(() => null);
  cache.set(zip, pending);
  return pending;
}

/**
 * The autofill rule every address form shares: a resolved ZIP fills city
 * and state only where the person has not typed something themselves,
 * or where the value is what a previous autofill wrote. Typing a ZIP
 * never overwrites a hand-entered city.
 */
export function applyZipHit<T extends { city: string; region: string }>(
  current: T,
  hit: ZipHit,
  previous: ZipHit | null,
): T {
  const next = { ...current };
  if (!next.city.trim() || (previous && next.city === previous.city)) next.city = hit.city;
  if (!next.region.trim() || (previous && next.region === previous.state)) {
    next.region = hit.state;
  }
  return next;
}

type AddressState = { city: string; region: string; postalCode: string };

/**
 * Controlled-form flavour: writes the ZIP into state at once, then — if
 * it is a complete ZIP — resolves it and fills city/state through
 * `applyZipHit`. The fill is skipped when the ZIP changed again before
 * the lookup returned, so a fast typist never sees a stale city land.
 */
export function autofillFromZip<T extends AddressState, K extends string>(
  value: string,
  set: (updater: (prev: T) => T) => void,
  memo: Record<K, ZipHit | null>,
  key: K,
): void {
  set((prev) => ({ ...prev, postalCode: value }));
  if (!looksLikeZip(value)) return;
  const zip = value.trim().toUpperCase();
  void lookupZip(zip).then((hit) => {
    if (!hit) return;
    set((prev) => {
      if (prev.postalCode.trim().toUpperCase() !== zip) return prev;
      const next = applyZipHit(prev, hit, memo[key]);
      memo[key] = hit;
      return next;
    });
  });
}

/**
 * Uncontrolled-form flavour for the customer edit page: given the ZIP
 * input, fill the sibling city/state inputs (found by name) in the same
 * form under the same never-overwrite rule.
 */
export function autofillFormFromZip(
  zipInput: HTMLInputElement,
  names: { city: string; region: string },
  memo: { current: ZipHit | null },
): void {
  const value = zipInput.value;
  if (!looksLikeZip(value)) return;
  const zip = value.trim().toUpperCase();
  const form = zipInput.form;
  if (!form) return;
  void lookupZip(zip).then((hit) => {
    if (!hit || zipInput.value.trim().toUpperCase() !== zip) return;
    const city = form.elements.namedItem(names.city);
    const region = form.elements.namedItem(names.region);
    if (!(city instanceof HTMLInputElement) || !(region instanceof HTMLInputElement)) return;
    const next = applyZipHit({ city: city.value, region: region.value }, hit, memo.current);
    city.value = next.city;
    region.value = next.region;
    memo.current = hit;
  });
}
