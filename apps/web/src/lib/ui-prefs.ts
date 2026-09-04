'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Appearance preferences (dashboard redesign, 2026-09-04): theme and
 * density are per browser, stored in localStorage and stamped on
 * `<html>` as `data-theme` / `data-density` so the token sheet flips
 * before React paints (the root layout's inline script does the first
 * stamp; this module keeps it in sync afterwards).
 */

export type Theme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';

export const THEME_KEY = 'jetnine.theme';
export const DENSITY_KEY = 'jetnine.density';

interface UiPrefs {
  theme: Theme;
  density: Density;
}

const DEFAULT: UiPrefs = { theme: 'light', density: 'comfortable' };
const listeners = new Set<() => void>();
let cache: UiPrefs | null = null;

function read(): UiPrefs {
  if (cache) return cache;
  let theme: Theme = DEFAULT.theme;
  let density: Density = DEFAULT.density;
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') theme = t;
    const d = localStorage.getItem(DENSITY_KEY);
    if (d === 'compact' || d === 'comfortable') density = d;
  } catch {
    // Storage unavailable — defaults it is.
  }
  cache = { theme, density };
  return cache;
}

export function applyUiPrefs(prefs: UiPrefs): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = prefs.theme;
  document.documentElement.dataset.density = prefs.density;
}

function write(next: UiPrefs): void {
  cache = next;
  try {
    localStorage.setItem(THEME_KEY, next.theme);
    localStorage.setItem(DENSITY_KEY, next.density);
  } catch {
    // Storage unavailable — the choice lasts for this page only.
  }
  applyUiPrefs(next);
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useUiPrefs(): {
  theme: Theme;
  density: Density;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
  toggleTheme: () => void;
} {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULT);
  const setTheme = useCallback((theme: Theme) => write({ ...read(), theme }), []);
  const setDensity = useCallback((density: Density) => write({ ...read(), density }), []);
  const toggleTheme = useCallback(
    () => write({ ...read(), theme: read().theme === 'dark' ? 'light' : 'dark' }),
    [],
  );
  return { theme: prefs.theme, density: prefs.density, setTheme, setDensity, toggleTheme };
}

/**
 * Inline bootstrap for the root layout: stamps the stored theme and
 * density on <html> before hydration so a dark-mode user never sees a
 * light flash. Kept tiny and dependency-free on purpose.
 */
export const UI_PREFS_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=localStorage.getItem('${DENSITY_KEY}');var h=document.documentElement;if(t==='dark'||t==='light')h.dataset.theme=t;if(d==='compact'||d==='comfortable')h.dataset.density=d;}catch(e){}})();`;
