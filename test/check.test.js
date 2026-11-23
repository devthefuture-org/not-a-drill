import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkSign, isSignFileName } from '../src/check.js';

const reference = (name) => readFileSync(new URL(`../template/${name}`, import.meta.url), 'utf8');
const HEADER = '# NOT A DRILL\n\n*NOT_A_DRILL.md v0.1 · 2026-11-23 · contact: security@acme-cooperative.org*\n';

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
  assert.deepEqual(checkSign('*NOT_A_DRILL.md v0.1 · contact: a@acme-cooperative.org*\n').map((f) => f.code), ['version']);
  assert.deepEqual(checkSign('*NOT_A_DRILL.md v0.1 · 2026-11-23*\n').map((f) => f.code), ['contact']);
  assert.deepEqual(checkSign('*NOT_A_DRILL.md v0.1 · 2026-11-23 · contact: someone*\n').map((f) => f.code), ['contact']);
});

test('sign file names follow the convention', () => {
  for (const name of ['NOT_A_DRILL.md', 'NOT_A_DRILL.fr.md', 'NOT_A_DRILL.pt-BR.md']) assert.ok(isSignFileName(name), name);
  for (const name of ['NOT_A_DRILL.txt', 'not_a_drill.md', 'NOT_A_DRILL.md.bak', 'README.md']) assert.ok(!isSignFileName(name), name);
});

test('escaped, rewrapped and linked fields are still unfilled', () => {
  const lines = (body) => checkSign(`${HEADER}\n${body}\n`).filter((f) => f.code === 'placeholder');
  assert.deepEqual(lines('It belongs to \\[NAME OR ORGANIZATION\\].').map((f) => f.message), ['unfilled field [NAME OR ORGANIZATION]']);
  assert.deepEqual(lines('It belongs to [NAME OR\nORGANIZATION].').map((f) => [f.line, f.message]), [[5, 'unfilled field [NAME OR ORGANIZATION]']]);
  assert.deepEqual(lines('Write to [CONTACT](mailto:x@y.org).').map((f) => f.message), ['unfilled field [CONTACT]']);
  assert.deepEqual(lines("Pour une urgence : \\[CONTACT D'URGENCE\\]."), [{ line: 5, code: 'placeholder', message: "unfilled field [CONTACT D'URGENCE]" }]);
});

test('footnotes, links and IPv6 addresses are not fields', () => {
  assert.deepEqual(checkSign(`${HEADER}\nSee [1], the [FAQ](https://x.org/faq) and https://[2001:db8::1]/.\n`), []);
});

test('the date must be next to the version, and must exist', () => {
  const codes = (header) => checkSign(`${header}\n`).map((f) => f.code);
  assert.deepEqual(codes('*NOT_A_DRILL.md v0.1 · contact: https://acme-cooperative.org/2026/security*'), ['version']);
  assert.deepEqual(codes('*NOT_A_DRILL.md v0.1 · 2026-02-30 · contact: sec@acme-cooperative.org*'), ['version']);
  assert.deepEqual(codes('*NOT_A_DRILL.fr.md v0.1 · 23 novembre 2026 · contact : sec@acme-cooperative.org*'), []);
});

test('the contact may be a link, bold or in angle brackets', () => {
  for (const contact of ['[sec@acme-cooperative.org](mailto:sec@acme-cooperative.org)', '**sec@acme-cooperative.org**', '<https://acme-cooperative.org/contact>']) {
    assert.deepEqual(checkSign(`*NOT_A_DRILL.md v0.1 · 2026-11-23 · contact: ${contact}*\n`), [], contact);
  }
});

test('language tags of any case and length name a sign', () => {
  for (const name of ['NOT_A_DRILL.FR.md', 'NOT_A_DRILL.zh-Hant-TW.md']) assert.ok(isSignFileName(name), name);
});
