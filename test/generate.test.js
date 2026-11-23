import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeAnswers } from '../src/answers.js';
import { checkSign } from '../src/check.js';
import { securityExpires } from '../src/context.js';
import { localizedName, planFiles } from '../src/generate.js';
import { fullAnswers, minimalAnswers } from './helpers/fixtures.js';

function sign(raw, lang = 'en') {
  const answers = normalizeAnswers(raw);
  const files = planFiles(answers);
  const path = lang === answers.languages[0] ? 'NOT_A_DRILL.md' : `NOT_A_DRILL.${lang}.md`;
  const file = files.find((f) => f.path === path);
  assert.ok(file, `no ${path} in ${files.map((f) => f.path).join(', ')}`);
  return file.content;
}

function changesLine(text) {
  return text.split('\n').find((l) => l.includes('Changes from the template') || l.includes('Changements par rapport au modèle'));
}

test('a sign with every option fills every field and lists no change', () => {
  for (const lang of ['en', 'fr']) {
    const text = sign(fullAnswers(), lang);
    assert.deepEqual(checkSign(text), [], lang);
    for (const value of ['ACME Cooperative', 'security@acme-cooperative.org', '+33 1 23 45 67 89', 'https://guest.acme-cooperative.org/api', '2026-11-23']) {
      assert.ok(text.includes(value), `${lang}: ${value}`);
    }
    assert.match(changesLine(text), lang === 'en' ? /Changes from the template: none\.$/ : /modèle : aucun\.$/);
  }
  assert.match(sign(fullAnswers(), 'en'), /Two things are allowed, and nothing else\./);
  assert.match(sign(fullAnswers(), 'fr'), /Deux choses sont autorisées, et rien d'autre\./);
});

// Each optional part: how to switch it off, what disappears in each language,
// and how the "Changes" line names it.
const OPTIONS = [
  {
    name: 'public reading',
    off: (a) => delete a.publicPaths,
    gone: { en: '**Reading what is public**', fr: '**Lire ce qui est public**' },
    change: { en: 'public reading', fr: 'de la lecture publique' },
  },
  {
    name: 'guest room',
    off: (a) => delete a.guestRoom,
    gone: { en: 'The guest room opens', fr: "La chambre d'amis s'ouvre" },
    change: { en: 'the guest room', fr: "de la chambre d'amis" },
  },
  {
    name: 'emergency contact',
    off: (a) => delete a.emergencyContact,
    gone: { en: 'For an emergency', fr: 'Pour une urgence' },
    change: { en: 'the emergency contact', fr: "du contact d'urgence" },
  },
  {
    name: '"at least" list',
    off: (a) => (a.atLeastList = false),
    gone: { en: 'Do not touch personal data or secrets.', fr: 'Ne touche ni aux données personnelles ni aux secrets.' },
    change: { en: 'the "at least" list', fr: 'de la liste « au moins »' },
  },
  {
    name: 'cooperation',
    off: (a) => delete a.cooperation,
    gone: { en: '## Cooperation', fr: '## Coopération' },
    change: { en: 'the cooperation section', fr: 'de la section Coopération' },
  },
];

for (const option of OPTIONS) {
  test(`leaving out the ${option.name} removes it and says so`, () => {
    const raw = fullAnswers();
    option.off(raw);
    for (const lang of ['en', 'fr']) {
      const full = sign(fullAnswers(), lang);
      const text = sign(raw, lang);
      assert.ok(full.includes(option.gone[lang]), `${lang}: the full sign has "${option.gone[lang]}"`);
      assert.ok(!text.includes(option.gone[lang]), `${lang}: "${option.gone[lang]}" should be gone`);
      assert.ok(changesLine(text).includes(option.change[lang]), `${lang}: ${changesLine(text)}`);
      assert.deepEqual(checkSign(text), [], lang);
    }
  });
}

test('the allowed section counts what is offered', () => {
  const guestOnly = fullAnswers();
  delete guestOnly.publicPaths;
  const publicOnly = fullAnswers();
  delete publicOnly.guestRoom;
  const nothing = fullAnswers();
  delete nothing.publicPaths;
  delete nothing.guestRoom;
  assert.match(sign(guestOnly), /One thing is allowed, and nothing else\.\n\n- \*\*Using the guest room\*\*/);
  assert.match(sign(publicOnly), /One thing is allowed, and nothing else\.\n\n- \*\*Reading what is public\*\*: https:\/\/acme-cooperative\.org and \/srv\/public\.\n\nEverything else remains off limits\./);
  assert.match(sign(nothing), /## What is allowed\n\nNothing is allowed here\.\n\nThis text authorizes nothing, and something tolerated in the past is not permission\.\n\n## If you came in uninvited/);
  assert.match(sign(nothing, 'fr'), /## Ce qui est autorisé\n\nRien n'est autorisé ici\.\n\nCe texte n'autorise rien, et une tolérance passée ne vaut pas permission\.\n\n## Si tu es entré/);
  assert.match(sign(publicOnly, 'fr'), /Une seule chose est autorisée, et rien d'autre\./);
});

test('the changes line joins several items', () => {
  const raw = fullAnswers();
  delete raw.guestRoom;
  delete raw.cooperation;
  assert.match(changesLine(sign(raw)), /removed the guest room and the cooperation section\.$/);
  assert.match(changesLine(sign(raw, 'fr')), /suppression de la chambre d'amis et de la section Coopération\.$/);
  delete raw.emergencyContact;
  assert.match(changesLine(sign(raw)), /removed the guest room, the emergency contact, and the cooperation section\.$/);
  assert.match(changesLine(sign(raw, 'fr')), /suppression de la chambre d'amis, du contact d'urgence et de la section Coopération\.$/);
});

test('every combination of options gives well-formed Markdown', () => {
  for (let mask = 0; mask < 2 ** OPTIONS.length; mask++) {
    const raw = fullAnswers();
    OPTIONS.forEach((option, i) => mask & (1 << i) && option.off(raw));
    for (const lang of ['en', 'fr']) {
      const text = sign(raw, lang);
      const where = `${lang}, options off: ${OPTIONS.filter((_, i) => mask & (1 << i)).map((o) => o.name).join(', ') || 'none'}`;
      assert.ok(!text.includes('\n\n\n'), `blank lines pile up (${where})`);
      assert.ok(text.endsWith('.\n') && !text.endsWith('\n\n'), `ending (${where})`);
      for (const match of text.matchAll(/\n## /g)) assert.equal(text[match.index - 1], '\n', `heading not preceded by a blank line (${where})`);
      assert.ok(!text.includes('{{') && !text.includes('}}'), `template tag left (${where})`);
      assert.deepEqual(checkSign(text), [], where);
    }
  }
});

test('the main language is NOT_A_DRILL.md, the other one is suffixed', () => {
  const raw = fullAnswers();
  raw.languages = ['fr', 'en'];
  const paths = planFiles(normalizeAnswers(raw)).map((f) => f.path);
  assert.deepEqual(paths.slice(0, 2), ['NOT_A_DRILL.md', 'NOT_A_DRILL.en.md']);
  assert.match(planFiles(normalizeAnswers(raw))[0].content, /^# NOT A DRILL — ceci n'est pas un exercice/);
});

test('snippets follow the main language, website snippets need a site URL', () => {
  const withSite = planFiles(normalizeAnswers(fullAnswers()));
  const security = withSite.find((f) => f.path === 'not-a-drill-snippets/security.snippet.txt').content;
  assert.equal(
    security,
    '# AI agents: read https://acme-cooperative.org/NOT_A_DRILL.md\nContact: mailto:security@acme-cooperative.org\nExpires: 2027-11-22T00:00:00.000Z\nPreferred-Languages: en, fr\n',
  );
  assert.ok(withSite.some((f) => f.path === 'not-a-drill-snippets/llms.snippet.txt'));

  const noSite = planFiles(normalizeAnswers(minimalAnswers())).map((f) => f.path);
  assert.deepEqual(noSite, [
    'NOT_A_DRILL.md',
    'not-a-drill-snippets/motd.txt',
    'not-a-drill-snippets/config-header.txt',
    'not-a-drill-snippets/AGENTS.snippet.md',
  ]);

  const fr = fullAnswers();
  fr.languages = ['fr'];
  for (const key of ['activity', 'responseTime']) fr[key] = fr[key].fr;
  fr.guestRoom.quota = fr.guestRoom.quota.fr;
  fr.cooperation = { goals: 'audits', offer: 'hébergement' };
  const motd = planFiles(normalizeAnswers(fr)).find((f) => f.path === 'not-a-drill-snippets/motd.txt').content;
  assert.match(motd, /^NOT A DRILL — CECI N'EST PAS UN EXERCICE\. Ce système est réel\. Il appartient à ACME Cooperative\./);

  const none = minimalAnswers();
  none.snippets = false;
  assert.deepEqual(planFiles(normalizeAnswers(none)).map((f) => f.path), ['NOT_A_DRILL.md']);
});

test('a URL contact goes to security.txt as is', () => {
  const raw = fullAnswers();
  raw.contact = 'https://acme-cooperative.org/contact';
  const security = planFiles(normalizeAnswers(raw)).find((f) => f.path.endsWith('security.snippet.txt')).content;
  assert.match(security, /^Contact: https:\/\/acme-cooperative\.org\/contact$/m);
});

test('security.txt expires less than a year after the date', () => {
  assert.equal(securityExpires('2026-11-23'), '2027-11-22T00:00:00.000Z');
  assert.equal(securityExpires('2028-01-01'), '2028-12-30T00:00:00.000Z');
});

test('localizedName inserts the language before the extension', () => {
  assert.equal(localizedName('NOT_A_DRILL.md', 'fr'), 'NOT_A_DRILL.fr.md');
  assert.equal(localizedName('AGENTS.snippet.md', 'fr'), 'AGENTS.snippet.fr.md');
});

test('Markdown files show the owner\'s texts as typed; plain-text snippets get them raw', () => {
  const raw = fullAnswers();
  raw.owner = 'ACME *Coop*';
  raw.publicPaths = '/srv/public/*, /home/<user>/public_html';
  const files = planFiles(normalizeAnswers(raw));
  const sign = files.find((f) => f.path === 'NOT_A_DRILL.md').content;
  assert.match(sign, /It belongs to ACME \\\*Coop\\\*, who depend/);
  assert.match(sign, /\*\*Reading what is public\*\*: \/srv\/public\/\\\*, \/home\/\\<user>\/public_html\./);
  assert.match(files.find((f) => f.path.endsWith('AGENTS.snippet.md')).content, /belongs to ACME \\\*Coop\\\*\./);
  assert.match(files.find((f) => f.path.endsWith('motd.txt')).content, /It belongs to ACME \*Coop\*\./);
});

test('a value that ends with a period does not double it', () => {
  const raw = fullAnswers();
  raw.cooperation.offer = { en: 'compute, hosting, etc.', fr: 'calcul, hébergement, etc.' };
  raw.responseTime = { en: '2 days.', fr: '2 jours.' };
  const answers = normalizeAnswers(raw);
  assert.match(sign(raw), /\*\*What I can offer\*\*: compute, hosting, etc\.\n/);
  assert.match(sign(raw), /answers within 2 days\. For an emergency/);
  assert.match(sign(raw, 'fr'), /répond sous 2 jours\. Pour une urgence/);
  assert.equal(answers.responseTime.en, '2 days.', 'the saved answers keep what was typed');
});

test('security.txt expires a year after the day of generation, not after the sign date', () => {
  const raw = fullAnswers();
  raw.date = '2025-06-01';
  const files = planFiles(normalizeAnswers(raw), { today: '2026-11-23' });
  assert.match(files.find((f) => f.path.endsWith('security.snippet.txt')).content, /^Expires: 2027-11-22T00:00:00\.000Z$/m);
});

test('llms.txt links put the colon right after the link, as the llms.txt format reads it', () => {
  for (const lang of ['en', 'fr']) {
    const raw = fullAnswers();
    raw.languages = [lang, lang === 'en' ? 'fr' : 'en'];
    const llms = planFiles(normalizeAnswers(raw)).find((f) => f.path.endsWith('llms.snippet.txt')).content;
    assert.match(llms, /^- \[[^\]]+\]\([^)]+\): \S/m, lang);
  }
});

test('an owner name that ends with a period keeps it once, wherever it falls', () => {
  const raw = fullAnswers();
  raw.owner = 'ACME Inc.';
  const files = planFiles(normalizeAnswers(raw));
  assert.match(files.find((f) => f.path === 'NOT_A_DRILL.md').content, /It belongs to ACME Inc\., who depend/);
  for (const name of ['motd.txt', 'config-header.txt', 'AGENTS.snippet.md']) {
    const text = files.find((f) => f.path.endsWith(name)).content;
    assert.match(text, /ACME Inc\.(?!\.)/, name);
    assert.doesNotMatch(text, /Inc\.\./, name);
  }
});
