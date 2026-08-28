'use client';

import { useEffect, useRef, useState } from 'react';
import { PERMISSIONS, PERMISSION_GROUPS, type Permission } from '@jetnine/shared';
import { Accordion } from '@/components/ui';

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
    <div style={{ display: 'grid', gap: 8 }}>
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
                disabled={disabled || !onChange}
                ariaLabel={`Grant all ${g.label} permissions`}
                onChange={(checked) => setGroup(g.permissions, checked)}
              />
            }
            summary={
              <>
                {overrides > 0 && (
                  <span className="badge badge-warning" style={{ marginRight: 8 }}>
                    {overrides} override{overrides === 1 ? '' : 's'}
                  </span>
                )}
                {granted} of {g.permissions.length}
              </>
            }
          >
            <div style={{ display: 'grid', gap: 2 }}>
              {g.permissions.map((p) => {
                const has = value.has(p);
                const overridden = baseline ? has !== baseline.has(p) : false;
                return (
                  <label
                    key={p}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '6px 4px',
                      borderRadius: 6,
                      cursor: disabled || !onChange ? 'default' : 'pointer',
                      background: overridden ? 'var(--surface-muted)' : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={has}
                      disabled={disabled || !onChange}
                      onChange={() => togglePermission(p)}
                      style={{ marginTop: 3, accentColor: 'var(--brand)' }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, display: 'block' }}>
                        {PERMISSIONS[p]}
                        {overridden && (
                          <span className="badge badge-warning" style={{ marginLeft: 8 }}>
                            {has ? 'extra allow' : 'revoked'}
                          </span>
                        )}
                      </span>
                      <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p}</code>
                    </span>
                  </label>
                );
              })}
            </div>
          </Accordion>
        );
      })}
    </div>
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
      style={{ accentColor: 'var(--brand)' }}
    />
  );
}
