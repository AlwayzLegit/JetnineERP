'use client';

/**
 * Form kit (owner 2026-09-02, auth/onboarding UX pass): react-hook-form +
 * zod on top of the app's `.input` / `.btn` styles. Every field owns its
 * label (so `getByLabel` and screen readers work), shows its own inline
 * error, and the submit button reflects the pending state. Pages keep
 * their business logic; this file only knows how a form looks and feels.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';

type AnySchema = z.ZodType<FieldValues, FieldValues>;

/** `useForm` wired to a zod schema; validates on blur, then on every change. */
export function useZodForm<S extends AnySchema>(
  schema: S,
  defaults?: DefaultValues<z.output<S>>,
): UseFormReturn<z.output<S>> {
  // react-hook-form's generic plumbing for resolvers is looser than zod's
  // input/output split; the cast keeps the public type honest (output).
  return useForm<z.output<S>>({
    resolver: zodResolver(schema as never) as never,
    defaultValues: defaults,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
}

/**
 * The form element. `onSubmit` may throw — the message lands in the
 * form's root error (rendered by `<FormRootError />`).
 */
export function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  style,
  ...rest
}: {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => Promise<void> | void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'children' | 'className' | 'style'
>) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    form.clearErrors('root');
    return form.handleSubmit(async (values) => {
      try {
        await onSubmit(values);
      } catch (err) {
        form.setError('root', {
          type: 'server',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })(e);
  };
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className={className} style={style} {...rest}>
        {children}
      </form>
    </FormProvider>
  );
}

function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  const err = name.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, errors);
  const message = (err as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' ? message : undefined;
}

interface FieldChrome {
  label: ReactNode;
  hint?: ReactNode;
  /** Something on the right of the label line (e.g. "Forgot?"). */
  labelAside?: ReactNode;
  className?: string;
}

function FieldFrame({
  id,
  label,
  hint,
  labelAside,
  error,
  className,
  children,
}: FieldChrome & { id: string; error?: string; children: ReactNode }) {
  return (
    <div className={className ?? 'mb-3'}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {labelAside && <span style={{ fontSize: 12 }}>{labelAside}</span>}
      </div>
      {children}
      {error ? (
        <p className="field-error" role="alert" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A labelled text-like input bound to the form by `name`. */
export function TextField<T extends FieldValues>({
  name,
  label,
  hint,
  labelAside,
  className,
  ...input
}: FieldChrome & { name: Path<T> } & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'name' | 'className'
  >) {
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      labelAside={labelAside}
      error={error}
      className={className}
    >
      <input
        id={id}
        className="input w-full"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...input}
        {...register(name)}
      />
    </FieldFrame>
  );
}

/** A labelled select bound to the form by `name`. */
export function SelectField<T extends FieldValues>({
  name,
  label,
  hint,
  labelAside,
  className,
  children,
  ...select
}: FieldChrome & { name: Path<T>; children: ReactNode } & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'name' | 'className' | 'children'
  >) {
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      labelAside={labelAside}
      error={error}
      className={className}
    >
      <select
        id={id}
        className="select w-full"
        aria-invalid={error ? 'true' : undefined}
        {...select}
        {...register(name)}
      >
        {children}
      </select>
    </FieldFrame>
  );
}

/** 0–4: length ≥ 12, then upper+lower, digit, symbol. */
export function passwordStrength(pw: string): { score: number; label: string; tips: string[] } {
  const tips: string[] = [];
  let score = 0;
  if (pw.length >= 12) score += 1;
  else tips.push('at least 12 characters');
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  else tips.push('upper and lower case');
  if (/\d/.test(pw)) score += 1;
  else tips.push('a number');
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  else tips.push('a symbol');
  if (pw.length >= 20 && score === 4) score = 4;
  const label = pw.length === 0 ? '' : ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score]!;
  return { score, label, tips };
}

/** Password input with show/hide and an optional strength meter. */
export function PasswordField<T extends FieldValues>({
  name,
  label,
  hint,
  labelAside,
  className,
  showStrength,
  ...input
}: FieldChrome & { name: Path<T>; showStrength?: boolean } & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'name' | 'className' | 'type'
  >) {
  const { register, watch } = useFormContext<T>();
  const error = useFieldError(name);
  const id = useId();
  const [visible, setVisible] = useState(false);
  const value = (showStrength ? watch(name) : '') as string | undefined;
  const strength = showStrength ? passwordStrength(value ?? '') : null;
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      labelAside={labelAside}
      error={error}
      className={className}
    >
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input w-full"
          style={{ paddingRight: 40 }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...input}
          {...register(name)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // Not "Show password": Playwright's getByLabel('Password') would
          // match this button too and trip strict mode in the auth spec.
          aria-label={visible ? 'Hide characters' : 'Reveal characters'}
          aria-pressed={visible}
          tabIndex={-1}
          className="input-adornment"
        >
          {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {strength && (value ?? '').length > 0 && (
        <div className="strength" aria-live="polite" data-score={strength.score}>
          <div className="strength-bar">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`strength-seg ${i < strength.score ? 'on' : ''}`} />
            ))}
          </div>
          <span className="strength-label">
            {strength.label}
            {strength.tips.length > 0 && ` · add ${strength.tips.slice(0, 2).join(', ')}`}
          </span>
        </div>
      )}
    </FieldFrame>
  );
}

/** Submit button that shows a spinner while the form is submitting. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const {
    formState: { isSubmitting },
  } = useFormContext();
  return (
    <button
      type="submit"
      disabled={isSubmitting || rest.disabled}
      aria-busy={isSubmitting}
      className={`btn btn-${variant} ${className ?? 'w-full'}`}
      {...rest}
    >
      {isSubmitting && <Loader2 size={15} aria-hidden className="spin" />}
      {isSubmitting ? (pendingLabel ?? children) : children}
    </button>
  );
}

/** Inline alert: error / success / info, with an optional testid. */
export function FormAlert({
  tone,
  title,
  children,
  testid,
  action,
}: {
  tone: 'error' | 'success' | 'info' | 'warning';
  title?: ReactNode;
  children?: ReactNode;
  testid?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`alert alert-${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      data-testid={testid}
    >
      <div style={{ minWidth: 0 }}>
        {title && <div className="alert-title">{title}</div>}
        {children && <div className="alert-body">{children}</div>}
      </div>
      {action && <div className="alert-action">{action}</div>}
    </div>
  );
}

/** The form-level (server) error, if any. */
export function FormRootError({ testid = 'auth-error' }: { testid?: string }) {
  const {
    formState: { errors },
  } = useFormContext();
  const message = (errors as { root?: { message?: string } }).root?.message;
  if (!message) return null;
  return (
    <FormAlert tone="error" testid={testid}>
      {message}
    </FormAlert>
  );
}
