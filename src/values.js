// Validators shared by the answers file, the interactive questions and
// `check`, so that all three accept and refuse the same values.

import { LABELS } from './labels.js';

// An unfilled field of the template: uppercase words in square brackets,
// such as [CONTACT] or [CONTACT D'URGENCE]. Converters escape the brackets
// (`\[CONTACT\]`) and rewrap lines, so the brackets may be escaped and the
// words may span lines. At least one letter: `[1]` is a footnote.
const PLACEHOLDER = /\\?\[(?=[^\]]*[A-ZÀ-ÖØ-Þ])([A-ZÀ-ÖØ-Þ0-9][A-ZÀ-ÖØ-Þ0-9\s,'’-]*?)\\?\]/g;
// The template's own labels, without brackets.
const KNOWN_LABELS = new Set(
  Object.values(LABELS)
    .flatMap((labels) => Object.values(labels))
    .map((label) => label.slice(1, -1)),
);

/** Every unfilled field in `text`, with its line number. */
export function findPlaceholders(text) {
  const found = [];
  for (const match of text.matchAll(PLACEHOLDER)) {
    const label = match[1].replace(/\s+/g, ' ').trim();
    // `[FAQ](https://…)` is a link; `[CONTACT](mailto:…)` is still the template's field.
    const isLink = text[match.index + match[0].length] === '(';
    if (isLink && !KNOWN_LABELS.has(label)) continue;
    found.push({ line: text.slice(0, match.index).split('\n').length, label: `[${label}]` });
  }
  return found;
}

// Control characters, line and paragraph separators, and bidirectional
// overrides: they break the line or hide text from human readers.
const NOT_PLAIN = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200e\u200f\u202a-\u202e\u2066-\u2069]/;

/** Why a one-line value cannot go into a sign: `{ code: 'control' | 'placeholder', label? }`, or null. */
export function lineProblem(value) {
  if (NOT_PLAIN.test(value)) return { code: 'control' };
  const [placeholder] = findPlaceholders(value);
  if (placeholder) return { code: 'placeholder', label: placeholder.label };
  return null;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDate(value) {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

// Names reserved for documentation and tests (RFC 2606, RFC 6761), and
// single-label hosts: a sign that points there has no real contact.
const RESERVED_HOST = /(^|\.)(example|invalid|localhost|test)$|(^|\.)example\.(com|net|org)$/i;

function isReservedHost(host) {
  return !host.includes('.') || RESERVED_HOST.test(host.replace(/\.$/, ''));
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

// URLs are printed as typed, in Markdown and in security.txt: printable ASCII
// only, without the characters a URI or Markdown would read differently.
const URL_UNSAFE = /[^\x21-\x7e]|[\\"{}|^[\]<>*`]/;

// ASCII only, without `*` or backquotes (Markdown) and without the characters
// a mailto: URI must encode (`?`, `#`, `%`, `{`, `|`, `}`, `^`…).
const EMAIL = /^[A-Za-z0-9.!$&'+/=_~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

/** Why a contact cannot be used: 'format', 'http' or 'reserved'; null when it can. */
export function contactProblem(value) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    const url = parseUrl(value);
    if (!url || !['https:', 'http:'].includes(url.protocol) || url.hostname === '') return 'format';
    // RFC 9116: a web URI in security.txt must begin with https://.
    if (url.protocol !== 'https:') return 'http';
    // The sign prints the contact as typed, before a period.
    if (!/^https:\/\/[^/]/i.test(value) || URL_UNSAFE.test(value) || value.endsWith('.')) return 'format';
    return isReservedHost(url.hostname) ? 'reserved' : null;
  }
  const address = value.replace(/^mailto:/i, '');
  if (!EMAIL.test(address)) return 'format';
  return isReservedHost(address.slice(address.lastIndexOf('@') + 1)) ? 'reserved' : null;
}

/** A contact as written in the sign (`display`) and as a URI (`uri`), or null. */
export function parseContact(value) {
  if (contactProblem(value) !== null) return null;
  if (/^https:\/\//i.test(value)) return { kind: 'url', display: value, uri: value };
  const address = value.replace(/^mailto:/i, '');
  return { kind: 'email', display: address, uri: `mailto:${address}` };
}

/** Why a website URL cannot be used: 'format', 'query' or 'reserved'; null when it can. */
export function siteUrlProblem(value) {
  const url = parseUrl(value);
  if (!url || !['https:', 'http:'].includes(url.protocol) || url.hostname === '') return 'format';
  // The URL goes inside a Markdown link in llms.txt.
  if (!/^https?:\/\/[^/]/i.test(value) || URL_UNSAFE.test(value) || /[()]/.test(value)) return 'format';
  if (/[?#]/.test(value)) return 'query';
  return isReservedHost(url.hostname) ? 'reserved' : null;
}
