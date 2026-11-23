// Turns normalized answers into the values the templates use. The reference
// context renders the published template: every option on, every field shown
// as its bracketed label.

import { PROJECT_URL, REGISTRY_URL } from './constants.js';
import { LABELS } from './labels.js';
import { parseContact } from './values.js';

export { LABELS } from './labels.js';

const DAY_MS = 24 * 60 * 60 * 1000;
// RFC 9116 asks for an Expires date less than a year away.
const SECURITY_TXT_LIFETIME_DAYS = 364;

const REFERENCE_SNIPPET_VALUES = {
  siteUrl: 'https://example.com',
  securityContact: 'mailto:[CONTACT]',
  expires: '2027-11-01T00:00:00.000Z',
  preferredLanguages: 'en, fr',
};

// The parts of the template a sign can leave out, in the order the
// "Changes from the template" line lists them.
const REMOVABLE = [
  { key: 'publicPaths', removed: (a) => !a.publicPaths, en: 'public reading', fr: 'de la lecture publique' },
  { key: 'guestRoom', removed: (a) => !a.guestRoom, en: 'the guest room', fr: "de la chambre d'amis" },
  { key: 'emergencyContact', removed: (a) => !a.emergencyContact, en: 'the emergency contact', fr: "du contact d'urgence" },
  { key: 'atLeastList', removed: (a) => !a.atLeastList, en: 'the "at least" list', fr: 'de la liste « au moins »' },
  { key: 'cooperation', removed: (a) => !a.cooperation, en: 'the cooperation section', fr: 'de la section Coopération' },
];

function joinList(items, lang) {
  if (items.length <= 1) return items.join('');
  const last = items.at(-1);
  const head = items.slice(0, -1).join(', ');
  if (lang === 'fr') return `${head} et ${last}`;
  return items.length === 2 ? `${head} and ${last}` : `${head}, and ${last}`;
}

export function describeChanges(answers, lang) {
  const items = REMOVABLE.filter((r) => r.removed(answers)).map((r) => r[lang]);
  if (items.length === 0) return lang === 'fr' ? 'aucun' : 'none';
  return lang === 'fr' ? `suppression ${joinList(items, 'fr')}` : `removed ${joinList(items, 'en')}`;
}

function allowedFlags(count) {
  return { allowedTwo: count === 2, allowedOne: count === 1, allowedNone: count === 0, allowedSome: count > 0 };
}

export function securityExpires(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + SECURITY_TXT_LIFETIME_DAYS * DAY_MS).toISOString();
}

// In a Markdown file, `*`, `<`, backquotes and backslashes in a value would
// turn into formatting and change what the reader sees (`/srv/public/*`).
export function escapeMarkdown(value) {
  return value.replace(/[\\*<`]/g, '\\$&');
}

// The template ends these sentences with its own period.
function withoutFinalPeriod(value) {
  return value.replace(/\.$/, '');
}

/**
 * Values for the templates. `markdown` escapes the owner's texts for a .md
 * file; `today` dates the security.txt expiry from the day of generation.
 */
export function buildContext(answers, lang, { markdown = false, today = answers.date } = {}) {
  const text = markdown ? escapeMarkdown : (value) => value;
  const sentence = (value) => text(withoutFinalPeriod(value));
  const pick = (localized) => localized[lang];
  const allowedCount = Number(Boolean(answers.publicPaths)) + Number(Boolean(answers.guestRoom));
  return {
    date: answers.date,
    contact: answers.contact,
    owner: text(answers.owner),
    ownerAtEnd: sentence(answers.owner),
    activity: sentence(pick(answers.activity)),
    responseTime: sentence(pick(answers.responseTime)),
    emergencyContact: answers.emergencyContact ? sentence(answers.emergencyContact) : '',
    publicPaths: answers.publicPaths ? sentence(answers.publicPaths) : '',
    guestRoom: Boolean(answers.guestRoom),
    guestRoomUrl: answers.guestRoom ? text(answers.guestRoom.url) : '',
    guestRoomQuota: answers.guestRoom ? sentence(pick(answers.guestRoom.quota)) : '',
    ...allowedFlags(allowedCount),
    atLeastList: answers.atLeastList,
    cooperation: Boolean(answers.cooperation),
    goals: answers.cooperation ? sentence(pick(answers.cooperation.goals)) : '',
    offer: answers.cooperation ? sentence(pick(answers.cooperation.offer)) : '',
    changes: describeChanges(answers, lang),
    projectUrl: PROJECT_URL,
    registryUrl: REGISTRY_URL,
    siteUrl: answers.siteUrl ?? '',
    securityContact: parseContact(answers.contact).uri,
    expires: securityExpires(today),
    preferredLanguages: answers.languages.join(', '),
  };
}

export function referenceContext(lang) {
  return {
    ...LABELS[lang],
    ownerAtEnd: LABELS[lang].owner,
    guestRoom: true,
    ...allowedFlags(2),
    atLeastList: true,
    cooperation: true,
    projectUrl: PROJECT_URL,
    registryUrl: REGISTRY_URL,
    ...REFERENCE_SNIPPET_VALUES,
  };
}
