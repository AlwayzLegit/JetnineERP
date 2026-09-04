'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import {
  addDays,
  daysBetween,
  rangeFor,
  rangeFromSearch,
  rangeToSearch,
  type DateRange,
} from '@/lib/date-range';

/**
 * Dashboard filters (redesign 2026-09-04): the topbar's store scope,
 * period and compare-to controls and the role-home switch live above
 * the page so the shell and the dashboard read one state. The period
 * is URL-backed (`?range=` / `?start=&end=` / `?compare=`) so a view
 * can be bookmarked; the store scope and the role view are per browser.
 */

export type CompareMode = 'none' | 'prior' | 'year';
export type RoleView = 'owner' | 'manager' | 'ops' | 'warehouse';

export interface StoreOption {
  id: string;
  name: string;
  timezone: string;
  locationType: string;
}

interface DashboardFilters {
  stores: StoreOption[];
  /** null = every store. */
  storeIds: string[] | null;
  setStoreIds: (ids: string[] | null) => void;
  storeLabel: string;
  range: DateRange;
  setRange: (r: DateRange) => void;
  rangeReady: boolean;
  compare: CompareMode;
  setCompare: (c: CompareMode) => void;
  /** The comparison window, if any. */
  compareRange: { start: string; end: string } | null;
  roleView: RoleView | null;
  setRoleView: (r: RoleView | null) => void;
  /** Query string fragment: `start=…&end=…&compare=…&locationIds=…`. */
  query: string;
}

const Ctx = createContext<DashboardFilters | null>(null);

const STORES_KEY = 'jetnine.dashboard.stores';
const ROLE_KEY = 'jetnine.dashboard.role';

export function compareWindow(
  range: DateRange,
  mode: CompareMode,
): { start: string; end: string } | null {
  if (mode === 'none') return null;
  if (mode === 'year') return { start: addDays(range.start, -364), end: addDays(range.end, -364) };
  const days = daysBetween(range.start, range.end) + 1;
  const end = addDays(range.start, -1);
  return { start: addDays(end, -(days - 1)), end };
}

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeIds, setStoreIdsState] = useState<string[] | null>(null);
  const [range, setRangeState] = useState<DateRange>(() => rangeFor('last30'));
  const [rangeReady, setRangeReady] = useState(false);
  const [compare, setCompareState] = useState<CompareMode>('prior');
  const [roleView, setRoleViewState] = useState<RoleView | null>(null);

  useEffect(() => {
    void api<StoreOption[]>('/v1/business/locations')
      .then((rows) =>
        setStores(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            timezone: r.timezone,
            locationType: r.locationType,
          })),
        ),
      )
      .catch(() => setStores([]));
    try {
      const raw = localStorage.getItem(STORES_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as unknown;
        if (Array.isArray(ids) && ids.every((x) => typeof x === 'string') && ids.length > 0) {
          setStoreIdsState(ids as string[]);
        }
      }
      const role = localStorage.getItem(ROLE_KEY);
      if (role === 'owner' || role === 'manager' || role === 'ops' || role === 'warehouse') {
        setRoleViewState(role);
      }
    } catch {
      // Storage unavailable — defaults.
    }
    const params = new URLSearchParams(window.location.search);
    setRangeState(rangeFromSearch(params, 'last30'));
    const c = params.get('compare');
    if (c === 'none' || c === 'prior' || c === 'year') setCompareState(c);
    setRangeReady(true);
  }, []);

  const setStoreIds = useCallback((ids: string[] | null) => {
    setStoreIdsState(ids);
    try {
      if (ids == null) localStorage.removeItem(STORES_KEY);
      else localStorage.setItem(STORES_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, []);

  const setRange = useCallback((next: DateRange) => {
    setRangeState(next);
    const url = new URL(window.location.href);
    rangeToSearch(next, url.searchParams);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const setCompare = useCallback((c: CompareMode) => {
    setCompareState(c);
    const url = new URL(window.location.href);
    if (c === 'prior') url.searchParams.delete('compare');
    else url.searchParams.set('compare', c);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const setRoleView = useCallback((r: RoleView | null) => {
    setRoleViewState(r);
    try {
      if (r == null) localStorage.removeItem(ROLE_KEY);
      else localStorage.setItem(ROLE_KEY, r);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<DashboardFilters>(() => {
    // Drop ids that no longer exist (a store retired since the pick).
    const known = new Set(stores.map((s) => s.id));
    const effective =
      storeIds && stores.length > 0 ? storeIds.filter((id) => known.has(id)) : storeIds;
    const all = effective == null || effective.length === 0 || effective.length === stores.length;
    const storeLabel = all
      ? 'All stores'
      : effective.length === 1
        ? (stores.find((s) => s.id === effective[0])?.name ?? '1 store')
        : `${effective.length} stores`;
    const cmp = compareWindow(range, compare);
    const q = new URLSearchParams();
    q.set('start', range.start);
    q.set('end', range.end);
    q.set('compare', compare);
    if (!all && effective) q.set('locationIds', effective.join(','));
    return {
      stores,
      storeIds: all ? null : effective,
      setStoreIds,
      storeLabel,
      range,
      setRange,
      rangeReady,
      compare,
      setCompare,
      compareRange: cmp,
      roleView,
      setRoleView,
      query: q.toString(),
    };
  }, [
    stores,
    storeIds,
    setStoreIds,
    range,
    setRange,
    rangeReady,
    compare,
    setCompare,
    roleView,
    setRoleView,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardFilters(): DashboardFilters {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDashboardFilters needs DashboardFiltersProvider');
  return v;
}

/** Same hook, but tolerant of pages rendered outside the provider. */
export function useOptionalDashboardFilters(): DashboardFilters | null {
  return useContext(Ctx);
}
