'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';

interface Account {
  id: string;
  code: string;
  name: string;
}

interface BatchRow {
  id: string;
  number: string;
  status: string;
  batchType: string;
  businessDate: string;
  period: number;
  memo: string | null;
  debitCents: number;
  postedAt: string | null;
}

interface LineDraft {
  accountId: string;
  memo: string;
  amountStr: string;
  side: 'debit' | 'credit';
}

const emptyLine = (): LineDraft => ({ accountId: '', memo: '', amountStr: '', side: 'debit' });

export default function GlJournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rows, setRows] = useState<BatchRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [businessDate, setBusinessDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(), emptyLine()]);

  async function load() {
    try {
      setAccounts(await api<Account[]>('/v1/gl/accounts'));
      const res = await api<{ rows: BatchRow[] }>('/v1/gl/journal-batches');
      setRows(res.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const totals = lines.reduce(
    (t, l) => {
      const cents = Math.round(Number(l.amountStr || 0) * 100);
      if (!Number.isFinite(cents) || cents <= 0) return t;
      return l.side === 'debit'
        ? { ...t, debit: t.debit + cents }
        : { ...t, credit: t.credit + cents };
    },
    { debit: 0, credit: 0 },
  );

  async function submit(post: boolean) {
    setBusy(true);
    try {
      const body = {
        businessDate,
        memo: memo || null,
        post,
        lines: lines
          .filter((l) => l.accountId && Number(l.amountStr) > 0)
          .map((l) => ({
            accountId: l.accountId,
            memo: l.memo || null,
            debitCents: l.side === 'debit' ? Math.round(Number(l.amountStr) * 100) : 0,
            creditCents: l.side === 'credit' ? Math.round(Number(l.amountStr) * 100) : 0,
          })),
      };
      await api('/v1/gl/journal-batches', { method: 'POST', body: JSON.stringify(body) });
      toast.success(post ? 'Batch posted' : 'Draft saved');
      setMemo('');
      setLines([emptyLine(), emptyLine()]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function postDraft(id: string) {
    setBusy(true);
    try {
      await api(`/v1/gl/journal-batches/${id}/post`, { method: 'POST', body: '{}' });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !rows) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!rows) return <LoadingRows rows={6} />;

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/gl">← General ledger</Link>
      </p>
      <PageHeader title="Journal entries" sub="Posted batches are append-only" />

      <Card title="New journal entry" style={{ marginBottom: 16 }}>
        <div className="grid gap-3 sm:grid-cols-2" style={{ marginBottom: 8 }}>
          <Field label="Date">
            <Input
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
            />
          </Field>
          <Field label="Memo">
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </Field>
        </div>
        {lines.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-4" style={{ marginBottom: 6 }}>
            <Select
              value={l.accountId}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...l, accountId: e.target.value };
                setLines(next);
              }}
            >
              <option value="">Account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </Select>
            <Select
              value={l.side}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...l, side: e.target.value as 'debit' | 'credit' };
                setLines(next);
              }}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </Select>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="$"
              value={l.amountStr}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...l, amountStr: e.target.value };
                setLines(next);
              }}
            />
            <Input
              placeholder="Line memo"
              value={l.memo}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...l, memo: e.target.value };
                setLines(next);
              }}
            />
          </div>
        ))}
        <div className="flex gap-2" style={{ alignItems: 'center', marginTop: 8 }}>
          <Button size="sm" variant="ghost" onClick={() => setLines([...lines, emptyLine()])}>
            + Line
          </Button>
          <span
            style={{
              fontSize: 12,
              color: totals.debit === totals.credit ? 'var(--success)' : 'var(--warning)',
            }}
          >
            Debits <Money cents={totals.debit} /> · Credits <Money cents={totals.credit} />
            {totals.debit !== totals.credit && ' (out of balance)'}
          </span>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" disabled={busy} onClick={() => void submit(false)}>
            Save draft
          </Button>
          <Button
            variant="primary"
            disabled={busy || totals.debit !== totals.credit || totals.debit === 0}
            onClick={() => void submit(true)}
          >
            Post
          </Button>
        </div>
      </Card>

      <Card title="Batches" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Date</th>
              <th>Type</th>
              <th>Memo</th>
              <th className="num">Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState>No journal batches yet.</EmptyState>
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <tr key={b.id}>
                <td>
                  <code>{b.number}</code>
                </td>
                <td>{b.businessDate}</td>
                <td>{b.batchType}</td>
                <td>{b.memo ?? '—'}</td>
                <td className="num">
                  <Money cents={b.debitCents} />
                </td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td>
                  {b.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void postDraft(b.id)}
                    >
                      Post
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
