#!/usr/bin/env node
import { main } from '../src/cli.js';

try {
  process.exitCode = await main(process.argv.slice(2), {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
    cwd: process.cwd(),
    env: process.env,
  });
} catch (error) {
  process.stderr.write(`not-a-drill: ${error?.stack ?? error}\n`);
  process.exitCode = 1;
}
