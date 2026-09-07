'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  TASK_STATUSES,
  type OrderTaskRow,
  type OrderTeamMember,
  type TaskPage,
} from '@jetnine/shared';
import { api } from '@/lib/api';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
} from './ui';

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};
type Queue = 'mine' | 'team' | 'overdue' | 'blocked' | 'done' | 'unassigned';
const QUEUES: { id: Queue; label: string }[] = [
  { id: 'mine', label: 'My tasks' },
  { id: 'team', label: 'Team' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'unassigned', label: 'Needs owner' },
  { id: 'done', label: 'Completed' },
];
const changed = () => window.dispatchEvent(new Event('erp:team-update'));
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const localDateTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function TaskForm({
  task,
  orderId,
  orderNumber,
  onSaved,
  onCancel,
}: {
  task?: OrderTaskRow;
  orderId?: string;
  orderNumber?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState(task?.orderId ?? orderId ?? '');
  const [orderQuery, setOrderQuery] = useState('');
  const [orders, setOrders] = useState<{ id: string; number: string; customerName: string }[]>([]);
  const [team, setTeam] = useState<OrderTeamMember[]>([]);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assignee, setAssignee] = useState(task?.assigneeMembershipId ?? '');
  const [due, setDue] = useState(localDateTime(task?.dueAt ?? null));
  const [priority, setPriority] = useState(task?.priority ?? 'normal');
  const [status, setStatus] = useState(task?.status ?? 'open');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (orderId || task || orderQuery.trim().length < 2) {
      setOrders([]);
      return;
    }
    const abort = new AbortController();
    const timer = setTimeout(() => {
      void api<typeof orders>(`/v1/task-orders?q=${encodeURIComponent(orderQuery.trim())}`, {
        signal: abort.signal,
      })
        .then(setOrders)
        .catch((e) => {
          if (!abort.signal.aborted) setError(errorText(e));
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [orderQuery, orderId, task]);
  useEffect(() => {
    setTeam([]);
    if (!selectedOrder) return;
    const abort = new AbortController();
    void api<OrderTeamMember[]>(`/v1/orders/${selectedOrder}/team`, { signal: abort.signal })
      .then(setTeam)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorText(e));
      });
    return () => abort.abort();
  }, [selectedOrder]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !selectedOrder) return;
    setSaving(true);
    setError('');
    try {
      await api(task ? `/v1/tasks/${task.id}` : `/v1/orders/${selectedOrder}/tasks`, {
        method: task ? 'PATCH' : 'POST',
        body: JSON.stringify({
          title,
          description,
          assigneeMembershipId: assignee || null,
          dueAt: due ? new Date(due).toISOString() : null,
          priority,
          ...(task ? { status, version: task.version } : {}),
        }),
      });
      changed();
      toast.success(task ? 'Task updated' : 'Task created');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card title={task ? 'Edit task' : 'New task'}>
      <form onSubmit={(e) => void save(e)} className="grid gap-4" data-testid="task-form">
        {error && <Alert tone="error">{error}</Alert>}
        {orderId || task ? (
          <p className="muted">For {task?.orderNumber ?? orderNumber ?? 'this order'}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Find an order">
              <Input
                value={orderQuery}
                onChange={(e) => {
                  setOrderQuery(e.target.value);
                  setSelectedOrder('');
                  setAssignee('');
                }}
                placeholder="Order number or customer name"
              />
            </Field>
            <Field label="Order" required>
              <Select
                required
                value={selectedOrder}
                onChange={(e) => {
                  setSelectedOrder(e.target.value);
                  setAssignee('');
                }}
              >
                <option value="">
                  {orderQuery.length < 2 ? 'Type at least 2 characters' : 'Choose an order'}
                </option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.number} · {o.customerName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <Field label="Task" required>
          <Input
            autoFocus
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Confirm delivery access with customer"
          />
        </Field>
        <Field label="Details">
          <textarea
            className="textarea"
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to happen, and what does the next person need to know?"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Owner">
            <Select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={!selectedOrder}
            >
              <option value="">Needs an owner</option>
              {assignee && !team.some((m) => m.id === assignee) && (
                <option value={assignee}>Previous owner — choose a member</option>
              )}
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.roleName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due" hint="Your local time">
            <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Priority">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'normal' | 'high')}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </Select>
          </Field>
          {task && (
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderTaskRow['status'])}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={saving || !selectedOrder || !title.trim()}
          >
            {saving ? 'Saving…' : task ? 'Save task' : 'Create task'}
          </Button>
          <Button onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <span className="muted text-xs">The owner receives an in-app update.</span>
        </div>
      </form>
    </Card>
  );
}

export function TeamTasks({ orderId, orderNumber }: { orderId?: string; orderNumber?: string }) {
  const [queue, setQueue] = useState<Queue>(orderId ? 'team' : 'mine');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<TaskPage | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<OrderTaskRow | 'new' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    const params = new URLSearchParams({
      queue,
      q: query,
      offset: String(offset),
      ...(orderId ? { orderId } : {}),
    });
    void api<TaskPage>(`/v1/tasks?${params}`, { signal: abort.signal })
      .then(setPage)
      .catch((e) => {
        if (!abort.signal.aborted) {
          setPage(null);
          setError(errorText(e));
        }
      });
    return () => abort.abort();
  }, [queue, query, offset, orderId, reload]);
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) refresh();
    };
    const timer = setInterval(tick, 30000);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', tick);
    };
  }, [refresh]);
  useEffect(() => {
    if (editing) editorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editing]);
  async function changeStatus(task: OrderTaskRow, status: OrderTaskRow['status']) {
    setBusy(task.id);
    try {
      await api(`/v1/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, version: task.version }),
      });
      changed();
      refresh();
      toast.success('Task updated');
    } catch (e) {
      toast.error(errorText(e));
      refresh();
    } finally {
      setBusy(null);
    }
  }
  return (
    <section id="team-tasks" className="grid gap-4" data-testid="team-tasks">
      {!orderId && (
        <PageHeader title="Team Tasks" sub="See who owns the next step on each order." />
      )}
      {orderId && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Team tasks</h2>
          <Link href="/tasks" className="text-sm">
            View all tasks →
          </Link>
        </div>
      )}
      {!orderId && page && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Assigned to me',
              value: page.counts.mine,
              icon: ClipboardList,
              target: 'mine' as Queue,
            },
            {
              label: 'Overdue',
              value: page.counts.overdue,
              icon: Clock3,
              target: 'overdue' as Queue,
            },
            {
              label: 'Blocked',
              value: page.counts.blocked,
              icon: AlertTriangle,
              target: 'blocked' as Queue,
            },
            {
              label: 'Needs owner',
              value: page.counts.unassigned,
              icon: ClipboardList,
              target: 'unassigned' as Queue,
            },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              className="rounded-lg border border-border bg-surface p-4 text-left"
              onClick={() => {
                setQueue(s.target);
                setOffset(0);
              }}
            >
              <span className="muted flex items-center gap-2 text-xs">
                <s.icon size={15} />
                {s.label}
              </span>
              <strong className="mt-1 block text-2xl">{s.value}</strong>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Task queues">
          {QUEUES.filter((q) => !orderId || ['team', 'done'].includes(q.id)).map((q) => (
            <Button
              key={q.id}
              size="sm"
              variant={queue === q.id ? 'primary' : 'secondary'}
              aria-pressed={queue === q.id}
              onClick={() => {
                setQueue(q.id);
                setOffset(0);
              }}
            >
              {q.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={refresh} aria-label="Refresh tasks">
            <RefreshCw size={14} />
          </Button>
          <Button size="sm" variant="primary" onClick={() => setEditing('new')}>
            <Plus size={14} />
            New task
          </Button>
        </div>
      </div>
      <div ref={editorRef}>
        {editing && (
          <TaskForm
            key={editing === 'new' ? 'new' : `${editing.id}:${editing.version}`}
            task={editing === 'new' ? undefined : editing}
            orderId={orderId}
            orderNumber={orderNumber}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refresh();
            }}
          />
        )}
      </div>
      {!orderId && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            setOffset(0);
          }}
        >
          <Input
            aria-label="Search tasks"
            placeholder="Search tasks or order numbers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
      )}
      {error && (
        <Alert
          tone="error"
          action={
            <Button size="sm" onClick={refresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {!page && !error ? (
        <LoadingRows rows={3} />
      ) : (
        page && (
          <>
            {page.data.length === 0 ? (
              <Card>
                <EmptyState>
                  {queue === 'done'
                    ? 'No completed tasks yet.'
                    : queue === 'mine'
                      ? 'You’re caught up. Tasks assigned to you will appear here.'
                      : 'No tasks in this queue.'}
                </EmptyState>
              </Card>
            ) : (
              <ul className="grid gap-3" aria-label="Tasks">
                {page.data.map((task) => {
                  const overdue =
                    task.status !== 'done' &&
                    !!task.dueAt &&
                    new Date(task.dueAt).getTime() < Date.now();
                  return (
                    <li
                      key={task.id}
                      id={`task-${task.id}`}
                      className="rounded-lg border border-border bg-surface p-4"
                      data-testid="task-row"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`badge ${task.status === 'blocked' ? 'badge-danger' : task.status === 'done' ? 'badge-success' : 'badge-info'}`}
                            >
                              {STATUS_LABELS[task.status]}
                            </span>
                            {task.priority === 'high' && (
                              <span className="text-xs font-medium text-danger">High priority</span>
                            )}
                            {overdue && (
                              <span className="text-xs font-medium text-danger">Overdue</span>
                            )}
                          </div>
                          <h3 className="mt-2 font-semibold">{task.title}</h3>
                          {task.description && (
                            <p className="text-secondary mt-1 whitespace-pre-wrap text-sm">
                              {task.description}
                            </p>
                          )}
                          <div className="muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <Link href={`/orders/${task.orderId}`}>
                              {task.orderNumber} {task.customerName && `· ${task.customerName}`}
                            </Link>
                            <span>
                              Owner: {task.assigneeName ?? 'Unassigned'}
                              {task.assigneeName && !task.assigneeActive
                                ? ' (inactive — reassign)'
                                : ''}
                            </span>
                            <span className={overdue ? 'text-danger' : ''}>
                              {task.dueAt
                                ? `Due ${new Date(task.dueAt).toLocaleString()}`
                                : 'No deadline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setEditing(task)}>
                            Edit task
                          </Button>
                          {task.status !== 'done' && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={busy === task.id}
                              onClick={() => void changeStatus(task, 'done')}
                            >
                              <CheckCircle2 size={14} />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {page.total > page.limit && (
              <div className="flex items-center justify-between gap-2">
                <span className="muted text-xs">
                  {offset + 1}–{Math.min(offset + page.limit, page.total)} of {page.total}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - page.limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    disabled={offset + page.limit >= page.total}
                    onClick={() => setOffset(offset + page.limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
