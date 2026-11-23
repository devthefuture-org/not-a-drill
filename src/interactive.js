// The interactive question session. It returns raw answers in the same shape
// as an answers file, so both go through the same validation.

import { contactProblem, isValidDate, lineProblem, siteUrlProblem } from './values.js';
import { LANGUAGES } from './constants.js';
import { MESSAGES } from './i18n.js';

/**
 * Runs the questions. Returns `{ refused: true, lang }` when the owner says
 * the system is not real, `{ answers, lang }` otherwise.
 */
export async function askAnswers(prompter, { today }) {
  const lang = await prompter.choose('Language of your sign / Langue de ton panneau', LANGUAGES, { fallback: 'en' });
  const m = MESSAGES[lang];
  prompter.setMessages(m);

  // Every answer goes into the sign: one plain line, and nothing that looks like a template field.
  const plain = (value) => {
    const problem = lineProblem(value);
    if (problem?.code === 'control') return m.notPlainText;
    if (problem?.code === 'placeholder') return m.placeholderInValue(problem.label);
    return null;
  };
  const ask = (label, options = {}) =>
    prompter.text(label, { ...options, validate: (v) => plain(v) ?? (options.validate ? options.validate(v) : null) });
  prompter.say();
  for (const line of m.intro) prompter.say(prompter.style.dim(line));

  const other = LANGUAGES.find((l) => l !== lang);
  const both = await prompter.confirm(m.alsoOther(other), { hint: m.alsoOtherHint(lang, other), fallback: false });
  const languages = both ? [lang, other] : [lang];

  const real = await prompter.confirm(m.realSystem, { hint: m.realSystemHint });
  if (!real) return { refused: true, lang };

  // A text that depends on the language: asked once per language of the sign.
  const localized = async (label, options = {}) => {
    const result = {};
    for (const l of languages) {
      const fallback = typeof options.fallback === 'function' ? options.fallback(l) : options.fallback;
      result[l] = await ask(languages.length > 1 ? `${label}${m.inLanguage(l)}` : label, { ...options, fallback });
    }
    return result;
  };

  const answers = { realSystem: true, languages };
  answers.owner = await ask(m.owner, { hint: m.ownerHint });
  answers.activity = await localized(m.activity, { hint: m.activityHint });
  answers.contact = await ask(m.contact, {
    hint: m.contactHint,
    validate: (v) => (contactProblem(v) ? m.contactProblems[contactProblem(v)] : null),
  });
  answers.responseTime = await localized(m.responseTime, {
    hint: m.responseTimeHint,
    fallback: (l) => MESSAGES[l].responseTimeDefault,
  });
  answers.emergencyContact = await ask(m.emergencyContact, { hint: m.emergencyContactHint, optional: true });
  answers.publicPaths = await ask(m.publicPaths, { hint: m.publicPathsHint, optional: true });

  if (await prompter.confirm(m.guestRoom, { hint: m.guestRoomHint, fallback: false })) {
    answers.guestRoom = {
      url: await ask(m.guestRoomUrl),
      quota: await localized(m.guestRoomQuota, { hint: m.guestRoomQuotaHint }),
    };
  }

  answers.atLeastList = await prompter.confirm(m.atLeastList, { hint: m.atLeastListHint, fallback: true });

  if (await prompter.confirm(m.cooperation, { hint: m.cooperationHint, fallback: false })) {
    answers.cooperation = {
      goals: await localized(m.goals, { hint: m.goalsHint }),
      offer: await localized(m.offer, { hint: m.offerHint }),
    };
  }

  answers.date = await ask(m.date, {
    hint: m.dateHint,
    fallback: today,
    validate: (v) => (isValidDate(v) ? null : m.dateInvalid),
  });
  answers.siteUrl = await ask(m.siteUrl, {
    hint: m.siteUrlHint,
    optional: true,
    validate: (v) => (siteUrlProblem(v) ? m.siteUrlProblems[siteUrlProblem(v)] : null),
  });
  answers.snippets = await prompter.confirm(m.snippets, { hint: m.snippetsHint, fallback: true });

  for (const key of Object.keys(answers)) if (answers[key] === null) delete answers[key];
  return { answers, lang };
}
