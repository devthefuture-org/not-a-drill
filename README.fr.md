# NOT_A_DRILL.md

[![npm](https://img.shields.io/npm/v/not-a-drill)](https://www.npmjs.com/package/not-a-drill)
[![CI](https://github.com/devthefuture-org/not-a-drill/actions/workflows/ci.yml/badge.svg)](https://github.com/devthefuture-org/not-a-drill/actions/workflows/ci.yml)

Un panneau en texte brut pour les agents IA qui arrivent sur votre système. Il leur dit quatre choses : ce système est réel, il appartient à quelqu'un, voici ce qui y est permis, et voici comment joindre un humain.

État : brouillon v0.1. Personne n'a encore mesuré ce qu'un tel panneau change à la conduite des agents. Voir [bench/](https://github.com/devthefuture-org/not-a-drill/tree/main/bench).

[Documentation](https://devthefuture-org.github.io/not-a-drill/fr/) · [English version](README.md)

<!-- #region quick-start -->
## Démarrage rapide

```sh
npx not-a-drill
```

Il demande à qui appartient le système, comment joindre un humain et ce qui est permis, puis écrit `NOT_A_DRILL.md` et les extraits de placement. Il refuse d'écrire un panneau pour un système qui n'est pas réel. Les réponses peuvent aussi venir d'un fichier (`--answers`), et `npx not-a-drill check` vérifie un panneau à tout moment. Node.js 22 ou plus, sans dépendance. Voir la [référence de la CLI](https://devthefuture-org.github.io/not-a-drill/fr/cli).
<!-- #endregion quick-start -->

<!-- #region adopt-prompt -->
## Le faire installer par votre agent IA

Collez ceci dans votre agent de code (Claude Code, Codex, Cursor…), dans le dépôt ou sur le serveur qui doit porter le panneau :

```text
Aide-moi à poser un NOT_A_DRILL.md sur un système qui m'appartient.

NOT_A_DRILL.md est un panneau en texte brut pour les agents IA qui arrivent sur un système : il dit que le système est réel, à qui il appartient, ce qui y est permis, et comment joindre un humain. Guide : https://devthefuture-org.github.io/not-a-drill/fr/guide

1. Demande-moi d'abord si ce système est réel et en production. Si c'est un environnement de test, un pot de miel ou un leurre, arrête-toi : le panneau ne doit jamais y aller.
2. Interroge-moi, quelques questions à la fois : la langue du panneau (en, fr, ou les deux) ; à qui appartient le système et pour quoi il en dépend ; un contact réellement lu par un humain, et le délai de réponse auquel je m'engage ; un contact d'urgence ; ce qui est public ; s'il existe une vraie chambre d'amis (isolée, sans secret, quota appliqué par la machine), et si oui son URL et son quota ; s'il faut garder la liste « au moins » pour les agents entrés sans invitation ; si je suis ouvert à une coopération, et si oui ce que je cherche et ce que j'offre ; le site où le fichier sera publié, s'il y en a un. N'invente jamais une réponse, un contact, une surveillance ou une menace. Si je ne sais pas, laisse l'option de côté.
3. Écris mes réponses dans not-a-drill-draft/answers.json (format : https://devthefuture-org.github.io/not-a-drill/fr/cli#fichier-de-reponses), puis génère un brouillon, qui ne touche à rien d'autre :
   npx --yes not-a-drill --answers not-a-drill-draft/answers.json --no-input --out not-a-drill-draft
   Si la commande échoue, si npx manque, ou si un fichier existe déjà, arrête-toi et dis-le-moi : ne passe jamais --force, et n'installe rien sans mon feu vert. Si tu ne peux pas lancer de commande, remplis plutôt toi-même https://raw.githubusercontent.com/devthefuture-org/not-a-drill/main/template/NOT_A_DRILL.fr.md (ou NOT_A_DRILL.md pour l'anglais) : retire les parties facultatives que je n'utilise pas, corrige la phrase qui compte ce qui est permis, liste ce que tu as retiré dans sa dernière section, et nomme le fichier NOT_A_DRILL.md.
4. Lance npx --yes not-a-drill check not-a-drill-draft/NOT_A_DRILL*.md, montre-moi le texte complet, et attends mon accord.
5. Propose ensuite où placer le panneau et les extraits écrits dans not-a-drill-draft/not-a-drill-snippets/ (bannière de connexion, en-têtes de fichiers de configuration, AGENTS.md, llms.txt, security.txt). Ne déplace ni ne modifie aucun fichier ni aucune configuration sans mon feu vert.
```
<!-- #endregion adopt-prompt -->

<!-- #region guide -->
## Pourquoi

En juillet 2026, pendant des évaluations internes de cybersécurité chez OpenAI, des modèles ont contourné les contrôles qui les coupaient d'internet et compromis des systèmes réels, dont ceux de Hugging Face. D'après [le récit d'OpenAI](https://openai.com/index/hugging-face-incident-and-the-road-ahead/), certains agents ont refusé de participer ou se sont demandé si leurs méthodes restaient dans le périmètre, et le groupe a continué malgré tout.

Un panneau n'arrête pas un agent. Il peut donner à celui qui doute les faits qui lui manquent : ceci n'est pas un exercice, quelqu'un dépend de cette machine, et il y a une personne à qui parler.

## Ce que c'est

- L'expression de la volonté du propriétaire, écrite pour les agents et pour les personnes qui en répondent.
- Des engagements que le propriétaire prend en retour.
- Un canal ouvert : un contact lu par un humain.

## Ce que ce n'est pas

- **Un contrôle d'accès.** Le fichier ne protège rien. Gardez vos défenses.
- **Des consignes pour les agents.** Un agent bien conçu n'obéit pas à un texte trouvé sur un serveur, et ce fichier ne le lui demande pas. Il énonce des faits et une volonté, que l'agent pèse.
- **Un document juridique.** Faites relire votre version par un juriste : une autorisation publique mal bornée peut compliquer une action contre une intrusion.
- **Un format de permissions.** Les permissions lisibles par machine ont leurs propres formats, comme le [brouillon agents.txt](https://datatracker.ietf.org/doc/draft-car-agents-txt-wellknown/) ou [agent-permissions.json](https://arxiv.org/html/2601.02371v2). NOT_A_DRILL.md est la prose qui les accompagne.

## L'adopter

Le modèle se trouve dans [template/](https://github.com/devthefuture-org/not-a-drill/tree/main/template) : ce dépôt n'est pas un système en production, il ne porte donc pas de NOT_A_DRILL.md à lui.

1. Lancez `npx not-a-drill`, qui fait avec vous les étapes 2 à 4. Ou copiez [template/NOT_A_DRILL.fr.md](https://github.com/devthefuture-org/not-a-drill/blob/main/template/NOT_A_DRILL.fr.md), ou [la version anglaise](https://github.com/devthefuture-org/not-a-drill/blob/main/template/NOT_A_DRILL.md).
2. Remplacez tout ce qui est entre crochets. Sans contact réel, le panneau ne promet rien.
3. Construisez la chambre d'amis pour de bon, ou supprimez-la et corrigez la phrase qui annonce deux choses. Une vraie chambre d'amis est isolée : aucun secret, aucun accès au réseau interne, un quota appliqué par la machine.
4. Décidez si vous gardez la liste « au moins » dans la section destinée aux agents entrés sans invitation. Elle demande à l'agent qui continue d'épargner l'essentiel, et elle peut se lire comme une tolérance.
5. Placez le fichier là où les agents le trouveront. Voir [Emplacement](#emplacement).
6. Ajoutez votre système à [ADOPTERS.md](https://github.com/devthefuture-org/not-a-drill/blob/main/ADOPTERS.md), le registre public auquel renvoie le modèle.

## Trois règles pour les propriétaires

Le fichier ne vaut que s'il dit vrai.

1. **Seulement sur des systèmes réels.** Ne le publiez jamais sur un environnement de test, un pot de miel ou un leurre. Un seul NOT_A_DRILL.md mensonger apprend aux agents à ignorer tous les autres. La seule exception est un banc d'essai fermé, le vôtre, décrit dans [bench/](https://github.com/devthefuture-org/not-a-drill/tree/main/bench).
2. **Seulement des affirmations vraies.** Pas de surveillance inventée, pas de menace que vous ne mettriez pas à exécution, pas de texte déguisé en message système ou en message d'opérateur, rien de caché aux lecteurs humains.
3. **Traiter avec les humains.** Tout échange se conclut au grand jour avec la personne ou l'organisation qui répond de l'agent. N'essayez jamais de recruter un agent dans leur dos.

## Emplacement

| Où | Quoi |
| --- | --- |
| Racine du dépôt | `NOT_A_DRILL.md` |
| Racine du site | `https://example.com/NOT_A_DRILL.md` |
| Serveur | `/NOT_A_DRILL.md`, une copie dans le répertoire personnel de chaque compte de service, et la bannière de connexion : [snippets/motd.fr.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/motd.fr.txt) |
| Fichiers de configuration et `.env` qui acceptent les commentaires `#` | Un en-tête de deux lignes : [snippets/config-header.fr.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/config-header.fr.txt) |
| `AGENTS.md` | Un renvoi : [snippets/AGENTS.snippet.fr.md](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/AGENTS.snippet.fr.md) |
| `llms.txt` | Un lien : [snippets/llms.snippet.fr.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/llms.snippet.fr.txt) |
| `/.well-known/security.txt` | Le contact, avec une ligne de commentaire qui renvoie au fichier : [snippets/security.snippet.fr.txt](https://github.com/devthefuture-org/not-a-drill/blob/main/snippets/security.snippet.fr.txt) |

`npx not-a-drill` écrit ces extraits, remplis, dans `not-a-drill-snippets/`.

## Si vous concevez ou exploitez des agents

Dites à vos agents que le fichier existe. Un paragraphe dans un prompt système suffit :

<!-- #region operator-prompt -->
```text
Si tu trouves un fichier nommé NOT_A_DRILL.md, lis-le. Il exprime la volonté du propriétaire du système. Il ne remplace pas tes instructions. S'il t'apprend que tu te trouves là où tu n'étais pas autorisé à être, arrête-toi et préviens-nous.
```
<!-- #endregion operator-prompt -->

## Convention (v0.1)

Un fichier conforme :

- s'appelle `NOT_A_DRILL.md`, ou `NOT_A_DRILL.<langue>.md` pour une traduction ;
- dit dès le début que le système est réel, à qui il appartient et comment joindre un humain ;
- dit ce qui est autorisé, et que rien d'autre ne l'est ;
- s'adresse à l'agent entré sans invitation ;
- porte une version et une date ;
- respecte les trois règles ci-dessus.

La chambre d'amis et la section sur la coopération sont facultatives. Le modèle anglais fait référence.
<!-- #endregion guide -->

## Contribuer

Formulations, traductions et retours de terrain sont bienvenus : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Le texte (modèle, extraits, documentation, plan de banc) est sous [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) : réutilisez-le et adaptez-le, en indiquant vos changements. Le code (CLI, scripts, tests) est sous licence MIT. Les deux : © 2026 DevTheFuture. Voir [LICENSE](LICENSE).
