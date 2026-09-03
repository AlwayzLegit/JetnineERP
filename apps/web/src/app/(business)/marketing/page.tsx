'use client';

import { Megaphone, Plus, Send, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Select,
  Stack,
  StatusBadge,
  TableEmpty,
  TableWrap,
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
      <Stack gap="lg">
        {error && <Alert tone="error">{error}</Alert>}

        <Stack>
          <SectionHeading
            title="Segments"
            description="An audience: every customer, or only those carrying certain tags or created recently."
          />
          <Card title="New segment">
            <FormGrid cols={2}>
              <Field label="Segment name" required>
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
                />
              </Field>
              {tags.length > 0 && (
                <>
                  <SectionHeading as="h3" title="Tags (any of)" />
                  <div className="form-span flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`pill ${segTagIds.includes(t.id) ? 'pill-active' : ''}`}
                        aria-pressed={segTagIds.includes(t.id)}
                        onClick={() => toggleTag(t.id)}
                        data-testid={`segment-tag-${t.name}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </FormGrid>
            <FormActions>
              <Button
                variant="primary"
                onClick={() => void createSegment()}
                disabled={busy || !segName.trim()}
              >
                <Plus size={14} aria-hidden /> Create segment
              </Button>
            </FormActions>
          </Card>

          <Card title="Segments" flush>
            {segments == null ? (
              <div className="p-4">
                <LoadingRows />
              </div>
            ) : (
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Filter</th>
                      <th className="num">Members</th>
                      <th className="actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {segments.length === 0 && (
                      <TableEmpty colSpan={4}>No segments yet — create one above.</TableEmpty>
                    )}
                    {segments.map((s) => {
                      const p = previews[s.id];
                      const tagNames = (s.filterJson.tagIds ?? [])
                        .map((id) => tags.find((t) => t.id === id)?.name ?? '?')
                        .join(', ');
                      return (
                        <tr key={s.id} data-testid={`segment-row-${s.name}`}>
                          <td>{s.name}</td>
                          <td className="muted">
                            {tagNames || 'All customers'}
                            {s.filterJson.sinceDays ? ` · last ${s.filterJson.sinceDays}d` : ''}
                          </td>
                          <td className="num">
                            {p ? (
                              <strong>{p.count}</strong>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => void previewSegment(s.id)}
                              >
                                <Users size={13} aria-hidden /> Count
                              </Button>
                            )}
                          </td>
                          <td className="actions">
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
              </TableWrap>
            )}
          </Card>
        </Stack>

        <Stack>
          <SectionHeading
            title="Campaigns"
            description="One-shot plain-text emails to a segment. Drafts can be edited until they are sent."
          />
          <Card title="New campaign">
            <FormGrid cols={2}>
              <Field label="Campaign name" required>
                <Input
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Labor Day sale"
                  data-testid="campaign-name"
                />
              </Field>
              <Field label="Segment" required>
                <Select
                  value={campSegmentId}
                  onChange={(e) => setCampSegmentId(e.target.value)}
                  data-testid="campaign-segment"
                >
                  <option value="">Choose a segment…</option>
                  {(segments ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject" required className="form-span">
                <Input
                  value={campSubject}
                  onChange={(e) => setCampSubject(e.target.value)}
                  data-testid="campaign-subject"
                />
              </Field>
              <Field label="Body (plain text)" required className="form-span">
                <textarea
                  className="textarea"
                  rows={5}
                  value={campBody}
                  onChange={(e) => setCampBody(e.target.value)}
                  data-testid="campaign-body"
                />
              </Field>
            </FormGrid>
            <FormActions>
              <Button variant="primary" onClick={() => void createCampaign()} disabled={busy}>
                <Megaphone size={14} aria-hidden /> Save draft
              </Button>
            </FormActions>
          </Card>

          <Card title="Campaigns" flush>
            {campaigns == null ? (
              <div className="p-4">
                <LoadingRows />
              </div>
            ) : (
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Segment</th>
                      <th>Status</th>
                      <th className="num">Recipients</th>
                      <th className="actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length === 0 && (
                      <TableEmpty colSpan={5}>No campaigns yet — save a draft above.</TableEmpty>
                    )}
                    {campaigns.map((c) => (
                      <tr key={c.id} data-testid={`campaign-row-${c.name}`}>
                        <td>
                          {c.name}
                          <span className="muted block text-xs">{c.subject}</span>
                        </td>
                        <td>{c.segmentName}</td>
                        <td>
                          <StatusBadge status={c.status} />
                          {c.sentAt && (
                            <span className="muted block text-xs">
                              {new Date(c.sentAt).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="num">{c.recipientCount ?? '—'}</td>
                        <td className="actions">
                          {c.status === 'draft' &&
                            (armedSendId === c.id ? (
                              <span className="inline-flex flex-wrap items-center justify-end gap-2 whitespace-normal">
                                <span className="text-xs font-semibold text-[var(--danger)]">
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
              </TableWrap>
            )}
          </Card>
        </Stack>
      </Stack>
    </div>
  );
}
