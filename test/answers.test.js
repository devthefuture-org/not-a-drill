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
  assert.equal(normalizeAnswers({ ...minimalAnswers(), contact: 'mailto:sec@acme.test' }).contact, 'sec@acme.test');
  assert.equal(normalizeAnswers({ ...minimalAnswers(), contact: 'https://acme.test/contact' }).contact, 'https://acme.test/contact');
  assert.deepEqual(problemsOf({ ...minimalAnswers(), contact: 'call us' }).map((p) => p.path), ['contact']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), contact: 'ftp://acme.test' }).map((p) => p.path), ['contact']);
  assert.equal(parseContact('nobody'), null);
});

test('dates must exist', () => {
  assert.deepEqual(problemsOf({ ...minimalAnswers(), date: '2026-02-30' }).map((p) => p.path), ['date']);
  assert.deepEqual(problemsOf({ ...minimalAnswers(), date: '23/11/2026' }).map((p) => p.path), ['date']);
  assert.equal(normalizeAnswers({ ...minimalAnswers(), date: '2028-02-29' }).date, '2028-02-29');
});

test('the site URL loses its trailing slash', () => {
  assert.equal(normalizeAnswers({ ...minimalAnswers(), siteUrl: 'https://acme.test/' }).siteUrl, 'https://acme.test');
  assert.deepEqual(problemsOf({ ...minimalAnswers(), siteUrl: 'acme.test' }).map((p) => p.path), ['siteUrl']);
});

test('optional sections can be null, false or absent', () => {
  for (const value of [null, false, undefined]) {
    const answers = normalizeAnswers({ ...minimalAnswers(), guestRoom: value, cooperation: value });
    assert.equal(answers.guestRoom, null);
    assert.equal(answers.cooperation, null);
  }
});
