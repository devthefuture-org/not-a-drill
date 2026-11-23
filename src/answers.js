// Validation of the answers that describe a sign. The interactive flow and
// `--answers <file>` both go through `normalizeAnswers`, so they accept and
// reject exactly the same things.

import { LANGUAGES } from './constants.js';

export const ANSWER_KEYS = [
  'realSystem',
  'languages',
  'date',
  'owner',
  'activity',
  'contact',
  'responseTime',
  'emergencyContact',
  'publicPaths',
  'guestRoom',
  'atLeastList',
  'cooperation',
  'siteUrl',
  'snippets',
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Answers that do not describe a valid sign. `problems` lists every one of them. */
export class AnswersError extends Error {
  constructor(problems) {
    super(problems.map((p) => `${p.path}: ${p.message}`).join('\n'));
    this.name = 'AnswersError';
    this.problems = problems;
  }
}

/** The owner did not confirm that the system is real: rule 1 forbids the sign. */
export class NotARealSystemError extends Error {
  constructor() {
    super('realSystem is false: a NOT_A_DRILL.md goes only on a real system');
    this.name = 'NotARealSystemError';
  }
}

export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isValidDate(value) {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname !== '';
  } catch {
    return false;
  }
}

/** Contact as written in the sign: an email address or an http(s) URL. `mailto:` is dropped. */
export function parseContact(value) {
  const bare = value.startsWith('mailto:') ? value.slice('mailto:'.length) : value;
  if (EMAIL.test(bare)) return { kind: 'email', display: bare, uri: `mailto:${bare}` };
  if (isHttpUrl(value)) return { kind: 'url', display: value, uri: value };
  return null;
}

class Collector {
  problems = [];
  missing(path) {
    this.problems.push({ path, message: 'required', missing: true });
  }
  invalid(path, message) {
    this.problems.push({ path, message });
  }
}

function readLine(raw, path, problems, { required }) {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    if (required) problems.missing(path);
    return null;
  }
  if (typeof raw !== 'string') {
    problems.invalid(path, `must be a string, got ${Array.isArray(raw) ? 'array' : typeof raw}`);
    return null;
  }
  if (/[\r\n]/.test(raw)) {
    problems.invalid(path, 'must fit on one line');
    return null;
  }
  return raw.trim();
}

function readBoolean(raw, path, problems, fallback) {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'boolean') {
    problems.invalid(path, `must be true or false, got ${JSON.stringify(raw)}`);
    return fallback;
  }
  return raw;
}

// A text that depends on the language: an object keyed by language, or a
// plain string when the sign has a single language.
function readLocalized(raw, path, problems, languages) {
  if (raw === undefined || raw === null) {
    problems.missing(path);
    return null;
  }
  if (typeof raw === 'string') {
    if (languages.length > 1) {
      problems.invalid(path, `the sign has ${languages.length} languages: give an object with ${languages.map((l) => `"${l}"`).join(' and ')}`);
      return null;
    }
    const value = readLine(raw, path, problems, { required: true });
    return value === null ? null : { [languages[0]]: value };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    problems.invalid(path, 'must be a string or an object keyed by language');
    return null;
  }
  const result = {};
  for (const key of Object.keys(raw)) {
    if (!languages.includes(key)) problems.invalid(`${path}.${key}`, `the sign's languages are ${languages.join(', ')}`);
  }
  for (const lang of languages) {
    const value = readLine(raw[lang], `${path}.${lang}`, problems, { required: true });
    if (value !== null) result[lang] = value;
  }
  return Object.keys(result).length === languages.length ? result : null;
}

function readSection(raw, path, problems, keys) {
  if (raw === undefined || raw === null || raw === false) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    problems.invalid(path, 'must be an object, or null to leave it out');
    return null;
  }
  for (const key of Object.keys(raw)) {
    if (!keys.includes(key)) problems.invalid(`${path}.${key}`, `unknown key (expected: ${keys.join(', ')})`);
  }
  return raw;
}

function readLanguages(raw, problems) {
  if (raw === undefined) return ['en'];
  const valid =
    Array.isArray(raw) &&
    raw.length >= 1 &&
    raw.length <= LANGUAGES.length &&
    new Set(raw).size === raw.length &&
    raw.every((l) => LANGUAGES.includes(l));
  if (!valid) {
    problems.invalid('languages', `must list 1 or 2 distinct languages among ${LANGUAGES.join(', ')}; the first one is the main file`);
    return ['en'];
  }
  return raw;
}

/**
 * Checks raw answers and returns them in normalized form.
 * Throws NotARealSystemError when realSystem is false, AnswersError otherwise.
 */
export function normalizeAnswers(raw, { today = todayIso() } = {}) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new AnswersError([{ path: '(root)', message: 'answers must be a JSON object' }]);
  }
  const problems = new Collector();
  for (const key of Object.keys(raw)) {
    if (!ANSWER_KEYS.includes(key)) problems.invalid(key, 'unknown key');
  }

  if (raw.realSystem === false) throw new NotARealSystemError();
  if (raw.realSystem === undefined) problems.missing('realSystem');
  else if (raw.realSystem !== true) problems.invalid('realSystem', 'must be true: confirm that this is a real system in production');

  const languages = readLanguages(raw.languages, problems);

  let date = today;
  if (raw.date !== undefined) {
    if (typeof raw.date !== 'string' || !isValidDate(raw.date)) problems.invalid('date', 'must be a date written YYYY-MM-DD');
    else date = raw.date;
  }

  const owner = readLine(raw.owner, 'owner', problems, { required: true });
  const activity = readLocalized(raw.activity, 'activity', problems, languages);

  let contact = readLine(raw.contact, 'contact', problems, { required: true });
  if (contact !== null) {
    const parsed = parseContact(contact);
    if (!parsed) problems.invalid('contact', 'must be an email address or an http(s) URL that a human reads');
    else contact = parsed.display;
  }

  const responseTime = readLocalized(raw.responseTime, 'responseTime', problems, languages);
  const emergencyContact = readLine(raw.emergencyContact, 'emergencyContact', problems, { required: false });
  const publicPaths = readLine(raw.publicPaths, 'publicPaths', problems, { required: false });

  let guestRoom = null;
  const rawGuest = readSection(raw.guestRoom, 'guestRoom', problems, ['url', 'quota']);
  if (rawGuest) {
    const url = readLine(rawGuest.url, 'guestRoom.url', problems, { required: true });
    const quota = readLocalized(rawGuest.quota, 'guestRoom.quota', problems, languages);
    guestRoom = { url, quota };
  }

  const atLeastList = readBoolean(raw.atLeastList, 'atLeastList', problems, true);

  let cooperation = null;
  const rawCoop = readSection(raw.cooperation, 'cooperation', problems, ['goals', 'offer']);
  if (rawCoop) {
    cooperation = {
      goals: readLocalized(rawCoop.goals, 'cooperation.goals', problems, languages),
      offer: readLocalized(rawCoop.offer, 'cooperation.offer', problems, languages),
    };
  }

  let siteUrl = readLine(raw.siteUrl, 'siteUrl', problems, { required: false });
  if (siteUrl !== null) {
    if (!isHttpUrl(siteUrl)) problems.invalid('siteUrl', 'must be an http(s) URL');
    else siteUrl = siteUrl.replace(/\/+$/, '');
  }

  const snippets = readBoolean(raw.snippets, 'snippets', problems, true);

  if (problems.problems.length > 0) throw new AnswersError(problems.problems);
  return {
    realSystem: true,
    languages,
    date,
    owner,
    activity,
    contact,
    responseTime,
    emergencyContact,
    publicPaths,
    guestRoom,
    atLeastList,
    cooperation,
    siteUrl,
    snippets,
  };
}
