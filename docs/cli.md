# CLI

`not-a-drill` writes a NOT_A_DRILL.md from your answers, and checks the ones you have. It needs Node.js 22 or later and has no dependencies.

## Write a sign

```sh
npx not-a-drill
```

The questions come in English or in French:

1. The language of the sign, and whether to write the other language too.
2. Whether the system is real and in production. If it is not, nothing is written: the sign goes only on real systems.
3. Who owns the system and what they depend on it for, a contact that a human reads, the response time you commit to, and an emergency contact.
4. What is public, the guest room, the "at least" list for uninvited agents, and cooperation.
5. The date of this version, the website where you will publish the file, and the placement snippets.

The CLI shows the files before it writes them, never overwrites a file without asking, and can save your answers to regenerate the sign later.

### Files written

| File | When |
| --- | --- |
| `NOT_A_DRILL.md` | Always, in the main language. |
| `NOT_A_DRILL.<lang>.md` | When the sign has both languages. |
| `not-a-drill-snippets/motd.txt`, `config-header.txt`, `AGENTS.snippet.md` | Unless you turn the snippets off. |
| `not-a-drill-snippets/llms.snippet.txt`, `security.snippet.txt` | When you give a website URL. |

If `--out` holds a translation or snippets from an earlier run that this run does not write, the CLI stops and names them: left in place, they would contradict the new sign.

The optional parts you leave out disappear from the text, and its last section lists them under "Changes from the template", as CC BY asks. If you edit the text by hand afterwards, add your changes to that line.

## Options

```text
npx not-a-drill [init] [options]     answer the questions, write the sign
npx not-a-drill check [files...]     check signs (default: ./NOT_A_DRILL*.md)

-a, --answers <file>       read the answers from a JSON file instead of asking
    --no-input             never ask anything (automatic when stdin is not a terminal)
-o, --out <dir>            where to write the sign (default: current directory)
-f, --force                overwrite existing files
    --save-answers <file>  also save the answers, to regenerate the sign later
-h, --help                 show the help
-v, --version              show the version
```

## Answers file {#answers-file}

Scripts, servers and AI agents pass the answers in a JSON file. The example below shows the format: replace every value, since the CLI refuses names reserved for examples and tests (`example.com`, `*.example`, `*.test`…) and a sign needs a real contact.

```sh
npx not-a-drill --answers not-a-drill.answers.json --no-input
```

```json
{
  "realSystem": true,
  "languages": ["en", "fr"],
  "date": "2026-11-23",
  "owner": "ACME Cooperative",
  "activity": { "en": "running its shop", "fr": "faire tourner sa boutique" },
  "contact": "security@acme.example",
  "responseTime": { "en": "72 hours", "fr": "72 heures" },
  "emergencyContact": "+33 1 23 45 67 89",
  "publicPaths": "https://acme.example",
  "guestRoom": null,
  "atLeastList": true,
  "cooperation": null,
  "siteUrl": "https://acme.example",
  "snippets": true
}
```

| Key | Value | Required | Meaning |
| --- | --- | --- | --- |
| `realSystem` | `true` | yes | Confirms that the system is real and in production. `false` is refused with exit code 1. |
| `languages` | `["en"]`, `["fr"]`, `["en", "fr"]` or `["fr", "en"]` | no, `["en"]` | The first one is written to `NOT_A_DRILL.md`, the other to `NOT_A_DRILL.<lang>.md`. |
| `date` | `"YYYY-MM-DD"` | no, today | Date of this version of the sign. |
| `owner` | string | yes | Completes "It belongs to ___". |
| `activity` | text | yes | Completes "who depend on it for ___". |
| `contact` | string | yes | An email address or an https URL that a human reads. Before the `@`, letters, digits, `.`, `_`, `+` and `-` only. A URL is written in ASCII, with spaces and accented letters percent-encoded (`%20`, `%C3%A9`), and https only (RFC 9116). |
| `responseTime` | text | yes | Completes "answers within ___". |
| `emergencyContact` | string | no | Leave it out if you have none. |
| `publicPaths` | string | no | Paths or URLs that agents may read. Leave it out if nothing is public. |
| `guestRoom` | `{ "url": string, "quota": text }` | no | Only if the guest room exists for real: isolated, no secrets, a quota enforced by the machine. |
| `atLeastList` | boolean | no, `true` | Keeps the "at least" list in the section for uninvited agents. |
| `cooperation` | `{ "goals": text, "offer": text }` | no | What you are looking for, and what you can offer. |
| `siteUrl` | http(s) URL, without query or fragment | no | Website where the file is published, at its root. Adds the llms.txt and security.txt snippets. |
| `snippets` | boolean | no, `true` | Writes the placement snippets. |

A *text* depends on the language: a plain string when the sign has one language, otherwise an object with one entry per language, such as `{ "en": "72 hours", "fr": "72 heures" }`.

Every value is plain text on one line, without control characters. A value that looks like a field of the template, such as `[EU]`, is refused. In the Markdown files, `*`, `<`, backquotes and backslashes are escaped so they show as typed. A final period is dropped where the sentence brings its own.

`null`, `false` or an absent key leaves out `emergencyContact`, `publicPaths`, `guestRoom`, `cooperation` and `siteUrl`. `atLeastList` and `snippets` take `true` or `false`, and default to `true`. An unknown key is an error, and every problem is reported at once.

## Check a sign

```sh
npx not-a-drill check                    # NOT_A_DRILL.md and NOT_A_DRILL.<lang>.md in the current directory
npx not-a-drill check /NOT_A_DRILL.md    # given files
```

`check` reports every field still in square brackets, even escaped (`\[CONTACT\]`), spread over two lines or turned into a link; a missing or impossible date next to the version; and a missing contact on that line.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Done. |
| `1` | Refused (not a real system, existing files without `--force`, files from an earlier sign in `--out`, write declined), or problems found by `check`. |
| `2` | Usage error or invalid answers. |
| `130` | Cancelled. |

## On a server

Keep the answers file next to your server configuration, and generate the sign from it:

```sh
npx --yes not-a-drill --answers not-a-drill.answers.json --no-input --out ./sign
sudo install -m 644 ./sign/NOT_A_DRILL*.md /
```

Add `./sign/not-a-drill-snippets/motd.txt` to the login banner (`/etc/motd`), copy the sign into the home directory of each service account, and put `config-header.txt` at the top of the configuration files that accept `#` comments.

To update the sign, change the answers (at least the `date`) and generate into an empty directory. Install the files the run lists under "Written", remove from `/` any `NOT_A_DRILL.<lang>.md` it no longer writes, and replace the lines of the earlier banner and headers instead of adding new ones. The security.txt `Expires` date counts from the day you generate.
