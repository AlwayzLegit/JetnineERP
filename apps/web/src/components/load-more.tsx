'use client';

import { Button } from '@/components/ui';
import type { CursorList } from '@/lib/use-cursor-list';

/**
 * The footer control for cursor-paginated lists: shows how many rows
 * are loaded, and a Load more button while the server has more. Pair
 * with `useCursorList`.
 */
export function LoadMore<T>({ state, noun = 'rows' }: { state: CursorList<T>; noun?: string }) {
  if (!state.rows) return null;
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--text-secondary)' }}
    >
      <span>
        {state.rows.length} {noun} loaded
        {state.nextCursor ? ' — more available' : state.rows.length > 0 ? ' — end of list' : ''}
      </span>
      {state.nextCursor && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={state.loadingMore}
          onClick={() => void state.loadMore()}
          data-testid="load-more"
        >
          {state.loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  );
}
