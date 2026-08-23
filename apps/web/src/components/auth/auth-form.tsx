'use client';

import { useState, type FormEvent, type ReactNode } from 'react';

export interface AuthFormProps {
  title: string;
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<{ ok: boolean; message?: string }>;
  fields: { name: string; label: string; type?: string; required?: boolean }[];
  footer?: ReactNode;
  successMessage?: string;
}

export function AuthForm({
  title,
  submitLabel,
  onSubmit,
  fields,
  footer,
  successMessage,
}: AuthFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const data = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const [k, v] of data.entries()) values[k] = String(v);
    try {
      const result = await onSubmit(values);
      if (!result.ok) {
        setError(result.message ?? 'Something went wrong');
      } else if (successMessage || result.message) {
        setSuccess(result.message ?? successMessage ?? 'Done.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handle}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {fields.map((f) => (
        <label key={f.name} className="mb-3 block">
          <span className="field-label">{f.label}</span>
          <input
            name={f.name}
            type={f.type ?? 'text'}
            required={f.required ?? true}
            className="input w-full"
          />
        </label>
      ))}
      {error && (
        <p data-testid="auth-error" className="mb-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      {success && (
        <p data-testid="auth-success" className="mb-3 text-[13px] text-success">
          {success}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn btn-primary w-full">
        {submitting ? 'Working…' : submitLabel}
      </button>
      {footer && <div className="mt-4 text-[13px]">{footer}</div>}
    </form>
  );
}
