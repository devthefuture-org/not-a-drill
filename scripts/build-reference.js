// Writes the reference template and snippets (template/, snippets/) from
// src/templates. These files are generated: edit the .tmpl sources instead.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { referenceFiles } from '../src/generate.js';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const file of referenceFiles()) {
  writeFileSync(new URL(file.path, `file://${root}`), file.content);
  console.log(`wrote ${file.path}`);
}
