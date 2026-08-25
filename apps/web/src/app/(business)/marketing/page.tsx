'use client';

import { Megaphone, Plus, Send, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { api } from '@/lib/api';

interface Tag {
  id: string;
  name: string;
}
interface Segment {
  id: string;
  name: string;
  filterJson: { tagIds?: string[]; sinceDays?: number };
  createdAt: string;
}
interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentAt: string | null;
  recipientCount: number | null;
  segmentId: string;
  segmentName: string;
  createdAt: string;
}
interface Preview {
  count: number;
  sample: { id: string; name: string | null; email: string | null }[];
}

export default function MarketingPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Campaign id whose Send button is armed for the inline confirm step. */
  const [armedSendId, setArmedSendId] = useState<string | null>(null);

  // Segment form
  const [segName, setSegName] = useState('');
  const [segTagIds, setSegTagIds] = useState<string[]>([]);
  const [segSinceDays, setSegSinceDays] = useState('');

  // Campaign form
  const [campName, setCampName] = useState('');
  const [campSegmentId, setCampSegmentId] = useState('');
  const [campSubject, setCampSubject] = useState('');
  const [campBody, setCampBody] = useState('');

  async function load() {
    try {
      const [t, s, c] = await Promise.all([
        api<Tag[]>('/v1/customer-tags').catch(() => []),
        api<Segment[]>('/v1/marketing/segments'),
        api<Campaign[]>('/v1/marketing/campaigns'),
      ]);
      setTags(t);
      setSegments(s);
      setCampaigns(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function createSegment() {
    if (!segName.trim()) return;
    setBusy(true);
    try {
      await api('/v1/marketing/segments', {
        method: 'POST',
        body: JSON.stringify({
          name: segName.trim(),
          filter: {
            ...(segTagIds.length > 0 ? { tagIds: segTagIds } : {}),
            ...(segSinceDays ? { sinceDays: Number(segSinceDays) } : {}),
          },
        }),
      });
      setSegName('');
      setSegTagIds([]);
      setSegSinceDays('');
      toast.success('Segment created');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function previewSegment(id: string) {
    try {
      const p = await api<Preview>(`/v1/marketing/segments/${id}/preview`);
      setPreviews((cur) => ({ ...cur, [id]: p }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteSegment(id: string) {
    if (!confirm('Delete this segment?')) return;
    try {
      await api(`/v1/marketing/segments/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function createCampaign() {
    if (!campName.trim() || !campSegmentId || !campSubject.trim() || !campBody.trim()) {
      toast.error('Fill out every campaign field first.');
      return;
    }
    setBusy(true);
    try {
      await api('/v1/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: campName.trim(),
          segmentId: campSegmentId,
          subject: campSubject.trim(),
          bodyText: campBody.trim(),
        }),
      });
      setCampName('');
      setCampSubject('');
      setCampBody('');
      toast.success('Draft created');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendCampaign(c: Campaign) {
    // Two-step confirm rendered inline (no native confirm() dialog):
    // the first click arms this campaign's Send button, the second
    // actually sends. Anything else disarms.
    if (armedSendId !== c.id) {
      setArmedSendId(c.id);
      return;
    }
    setArmedSendId(null);
    setBusy(true);
    try {
      const res = await api<{ recipientCount: number; sent: number }>(
        `/v1/marketing/campaigns/${c.id}/send`,
        { method: 'POST' },
      );
      toast.success(`Sent to ${res.sent} of ${res.recipientCount} recipients.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleTag(id: string) {
    setSegTagIds((cur) => (cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]));
  }

  return (
    <div>
      <PageHeader
        title="Marketing"
        sub="Build audience segments from customer tags, then send one-shot email campaigns. Only customers with an email address receive anything."
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <Card title="Segments">
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Field label="Segment name" className="min-w-52">
            <Input
              value={segName}
              onChange={(e) => setSegName(e.target.value)}
              placeholder="e.g. Mattress buyers"
              data-testid="segment-name"
            />
          </Field>
          <Field label="Created in last N days (optional)">
            <Input
              type="number"
              min={1}
              value={segSinceDays}
              onChange={(e) => setSegSinceDays(e.target.value)}
              style={{ width: 90 }}
            />
          </Field>
          <Button variant="primary" onClick={() => void createSegment()} disabled={busy}>
            <Plus size={14} aria-hidden /> Create segment
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="muted" style={{ fontSize: 12, alignSelf: 'center' }}>
              Tags (any of):
            </span>
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`pill ${segTagIds.includes(t.id) ? 'pill-active' : ''}`}
                onClick={() => toggleTag(t.id)}
                data-testid={`segment-tag-${t.name}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {segments == null ? (
          <LoadingRows />
        ) : segments.length === 0 ? (
          <EmptyState>No segments yet — create one above.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Filter</th>
                  <th className="num">Members</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => {
                  const p = previews[s.id];
                  const tagNames = (s.filterJson.tagIds ?? [])
                    .map((id) => tags.find((t) => t.id === id)?.name ?? '?')
                    .join(', ');
                  return (
                    <tr key={s.id} data-testid={`segment-row-${s.name}`}>
                      <td>{s.name}</td>
                      <td className="muted" style={{ fontSize: 12 }}>
                        {tagNames || 'All customers'}
                        {s.filterJson.sinceDays ? ` · last ${s.filterJson.sinceDays}d` : ''}
                      </td>
                      <td className="num">
                        {p ? (
                          <strong>{p.count}</strong>
                        ) : (
                          <Button size="sm" onClick={() => void previewSegment(s.id)}>
                            <Users size={13} aria-hidden /> Count
                          </Button>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void deleteSegment(s.id)}
                          aria-label="Delete segment"
                        >
                          <Trash2 size={14} aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Campaigns">
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <Field label="Campaign name">
            <Input
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
              placeholder="e.g. Labor Day sale"
              data-testid="campaign-name"
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="Segment">
            <Select
              value={campSegmentId}
              onChange={(e) => setCampSegmentId(e.target.value)}
              data-testid="campaign-segment"
              style={{ width: '100%' }}
            >
              <option value="">Choose a segment…</option>
              {(segments ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" className="sm:col-span-2">
            <Input
              value={campSubject}
              onChange={(e) => setCampSubject(e.target.value)}
              data-testid="campaign-subject"
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="Body (plain text)" className="sm:col-span-2">
            <textarea
              className="textarea"
              rows={5}
              value={campBody}
              onChange={(e) => setCampBody(e.target.value)}
              data-testid="campaign-body"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </Field>
          <div>
            <Button variant="primary" onClick={() => void createCampaign()} disabled={busy}>
              <Megaphone size={14} aria-hidden /> Save draft
            </Button>
          </div>
        </div>

        {campaigns == null ? (
          <LoadingRows />
        ) : campaigns.length === 0 ? (
          <EmptyState>No campaigns yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Segment</th>
                  <th>Status</th>
                  <th className="num">Recipients</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} data-testid={`campaign-row-${c.name}`}>
                    <td>
                      {c.name}
                      <span className="muted" style={{ display: 'block', fontSize: 11.5 }}>
                        {c.subject}
                      </span>
                    </td>
                    <td>{c.segmentName}</td>
                    <td>
                      <StatusBadge status={c.status} />
                      {c.sentAt && (
                        <span className="muted" style={{ display: 'block', fontSize: 11 }}>
                          {new Date(c.sentAt).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="num">{c.recipientCount ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {c.status === 'draft' &&
                        (armedSendId === c.id ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              gap: 6,
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                              Emails everyone in “{c.segmentName}” — can’t be undone.
                            </span>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={busy}
                              onClick={() => void sendCampaign(c)}
                              data-testid={`send-${c.name}`}
                            >
                              <Send size={13} aria-hidden /> Really send
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => setArmedSendId(null)}
                            >
                              Cancel
                            </Button>
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busy}
                            onClick={() => void sendCampaign(c)}
                            data-testid={`send-${c.name}`}
                          >
                            <Send size={13} aria-hidden /> Send
                          </Button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
