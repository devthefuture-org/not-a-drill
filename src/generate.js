// Renders the files of a sign from normalized answers, and the reference
// template published in template/ and snippets/.

import { readFileSync } from 'node:fs';
import { buildContext, referenceContext } from './context.js';
import { LANGUAGES, SNIPPETS_DIR } from './constants.js';
import { render } from './render.js';

const SIGN_TEMPLATE = 'NOT_A_DRILL.md';

export const SNIPPETS = [
  { name: 'motd.txt', needsSite: false },
  { name: 'config-header.txt', needsSite: false },
  { name: 'AGENTS.snippet.md', needsSite: false },
  { name: 'llms.snippet.txt', needsSite: true },
  { name: 'security.snippet.txt', needsSite: true },
];

const templateCache = new Map();

function loadTemplate(lang, name) {
  const key = `${lang}/${name}`;
  if (!templateCache.has(key)) {
    const url = new URL(`./templates/${key}.tmpl`, import.meta.url);
    templateCache.set(key, readFileSync(url, 'utf8'));
  }
  return templateCache.get(key);
}

function renderTemplate(lang, name, context) {
  return render(loadTemplate(lang, name), context, `templates/${lang}/${name}.tmpl`);
}

/** `motd.txt` → `motd.fr.txt`, `NOT_A_DRILL.md` → `NOT_A_DRILL.fr.md`. */
export function localizedName(name, lang) {
  return name.replace(/(\.[^.]+)$/, `.${lang}$1`);
}

/** The files of a sign, as paths relative to the output directory. */
export function planFiles(answers) {
  const [main] = answers.languages;
  const files = [];
  for (const lang of answers.languages) {
    files.push({
      path: lang === main ? SIGN_TEMPLATE : localizedName(SIGN_TEMPLATE, lang),
      content: renderTemplate(lang, SIGN_TEMPLATE, buildContext(answers, lang)),
    });
  }
  if (answers.snippets) {
    const context = buildContext(answers, main);
    for (const snippet of SNIPPETS) {
      if (snippet.needsSite && !answers.siteUrl) continue;
      files.push({
        path: `${SNIPPETS_DIR}/${snippet.name}`,
        content: renderTemplate(main, `snippets/${snippet.name}`, context),
      });
    }
  }
  return files;
}

/** The reference template and snippets, as paths relative to the repository root. */
export function referenceFiles() {
  const files = [];
  for (const lang of LANGUAGES) {
    const context = referenceContext(lang);
    const suffix = (name) => (lang === 'en' ? name : localizedName(name, lang));
    files.push({ path: `template/${suffix(SIGN_TEMPLATE)}`, content: renderTemplate(lang, SIGN_TEMPLATE, context) });
    for (const snippet of SNIPPETS) {
      files.push({ path: `snippets/${suffix(snippet.name)}`, content: renderTemplate(lang, `snippets/${snippet.name}`, context) });
    }
  }
  return files;
}
