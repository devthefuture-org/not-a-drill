import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { main } from '../src/cli.js';
import { NOW, scratchDir } from './helpers/fixtures.js';

// Runs the CLI in process with a fake terminal on stdin. `lines` are typed
// ahead; when `end` is true the input then closes, like Ctrl-D.
async function session(lines, { args = [], cwd = scratchDir(), end = true } = {}) {
  const stdin = new PassThrough();
  stdin.isTTY = true;
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let out = '';
  let err = '';
  stdout.on('data', (chunk) => (out += chunk));
  stderr.on('data', (chunk) => (err += chunk));
  stdin.write(lines.map((l) => `${l}\n`).join(''));
  if (end) stdin.end();
  const code = await main(args, { stdin, stdout, stderr, cwd, env: { NO_COLOR: '1' }, now: NOW });
  return { code, out, err, cwd };
}

const ENGLISH_SESSION = [
  'en', // language
  '', // other language: no
  'y', // real system
  'ACME Cooperative',
  'running its shop',
  'not an address', // refused, asked again
  'security@acme.test',
  '', // response time: 72 hours
  '', // no emergency contact
  'https://acme.test',
  '', // guest room: no
  '', // "at least" list: yes
  '', // cooperation: no
  '', // date: today
  '', // no site URL
  'n', // no snippets
  '', // write: yes
  '', // save answers: no
];

test('an English session writes the sign', async () => {
  const { code, out, cwd } = await session(ENGLISH_SESSION);
  assert.equal(code, 0, out);
  assert.match(out, /Give an email address or an http\(s\) URL\./);
  assert.deepEqual(readdirSync(cwd), ['NOT_A_DRILL.md']);
  const text = readFileSync(join(cwd, 'NOT_A_DRILL.md'), 'utf8');
  assert.match(text, /^\*NOT_A_DRILL\.md v0\.1 · 2026-11-23 · contact: security@acme\.test\*$/m);
  assert.match(text, /answers within 72 hours\.\n/);
  assert.match(text, /One thing is allowed, and nothing else\.\n\n- \*\*Reading what is public\*\*: https:\/\/acme\.test\./);
  assert.match(text, /Changes from the template: removed the guest room, the emergency contact, and the cooperation section\./);
});

test('a French session in both languages asks the texts twice', async () => {
  const { code, out, cwd } = await session([
    'fr',
    'o', // also English
    'o',
    'Coopérative ACME',
    'faire tourner sa boutique', // activity [fr]
    'running its shop', // activity [en]
    'https://acme.test/contact',
    '', // 72 heures
    '', // 72 hours
    '+33 1 23 45 67 89',
    '',
    'o', // guest room
    'https://guest.acme.test',
    '100 requêtes par jour',
    '100 requests per day',
    'n', // no "at least" list
    'n',
    '2026-12-01',
    'https://acme.test',
    '', // snippets: yes
    '',
    'o', // save the answers
  ]);
  assert.equal(code, 0, out);
  assert.match(out, /Activité \[français\]|Pour quoi en dépend-il \? \[français\]/);
  assert.deepEqual(readdirSync(cwd).sort(), ['NOT_A_DRILL.en.md', 'NOT_A_DRILL.md', 'not-a-drill-snippets', 'not-a-drill.answers.json']);
  const fr = readFileSync(join(cwd, 'NOT_A_DRILL.md'), 'utf8');
  assert.match(fr, /Il appartient à Coopérative ACME, qui en dépend pour faire tourner sa boutique\./);
  assert.match(fr, /Pour une urgence : \+33 1 23 45 67 89\./);
  assert.match(fr, /Une seule chose est autorisée/);
  assert.match(fr, /Changements par rapport au modèle : suppression de la lecture publique, de la liste « au moins » et de la section Coopération\./);
  const en = readFileSync(join(cwd, 'NOT_A_DRILL.en.md'), 'utf8');
  assert.match(en, /within 100 requests per day\./);
  const saved = JSON.parse(readFileSync(join(cwd, 'not-a-drill.answers.json'), 'utf8'));
  assert.deepEqual(saved.languages, ['fr', 'en']);
  assert.equal(saved.date, '2026-12-01');
  assert.equal(readdirSync(join(cwd, 'not-a-drill-snippets')).length, 5);
});

test('saying the system is not real stops before any write', async () => {
  const { code, out, cwd } = await session(['en', '', 'n']);
  assert.equal(code, 1);
  assert.match(out, /the sign goes only on real systems/);
  assert.deepEqual(readdirSync(cwd), []);
});

test('the real-system question has no default', async () => {
  const { code, out } = await session(['en', '', '', 'n']);
  assert.equal(code, 1);
  assert.match(out, /Answer y or n\./);
});

test('closing the input cancels without writing', async () => {
  const { code, err, cwd } = await session(['en', '', 'y', 'ACME']);
  assert.equal(code, 130);
  assert.match(err, /Cancelled\. Nothing was written\./);
  assert.deepEqual(readdirSync(cwd), []);
});

test('declining to overwrite keeps the existing sign', async () => {
  const cwd = scratchDir();
  writeFileSync(join(cwd, 'NOT_A_DRILL.md'), 'mine\n');
  const { code } = await session([...ENGLISH_SESSION, 'n'], { cwd });
  assert.equal(code, 1);
  assert.equal(readFileSync(join(cwd, 'NOT_A_DRILL.md'), 'utf8'), 'mine\n');
});

test('accepting to overwrite replaces it', async () => {
  const cwd = scratchDir();
  writeFileSync(join(cwd, 'NOT_A_DRILL.md'), 'mine\n');
  const { code } = await session([...ENGLISH_SESSION, 'y'], { cwd });
  assert.equal(code, 0);
  assert.match(readFileSync(join(cwd, 'NOT_A_DRILL.md'), 'utf8'), /^# NOT A DRILL/);
});

test('answering "no" to the final confirmation writes nothing', async () => {
  const lines = [...ENGLISH_SESSION];
  lines[lines.length - 2] = 'n';
  const { code, cwd } = await session(lines.slice(0, -1));
  assert.equal(code, 1);
  assert.ok(!existsSync(join(cwd, 'NOT_A_DRILL.md')));
});
