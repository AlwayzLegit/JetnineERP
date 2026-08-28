'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui';

interface DictionaryMeta {
  name: string;
  columnHeading: string;
  width: number;
  type: string;
  kind: string;
  masked: boolean;
  selectable: boolean;
}
interface SourceMeta {
  id: string;
  name: string;
  description: string;
  dictionaries: DictionaryMeta[];
  relations: { sourceId: string; name: string }[];
}
interface ReportListRow {
  id: string;
  name: string;
  description: string | null;
  sourceId: string;
  access: string;
  systemOwned: boolean;
  canEdit: boolean;
}
interface ColumnDef {
  dictionary: string;
  width?: number | null;
  break?: boolean;
  total?: boolean;
}
interface PromptDef {
  dictionary: string;
  label: string;
  required?: boolean;
  promptType: 'simple' | 'range' | 'multi_select';
  dateCode?: boolean;
  includeExclude?: 'include' | 'exclude' | null;
}
interface FilterDef {
  dictionary: string;
  operator: string;
  value?: string | null;
}
interface RunResult {
  title: string | null;
  subTitle: string | null;
  runTimeInformation: string | null;
  columns: { name: string; heading: string; masked: boolean; type: string }[];
  rows: Record<string, string | number | boolean | null>[];
  groups: { key: string | number | null; totals: Record<string, number> }[];
  grandTotals: Record<string, number>;
  summaryOnly: boolean;
  truncated: boolean;
  warnings: string[];
}

const OPERATORS = ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE', 'TR', 'FL'];

export default function ReportBuilderPage() {
  const [sources, setSources] = useState<SourceMeta[] | null>(null);
  const [reports, setReports] = useState<ReportListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'edit' | 'run'>('list');

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [title, setTitle] = useState('');
  const [access, setAccess] = useState('anyone');
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [filters, setFilters] = useState<FilterDef[]>([]);
  const [sorts, setSorts] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<PromptDef[]>([]);

  // Runner state
  const [runReport, setRunReport] = useState<ReportListRow | null>(null);
  const [runInfo, setRunInfo] = useState<{
    prompts: PromptDef[];
    summaryOnlyAvailable: boolean;
    runTimeInformation: string | null;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const source = useMemo(
    () => sources?.find((s) => s.id === sourceId) ?? null,
    [sources, sourceId],
  );
  const selectableDicts = useMemo(
    () => source?.dictionaries.filter((d) => d.selectable) ?? [],
    [source],
  );

  async function load() {
    setError(null);
    try {
      const [s, r] = await Promise.all([
        api<{ sources: SourceMeta[] }>('/v1/report-builder/sources'),
        api<{ reports: ReportListRow[] }>('/v1/report-builder/reports'),
      ]);
      setSources(s.sources);
      setReports(r.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function startNew() {
    setEditingId(null);
    setName('');
    setDescription('');
    setSourceId('');
    setTitle('');
    setAccess('anyone');
    setColumns([]);
    setFilters([]);
    setSorts([]);
    setPrompts([]);
    setMode('edit');
  }

  async function startEdit(r: ReportListRow) {
    try {
      const full = await api<{
        name: string;
        description: string | null;
        sourceId: string;
        title: string | null;
        access: string;
        definitionJson: {
          columns: ColumnDef[];
          filters: FilterDef[];
          sorts: { dictionary: string }[];
          prompts: PromptDef[];
        };
      }>(`/v1/report-builder/reports/${r.id}`);
      setEditingId(r.id);
      setName(full.name);
      setDescription(full.description ?? '');
      setSourceId(full.sourceId);
      setTitle(full.title ?? '');
      setAccess(full.access);
      setColumns(full.definitionJson.columns ?? []);
      setFilters(full.definitionJson.filters ?? []);
      setSorts((full.definitionJson.sorts ?? []).map((s) => s.dictionary));
      setPrompts(full.definitionJson.prompts ?? []);
      setMode('edit');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function save() {
    const body = {
      name,
      description: description || null,
      sourceId,
      title: title || null,
      access,
      columns,
      filters,
      sorts: sorts.map((dictionary) => ({ dictionary })),
      prompts,
    };
    try {
      const saved = editingId
        ? await api<{ warnings: string[] }>(`/v1/report-builder/reports/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ warnings: string[] }>('/v1/report-builder/reports', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      for (const w of saved.warnings ?? []) toast.warning(w);
      toast.success('Report saved');
      setMode('list');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function openRunner(r: ReportListRow) {
    try {
      const full = await api<{
        runTimeInformation: string | null;
        summaryOnlyAvailable: boolean;
        definitionJson: { prompts: PromptDef[] };
      }>(`/v1/report-builder/reports/${r.id}`);
      setRunReport(r);
      setRunInfo({
        prompts: full.definitionJson.prompts ?? [],
        summaryOnlyAvailable: full.summaryOnlyAvailable,
        runTimeInformation: full.runTimeInformation,
      });
      setAnswers({});
      setSummaryOnly(false);
      setResult(null);
      setMode('run');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function execute() {
    if (!runReport) return;
    setRunning(true);
    setResult(null);
    try {
      const body = {
        answers: Object.fromEntries(
          Object.entries(answers)
            .filter(([, v]) => v !== '')
            .map(([k, v]) => [k, v.includes(',') ? v.split(',').map((x) => x.trim()) : v]),
        ),
        summaryOnly,
      };
      const res = await api<RunResult>(`/v1/report-builder/reports/${runReport.id}/run`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(res);
      for (const w of res.warnings ?? []) toast.warning(w);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function clone(r: ReportListRow) {
    const newName = window.prompt(`Clone "${r.name}" as:`);
    if (!newName) return;
    try {
      await api(`/v1/report-builder/reports/${r.id}/clone`, {
        method: 'POST',
        body: JSON.stringify({ name: newName }),
      });
      toast.success(`Cloned as ${newName}`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  function fmt(v: string | number | boolean | null, type: string): string {
    if (v == null) return '';
    if (type === 'money' && typeof v === 'number') return (v / 100).toFixed(2);
    return String(v);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report builder"
        sub="Author reports over the live data — dictionaries, filters, prompts, breaks and totals"
        actions={
          mode === 'list' ? (
            <Button variant="primary" onClick={startNew}>
              New report
            </Button>
          ) : (
            <Button onClick={() => setMode('list')}>Back to reports</Button>
          )
        }
      />
      {error ? (
        <Card>
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      ) : null}

      {mode === 'list' ? (
        reports === null ? null : reports.length === 0 ? (
          <EmptyState>No reports yet — build the first one.</EmptyState>
        ) : (
          <Card title="Reports">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-neutral-500">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Access</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      {r.name}
                      {r.systemOwned ? (
                        <span className="ml-2 text-xs text-neutral-500">system</span>
                      ) : null}
                      {r.description ? (
                        <div className="text-xs text-neutral-500">{r.description}</div>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">{r.sourceId}</td>
                    <td className="py-2 pr-3">{r.access}</td>
                    <td className="py-2 pr-3 text-right">
                      <Button size="sm" variant="primary" onClick={() => void openRunner(r)}>
                        Run
                      </Button>{' '}
                      {r.canEdit && !r.systemOwned ? (
                        <Button size="sm" onClick={() => void startEdit(r)}>
                          Edit
                        </Button>
                      ) : null}{' '}
                      <Button size="sm" onClick={() => void clone(r)}>
                        Clone
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : null}

      {mode === 'edit' ? (
        <>
          <Card title="Headings">
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Report name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={Boolean(editingId)}
                />
              </Field>
              <Field label="Description">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label="Source">
                <Select
                  value={sourceId}
                  disabled={Boolean(editingId) || columns.length > 0}
                  onChange={(e) => {
                    setSourceId(e.target.value);
                    setColumns([]);
                    setFilters([]);
                    setSorts([]);
                    setPrompts([]);
                  }}
                >
                  <option value="">Select…</option>
                  {(sources ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Access">
                <Select value={access} onChange={(e) => setAccess(e.target.value)}>
                  <option value="anyone">Anyone can run</option>
                  <option value="same_role">Within my role</option>
                  <option value="owner_only">Only me</option>
                </Select>
              </Field>
              <Field label="Title (tokens: {PROMPT_DICT})">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
            </div>
          </Card>

          {source ? (
            <>
              <Card title="Output columns">
                {columns.map((c, i) => (
                  <div key={i} className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                    <Select
                      value={c.dictionary}
                      onChange={(e) =>
                        setColumns((cs) =>
                          cs.map((x, j) => (j === i ? { ...x, dictionary: e.target.value } : x)),
                        )
                      }
                    >
                      {selectableDicts.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={c.break ?? false}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setColumns((cs) => cs.map((x, j) => (j === i ? { ...x, break: on } : x)));
                          if (on && !sorts.includes(c.dictionary)) {
                            setSorts((ss) => [...ss, c.dictionary]); // break ⇒ sort (#14)
                          }
                        }}
                      />
                      Break
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={c.total ?? false}
                        onChange={(e) =>
                          setColumns((cs) =>
                            cs.map((x, j) => (j === i ? { ...x, total: e.target.checked } : x)),
                          )
                        }
                      />
                      Total
                    </label>
                    <Button
                      size="sm"
                      onClick={() => setColumns((cs) => cs.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    selectableDicts[0] &&
                    setColumns((cs) => [...cs, { dictionary: selectableDicts[0]!.name }])
                  }
                >
                  Add column
                </Button>
              </Card>

              <Card title="Selection filters (fixed, AND)">
                {filters.map((f, i) => (
                  <div key={i} className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                    <Select
                      value={f.dictionary}
                      onChange={(e) =>
                        setFilters((fs) =>
                          fs.map((x, j) => (j === i ? { ...x, dictionary: e.target.value } : x)),
                        )
                      }
                    >
                      {selectableDicts.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={f.operator}
                      onChange={(e) =>
                        setFilters((fs) =>
                          fs.map((x, j) => (j === i ? { ...x, operator: e.target.value } : x)),
                        )
                      }
                    >
                      {OPERATORS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                    {f.operator !== 'TR' && f.operator !== 'FL' ? (
                      <Input
                        placeholder={'value ("" = blank)'}
                        value={f.value ?? ''}
                        onChange={(e) =>
                          setFilters((fs) =>
                            fs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                          )
                        }
                        style={{ width: 160 }}
                      />
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => setFilters((fs) => fs.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    selectableDicts[0] &&
                    setFilters((fs) => [
                      ...fs,
                      { dictionary: selectableDicts[0]!.name, operator: 'EQ', value: '' },
                    ])
                  }
                >
                  Add filter
                </Button>
              </Card>

              <Card title="Prompts (asked at run time)">
                {prompts.map((p, i) => (
                  <div key={i} className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                    <Select
                      value={p.dictionary}
                      onChange={(e) =>
                        setPrompts((ps) =>
                          ps.map((x, j) => (j === i ? { ...x, dictionary: e.target.value } : x)),
                        )
                      }
                    >
                      {selectableDicts
                        .filter((d) => !d.name.includes('.'))
                        .map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                    </Select>
                    <Input
                      placeholder="Label"
                      value={p.label}
                      onChange={(e) =>
                        setPrompts((ps) =>
                          ps.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                        )
                      }
                      style={{ width: 140 }}
                    />
                    <Select
                      value={p.promptType}
                      onChange={(e) =>
                        setPrompts((ps) =>
                          ps.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  promptType: e.target.value as PromptDef['promptType'],
                                  includeExclude:
                                    e.target.value === 'multi_select'
                                      ? (x.includeExclude ?? 'include')
                                      : null,
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="simple">Simple</option>
                      <option value="range">Range</option>
                      <option value="multi_select">Multi-select</option>
                    </Select>
                    {p.promptType === 'multi_select' ? (
                      <Select
                        value={p.includeExclude ?? 'include'}
                        onChange={(e) =>
                          setPrompts((ps) =>
                            ps.map((x, j) =>
                              j === i
                                ? { ...x, includeExclude: e.target.value as 'include' | 'exclude' }
                                : x,
                            ),
                          )
                        }
                      >
                        <option value="include">Include</option>
                        <option value="exclude">Exclude</option>
                      </Select>
                    ) : null}
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={p.required ?? false}
                        onChange={(e) =>
                          setPrompts((ps) =>
                            ps.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)),
                          )
                        }
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={p.dateCode ?? false}
                        onChange={(e) =>
                          setPrompts((ps) =>
                            ps.map((x, j) => (j === i ? { ...x, dateCode: e.target.checked } : x)),
                          )
                        }
                      />
                      Date codes
                    </label>
                    <Button
                      size="sm"
                      onClick={() => setPrompts((ps) => ps.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    selectableDicts[0] &&
                    setPrompts((ps) => [
                      ...ps,
                      {
                        dictionary: selectableDicts[0]!.name,
                        label: 'Value',
                        promptType: 'simple',
                      },
                    ])
                  }
                >
                  Add prompt
                </Button>
              </Card>

              <Card title="Sorting">
                {sorts.map((s, i) => (
                  <div key={i} className="mb-2 flex items-center gap-3 text-sm">
                    <Select
                      value={s}
                      onChange={(e) =>
                        setSorts((ss) => ss.map((x, j) => (j === i ? e.target.value : x)))
                      }
                    >
                      {selectableDicts.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => setSorts((ss) => ss.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    selectableDicts[0] && setSorts((ss) => [...ss, selectableDicts[0]!.name])
                  }
                >
                  Add sort
                </Button>
              </Card>

              <Button
                variant="primary"
                onClick={() => void save()}
                disabled={!name || columns.length === 0}
              >
                Save report
              </Button>
            </>
          ) : null}
        </>
      ) : null}

      {mode === 'run' && runReport && runInfo ? (
        <>
          <Card title={`Run: ${runReport.name}`}>
            {runInfo.runTimeInformation ? (
              <p className="mb-3 whitespace-pre-wrap text-sm">{runInfo.runTimeInformation}</p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              {runInfo.prompts.map((p) => (
                <Field
                  key={p.dictionary}
                  label={`${p.label}${p.required ? ' *' : ''}${p.dateCode ? ' (TDAY/YDAY/CPTD/LPTD ok)' : ''}${
                    p.promptType === 'multi_select' ? ' (comma-separated)' : ''
                  }`}
                >
                  <Input
                    value={answers[p.dictionary] ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [p.dictionary]: e.target.value }))}
                  />
                </Field>
              ))}
              {runInfo.summaryOnlyAvailable ? (
                <Field label="Summary only">
                  <label className="flex h-9 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={summaryOnly}
                      onChange={(e) => setSummaryOnly(e.target.checked)}
                    />
                    Totals only, no detail rows
                  </label>
                </Field>
              ) : null}
            </div>
            <div className="mt-4">
              <Button variant="primary" onClick={() => void execute()} disabled={running}>
                {running ? 'Running…' : 'Run'}
              </Button>
            </div>
          </Card>

          {result ? (
            <Card title={result.title ?? runReport.name}>
              {result.subTitle ? <p className="mb-2 text-sm">{result.subTitle}</p> : null}
              {result.truncated ? (
                <p className="mb-2 text-sm text-amber-600">
                  Output truncated at the row cap — narrow the criteria.
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-neutral-500">
                      {result.columns.map((c) => (
                        <th key={c.name} className="py-2 pr-3">
                          {c.heading}
                          {c.masked ? ' 🔒' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {result.columns.map((c) => (
                          <td key={c.name} className="py-1 pr-3">
                            {fmt(r[c.name] ?? null, c.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {result.groups.map((g, i) => (
                      <tr
                        key={`g${i}`}
                        className="border-b bg-neutral-50 font-medium dark:bg-neutral-900"
                      >
                        {result.columns.map((c, j) => (
                          <td key={c.name} className="py-1 pr-3">
                            {j === 0
                              ? `TOTAL ${String(g.key ?? '')}`
                              : c.name in g.totals
                                ? fmt(g.totals[c.name]!, c.type)
                                : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {Object.keys(result.grandTotals).length > 0 ? (
                      <tr className="font-semibold">
                        {result.columns.map((c, j) => (
                          <td key={c.name} className="py-1 pr-3">
                            {j === 0
                              ? 'GRAND TOTAL'
                              : c.name in result.grandTotals
                                ? fmt(result.grandTotals[c.name]!, c.type)
                                : ''}
                          </td>
                        ))}
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
