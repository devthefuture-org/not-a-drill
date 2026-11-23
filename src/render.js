// Minimal template engine: `{{name}}` inserts a string, `{{#if name}}…{{/if}}`
// keeps its body when `name` is truthy. Blocks nest. A block tag alone on its
// line takes the whole line with it, so removing a block leaves no blank line.
// Every mistake is an error: an unknown tag, an unclosed or stray block, a
// missing or non-string value.

const STANDALONE_BLOCK_TAG = /^[ \t]*(\{\{(?:#if [A-Za-z]\w*|\/if)\}\})[ \t]*\n/gm;
const TAG = /\{\{(.*?)\}\}/g;
const IDENTIFIER = /^[A-Za-z]\w*$/;

export class TemplateError extends Error {
  constructor(message, source) {
    super(source ? `${source}: ${message}` : message);
    this.name = 'TemplateError';
  }
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

export function parse(template, source = '') {
  const text = template.replace(STANDALONE_BLOCK_TAG, '$1');
  const root = { type: 'root', children: [] };
  const stack = [root];
  let cursor = 0;
  for (const match of text.matchAll(TAG)) {
    const current = stack.at(-1);
    if (match.index > cursor) current.children.push({ type: 'text', value: text.slice(cursor, match.index) });
    cursor = match.index + match[0].length;
    const inner = match[1].trim();
    const line = lineAt(text, match.index);
    if (inner.startsWith('#if ')) {
      const name = inner.slice(4).trim();
      if (!IDENTIFIER.test(name)) throw new TemplateError(`invalid block name "${name}" (line ${line})`, source);
      const block = { type: 'if', name, line, children: [] };
      current.children.push(block);
      stack.push(block);
    } else if (inner === '/if') {
      if (stack.length === 1) throw new TemplateError(`{{/if}} without an open block (line ${line})`, source);
      stack.pop();
    } else if (IDENTIFIER.test(inner)) {
      current.children.push({ type: 'var', name: inner, line });
    } else {
      throw new TemplateError(`invalid tag "${match[0]}" (line ${line})`, source);
    }
  }
  if (stack.length > 1) {
    const open = stack.at(-1);
    throw new TemplateError(`{{#if ${open.name}}} opened on line ${open.line} is never closed`, source);
  }
  if (cursor < text.length) root.children.push({ type: 'text', value: text.slice(cursor) });
  return root;
}

function renderNodes(nodes, context, source) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      out += node.value;
    } else if (node.type === 'var') {
      const value = context[node.name];
      if (typeof value !== 'string') {
        throw new TemplateError(`"${node.name}" (line ${node.line}) needs a string value, got ${value === undefined ? 'nothing' : typeof value}`, source);
      }
      out += value;
    } else {
      if (!Object.hasOwn(context, node.name)) {
        throw new TemplateError(`block "${node.name}" (line ${node.line}) has no value in the context`, source);
      }
      if (context[node.name]) out += renderNodes(node.children, context, source);
    }
  }
  return out;
}

export function render(template, context, source = '') {
  return renderNodes(parse(template, source).children, context, source);
}

/** Every name a template uses, as a variable or as a block condition. */
export function namesUsed(template, source = '') {
  const names = new Set();
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'var' || node.type === 'if') names.add(node.name);
      if (node.children) walk(node.children);
    }
  };
  walk(parse(template, source).children);
  return names;
}
