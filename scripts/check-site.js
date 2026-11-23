// Checks the built documentation site. The site is not a production system:
// it must not serve a NOT_A_DRILL.md of its own (rule 1 of the convention).

import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../docs/.vitepress/dist/', import.meta.url));
const failures = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/^NOT_A_DRILL.*\.md$/i.test(entry.name)) failures.push(`the site serves a sign: ${relative(dist, path)}`);
  }
}

if (!existsSync(dist)) {
  console.error(`no built site in ${dist}: run "task docs:build"`);
  process.exit(1);
}
walk(dist);
for (const page of ['index.html', 'guide.html', 'cli.html', 'prompts.html', 'template.html', 'fr/index.html', 'fr/prompts.html']) {
  if (!existsSync(join(dist, page))) failures.push(`missing page: ${page}`);
}
if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('site: every page present, no NOT_A_DRILL.md served');
