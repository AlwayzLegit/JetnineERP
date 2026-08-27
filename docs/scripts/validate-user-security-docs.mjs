#!/usr/bin/env node
// Interim validator for the users & security docs domain.
// The paired docs-system spec (docs/STORIS-DOCS-HANDOFF.md) has not been
// uploaded to this repo yet; this script enforces the conventions inferable
// from docs/HANDOFF-users-and-security.md until the real spec (and its six
// scripts) arrives. Exit non-zero on any violation.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const read = (p) => readFileSync(join(docs, p), 'utf8');

function frontmatter(p, src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    errors.push(`${p}: missing frontmatter`);
    return {};
  }
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '');
  }
  for (const key of ['title', 'type', 'status'])
    if (!fm[key]) errors.push(`${p}: frontmatter missing "${key}"`);
  return fm;
}

function checkLinks(p, src) {
  for (const m of src.matchAll(/\]\((?!https?:|#)([^)#]+)(#[^)]*)?\)/g)) {
    const target = resolve(join(docs, dirname(p)), m[1]);
    if (!existsSync(target)) errors.push(`${p}: broken link -> ${m[1]}`);
  }
}

// 1. Settings article
{
  const p = 'settings/general-system-control-settings.md';
  const src = read(p);
  const fm = frontmatter(p, src);
  if (fm.status !== 'draft') errors.push(`${p}: status must be draft`);
  if (/Our value:\*\*(?! TBD)/.test(src))
    errors.push(`${p}: found a non-TBD "Our value" in a draft`);
  checkLinks(p, src);
}

// 2. Process articles must end with the required section
for (const p of ['processes/user-access-model.md', 'processes/login-chain.md']) {
  const src = read(p);
  frontmatter(p, src);
  if (!src.includes('## Settings that control this process'))
    errors.push(`${p}: missing "Settings that control this process" section`);
  checkLinks(p, src);
}

// 3. create-a-user.md: every field entry (###) carries a Status line
{
  const p = 'erp/system-administration/user-settings/create-a-user.md';
  const src = read(p);
  frontmatter(p, src);
  const entries = src.split(/^### /m).slice(1);
  if (entries.length < 30) errors.push(`${p}: only ${entries.length} field entries — expected 30+`);
  for (const e of entries) {
    const label = e.split('\n')[0];
    if (!/\*\*Status:\*\*/.test(e)) errors.push(`${p}: entry "${label}" has no Status line`);
  }
  checkLinks(p, src);
}

// 4. Exactly 10 ADR stubs, all proposed
{
  const files = readdirSync(join(docs, 'decisions')).filter((f) => /^d\d+-.*\.md$/.test(f));
  if (files.length !== 10) errors.push(`decisions/: expected 10 ADRs, found ${files.length}`);
  for (const f of files) {
    const p = `decisions/${f}`;
    const fm = frontmatter(p, read(p));
    if (fm.status !== 'proposed') errors.push(`${p}: ADR status must be proposed`);
  }
}

// 5. open-questions.md: five numbered questions, each with a Test and Environment
{
  const p = 'open-questions.md';
  const src = read(p);
  frontmatter(p, src);
  const qs = src.split(/^## \d+\. /m).slice(1);
  if (qs.length !== 5) errors.push(`${p}: expected 5 questions, found ${qs.length}`);
  qs.forEach((q, i) => {
    if (!/\*\*Test:\*\*/.test(q)) errors.push(`${p}: question ${i + 1} missing a Test`);
    if (!/\*\*Environment:\*\*/.test(q))
      errors.push(`${p}: question ${i + 1} missing an Environment`);
  });
  checkLinks(p, src);
}

if (errors.length) {
  console.error(`FAIL — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('OK — users & security docs domain passes interim validation');
