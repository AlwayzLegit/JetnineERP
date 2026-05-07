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
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>{title}</h2>
      {fields.map((f) => (
        <label key={f.name} style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{f.label}</span>
          <input
            name={f.name}
            type={f.type ?? 'text'}
            required={f.required ?? true}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 14,
            }}
          />
        </label>
      ))}
      {error && (
        <p data-testid="auth-error" style={{ color: '#b00', marginBottom: 12, fontSize: 13 }}>
          {error}
        </p>
      )}
      {success && (
        <p data-testid="auth-success" style={{ color: '#080', marginBottom: 12, fontSize: 13 }}>
          {success}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontSize: 14,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? 'Working…' : submitLabel}
      </button>
      {footer && <div style={{ marginTop: 16, fontSize: 13 }}>{footer}</div>}
    </form>
  );
}
