'use client';

import { useEffect, useRef, useState } from 'react';
import { PERMISSIONS, PERMISSION_GROUPS, type Permission } from '@jetnine/shared';
import { Accordion, Stack } from '@/components/ui';

/**
 * Shopify-style grouped permission editor: one accordion per domain,
 * a select-all checkbox on the group header, and one row per permission
 * showing the human description with the raw key underneath.
 *
 * Two callers, one component:
 *  - Role editor: `value` is the role's permission set.
 *  - Member access editor: `value` is the member's EFFECTIVE set and
 *    `baseline` is what the role alone would grant — rows where the two
 *    differ render an "override" chip, so per-member adjustments are
 *    visible at a glance.
 */
export function PermissionGroupsEditor({
  value,
  onChange,
  baseline,
  disabled,
  defaultOpen = false,
}: {
  value: Set<string>;
  onChange?: (next: Set<string>) => void;
  baseline?: Set<string>;
  disabled?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(defaultOpen ? PERMISSION_GROUPS.map((g) => g.key) : []),
  );
  const editable = Boolean(onChange) && !disabled;

  function toggleGroupOpen(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePermission(p: Permission) {
    if (!onChange || disabled) return;
    const next = new Set(value);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    onChange(next);
  }

  function setGroup(perms: Permission[], grant: boolean) {
    if (!onChange || disabled) return;
    const next = new Set(value);
    for (const p of perms) {
      if (grant) next.add(p);
      else next.delete(p);
    }
    onChange(next);
  }

  return (
    <Stack gap="sm">
      {PERMISSION_GROUPS.map((g) => {
        const granted = g.permissions.filter((p) => value.has(p)).length;
        const all = granted === g.permissions.length;
        const overrides = baseline
          ? g.permissions.filter((p) => value.has(p) !== baseline.has(p)).length
          : 0;
        return (
          <Accordion
            key={g.key}
            title={g.label}
            open={open.has(g.key)}
            onToggle={() => toggleGroupOpen(g.key)}
            leading={
              <TriCheckbox
                checked={all && g.permissions.length > 0}
                indeterminate={granted > 0 && !all}
                disabled={!editable}
                ariaLabel={`Grant all ${g.label} permissions`}
                onChange={(checked) => setGroup(g.permissions, checked)}
              />
            }
            summary={
              <>
                {overrides > 0 && (
                  <span className="badge badge-warning mr-2">
                    {overrides} override{overrides === 1 ? '' : 's'}
                  </span>
                )}
                {granted} of {g.permissions.length}
              </>
            }
          >
            <div className="grid gap-0.5">
              {g.permissions.map((p) => {
                const has = value.has(p);
                const overridden = baseline ? has !== baseline.has(p) : false;
                return (
                  <label
                    key={p}
                    className={`flex items-start gap-2.5 rounded-md px-1 py-1.5 ${
                      editable ? 'cursor-pointer' : 'cursor-default'
                    } ${overridden ? 'bg-[var(--surface-muted)]' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-[3px] accent-[var(--brand)]"
                      checked={has}
                      disabled={!editable}
                      onChange={() => togglePermission(p)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px]">
                        {PERMISSIONS[p]}
                        {overridden && (
                          <span className="badge badge-warning ml-2">
                            {has ? 'extra allow' : 'revoked'}
                          </span>
                        )}
                      </span>
                      <code className="muted text-[11px]">{p}</code>
                    </span>
                  </label>
                );
              })}
            </div>
          </Accordion>
        );
      })}
    </Stack>
  );
}

function TriCheckbox({
  checked,
  indeterminate,
  disabled,
  ariaLabel,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="accent-[var(--brand)]"
    />
  );
}
