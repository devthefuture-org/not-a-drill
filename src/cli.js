// Command line: `not-a-drill [init]` writes a sign, `not-a-drill check`
// checks one. Exit codes: 0 done, 1 refused or problems found, 2 usage or
// invalid answers, 130 cancelled.

import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { AnswersError, NotARealSystemError, normalizeAnswers, todayIso } from './answers.js';
import { checkSign, isSignFileName } from './check.js';
import { ANSWERS_FILE, BENCH_URL, DOCS_URL } from './constants.js';
import { planFiles } from './generate.js';
import { MESSAGES } from './i18n.js';
import { askAnswers } from './interactive.js';
import { CancelledError, createPrompter, createStyle } from './prompter.js';

export const EXIT = { ok: 0, refused: 1, usage: 2, cancelled: 130 };

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const OPTIONS = {
  answers: { type: 'string', short: 'a' },
  out: { type: 'string', short: 'o' },
  'no-input': { type: 'boolean' },
  force: { type: 'boolean', short: 'f' },
  'save-answers': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
};

const HELP = `not-a-drill ${VERSION}: write a NOT_A_DRILL.md, the sign that tells AI agents this system is real.

Usage
  npx not-a-drill [init] [options]     answer the questions, write the sign
  npx not-a-drill check [files...]     check signs (default: ./NOT_A_DRILL*.md)

Options
  -a, --answers <file>       read the answers from a JSON file instead of asking
      --no-input             never ask anything (automatic when stdin is not a terminal)
  -o, --out <dir>            where to write the sign (default: current directory)
  -f, --force                overwrite existing files
      --save-answers <file>  also save the answers, to regenerate the sign later
  -h, --help                 show this help
  -v, --version              show the version

Exit codes
  0 done, 1 refused or problems found, 2 usage error or invalid answers, 130 cancelled

Answers file and guide: ${DOCS_URL}cli`;

function readAnswersFile(path) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    throw new UsageError(`cannot read the answers file ${path}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new UsageError(`the answers file ${path} is not valid JSON: ${error.message}`);
  }
}

class UsageError extends Error {
  name = 'UsageError';
}

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function printAnswersProblems(error, stderr) {
  stderr.write('Invalid answers:\n');
  for (const p of error.problems) stderr.write(`  ${p.path}: ${p.message}\n`);
  const missing = error.problems.filter((p) => p.missing).map((p) => p.path);
  if (missing.length > 0) stderr.write(`Missing: ${missing.join(', ')}\n`);
  stderr.write(`Format of the answers: ${DOCS_URL}cli#answers-file\n`);
}

async function runInit(values, io) {
  const { stdin, stdout, stderr, cwd } = io;
  const today = todayIso(io.now ?? new Date());
  const interactive = !values['no-input'] && Boolean(stdin.isTTY) && values.answers === undefined;
  const canConfirm = !values['no-input'] && Boolean(stdin.isTTY);
  const outDir = resolve(cwd, values.out ?? '.');

  let prompter = null;
  let raw;
  let lang = 'en';
  try {
    if (values.answers !== undefined) {
      raw = readAnswersFile(resolve(cwd, values.answers));
    } else if (!interactive) {
      throw new UsageError('no answers: run in a terminal to answer the questions, or pass --answers <file>');
    }
    if (canConfirm) prompter = createPrompter({ input: stdin, output: stdout, env: io.env, messages: MESSAGES.en });
    if (interactive) {
      const session = await askAnswers(prompter, { today });
      lang = session.lang;
      if (session.refused) {
        prompter.say();
        for (const line of MESSAGES[lang].refused) prompter.say(line);
        return EXIT.refused;
      }
      raw = session.answers;
    }

    let answers;
    try {
      answers = normalizeAnswers(raw, { today });
    } catch (error) {
      if (error instanceof NotARealSystemError) {
        stderr.write(`Refused: ${error.message}.\nThe single exception is a closed bench of your own: ${BENCH_URL}\n`);
        return EXIT.refused;
      }
      if (error instanceof AnswersError) {
        printAnswersProblems(error, stderr);
        return EXIT.usage;
      }
      throw error;
    }
    if (!interactive) lang = answers.languages[0];
    const m = MESSAGES[lang];

    const files = planFiles(answers).map((file) => ({ ...file, target: resolve(outDir, file.path) }));
    for (const file of files) {
      if (!file.path.endsWith('.md') || !file.path.startsWith('NOT_A_DRILL')) continue;
      const findings = checkSign(file.content);
      if (findings.length > 0) {
        stderr.write(`The generated ${file.path} does not pass the check, nothing was written:\n`);
        for (const f of findings) stderr.write(`  ${f.line ? `line ${f.line}: ` : ''}${f.message}\n`);
        return EXIT.usage;
      }
    }

    let saveAnswersTo = values['save-answers'] === undefined ? null : resolve(cwd, values['save-answers']);
    if (interactive) {
      prompter.say();
      prompter.say(prompter.style.bold(m.filesToWrite(outDir)));
      for (const file of files) prompter.say(`  ${file.path}${pathExists(file.target) ? prompter.style.yellow(` (${m.exists})`) : ''}`);
      if (!(await prompter.confirm(m.writeNow, { fallback: true }))) {
        prompter.say(m.notWritten);
        return EXIT.refused;
      }
      if (saveAnswersTo === null) {
        const candidate = resolve(cwd, ANSWERS_FILE);
        if (await prompter.confirm(m.saveAnswers(relative(cwd, candidate)), { fallback: false })) saveAnswersTo = candidate;
      }
    }

    const writes = files.map((file) => ({ target: file.target, content: file.content }));
    if (saveAnswersTo !== null) writes.push({ target: saveAnswersTo, content: `${JSON.stringify(answers, null, 2)}\n` });

    // Every target is checked before anything is written: a refusal leaves no half-written sign.
    const existing = writes.filter((w) => pathExists(w.target));
    let overwrite = Boolean(values.force);
    if (existing.length > 0 && !overwrite) {
      if (prompter) {
        prompter.say();
        for (const w of existing) prompter.say(`  ${w.target}`);
        overwrite = await prompter.confirm(m.overwrite, { fallback: false });
      }
      if (!overwrite) {
        if (prompter) prompter.say(m.notWritten);
        else stderr.write(`These files already exist; pass --force to overwrite them. Nothing was written.\n${existing.map((w) => `  ${w.target}\n`).join('')}`);
        return EXIT.refused;
      }
    }

    for (const w of writes) {
      mkdirSync(dirname(w.target), { recursive: true });
      writeFileSync(w.target, w.content, { flag: overwrite ? 'w' : 'wx' });
    }

    const style = createStyle(stdout, io.env);
    stdout.write(`\n${style.green(m.written)}\n`);
    for (const w of writes) stdout.write(`  ${w.target}\n`);
    stdout.write('\n');
    for (const line of m.nextSteps) stdout.write(`${line}\n`);
    return EXIT.ok;
  } catch (error) {
    if (error instanceof CancelledError) {
      stderr.write(`\n${MESSAGES[lang].cancelled}\n`);
      return EXIT.cancelled;
    }
    throw error;
  } finally {
    prompter?.close();
  }
}

function runCheck(paths, io) {
  const { stdout, stderr, cwd } = io;
  let files = paths.map((p) => resolve(cwd, p));
  if (files.length === 0) {
    files = readdirSync(cwd).filter(isSignFileName).sort().map((name) => resolve(cwd, name));
    if (files.length === 0) {
      stderr.write(`No NOT_A_DRILL*.md in ${cwd}. Name the files to check: not-a-drill check <file>...\n`);
      return EXIT.refused;
    }
  }
  const style = createStyle(stdout, io.env);
  let failed = false;
  for (const file of files) {
    const label = relative(cwd, file) || file;
    if (!existsSync(file)) {
      stderr.write(`${label}: no such file\n`);
      failed = true;
      continue;
    }
    const findings = checkSign(readFileSync(file, 'utf8'));
    if (findings.length === 0) {
      stdout.write(`${label}: ${style.green('ok')}\n`);
      continue;
    }
    failed = true;
    stdout.write(`${label}: ${style.red(`${findings.length} problem${findings.length > 1 ? 's' : ''}`)}\n`);
    for (const f of findings) stdout.write(`  ${f.line ? `line ${f.line}: ` : ''}${f.message}\n`);
  }
  return failed ? EXIT.refused : EXIT.ok;
}

export async function main(argv, io) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    io.stderr.write(`${error.message}\n\n${HELP}\n`);
    return EXIT.usage;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    io.stdout.write(`${HELP}\n`);
    return EXIT.ok;
  }
  if (values.version) {
    io.stdout.write(`${VERSION}\n`);
    return EXIT.ok;
  }
  const [command = 'init', ...rest] = positionals;
  try {
    if (command === 'check') return runCheck(rest, io);
    if (command !== 'init') throw new UsageError(`unknown command "${command}"`);
    if (rest.length > 0) throw new UsageError(`unexpected argument "${rest[0]}"`);
    return await runInit(values, io);
  } catch (error) {
    if (error instanceof UsageError) {
      io.stderr.write(`not-a-drill: ${error.message}\nRun "not-a-drill --help" for the usage.\n`);
      return EXIT.usage;
    }
    throw error;
  }
}
