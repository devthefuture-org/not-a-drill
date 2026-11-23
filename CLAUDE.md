# not-a-drill

NOT_A_DRILL.md convention (v0.1 draft) + the `not-a-drill` npm CLI + the VitePress site.
Repo `devthefuture-org/not-a-drill`, site https://devthefuture-org.github.io/not-a-drill/,
npm `not-a-drill` (0.1.0 published by hand on 2026-11-23). `devbox install && task` lists everything;
`task check` is the gate CI runs. Open follow-ups: issues #4 (low hardening checklist) and #6.

## Locked decisions

- The text has ONE source: `src/templates/<lang>/*.tmpl`. `template/` and `snippets/` are
  generated (`task build:reference`); never edit them by hand, `test/reference.test.js` fails on drift.
- The reference render must stay byte-identical to the template wording; option blocks only add
  variants (allowed 0/1/2, guest room, "at least" list, emergency contact, cooperation).
- CLI: zero runtime dependencies, Node >= 22. Interactive and `--answers` go through the same
  `normalizeAnswers`. `realSystem` must be `true` (rule 1); refused otherwise, nothing written.
- The npm package ships no `template/` or `snippets/`, and no file named NOT_A_DRILL*.md
  (`scripts/check-pack.js`). The site serves none either (`scripts/check-site.js`): neither the
  repo nor the site is a production system.
- README.md / README.fr.md are the source of the site's guide and prompts (`#region` includes);
  their links are absolute so they work in both places.
- Licenses: text CC BY 4.0, code MIT, © DevTheFuture.
- Releases: `task release VERSION=x.y.z` tags; pushing the tag runs `release.yml` (npm trusted
  publishing / OIDC, no token).

## Traps

- npm trusted publishing cannot be set up before the package exists: 0.1.0 is published by hand,
  then the trusted publisher is configured on npmjs.com (org devthefuture-org, repo not-a-drill,
  workflow `release.yml`, direct publish allowed). npm expires a configuration that has not
  published within 2 days: configure it right before pushing the next release tag.
- npm publishing needs 2FA in the browser: from an agent's background shell it fails (EOTP without a TTY;
  in a pty the auth links expire within minutes). Hand Jo the command to run in his own terminal:
  `builtin cd <repo> && devbox run -- npm publish --access public` (his shell's `cd` hook calls fnm).
- A new package is staged a minute or two (`0.0.0-stage`) before the version shows on the registry.
- In the Taskfile, quote any command containing `: ` (YAML reads it as a mapping).
- npm 11 skips esbuild's postinstall in docs/; the VitePress build works without it.
