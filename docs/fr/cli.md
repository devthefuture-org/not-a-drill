# CLI

`not-a-drill` écrit un NOT_A_DRILL.md à partir de vos réponses, et vérifie ceux que vous avez. Il demande Node.js 22 ou plus et n'a aucune dépendance.

## Écrire un panneau

```sh
npx not-a-drill
```

Les questions viennent en anglais ou en français :

1. La langue du panneau, et s'il faut aussi écrire l'autre langue.
2. Si le système est réel et en production. Sinon, rien n'est écrit : le panneau ne va que sur des systèmes réels.
3. À qui appartient le système et pour quoi il en dépend, un contact lu par un humain, le délai de réponse auquel vous vous engagez, et un contact d'urgence.
4. Ce qui est public, la chambre d'amis, la liste « au moins » pour les agents entrés sans invitation, et la coopération.
5. La date de cette version, le site où vous publierez le fichier, et les extraits de placement.

La CLI montre les fichiers avant de les écrire, ne remplace jamais un fichier sans demander, et peut garder vos réponses pour régénérer le panneau plus tard.

### Fichiers écrits

| Fichier | Quand |
| --- | --- |
| `NOT_A_DRILL.md` | Toujours, dans la langue principale. |
| `NOT_A_DRILL.<langue>.md` | Quand le panneau a les deux langues. |
| `not-a-drill-snippets/motd.txt`, `config-header.txt`, `AGENTS.snippet.md` | Sauf si vous refusez les extraits. |
| `not-a-drill-snippets/llms.snippet.txt`, `security.snippet.txt` | Quand vous donnez l'URL d'un site. |

Les parties facultatives que vous écartez disparaissent du texte, et sa dernière section les liste sous « Changements par rapport au modèle », comme le demande CC BY. Si vous modifiez ensuite le texte à la main, ajoutez vos changements à cette ligne.

## Options

```text
npx not-a-drill [init] [options]     répondre aux questions, écrire le panneau
npx not-a-drill check [fichiers...]  vérifier des panneaux (par défaut : ./NOT_A_DRILL*.md)

-a, --answers <fichier>       lire les réponses dans un fichier JSON au lieu de les demander
    --no-input                ne rien demander (automatique quand stdin n'est pas un terminal)
-o, --out <dossier>           où écrire le panneau (par défaut : le dossier courant)
-f, --force                   remplacer les fichiers existants
    --save-answers <fichier>  garder aussi les réponses, pour régénérer le panneau plus tard
-h, --help                    afficher l'aide
-v, --version                 afficher la version
```

## Fichier de réponses {#fichier-de-reponses}

Scripts, serveurs et agents IA passent les réponses dans un fichier JSON. L'exemple ci-dessous montre le format : remplacez chaque valeur, car la CLI refuse les noms réservés aux exemples et aux tests (`example.com`, `*.example`, `*.test`…) et un panneau demande un vrai contact.

```sh
npx not-a-drill --answers not-a-drill.answers.json --no-input
```

```json
{
  "realSystem": true,
  "languages": ["fr", "en"],
  "date": "2026-11-23",
  "owner": "Coopérative ACME",
  "activity": { "fr": "faire tourner sa boutique", "en": "running its shop" },
  "contact": "securite@acme.example",
  "responseTime": { "fr": "72 heures", "en": "72 hours" },
  "emergencyContact": "+33 1 23 45 67 89",
  "publicPaths": "https://acme.example",
  "guestRoom": null,
  "atLeastList": true,
  "cooperation": null,
  "siteUrl": "https://acme.example",
  "snippets": true
}
```

| Clé | Valeur | Requise | Sens |
| --- | --- | --- | --- |
| `realSystem` | `true` | oui | Confirme que le système est réel et en production. `false` est refusé avec le code de sortie 1. |
| `languages` | `["fr"]`, `["en"]`, `["fr", "en"]` ou `["en", "fr"]` | non, `["en"]` | La première est écrite dans `NOT_A_DRILL.md`, l'autre dans `NOT_A_DRILL.<langue>.md`. |
| `date` | `"AAAA-MM-JJ"` | non, aujourd'hui | Date de cette version du panneau. |
| `owner` | chaîne | oui | Complète « Il appartient à ___ ». |
| `activity` | texte | oui | Complète « qui en dépend pour ___ ». |
| `contact` | chaîne | oui | Une adresse e-mail ou une URL https lue par un humain (RFC 9116 n'accepte que des contacts web en https). |
| `responseTime` | texte | oui | Complète « répond sous ___ ». |
| `emergencyContact` | chaîne | non | À omettre si vous n'en avez pas. |
| `publicPaths` | chaîne | non | Chemins ou URL que les agents peuvent lire. À omettre si rien n'est public. |
| `guestRoom` | `{ "url": chaîne, "quota": texte }` | non | Seulement si la chambre d'amis existe pour de bon : isolée, sans secret, avec un quota appliqué par la machine. |
| `atLeastList` | booléen | non, `true` | Garde la liste « au moins » dans la section destinée aux agents entrés sans invitation. |
| `cooperation` | `{ "goals": texte, "offer": texte }` | non | Ce que vous cherchez, et ce que vous pouvez offrir. |
| `siteUrl` | URL http(s), sans requête ni fragment | non | Site où le fichier est publié, à sa racine. Ajoute les extraits llms.txt et security.txt. |
| `snippets` | booléen | non, `true` | Écrit les extraits de placement. |

Un *texte* dépend de la langue : une simple chaîne quand le panneau a une seule langue, sinon un objet avec une entrée par langue, comme `{ "fr": "72 heures", "en": "72 hours" }`.

Chaque valeur est du texte simple sur une ligne, sans caractère de contrôle. Une valeur qui ressemble à un champ du modèle, comme `[EU]`, est refusée. Dans les fichiers Markdown, `*`, `<`, les accents graves et les barres obliques inverses sont échappés pour s'afficher tels que saisis. Un point final est retiré là où la phrase apporte le sien.

`null`, `false` ou une clé absente écarte `emergencyContact`, `publicPaths`, `guestRoom`, `cooperation` et `siteUrl`. `atLeastList` et `snippets` prennent `true` ou `false`, et valent `true` par défaut. Une clé inconnue est une erreur, et tous les problèmes sont signalés d'un coup.

## Vérifier un panneau

```sh
npx not-a-drill check                    # NOT_A_DRILL.md et NOT_A_DRILL.<langue>.md du dossier courant
npx not-a-drill check /NOT_A_DRILL.md    # les fichiers indiqués
```

`check` signale chaque champ resté entre crochets, même échappé (`\[CONTACT\]`), coupé sur deux lignes ou transformé en lien ; une date absente ou impossible à côté de la version ; et l'absence de contact sur cette ligne.

## Codes de sortie

| Code | Sens |
| --- | --- |
| `0` | Terminé. |
| `1` | Refusé (système qui n'est pas réel, fichiers existants sans `--force`, écriture déclinée), ou problèmes trouvés par `check`. |
| `2` | Erreur d'utilisation ou réponses invalides. |
| `130` | Annulé. |

## Sur un serveur

Gardez le fichier de réponses avec la configuration du serveur, et générez le panneau à partir de lui :

```sh
npx --yes not-a-drill --answers not-a-drill.answers.json --no-input --out ./panneau
sudo install -m 644 ./panneau/NOT_A_DRILL*.md /
```

Ajoutez `./panneau/not-a-drill-snippets/motd.txt` à la bannière de connexion (`/etc/motd`), copiez le panneau dans le répertoire personnel de chaque compte de service, et placez `config-header.txt` en tête des fichiers de configuration qui acceptent les commentaires `#`.

Pour mettre le panneau à jour, changez les réponses (au moins la `date`), régénérez avec `--force`, réinstallez les fichiers, et remplacez les lignes de l'ancienne bannière et des en-têtes au lieu d'en ajouter. La date `Expires` de security.txt part du jour de la génération.
