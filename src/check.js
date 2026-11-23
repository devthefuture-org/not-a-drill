// Checks a NOT_A_DRILL.md against the convention: every bracketed field
// filled in, a version and a date, and a contact a human reads.

import { parseContact } from './answers.js';

// An unfilled field of the template: uppercase words in square brackets,
// such as [CONTACT] or [CONTACT D'URGENCE]. A Markdown link `[text](url)` is
// not one.
const PLACEHOLDER = /\[([A-ZÀ-ÖØ-Þ0-9][A-ZÀ-ÖØ-Þ0-9 ,'’\-]*)\](?!\()/g;
const SIGN_FILE = /^NOT_A_DRILL(\.[a-z]{2,3}(-[A-Za-z0-9]+)?)?\.md$/;
const VERSION_LINE = /NOT_A_DRILL\.md v\d+\.\d+/;
const YEAR = /\b(19|20)\d{2}\b/;
const CONTACT_FIELD = /contact\s*:\s*([^\s*]+)/i;

export function isSignFileName(name) {
  return SIGN_FILE.test(name);
}

/** Returns the problems found in the text of a sign; an empty list means it conforms. */
export function checkSign(text) {
  const findings = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(PLACEHOLDER)) {
      findings.push({ line: index + 1, code: 'placeholder', message: `unfilled field ${match[0]}` });
    }
  });

  const versionIndex = lines.findIndex((line) => VERSION_LINE.test(line));
  if (versionIndex === -1 || !YEAR.test(lines[versionIndex])) {
    findings.push({ line: null, code: 'version', message: 'no line with the version and the date ("NOT_A_DRILL.md v0.1 · YYYY-MM-DD")' });
  }

  const contact = versionIndex === -1 ? null : CONTACT_FIELD.exec(lines[versionIndex]);
  if (!contact || !parseContact(contact[1])) {
    findings.push({
      line: versionIndex === -1 ? null : versionIndex + 1,
      code: 'contact',
      message: 'no contact next to the version: give an email address or an http(s) URL that a human reads',
    });
  }
  return findings;
}
