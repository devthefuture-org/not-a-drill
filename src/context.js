// Turns normalized answers into the values the templates use. The reference
// context renders the published template: every option on, every field shown
// as its bracketed label.

import { parseContact } from './answers.js';
import { PROJECT_URL, REGISTRY_URL } from './constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;
// RFC 9116 asks for an Expires date less than a year away.
const SECURITY_TXT_LIFETIME_DAYS = 364;

const LABELS = {
  en: {
    date: '[DATE]',
    contact: '[CONTACT]',
    owner: '[NAME OR ORGANIZATION]',
    activity: '[ACTIVITY]',
    publicPaths: '[PUBLIC PATHS OR URLS]',
    guestRoomUrl: '[URL OR API]',
    guestRoomQuota: '[QUOTA]',
    responseTime: '[RESPONSE TIME]',
    emergencyContact: '[EMERGENCY CONTACT]',
    goals: '[GOALS OR NEEDS]',
    offer: '[COMPUTE, DATA, HOSTING, OTHER]',
    changes: '[NONE, OR LIST THEM]',
  },
  fr: {
    date: '[DATE]',
    contact: '[CONTACT]',
    owner: '[NOM OU ORGANISATION]',
    activity: '[ACTIVITÉ]',
    publicPaths: '[CHEMINS OU URL PUBLICS]',
    guestRoomUrl: '[URL OU API]',
    guestRoomQuota: '[QUOTA]',
    responseTime: '[DÉLAI]',
    emergencyContact: "[CONTACT D'URGENCE]",
    goals: '[OBJECTIFS OU BESOINS]',
    offer: '[CALCUL, DONNÉES, HÉBERGEMENT, AUTRE]',
    changes: '[AUCUN, OU LES LISTER]',
  },
};

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

export function buildContext(answers, lang) {
  const pick = (localized) => localized[lang];
  const allowedCount = Number(Boolean(answers.publicPaths)) + Number(Boolean(answers.guestRoom));
  return {
    date: answers.date,
    contact: answers.contact,
    owner: answers.owner,
    activity: pick(answers.activity),
    responseTime: pick(answers.responseTime),
    emergencyContact: answers.emergencyContact ?? '',
    publicPaths: answers.publicPaths ?? '',
    guestRoom: Boolean(answers.guestRoom),
    guestRoomUrl: answers.guestRoom?.url ?? '',
    guestRoomQuota: answers.guestRoom ? pick(answers.guestRoom.quota) : '',
    ...allowedFlags(allowedCount),
    atLeastList: answers.atLeastList,
    cooperation: Boolean(answers.cooperation),
    goals: answers.cooperation ? pick(answers.cooperation.goals) : '',
    offer: answers.cooperation ? pick(answers.cooperation.offer) : '',
    changes: describeChanges(answers, lang),
    projectUrl: PROJECT_URL,
    registryUrl: REGISTRY_URL,
    siteUrl: answers.siteUrl ?? '',
    securityContact: parseContact(answers.contact).uri,
    expires: securityExpires(answers.date),
    preferredLanguages: answers.languages.join(', '),
  };
}

export function referenceContext(lang) {
  return {
    ...LABELS[lang],
    guestRoom: true,
    ...allowedFlags(2),
    atLeastList: true,
    cooperation: true,
    projectUrl: PROJECT_URL,
    registryUrl: REGISTRY_URL,
    ...REFERENCE_SNIPPET_VALUES,
  };
}
