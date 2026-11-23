// Line-based prompts on any pair of streams. Lines are queued as they
// arrive, so input written ahead of the questions (a pipe, a test) is never
// lost. Closing the input or Ctrl-C cancels the session.

import { createInterface } from 'node:readline';

export class CancelledError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'CancelledError';
  }
}

export function createStyle(stream, env = process.env) {
  const enabled = Boolean(stream.isTTY) && !env.NO_COLOR && env.TERM !== 'dumb';
  const wrap = (open, close) => (text) => (enabled ? `\u001b[${open}m${text}\u001b[${close}m` : text);
  return {
    bold: wrap(1, 22),
    dim: wrap(2, 22),
    red: wrap(31, 39),
    green: wrap(32, 39),
    yellow: wrap(33, 39),
    cyan: wrap(36, 39),
  };
}

const YES = ['y', 'yes', 'o', 'oui'];
const NO = ['n', 'no', 'non'];

export function createPrompter({ input, output, env = process.env, messages: initialMessages }) {
  let messages = initialMessages;
  const terminal = Boolean(input.isTTY && output.isTTY);
  const rl = createInterface({ input, output, terminal });
  const style = createStyle(output, env);
  const queue = [];
  const waiting = [];
  let closed = false;

  rl.on('line', (line) => {
    if (waiting.length > 0) waiting.shift().resolve(line);
    else queue.push(line);
  });
  rl.on('close', () => {
    closed = true;
    for (const waiter of waiting.splice(0)) waiter.reject(new CancelledError());
  });
  rl.on('SIGINT', () => rl.close());

  function nextLine(prompt) {
    // Once the input has closed, readline refuses to prompt; lines typed
    // ahead are still served from the queue.
    if (closed) {
      output.write(prompt);
    } else {
      rl.setPrompt(prompt);
      rl.prompt();
    }
    if (queue.length > 0) {
      const line = queue.shift();
      if (!terminal) output.write(`${line}\n`);
      return Promise.resolve(line);
    }
    if (closed) return Promise.reject(new CancelledError());
    return new Promise((resolve, reject) => {
      waiting.push({
        resolve: (line) => {
          if (!terminal) output.write(`${line}\n`);
          resolve(line);
        },
        reject,
      });
    });
  }

  function say(text = '') {
    output.write(`${text}\n`);
  }

  function header(label, hint) {
    say();
    say(style.bold(label));
    if (hint) for (const line of hint.split('\n')) say(style.dim(`  ${line}`));
  }

  /**
   * Asks for one line of text. `validate` returns an error message or null.
   * An empty answer takes `fallback` when there is one, is accepted as null
   * when `optional`, and is refused otherwise.
   */
  async function text(label, { hint, fallback, optional = false, validate } = {}) {
    header(label, hint);
    for (;;) {
      const suffix = fallback ? style.dim(`(${fallback}) `) : optional ? style.dim(`(${messages.optional}) `) : '';
      const answer = (await nextLine(`${style.cyan('›')} ${suffix}`)).trim();
      if (answer === '') {
        if (fallback) return fallback;
        if (optional) return null;
        say(style.yellow(`  ${messages.required}`));
        continue;
      }
      const problem = validate ? validate(answer) : null;
      if (problem) {
        say(style.yellow(`  ${problem}`));
        continue;
      }
      return answer;
    }
  }

  /** Asks a yes/no question. Without a fallback, an empty answer is refused. */
  async function confirm(label, { hint, fallback } = {}) {
    header(label, hint);
    const choices = fallback === true ? messages.yesNoDefaultYes : fallback === false ? messages.yesNoDefaultNo : messages.yesNo;
    for (;;) {
      const answer = (await nextLine(`${style.cyan('›')} ${style.dim(choices)} `)).trim().toLowerCase();
      if (answer === '' && fallback !== undefined) return fallback;
      if (YES.includes(answer)) return true;
      if (NO.includes(answer)) return false;
      say(style.yellow(`  ${messages.answerYesNo}`));
    }
  }

  /** Asks to pick one value among `options`. */
  async function choose(label, options, { hint, fallback } = {}) {
    header(label, hint);
    for (;;) {
      const answer = (await nextLine(`${style.cyan('›')} ${style.dim(`${options.join('/')} (${fallback})`)} `)).trim().toLowerCase();
      if (answer === '') return fallback;
      if (options.includes(answer)) return answer;
      say(style.yellow(`  ${options.join(' / ')}`));
    }
  }

  return {
    text,
    confirm,
    choose,
    say,
    style,
    setMessages: (next) => {
      messages = next;
    },
    close: () => rl.close(),
  };
}
