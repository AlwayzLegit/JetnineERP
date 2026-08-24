'use client';

import Link from 'next/link';
import { Search, UserPlus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
} from '@/components/ui';
import { api } from '@/lib/api';

interface CustomerRow {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(query: string) {
    setError(null);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await api<{ data: CustomerRow[]; nextCursor: string | null }>(
        `/v1/customers${params}`,
      );
      setRows(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load('');
  }, []);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void load(q);
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        actions={
          <LinkButton href="/customers/new" variant="primary">
            <UserPlus size={14} aria-hidden />
            Add customer
          </LinkButton>
        }
      />

      <form onSubmit={search} className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Search by name, email, or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" variant="primary">
          <Search size={14} aria-hidden />
          Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ('');
            void load('');
          }}
        >
          Clear
        </Button>
      </form>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <Card>
          <LoadingRows />
        </Card>
      )}
      {rows && (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState>No customers match{q ? ` "${q}"` : ' yet'}.</EmptyState>
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>
                      {displayName(c) || <em style={{ color: 'var(--text-muted)' }}>—</em>}
                    </strong>
                  </td>
                  <td>{c.email ?? '—'}</td>
                  <td>{c.phone ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/customers/${c.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function displayName(c: CustomerRow): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ');
}
