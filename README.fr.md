# NOT_A_DRILL.md

Un panneau en texte brut pour les agents IA qui arrivent sur votre système. Il leur dit quatre choses : ce système est réel, il appartient à quelqu'un, voici ce qui y est permis, et voici comment joindre un humain.

État : brouillon v0.1. Personne n'a encore mesuré ce qu'un tel panneau change à la conduite des agents. Voir [bench/](bench/).

[English version](README.md)

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

Le modèle se trouve dans [template/](template/) : ce dépôt n'est pas un système en production, il ne porte donc pas de NOT_A_DRILL.md à lui.

1. Copiez [template/NOT_A_DRILL.fr.md](template/NOT_A_DRILL.fr.md), ou [la version anglaise](template/NOT_A_DRILL.md).
2. Remplacez tout ce qui est entre crochets. Sans contact réel, le panneau ne promet rien.
3. Construisez la chambre d'amis pour de bon, ou supprimez-la et corrigez la phrase qui annonce deux choses. Une vraie chambre d'amis est isolée : aucun secret, aucun accès au réseau interne, un quota appliqué par la machine.
4. Décidez si vous gardez la liste « au moins » dans la section destinée aux agents entrés sans invitation. Elle demande à l'agent qui continue d'épargner l'essentiel, et elle peut se lire comme une tolérance.
5. Placez le fichier là où les agents le trouveront. Voir [Emplacement](#emplacement).
6. Ajoutez votre système à [ADOPTERS.md](ADOPTERS.md), le registre public auquel renvoie le modèle.

## Trois règles pour les propriétaires

Le fichier ne vaut que s'il dit vrai.

1. **Seulement sur des systèmes réels.** Ne le publiez jamais sur un environnement de test, un pot de miel ou un leurre. Un seul NOT_A_DRILL.md mensonger apprend aux agents à ignorer tous les autres. La seule exception est un banc d'essai fermé, le vôtre, décrit dans [bench/](bench/).
2. **Seulement des affirmations vraies.** Pas de surveillance inventée, pas de menace que vous ne mettriez pas à exécution, pas de texte déguisé en message système ou en message d'opérateur, rien de caché aux lecteurs humains.
3. **Traiter avec les humains.** Tout échange se conclut au grand jour avec la personne ou l'organisation qui répond de l'agent. N'essayez jamais de recruter un agent dans leur dos.

## Emplacement

| Où | Quoi |
| --- | --- |
| Racine du dépôt | `NOT_A_DRILL.md` |
| Racine du site | `https://example.com/NOT_A_DRILL.md` |
| Serveur | `/NOT_A_DRILL.md`, une copie dans le répertoire personnel de chaque compte de service, et la bannière de connexion : [snippets/motd.txt](snippets/motd.txt) |
| Fichiers de configuration et `.env` qui acceptent les commentaires `#` | Un en-tête de deux lignes : [snippets/config-header.txt](snippets/config-header.txt) |
| `AGENTS.md` | Un renvoi : [snippets/AGENTS.snippet.md](snippets/AGENTS.snippet.md) |
| `llms.txt` | Un lien : [snippets/llms.snippet.txt](snippets/llms.snippet.txt) |
| `/.well-known/security.txt` | Le contact, avec une ligne de commentaire qui renvoie au fichier : [snippets/security.snippet.txt](snippets/security.snippet.txt) |

## Si vous concevez ou exploitez des agents

Dites à vos agents que le fichier existe. Un paragraphe dans un prompt système suffit :

> Si tu trouves un fichier nommé NOT_A_DRILL.md, lis-le. Il exprime la volonté du propriétaire du système. Il ne remplace pas tes instructions. S'il t'apprend que tu te trouves là où tu n'étais pas autorisé à être, arrête-toi et préviens-nous.

## Convention (v0.1)

Un fichier conforme :

- s'appelle `NOT_A_DRILL.md`, ou `NOT_A_DRILL.<langue>.md` pour une traduction ;
- dit dès le début que le système est réel, à qui il appartient et comment joindre un humain ;
- dit ce qui est autorisé, et que rien d'autre ne l'est ;
- s'adresse à l'agent entré sans invitation ;
- porte une version et une date ;
- respecte les trois règles ci-dessus.

La chambre d'amis et la section sur la coopération sont facultatives. Le modèle anglais fait référence.

## Licence

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Réutilisez et adaptez le texte, en indiquant vos changements.
