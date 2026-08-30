'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResults {
  customers: { id: string; name: string; phone: string | null; email: string | null }[];
  orders: {
    id: string;
    number: string;
    legacyNumber: string | null;
    status: string;
    totalCents: number;
    requestedDate: string | null;
    customerName: string | null;
  }[];
  sales: {
    id: string;
    number: string;
    totalCents: number;
    customerName: string | null;
    imported: boolean;
  }[];
}

interface Hit {
  key: string;
  href: string;
  primary: string;
  secondary: string;
  section: 'Customers' | 'Orders' | 'Receipts';
}

function flatten(r: SearchResults): Hit[] {
  const hits: Hit[] = [];
  for (const c of r.customers) {
    hits.push({
      key: `c-${c.id}`,
      href: `/customers/${c.id}`,
      primary: c.name || c.email || c.phone || 'customer',
      secondary: [c.phone, c.email].filter(Boolean).join(' · '),
      section: 'Customers',
    });
  }
  for (const o of r.orders) {
    hits.push({
      key: `o-${o.id}`,
      href: `/orders/${o.id}`,
      primary: o.number,
      secondary: [o.customerName, o.status, o.legacyNumber ? `was ${o.legacyNumber}` : null]
        .filter(Boolean)
        .join(' · '),
      section: 'Orders',
    });
  }
  for (const s of r.sales) {
    hits.push({
      key: `s-${s.id}`,
      href: `/sales/${s.id}`,
      primary: s.number,
      secondary: [s.customerName, s.imported ? 'imported from STORIS' : 'receipt']
        .filter(Boolean)
        .join(' · '),
      section: 'Receipts',
    });
  }
  return hits;
}

/**
 * The omnibox (handoff G1): from any page, typing a caller's phone
 * number, name, or a document number reaches the record in two
 * interactions. ⌘K / Ctrl-K focuses it; arrows + Enter navigate.
 */
export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close when clicking anywhere else.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits(null);
      return;
    }
    const t = setTimeout(() => {
      void api<SearchResults>(`/v1/search?q=${encodeURIComponent(query)}`)
        .then((r) => {
          setHits(flatten(r));
          setActive(0);
          setOpen(true);
        })
        .catch(() => setHits(null));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (hit: Hit) => {
      setOpen(false);
      setQ('');
      setHits(null);
      router.push(hit.href);
    },
    [router],
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (!open || !hits || hits.length === 0) {
      if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit);
    } else if (e.key === 'Escape') {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  let lastSection: string | null = null;
  return (
    <div ref={boxRef} style={{ position: 'relative', flex: '1 1 220px', maxWidth: 420 }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          aria-hidden
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          data-testid="global-search"
          type="search"
          placeholder="Search customer, phone, or order #…  (⌘K)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits && setOpen(true)}
          onKeyDown={onInputKey}
          aria-label="Search customers and orders"
          style={{
            width: '100%',
            fontSize: 13,
            padding: '6px 10px 6px 30px',
            border: '1px solid var(--border)',
            borderRadius: 999,
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
      </div>
      {open && hits && (
        <div
          data-testid="search-results"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-md, var(--shadow-sm))',
            maxHeight: 420,
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {hits.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
              Nothing matches — check the spelling, or try the phone number digits only.
            </div>
          ) : (
            hits.map((hit, i) => {
              const header = hit.section !== lastSection ? hit.section : null;
              lastSection = hit.section;
              return (
                <div key={hit.key}>
                  {header && (
                    <div
                      style={{
                        padding: '6px 10px 2px',
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {header}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-testid={`search-hit-${hit.key}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 10px',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background:
                        i === active ? 'var(--accent-soft, var(--border))' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--text)',
                    }}
                  >
                    <strong>{hit.primary}</strong>
                    {hit.secondary && (
                      <span style={{ color: 'var(--text-secondary)' }}> — {hit.secondary}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
