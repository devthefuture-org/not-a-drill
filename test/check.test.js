import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkSign, isSignFileName } from '../src/check.js';

const reference = (name) => readFileSync(new URL(`../template/${name}`, import.meta.url), 'utf8');
const HEADER = '# NOT A DRILL\n\n*NOT_A_DRILL.md v0.1 · 2026-11-23 · contact: security@acme.test*\n';

test('the unfilled template fails on every bracketed field', () => {
  for (const name of ['NOT_A_DRILL.md', 'NOT_A_DRILL.fr.md']) {
    const findings = checkSign(reference(name));
    const placeholders = findings.filter((f) => f.code === 'placeholder').map((f) => f.message);
    assert.ok(placeholders.includes('unfilled field [CONTACT]'), name);
    assert.ok(placeholders.includes('unfilled field [DATE]'), name);
    assert.ok(findings.some((f) => f.code === 'contact'), name);
  }
  const fr = checkSign(reference('NOT_A_DRILL.fr.md')).map((f) => f.message);
  assert.ok(fr.includes("unfilled field [CONTACT D'URGENCE]"));
  assert.ok(fr.includes('unfilled field [ACTIVITÉ]'));
});

test('a filled sign passes', () => {
  assert.deepEqual(checkSign(`${HEADER}\nRead [NOT_A_DRILL.md](NOT_A_DRILL.md), [the guide](https://x.test) or the [FAQ](https://x.test/faq).\n`), []);
});

test('one placeholder is reported with its line', () => {
  assert.deepEqual(checkSign(`${HEADER}\nIt belongs to [NAME OR ORGANIZATION].\n`), [
    { line: 5, code: 'placeholder', message: 'unfilled field [NAME OR ORGANIZATION]' },
  ]);
});

test('a sign without version, date or contact is reported', () => {
  assert.deepEqual(checkSign('# NOT A DRILL\n').map((f) => f.code), ['version', 'contact']);
  assert.deepEqual(checkSign('*NOT_A_DRILL.md v0.1 · contact: a@b.test*\n').map((f) => f.code), ['version']);
  assert.deepEqual(checkSign('*NOT_A_DRILL.md v0.1 · 2026-11-23*\n').map((f) => f.code), ['contact']);
  assert.deepEqual(checkSign('*NOT_A_DRILL.md v0.1 · 2026-11-23 · contact: someone*\n').map((f) => f.code), ['contact']);
});

test('sign file names follow the convention', () => {
  for (const name of ['NOT_A_DRILL.md', 'NOT_A_DRILL.fr.md', 'NOT_A_DRILL.pt-BR.md']) assert.ok(isSignFileName(name), name);
  for (const name of ['NOT_A_DRILL.txt', 'not_a_drill.md', 'NOT_A_DRILL.md.bak', 'README.md']) assert.ok(!isSignFileName(name), name);
});
