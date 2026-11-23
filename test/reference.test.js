import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { buildContext, referenceContext } from '../src/context.js';
import { normalizeAnswers } from '../src/answers.js';
import { referenceFiles } from '../src/generate.js';
import { namesUsed } from '../src/render.js';
import { fullAnswers } from './helpers/fixtures.js';

const root = new URL('../', import.meta.url);

test('the committed template/ and snippets/ are the render of src/templates', () => {
  for (const file of referenceFiles()) {
    const committed = readFileSync(new URL(file.path, root), 'utf8');
    assert.equal(file.content, committed, `${file.path} is out of date: run "task build:reference"`);
  }
});

test('template/ and snippets/ hold only generated files', () => {
  const generated = new Set(referenceFiles().map((f) => f.path));
  for (const dir of ['template', 'snippets']) {
    for (const name of readdirSync(new URL(`${dir}/`, root))) {
      assert.ok(generated.has(`${dir}/${name}`), `${dir}/${name} is not generated from src/templates`);
    }
  }
});

test('both contexts give a value to every name the templates use', () => {
  const templates = new URL('../src/templates/', import.meta.url);
  const answers = normalizeAnswers(fullAnswers());
  for (const lang of ['en', 'fr']) {
    const names = new Set();
    const collect = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) collect(url);
        else for (const n of namesUsed(readFileSync(url, 'utf8'))) names.add(n);
      }
    };
    collect(new URL(`${lang}/`, templates));
    for (const [label, context] of [['reference', referenceContext(lang)], ['answers', buildContext(answers, lang)]]) {
      for (const name of names) assert.ok(Object.hasOwn(context, name), `${label} context (${lang}) lacks "${name}"`);
    }
  }
});
