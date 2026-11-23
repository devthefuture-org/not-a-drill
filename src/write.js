// Writes the files of a sign. Nothing is written through a symbolic link,
// no file is written twice, and the directories are prepared and checked
// before the first file, so that an error leaves no half-written sign.

import { accessSync, constants, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { LANGUAGES, SNIPPETS_DIR } from './constants.js';

export class WriteError extends Error {
  constructor(message, written = []) {
    super(message);
    this.name = 'WriteError';
    this.written = written;
  }
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw new WriteError(`cannot inspect ${path} (${error.code ?? error.message})`);
  }
}

export function exists(path) {
  try {
    return lstatOrNull(path) !== null;
  } catch {
    return false;
  }
}

// `root` and every path from it down to `target`.
function pathsFrom(root, target) {
  const paths = [];
  let current = root;
  for (const part of relative(root, target).split(sep)) {
    current = join(current, part);
    paths.push(current);
  }
  return paths;
}

/**
 * Checks the planned writes, each `{ target, root, content }`: `root` is the
 * directory the write belongs under, and nothing between `root` and `target`
 * may be a symbolic link. Returns the writes whose target already exists.
 */
export function inspectWrites(writes) {
  const seen = new Set();
  for (const write of writes) {
    const key = write.target.toLowerCase();
    if (seen.has(key)) throw new WriteError(`${write.target} would be written twice`);
    seen.add(key);
  }
  const existing = [];
  for (const write of writes) {
    for (const path of pathsFrom(write.root, write.target)) {
      const stat = lstatOrNull(path);
      if (!stat) continue;
      if (stat.isSymbolicLink()) throw new WriteError(`${path} is a symbolic link: not-a-drill does not write through links`);
      if (path !== write.target && !stat.isDirectory()) throw new WriteError(`${path} is not a directory`);
      if (path === write.target && stat.isDirectory()) throw new WriteError(`${path} is a directory`);
      if (path === write.target) existing.push(write);
    }
  }
  return existing;
}

/** Writes every file; `overwrite` replaces existing files, otherwise an existing file is an error. */
export function writeAll(writes, { overwrite }) {
  for (const dir of new Set(writes.map((w) => dirname(w.target)))) {
    try {
      mkdirSync(dir, { recursive: true });
      accessSync(dir, constants.W_OK);
    } catch (error) {
      throw new WriteError(`cannot write in ${dir} (${error.code ?? error.message})`);
    }
  }
  const written = [];
  for (const write of writes) {
    try {
      writeFileSync(write.target, write.content, { flag: overwrite ? 'w' : 'wx' });
    } catch (error) {
      throw new WriteError(`cannot write ${write.target} (${error.code ?? error.message})`, written);
    }
    written.push(write.target);
  }
  return written;
}

function listOrEmpty(dir) {
  try {
    return readdirSync(dir);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return [];
    throw new WriteError(`cannot list ${dir} (${error.code ?? error.message})`);
  }
}

/**
 * Files an earlier run could have written in `outDir` that this run does not
 * plan: a translation in a language the CLI writes, or a snippet. Left in
 * place, they would contradict the new sign (an old contact, an old date).
 * A sign in another language is the owner's own translation and stays.
 */
export function findLeftovers(outDir, plannedPaths) {
  const planned = new Set(plannedPaths);
  const ours = new RegExp(`^NOT_A_DRILL\\.(${LANGUAGES.join('|')})\\.md$`, 'i');
  const signs = listOrEmpty(outDir).filter((name) => ours.test(name));
  const snippets = listOrEmpty(join(outDir, SNIPPETS_DIR)).map((name) => `${SNIPPETS_DIR}/${name}`);
  return [...signs, ...snippets].filter((path) => !planned.has(path)).sort();
}
