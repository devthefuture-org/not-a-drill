// Writes the files of a sign. Nothing is written through a symbolic link,
// no file is written twice, and the directories are prepared and checked
// before the first file, so that an error leaves no half-written sign.

import { accessSync, constants, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

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
