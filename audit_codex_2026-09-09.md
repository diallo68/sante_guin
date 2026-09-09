# Audit complémentaire (Codex) — 9 septembre 2026

**Révision examinée :** `main` à `a37295f` (juste après la remédiation de
[`audit123_A_nouveau.md`](audit123_A_nouveau.md), voir
[`correctif_audit123_A_nouveau.md`](correctif_audit123_A_nouveau.md), RA-01
à RA-13).

**Nature :** audit statique mené avec Codex (hors de cette session Claude
Code), transmis oralement par l'utilisateur (captures d'écran) plutôt que
livré sous forme de fichier — consigné ici a posteriori pour ne pas perdre
le contexte. Le détail technique de la vérification/correction de chaque
point est dans [`correctif_audit123_A_nouveau.md`](correctif_audit123_A_nouveau.md#6-ré-audit-complémentaire-codex-9-septembre-2026--ra-14-à-ra-16),
section 6.

## Résumé exécutif (tel que transmis par Codex)

> Le projet est sensiblement mieux préparé pour la production qu'auparavant.
> Les contrôles d'authentification, d'autorisation, de fichiers et de
> sessions sont désormais solides.

## Priorités identifiées

1. **Injection HTML dans les emails admin** — confirmé. `adminNote`, `nom`
   (→ `firstName`) et `planName` n'étaient pas ré-échappés avant
   interpolation dans les templates HTML de `web/app/api/admin/subscription-requests/route.ts`
   (activation, refus, message libre) — alors que le même problème avait
   déjà été corrigé sur `web/app/api/pro/subscribe/route.ts` (voir audit
   S19). Un `nom` ou `planName` forgé lors de la demande d'abonnement
   pouvait donc falsifier le contenu d'un email envoyé plus tard par
   l'admin au nom de la plateforme. → **RA-14**, corrigé.

2. **Validation stricte des statuts de souscription** — confirmé.
   `SubscriptionRequest.findByIdAndUpdate` n'exécute pas les validateurs du
   schéma Mongoose (dont l'enum `status`) par défaut ; un statut arbitraire
   pouvait être écrit en base par la route admin. → **RA-15**, corrigé.

3. **Quota du service IA** — confirmé. `POST /api/ai/chat` (appel à l'API
   Groq, payante) n'avait aucune limite de fréquence, alors qu'un
   abonnement Pro actif suffisait à l'appeler sans contrôle de coût.
   → **RA-16**, corrigé.

4. **Injection systématique de `REDIS_URL` dans le pipeline de build** —
   vérifié, **déjà correct** : `.github/workflows/web-ci.yml` définit
   `REDIS_URL` (valeur factice) sur l'étape `Build`, et
   `web/vitest.config.ts` la définit pour la suite de tests (avec
   `ioredis-mock`). Aucun changement nécessaire.

5. **Exécution des tests dans un environnement autorisant le démarrage de
   MongoDB en mémoire** — vérifié, **déjà correct** dans cette session :
   `mongodb-memory-server` démarre et la suite complète (107 tests, après
   ajout de 5 tests de régression pour RA-14/15/16) passe sans problème.
   Ce constat de Codex reflète très probablement une limitation propre au
   bac à sable dans lequel Codex a été exécuté (pas d'accès réseau/process
   pour démarrer `mongod`), pas un défaut du dépôt.

## Suite donnée

Voir [`correctif_audit123_A_nouveau.md`](correctif_audit123_A_nouveau.md),
section 6, pour le détail des correctifs, des tests de régression ajoutés,
et la vérification en production (PR [#17](https://github.com/diallo68/sante_guin/pull/17),
commit `8686ae2`).
