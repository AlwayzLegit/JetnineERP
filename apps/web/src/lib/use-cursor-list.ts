'use client';

import { useCallback, useRef, useState } from 'react';
import { api } from '@/lib/api';

export interface PageResponse<T> {
  data: T[];
  nextCursor: string | null;
}

/**
 * The house client for cursor-paginated list endpoints
 * (`{ data, nextCursor }` — see apps/api/src/common/pagination.ts).
 *
 * `load(params)` fetches page one for the given filters; `loadMore()`
 * appends the next page for the SAME filters. A stale in-flight page
 * never clobbers a newer search: each load bumps a generation counter
 * and late responses from an older generation are dropped.
 *
 *   const list = useCursorList<Row>('/v1/products');
 *   useEffect(() => { void list.load(); }, []);
 *   ...
 *   <LoadMore state={list} />
 */
export function useCursorList<T>(path: string) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastParams = useRef<Record<string, string>>({});
  const generation = useRef(0);

  const buildUrl = useCallback(
    (params: Record<string, string>, cursor?: string | null) => {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== '') search.set(k, v);
      }
      if (cursor) search.set('cursor', cursor);
      const qs = search.toString();
      return `${path}${qs ? `?${qs}` : ''}`;
    },
    [path],
  );

  const load = useCallback(
    async (params: Record<string, string> = {}) => {
      const gen = ++generation.current;
      lastParams.current = params;
      setLoading(true);
      setError(null);
      try {
        const res = await api<PageResponse<T>>(buildUrl(params));
        if (gen !== generation.current) return;
        setRows(res.data);
        setNextCursor(res.nextCursor);
      } catch (err) {
        if (gen !== generation.current) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (gen === generation.current) setLoading(false);
      }
    },
    [buildUrl],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const gen = generation.current;
    setLoadingMore(true);
    try {
      const res = await api<PageResponse<T>>(buildUrl(lastParams.current, nextCursor));
      if (gen !== generation.current) return;
      setRows((prev) => [...(prev ?? []), ...res.data]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      if (gen !== generation.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (gen === generation.current) setLoadingMore(false);
    }
  }, [buildUrl, nextCursor]);

  return { rows, nextCursor, loading, loadingMore, error, load, loadMore, setRows };
}

export type CursorList<T> = ReturnType<typeof useCursorList<T>>;
