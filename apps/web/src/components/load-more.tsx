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
      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[12.5px] text-secondary"
      data-testid="load-more-footer"
    >
      <span aria-live="polite">
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
