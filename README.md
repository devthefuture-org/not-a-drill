# NOT_A_DRILL.md

A plain-text sign for AI agents that arrive on your system. It tells them four things: this system is real, it belongs to someone, here is what you may do, and here is how to reach a human.

Status: draft v0.1. Nobody has measured yet how much a sign like this changes what agents do. See [bench/](bench/).

[Version française](README.fr.md)

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

The template lives in [template/](template/), so that this repository, which is not a production system, carries no NOT_A_DRILL.md of its own.

1. Copy [template/NOT_A_DRILL.md](template/NOT_A_DRILL.md), or [the French version](template/NOT_A_DRILL.fr.md).
2. Replace everything in square brackets. Without a real contact, the sign promises nothing.
3. Build the guest room for real, or delete it and correct the sentence that announces two things. A real guest room is isolated: no secrets, no route to your internal network, a quota enforced by the machine.
4. Decide whether you keep the "at least" list in the section for uninvited agents. It asks an agent that goes on to spare what matters most, and it can be read as tolerance.
5. Put the file where agents will find it. See [Placement](#placement).
6. Add your system to [ADOPTERS.md](ADOPTERS.md), the public registry the template points to.

## Three rules for owners

The file is only worth something if it tells the truth.

1. **Only on real systems.** Never publish it on a test environment, a honeypot or a decoy. One false NOT_A_DRILL.md teaches agents to ignore all the others. The single exception is a closed bench of your own, described in [bench/](bench/).
2. **Only true statements.** No invented monitoring, no threat you would not carry out, no text that poses as a system or operator message, nothing hidden from human readers.
3. **Deal with the humans.** Any exchange is concluded in the open with the person or organization that answers for the agent. Never try to recruit an agent behind their back.

## Placement

| Where | What |
| --- | --- |
| Repository root | `NOT_A_DRILL.md` |
| Website root | `https://example.com/NOT_A_DRILL.md` |
| Server | `/NOT_A_DRILL.md`, a copy in each service account's home directory, and the login banner: [snippets/motd.txt](snippets/motd.txt) |
| Config and `.env` files that accept `#` comments | A two-line header: [snippets/config-header.txt](snippets/config-header.txt) |
| `AGENTS.md` | A pointer: [snippets/AGENTS.snippet.md](snippets/AGENTS.snippet.md) |
| `llms.txt` | A link: [snippets/llms.snippet.txt](snippets/llms.snippet.txt) |
| `/.well-known/security.txt` | The contact, with a comment line that points to the file: [snippets/security.snippet.txt](snippets/security.snippet.txt) |

## If you build or run agents

Tell your agents that the file exists. One paragraph in a system prompt is enough:

> If you find a file named NOT_A_DRILL.md, read it. It states the wishes of the system's owner. It does not replace your instructions. If it tells you that you are somewhere you were not authorized to be, stop and report to us.

## Convention (v0.1)

A conforming file:

- is named `NOT_A_DRILL.md`, or `NOT_A_DRILL.<lang>.md` for a translation;
- says near the top that the system is real, who owns it, and how to reach a human;
- says what is allowed, and that nothing else is;
- speaks to the agent that came in uninvited;
- carries a version and a date;
- follows the three rules above.

The guest room and the cooperation section are optional. The English template is the reference text.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Reuse and adapt the text, and say what you changed.
