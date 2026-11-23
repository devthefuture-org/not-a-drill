import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { fullAnswers, minimalAnswers, scratchDir } from './helpers/fixtures.js';

const BIN = fileURLToPath(new URL('../bin/not-a-drill.js', import.meta.url));
const PKG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

// stdin is not a terminal here, as for an agent or a script.
function run(args, { cwd = scratchDir() } = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8', input: '', env: { ...process.env, NO_COLOR: '1' } });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr, cwd };
}

function withAnswers(answers) {
  const dir = scratchDir();
  writeFileSync(join(dir, 'answers.json'), JSON.stringify(answers));
  return dir;
}

test('--help and --version', () => {
  const help = run(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /npx not-a-drill check/);
  const version = run(['--version']);
  assert.equal(version.code, 0);
  assert.equal(version.stdout.trim(), PKG.version);
});

test('usage errors exit 2', () => {
  assert.equal(run(['--nope']).code, 2);
  assert.equal(run(['deploy']).code, 2);
  assert.equal(run(['init', 'extra']).code, 2);
});

test('without a terminal and without answers, it asks for an answers file', () => {
  const result = run([]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /pass --answers <file>/);
  assert.deepEqual(readdirSync(result.cwd), []);
});

test('an answers file writes the sign and the snippets', () => {
  const cwd = withAnswers(fullAnswers());
  const result = run(['--answers', 'answers.json', '--out', 'site'], { cwd });
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(readdirSync(join(cwd, 'site')).sort(), ['NOT_A_DRILL.fr.md', 'NOT_A_DRILL.md', 'not-a-drill-snippets']);
  assert.equal(readdirSync(join(cwd, 'site', 'not-a-drill-snippets')).length, 5);
  assert.match(readFileSync(join(cwd, 'site', 'NOT_A_DRILL.md'), 'utf8'), /It belongs to ACME Cooperative, who depend on it for running its shop\./);
  assert.match(result.stdout, /Next steps:/);
});

test('a system that is not real gets no sign', () => {
  const cwd = withAnswers({ ...minimalAnswers(), realSystem: false });
  const result = run(['--answers', 'answers.json', '--out', 'site'], { cwd });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /only on a real system/);
  assert.ok(!existsSync(join(cwd, 'site')));
});

test('missing answers are listed and nothing is written', () => {
  const { owner, ...rest } = minimalAnswers();
  const cwd = withAnswers(rest);
  const result = run(['--answers', 'answers.json'], { cwd });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /Missing: owner/);
  assert.deepEqual(readdirSync(cwd), ['answers.json']);
});

test('an unreadable or invalid answers file exits 2', () => {
  assert.equal(run(['--answers', 'nowhere.json']).code, 2);
  const cwd = scratchDir();
  writeFileSync(join(cwd, 'answers.json'), '{ not json');
  const result = run(['--answers', 'answers.json'], { cwd });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /not valid JSON/);
});

test('existing files are kept unless --force, and nothing else is written', () => {
  const cwd = withAnswers(minimalAnswers());
  writeFileSync(join(cwd, 'NOT_A_DRILL.md'), 'mine\n');
  const refused = run(['--answers', 'answers.json'], { cwd });
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /pass --force/);
  assert.equal(readFileSync(join(cwd, 'NOT_A_DRILL.md'), 'utf8'), 'mine\n');
  assert.ok(!existsSync(join(cwd, 'not-a-drill-snippets')), 'no snippet written next to a refused sign');

  const forced = run(['--answers', 'answers.json', '--force'], { cwd });
  assert.equal(forced.code, 0, forced.stderr);
  assert.match(readFileSync(join(cwd, 'NOT_A_DRILL.md'), 'utf8'), /^# NOT A DRILL/);
});

test('saved answers regenerate the same sign', () => {
  const cwd = withAnswers(fullAnswers());
  assert.equal(run(['--answers', 'answers.json', '--out', 'a', '--save-answers', 'saved.json'], { cwd }).code, 0);
  assert.equal(run(['--answers', 'saved.json', '--out', 'b'], { cwd }).code, 0);
  for (const name of ['NOT_A_DRILL.md', 'NOT_A_DRILL.fr.md']) {
    assert.equal(readFileSync(join(cwd, 'b', name), 'utf8'), readFileSync(join(cwd, 'a', name), 'utf8'));
  }
});

test('check passes a generated sign and fails the template', () => {
  const cwd = withAnswers(fullAnswers());
  assert.equal(run(['--answers', 'answers.json'], { cwd }).code, 0);
  const ok = run(['check'], { cwd });
  assert.equal(ok.code, 0, ok.stdout);
  assert.match(ok.stdout, /NOT_A_DRILL\.fr\.md: ok\nNOT_A_DRILL\.md: ok/);

  const template = fileURLToPath(new URL('../template/NOT_A_DRILL.md', import.meta.url));
  const failed = run(['check', template]);
  assert.equal(failed.code, 1);
  assert.match(failed.stdout, /unfilled field \[CONTACT\]/);
});

test('check without a sign to check exits 1', () => {
  const cwd = scratchDir();
  mkdirSync(join(cwd, 'empty'));
  const result = run(['check'], { cwd: join(cwd, 'empty') });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /No NOT_A_DRILL\*\.md/);
  assert.equal(run(['check', 'missing.md'], { cwd }).code, 1);
});

test('a value that looks like an unfilled field is refused before any write', () => {
  const cwd = withAnswers({ ...minimalAnswers(), owner: '[NAME OR ORGANIZATION]' });
  const result = run(['--answers', 'answers.json'], { cwd });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /owner: looks like an unfilled field of the template \(\[NAME OR ORGANIZATION\]\)/);
  assert.deepEqual(readdirSync(cwd), ['answers.json']);
});

test('--save-answers cannot name one of the sign files', () => {
  for (const force of [[], ['--force']]) {
    const cwd = withAnswers(minimalAnswers());
    const result = run(['--answers', 'answers.json', '--save-answers', 'NOT_A_DRILL.md', ...force], { cwd });
    assert.equal(result.code, 1, result.stderr);
    assert.match(result.stderr, /would be written twice/);
    assert.deepEqual(readdirSync(cwd), ['answers.json'], 'nothing written');
  }
});

test('nothing is written through a symbolic link, even with --force', () => {
  const cwd = withAnswers(minimalAnswers());
  mkdirSync(join(cwd, 'out'));
  mkdirSync(join(cwd, 'elsewhere'));
  writeFileSync(join(cwd, 'elsewhere', 'victim.txt'), 'victim\n');
  symlinkSync('../elsewhere/victim.txt', join(cwd, 'out', 'NOT_A_DRILL.md'));
  const linked = run(['--answers', 'answers.json', '--out', 'out', '--force'], { cwd });
  assert.equal(linked.code, 1);
  assert.match(linked.stderr, /is a symbolic link/);
  assert.equal(readFileSync(join(cwd, 'elsewhere', 'victim.txt'), 'utf8'), 'victim\n');

  const cwd2 = withAnswers(minimalAnswers());
  mkdirSync(join(cwd2, 'out'));
  mkdirSync(join(cwd2, 'elsewhere'));
  symlinkSync('../elsewhere', join(cwd2, 'out', 'not-a-drill-snippets'));
  const dir = run(['--answers', 'answers.json', '--out', 'out'], { cwd: cwd2 });
  assert.equal(dir.code, 1);
  assert.match(dir.stderr, /not-a-drill-snippets is a symbolic link/);
  assert.deepEqual(readdirSync(join(cwd2, 'elsewhere')), []);
  assert.deepEqual(readdirSync(join(cwd2, 'out')), ['not-a-drill-snippets'], 'no sign written either');
});

test('a directory that cannot be written stops the run before the first file, without a stack trace', { skip: process.getuid?.() === 0 && 'root ignores permissions' }, () => {
  const cwd = withAnswers(minimalAnswers());
  mkdirSync(join(cwd, 'out', 'not-a-drill-snippets'), { recursive: true });
  chmodSync(join(cwd, 'out', 'not-a-drill-snippets'), 0o555);
  const result = run(['--answers', 'answers.json', '--out', 'out'], { cwd });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /cannot write in .*not-a-drill-snippets \(EACCES\)\nNothing was written\./);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
  assert.ok(!existsSync(join(cwd, 'out', 'NOT_A_DRILL.md')));
});

test('--out must be a directory, and a target must not be one', () => {
  const cwd = withAnswers(minimalAnswers());
  writeFileSync(join(cwd, 'afile'), 'x');
  const out = run(['--answers', 'answers.json', '--out', 'afile'], { cwd });
  assert.equal(out.code, 2);
  assert.match(out.stderr, /is not a directory/);
  mkdirSync(join(cwd, 'saved'));
  const save = run(['--answers', 'answers.json', '--save-answers', 'saved'], { cwd });
  assert.equal(save.code, 1);
  assert.match(save.stderr, /saved is a directory/);
  assert.ok(!existsSync(join(cwd, 'NOT_A_DRILL.md')));
});

test('the answers file is UTF-8, with or without a byte order mark', () => {
  const cwd = scratchDir();
  writeFileSync(join(cwd, 'bom.json'), `\uFEFF${JSON.stringify(minimalAnswers())}`);
  assert.equal(run(['--answers', 'bom.json', '--out', 'a'], { cwd }).code, 0);
  writeFileSync(join(cwd, 'latin1.json'), Buffer.from(JSON.stringify({ ...minimalAnswers(), owner: 'Coopérative' }), 'latin1'));
  const latin1 = run(['--answers', 'latin1.json', '--out', 'b'], { cwd });
  assert.equal(latin1.code, 2);
  assert.match(latin1.stderr, /not UTF-8/);
});

test('check reports an unreadable sign and goes on with the others', () => {
  const cwd = withAnswers(fullAnswers());
  assert.equal(run(['--answers', 'answers.json'], { cwd }).code, 0);
  mkdirSync(join(cwd, 'NOT_A_DRILL.de.md'));
  const result = run(['check'], { cwd });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /NOT_A_DRILL\.de\.md: cannot read \(EISDIR\)/);
  assert.match(result.stdout, /NOT_A_DRILL\.fr\.md: ok\nNOT_A_DRILL\.md: ok/);
});

test('--no-input without answers says what is missing', () => {
  const result = run(['--no-input']);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /--no-input needs --answers <file>/);
});
