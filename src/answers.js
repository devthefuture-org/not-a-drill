// Validation of the answers that describe a sign. The interactive flow and
// `--answers <file>` both go through `normalizeAnswers`, so they accept and
// reject exactly the same things.

import { LANGUAGES } from './constants.js';
import { contactProblem, isValidDate, lineProblem, parseContact, siteUrlProblem } from './values.js';

export { isValidDate, parseContact } from './values.js';

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

const CONTACT_PROBLEMS = {
  format: 'must be an email address or an https URL that a human reads',
  http: 'must use https: security.txt (RFC 9116) accepts only https web contacts',
  reserved: 'uses a name reserved for examples or tests: give the real contact',
};

const SITE_URL_PROBLEMS = {
  format: 'must be an http(s) URL',
  query: 'must not have a query or a fragment: the sign is published at <siteUrl>/NOT_A_DRILL.md',
  reserved: 'uses a name reserved for examples or tests: give the real website',
};

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
  if (raw === undefined || raw === null || (raw === false && !required) || (typeof raw === 'string' && raw.trim() === '')) {
    if (required) problems.missing(path);
    return null;
  }
  if (typeof raw !== 'string') {
    problems.invalid(path, `must be a string, got ${Array.isArray(raw) ? 'array' : typeof raw}`);
    return null;
  }
  const problem = lineProblem(raw);
  if (problem?.code === 'control') {
    problems.invalid(path, 'must be plain text on one line: no line break, control or bidirectional character');
    return null;
  }
  if (problem?.code === 'placeholder') {
    problems.invalid(path, `looks like an unfilled field of the template (${problem.label}): write it without square brackets`);
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
    const problem = contactProblem(contact);
    if (problem) problems.invalid('contact', CONTACT_PROBLEMS[problem]);
    else contact = parseContact(contact).display;
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
    const problem = siteUrlProblem(siteUrl);
    if (problem) problems.invalid('siteUrl', SITE_URL_PROBLEMS[problem]);
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
