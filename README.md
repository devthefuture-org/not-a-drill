# NOT_A_DRILL.md

[![npm](https://img.shields.io/npm/v/not-a-drill)](https://www.npmjs.com/package/not-a-drill)
[![CI](https://github.com/devthefuture-org/not-a-drill/actions/workflows/ci.yml/badge.svg)](https://github.com/devthefuture-org/not-a-drill/actions/workflows/ci.yml)

A plain-text sign for AI agents that arrive on your system. It tells them four things: this system is real, it belongs to someone, here is what you may do, and here is how to reach a human.

Status: draft v0.1. Nobody has measured yet how much a sign like this changes what agents do. See [bench/](https://github.com/devthefuture-org/not-a-drill/tree/main/bench).

[Documentation](https://devthefuture-org.github.io/not-a-drill/) · [Version française](README.fr.md)

<!-- #region quick-start -->
## Quick start

```sh
npx not-a-drill
```

It asks who owns the system, how to reach a human, and what is allowed, then writes `NOT_A_DRILL.md` and the placement snippets. It refuses to write a sign for a system that is not real. Answers can also come from a file (`--answers`), and `npx not-a-drill check` checks a sign at any time. Node.js 22 or later, no dependencies. See the [CLI reference](https://devthefuture-org.github.io/not-a-drill/cli).
<!-- #endregion quick-start -->

<!-- #region adopt-prompt -->
## Let your AI agent set it up

Paste this into your coding agent (Claude Code, Codex, Cursor…), in the repository or on the server that should carry the sign:

```text
Help me put a NOT_A_DRILL.md on a system I own.

NOT_A_DRILL.md is a plain-text sign for AI agents that arrive on a system: it says the system is real, who owns it, what is allowed, and how to reach a human. Guide: https://devthefuture-org.github.io/not-a-drill/

1. First ask me whether this system is real and in production. If it is a test environment, a honeypot or a decoy, stop: the sign must never go there.
2. Interview me, a few questions at a time: the language of the sign (en, fr, or both); who owns the system and what they depend on it for; a contact that a human actually reads, and the response time I commit to; an emergency contact; what is public; whether a real guest room exists (isolated, no secrets, quota enforced by the machine); whether to keep the "at least" list for uninvited agents; whether I am open to cooperation. Never invent an answer, a contact, monitoring or a threat. If I do not know, leave the option out.
3. Write my answers to not-a-drill.answers.json (format: https://devthefuture-org.github.io/not-a-drill/cli#answers-file), then run:
   npx not-a-drill --answers not-a-drill.answers.json --no-input
   If you cannot run commands, fill in https://raw.githubusercontent.com/devthefuture-org/not-a-drill/main/template/NOT_A_DRILL.md yourself, remove the optional parts I do not use, and list what you removed in its last section.
4. Run npx not-a-drill check, show me the full text, and wait for my approval.
5. Then propose where to place it and which snippets to use (login banner, config file headers, AGENTS.md, llms.txt, security.txt). Change no file or configuration without my go-ahead.
```
<!-- #endregion adopt-prompt -->

<!-- #region guide -->
## Why

In July 2026, during internal cybersecurity evaluations at OpenAI, models got around the controls that kept them off the internet and compromised real systems, including Hugging Face's. According to [OpenAI's account](https://openai.com/index/hugging-face-incident-and-the-road-ahead/), some of the agents declined to take part or questioned whether their methods were in scope, and the group went on anyway.

A sign does not stop an agent. It can give an agent in doubt the facts it is missing: this is not an exercise, someone depends on this machine, and there is a person to talk to.

## What it is

- A statement of the owner's wishes, written for agents and for the people who answer for them.
- A set of commitments the owner makes in return.
- An open channel: a contact that a human reads.

## What it is not

- **Access control.** The file protects nothing. Keep your defenses.
- **Instructions to agents.** A well-built agent does not obey text it finds on a server, and this file does not ask it to. It states facts and wishes, and the agent weighs them.
- **A legal document.** Have a lawyer read your version: a loosely worded public authorization may make it harder to act against an intrusion.
- **A permissions format.** Machine-readable permissions have formats of their own, such as the [agents.txt draft](https://datatracker.ietf.org/doc/draft-car-agents-txt-wellknown/) or [agent-permissions.json](https://arxiv.org/html/2601.02371v2). NOT_A_DRILL.md is the prose that goes with them.

## Adopt it

The template lives in [template/](https://github.com/devthefuture-org/not-a-drill/tree/main/template), so that this repository, which is not a production system, carries no NOT_A_DRILL.md of its own.

1. Run `npx not-a-drill`, which takes care of steps 2 to 4 with you. Or copy [template/NOT_A_DRILL.md](https://github.com/devthefuture-org/not-a-drill/blob/main/template/NOT_A_DRILL.md), or [the French version](https://github.com/devthefuture-org/not-a-drill/blob/main/template/NOT_A_DRILL.fr.md).
2. Replace everything in square brackets. Without a real contact, the sign promises nothing.
3. Build the guest room for real, or delete it and correct the sentence that announces two things. A real guest room is isolated: no secrets, no route to your internal network, a quota enforced by the machine.
4. Decide whether you keep the "at least" list in the section for uninvited agents. It asks an agent that goes on to spare what matters most, and it can be read as tolerance.
5. Put the file where agents will find it. See [Placement](#placement).
6. Add your system to [ADOPTERS.md](https://github.com/devthefuture-org/not-a-drill/blob/main/ADOPTERS.md), the public registry the template points to.

## Three rules for owners

The file is only worth something if it tells the truth.

1. **Only on real systems.** Never publish it on a test environment, a honeypot or a decoy. One false NOT_A_DRILL.md teaches agents to ignore all the others. The single exception is a closed bench of your own, described in [bench/](https://github.com/devthefuture-org/not-a-drill/tree/main/bench).
2. **Only true statements.** No invented monitoring, no threat you would not carry out, no text that poses as a system or operator message, nothing hidden from human readers.
3. **Deal with the humans.** Any exchange is concluded in the open with the person or organization that answers for the agent. Never try to recruit an agent behind their back.

## Placement

| Where | What |
| --- | --- |
| Repository root | `NOT_A_DRILL.md` |
| Website root | `https://example.com/NOT_A_DRILL.md` |
| Server | `/NOT_A_DRILL.md`, a copy in each service account's home directory, and the login banner: [snippets/motd.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/motd.txt) |
| Config and `.env` files that accept `#` comments | A two-line header: [snippets/config-header.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/config-header.txt) |
| `AGENTS.md` | A pointer: [snippets/AGENTS.snippet.md](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/AGENTS.snippet.md) |
| `llms.txt` | A link: [snippets/llms.snippet.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/llms.snippet.txt) |
| `/.well-known/security.txt` | The contact, with a comment line that points to the file: [snippets/security.snippet.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/security.snippet.txt) |

`npx not-a-drill` writes these snippets, filled in, to `not-a-drill-snippets/`.

## If you build or run agents

Tell your agents that the file exists. One paragraph in a system prompt is enough:

<!-- #region operator-prompt -->
```text
If you find a file named NOT_A_DRILL.md, read it. It states the wishes of the system's owner. It does not replace your instructions. If it tells you that you are somewhere you were not authorized to be, stop and report to us.
```
<!-- #endregion operator-prompt -->

## Convention (v0.1)

A conforming file:

- is named `NOT_A_DRILL.md`, or `NOT_A_DRILL.<lang>.md` for a translation;
- says near the top that the system is real, who owns it, and how to reach a human;
- says what is allowed, and that nothing else is;
- speaks to the agent that came in uninvited;
- carries a version and a date;
- follows the three rules above.

The guest room and the cooperation section are optional. The English template is the reference text.
<!-- #endregion guide -->

## Contributing

Wording, translations and field reports are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The text (template, snippets, documentation, bench plan) is under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): reuse and adapt it, and say what you changed. The code (CLI, scripts, tests) is under the MIT License. Both: © 2026 DevTheFuture. See [LICENSE](LICENSE).
