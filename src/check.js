// Checks a NOT_A_DRILL.md against the convention: every bracketed field
// filled in, a version and a date, and a contact a human reads.

import { findPlaceholders, isValidDate, parseContact } from './values.js';

export { findPlaceholders } from './values.js';

const SIGN_FILE = /^NOT_A_DRILL(\.[A-Za-z]{2,3}(-[A-Za-z0-9]+)*)?\.md$/;
const VERSION_LINE = /NOT_A_DRILL(\.[A-Za-z-]+)?\.md v\d+\.\d+/;
// The contact may be bold, in angle brackets, in backticks or a Markdown link.
const CONTACT_FIELD = /contact\s*:\s*[*_<[`]*([^\s*<>[\]()`]+)/i;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;
const YEAR = /\b(19|20)\d{2}\b/;

export function isSignFileName(name) {
  return SIGN_FILE.test(name);
}

function versionLineProblem(line) {
  // The contact may hold digits that look like a year: look for the date elsewhere.
  const withoutContact = line.replace(CONTACT_FIELD, '');
  const isoDates = withoutContact.match(ISO_DATE) ?? [];
  if (isoDates.some((d) => !isValidDate(d))) return `the date ${isoDates.find((d) => !isValidDate(d))} does not exist`;
  if (isoDates.length === 0 && !YEAR.test(withoutContact)) return 'no date next to the version';
  return null;
}

/** Returns the problems found in the text of a sign; an empty list means it conforms. */
export function checkSign(text) {
  const findings = findPlaceholders(text).map((p) => ({ line: p.line, code: 'placeholder', message: `unfilled field ${p.label}` }));
  const lines = text.split('\n');

  const versionIndex = lines.findIndex((line) => VERSION_LINE.test(line));
  if (versionIndex === -1) {
    findings.push({ line: null, code: 'version', message: 'no line with the version and the date ("NOT_A_DRILL.md v0.1 · YYYY-MM-DD")' });
  } else {
    const problem = versionLineProblem(lines[versionIndex]);
    if (problem) findings.push({ line: versionIndex + 1, code: 'version', message: `${problem} ("NOT_A_DRILL.md v0.1 · YYYY-MM-DD")` });
  }

  const contact = versionIndex === -1 ? null : CONTACT_FIELD.exec(lines[versionIndex]);
  if (!contact || !parseContact(contact[1])) {
    findings.push({
      line: versionIndex === -1 ? null : versionIndex + 1,
      code: 'contact',
      message: 'no contact next to the version: give an email address or an https URL that a human reads',
    });
  }
  return findings;
}
