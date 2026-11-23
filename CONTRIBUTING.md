# Contributing

NOT_A_DRILL.md is a draft. Changes to the wording, translations and field reports are all welcome.

- **Wording.** Open an issue or a pull request. Say what the change should improve and, if you can, how you tested it.
- **Translations.** Keep the sections, the optional parts and the fields of the English template. See [Working on the text](#working-on-the-text).
- **Adopters.** Add your system to [ADOPTERS.md](ADOPTERS.md).
- **Field reports.** If an agent read your file and stopped, reported or ignored it, open an issue. Leave out anything that identifies a person or reveals a vulnerability that is still open.

Three things stay fixed: the file tells the truth, it gives agents no orders, and any agreement is made in the open with the people who answer for them.

## Working on the text

The text has one source: `src/templates/<lang>/`. The files in `template/` and `snippets/` are generated from it, and the CLI renders the same sources.

1. Edit `src/templates/<lang>/NOT_A_DRILL.md.tmpl` or a snippet next to it. `{{field}}` is a field, `{{#if option}}…{{/if}}` an optional part.
2. Run `task build:reference` to regenerate `template/` and `snippets/`.
3. Run `task check`. The tests fail if the generated files and their sources differ.

A new language needs `src/templates/<lang>/`, the language in `src/constants.js`, its bracketed labels and its "Changes" wording in `src/context.js`, and the questions in `src/i18n.js`.

## Development

```sh
devbox install   # Node.js and Task, pinned
task             # list the tasks
task check       # the gate CI runs: tests, npm package, documentation site
```

The CLI has no runtime dependency, and it should stay that way.
