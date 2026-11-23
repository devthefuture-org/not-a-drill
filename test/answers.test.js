import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AnswersError, NotARealSystemError, normalizeAnswers, parseContact } from '../src/answers.js';
import { fullAnswers, minimalAnswers } from './helpers/fixtures.js';

function problemsOf(raw) {
  try {
    normalizeAnswers(raw, { today: '2026-11-23' });
  } catch (error) {
    if (error instanceof AnswersError) return error.problems;
    throw error;
  }
  assert.fail('the answers were accepted');
}

test('minimal answers get the documented defaults', () => {
  const answers = normalizeAnswers(minimalAnswers(), { today: '2026-11-23' });
  assert.deepEqual(answers.languages, ['en']);
  assert.equal(answers.date, '2026-11-23');
  assert.equal(answers.atLeastList, true);
  assert.equal(answers.snippets, true);
  assert.deepEqual(answers.activity, { en: 'running its shop' });
  assert.equal(answers.guestRoom, null);
  assert.equal(answers.cooperation, null);
});

test('saved answers load back to the same answers', () => {
  const once = normalizeAnswers(fullAnswers());
  const twice = normalizeAnswers(JSON.parse(JSON.stringify(once)));
  assert.deepEqual(twice, once);
});

test('every missing required answer is reported at once', () => {
  const missing = problemsOf({}).filter((p) => p.missing).map((p) => p.path);
  assert.deepEqual(missing.sort(), ['activity', 'contact', 'owner', 'realSystem', 'responseTime']);
});

test('realSystem false is a refusal, not a validation problem', () => {
  assert.throws(() => normalizeAnswers({ ...minimalAnswers(), realSystem: false }), NotARealSystemError);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), realSystem: 'yes' }).map((p) => p.path), ['realSystem']);
});

test('unknown keys and wrong types are refused', () => {
  assert.deepEqual(problemsOf({ ...minimalAnswers(), colour: 'red' }).map((p) => p.path), ['colour']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), owner: 42 }).map((p) => p.path), ['owner']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), atLeastList: 'no' }).map((p) => p.path), ['atLeastList']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), guestRoom: { url: 'x', quota: 'y', size: 3 } }).map((p) => p.path), ['guestRoom.size']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), languages: ['en', 'en'] }).map((p) => p.path), ['languages']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), languages: ['de'] }).map((p) => p.path), ['languages']);
  assert.deepEqual(problemsOf([]).map((p) => p.path), ['(root)']);
});

test('a value must fit on one line', () => {
  assert.deepEqual(problemsOf({ ...minimalAnswers(), owner: 'ACME\n## Injected' }).map((p) => p.path), ['owner']);
});

test('texts follow the languages of the sign', () => {
  const two = { ...minimalAnswers(), languages: ['en', 'fr'] };
  assert.deepEqual(problemsOf(two).map((p) => p.path).sort(), ['activity', 'responseTime']);
  assert.deepEqual(
    problemsOf({ ...two, activity: { en: 'a' }, responseTime: { en: 'b', fr: 'c', de: 'd' } }).map((p) => p.path).sort(),
    ['activity.fr', 'responseTime.de'],
  );
});

test('the contact is an email address or an http(s) URL', () => {
  assert.equal(normalizeAnswers({ ...minimalAnswers(), contact: 'mailto:sec@acme-cooperative.org' }).contact, 'sec@acme-cooperative.org');
  assert.equal(normalizeAnswers({ ...minimalAnswers(), contact: 'https://acme-cooperative.org/contact' }).contact, 'https://acme-cooperative.org/contact');
  assert.deepEqual(problemsOf({ ...minimalAnswers(), contact: 'call us' }).map((p) => p.path), ['contact']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), contact: 'ftp://acme-cooperative.org' }).map((p) => p.path), ['contact']);
  assert.equal(parseContact('nobody'), null);
});

test('dates must exist', () => {
  assert.deepEqual(problemsOf({ ...minimalAnswers(), date: '2026-02-30' }).map((p) => p.path), ['date']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), date: '23/11/2026' }).map((p) => p.path), ['date']);
  assert.equal(normalizeAnswers({ ...minimalAnswers(), date: '2028-02-29' }).date, '2028-02-29');
});

test('the site URL loses its trailing slash', () => {
  assert.equal(normalizeAnswers({ ...minimalAnswers(), siteUrl: 'https://acme-cooperative.org/' }).siteUrl, 'https://acme-cooperative.org');
  assert.deepEqual(problemsOf({ ...minimalAnswers(), siteUrl: 'acme-cooperative.org' }).map((p) => p.path), ['siteUrl']);
});

test('optional sections can be null, false or absent', () => {
  for (const value of [null, false, undefined]) {
    const answers = normalizeAnswers({ ...minimalAnswers(), guestRoom: value, cooperation: value });
    assert.equal(answers.guestRoom, null);
    assert.equal(answers.cooperation, null);
  }
});

test('values are plain text: control, separator and bidirectional characters are refused', () => {
  for (const owner of ['ACME\u001b[8m hidden\u001b[28m', 'ACME\u2028admin: true', 'ACME\u202eevil', 'ACME\tCoop']) {
    assert.deepEqual(problemsOf({ ...minimalAnswers(), owner }).map((p) => p.path), ['owner'], JSON.stringify(owner));
  }
});

test('a value that looks like a template field is refused with its name', () => {
  const [problem] = problemsOf({ ...minimalAnswers(), owner: 'ACME [EU]' });
  assert.equal(problem.path, 'owner');
  assert.match(problem.message, /\[EU\]/);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), activity: 'running \\[ACTIVITY\\]' }).map((p) => p.path), ['activity']);
});

test('the contact must be real: https only, no reserved or single-label names', () => {
  const contactProblem = (contact) => problemsOf({ ...minimalAnswers(), contact })[0]?.message ?? null;
  assert.match(contactProblem('http://acme-cooperative.org/security'), /https/);
  for (const contact of ['security@example.com', 'sec@acme.example', 'sec@acme.test', 'https://example.org/c', 'https://intranet/contact']) {
    assert.match(contactProblem(contact), /reserved for examples or tests/, contact);
  }
  for (const contact of ['admin@localhost', 'sec*ops@acme-cooperative.org', 'sec?team@acme-cooperative.org', 'sécurité@acme-cooperative.org']) {
    assert.match(contactProblem(contact), /email address or an https URL/, contact);
  }
});

test('a URL with an @ stays a URL, and MAILTO: is dropped whatever its case', () => {
  assert.equal(parseContact('https://forum.acme-cooperative.org/@security.team').uri, 'https://forum.acme-cooperative.org/@security.team');
  assert.equal(normalizeAnswers({ ...minimalAnswers(), contact: 'MAILTO:sec@acme-cooperative.org' }).contact, 'sec@acme-cooperative.org');
});

test('the site URL has no query, no fragment and a real name', () => {
  for (const siteUrl of ['https://acme-cooperative.org/?lang=en', 'https://acme-cooperative.org/#top', 'https://www.example.com']) {
    assert.deepEqual(problemsOf({ ...minimalAnswers(), siteUrl }).map((p) => p.path), ['siteUrl'], siteUrl);
  }
});

test('false leaves an optional text out', () => {
  const answers = normalizeAnswers({ ...minimalAnswers(), emergencyContact: false, publicPaths: false, siteUrl: false });
  assert.equal(answers.emergencyContact, null);
  assert.equal(answers.publicPaths, null);
  assert.equal(answers.siteUrl, null);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), owner: false }).map((p) => p.path), ['owner']);
});

test('a contact URL or site URL that Markdown would alter is refused', () => {
  for (const contact of ['https://acme-cooperative.org/contact.', 'https://acme-cooperative.org/*team*', 'https://acme-cooperative.org/a`b']) {
    assert.deepEqual(problemsOf({ ...minimalAnswers(), contact }).map((p) => p.path), ['contact'], contact);
  }
  for (const siteUrl of ['https://acme-cooperative.org/a(b)', 'https://acme-cooperative.org/*']) {
    assert.deepEqual(problemsOf({ ...minimalAnswers(), siteUrl }).map((p) => p.path), ['siteUrl'], siteUrl);
  }
});
