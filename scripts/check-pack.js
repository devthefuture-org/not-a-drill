// Checks what npm would publish, then runs the packed CLI through npx the way
// a user would: --version, a generation from an answers file, and check.

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const failures = [];

const [report] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' }));
const files = report.files.map((f) => f.path);

const required = [
  'package.json',
  'README.md',
  'LICENSE',
  'LICENSE-CC-BY-4.0',
  'bin/not-a-drill.js',
  'src/cli.js',
  'src/templates/en/NOT_A_DRILL.md.tmpl',
  'src/templates/fr/NOT_A_DRILL.md.tmpl',
  'src/templates/en/snippets/security.snippet.txt.tmpl',
  'src/templates/fr/snippets/security.snippet.txt.tmpl',
];
for (const file of required) if (!files.includes(file)) failures.push(`missing from the package: ${file}`);

// The package ships no sign of its own: an agent that finds a NOT_A_DRILL.md
// inside node_modules must not mistake a template for a real system's sign.
const forbidden = [/^test\//, /^docs\//, /^scripts\//, /^template\//, /^snippets\//, /^bench\//, /^\.github\//, /(^|\/)NOT_A_DRILL[^/]*\.md$/];
for (const file of files) if (forbidden.some((re) => re.test(file))) failures.push(`should not be in the package: ${file}`);

if (Object.keys(pkg.dependencies ?? {}).length > 0) failures.push(`the CLI has runtime dependencies: ${Object.keys(pkg.dependencies).join(', ')}`);

const packDir = mkdtempSync(join(tmpdir(), 'not-a-drill-pack-'));
const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', packDir], { cwd: root, encoding: 'utf8' }));
const tarball = join(packDir, packed.filename);

const work = mkdtempSync(join(tmpdir(), 'not-a-drill-npx-'));
writeFileSync(
  join(work, 'answers.json'),
  JSON.stringify({ realSystem: true, owner: 'ACME', activity: 'running its shop', contact: 'security@acme-cooperative.org', responseTime: '72 hours' }),
);
function npx(args) {
  return spawnSync('npx', ['--yes', '--package', tarball, 'not-a-drill', ...args], { cwd: work, encoding: 'utf8', input: '' });
}
const version = npx(['--version']);
if (version.status !== 0 || version.stdout.trim() !== pkg.version) failures.push(`npx not-a-drill --version: exit ${version.status}, "${version.stdout.trim()}" ${version.stderr}`);
const init = npx(['--answers', 'answers.json', '--no-input']);
if (init.status !== 0) failures.push(`npx not-a-drill --answers: exit ${init.status}\n${init.stderr}`);
const check = npx(['check']);
if (check.status !== 0) failures.push(`npx not-a-drill check: exit ${check.status}\n${check.stdout}${check.stderr}`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${packed.filename}: ${files.length} files, no runtime dependency; npx --version, generation and check pass`);
