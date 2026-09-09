# Correctifs apportés suite au ré-audit du 9 septembre 2026

**Déployé en production** (VM Oracle, `bash web/scripts/deploy-vm.sh`) le
9 septembre 2026, en deux temps (RA-01 à RA-13 puis RA-04/Redis séparément).
Vérifié sur `mondocteur.org` : `Content-Security-Policy` avec nonce
présent, `/profile` sans session redirige toujours vers `/auth/login`,
site HTTP 200, et une tentative de login réelle crée bien les clés
`login:ip:*`/`login:acct:*` dans Redis (`redis-cli keys`).

Ce document fait le suivi de la remédiation de [`audit123_A_nouveau.md`](audit123_A_nouveau.md),
qui confirme que la remédiation du premier audit ([`audit123.md`](audit123.md),
voir [`correctif_audit123.md`](correctif_audit123.md)) est bien intégrée dans
`main`, et liste des risques résiduels.

## 1. Élevées

| # | Constat de l'audit | Statut | Où |
|---|---|---|---|
| RA-01 | JWT non révoqué à la déconnexion | ✅ Corrigé | `web/app/api/auth/logout/route.ts` — incrémente `tokenVersion` de l'utilisateur authentifié |
| RA-02 | JWT renvoyé dans la réponse JSON web | ✅ Corrigé | `web/lib/auth.ts` (`isMobileClient()`), `web/app/api/auth/login/route.ts`, `change-password/route.ts` — `token` uniquement si header `X-Client-Platform: mobile` (envoyé par `mobile/lib/api.ts`) ; le web s'appuie sur le seul cookie httpOnly |

PR : [#7](https://github.com/diallo68/sante_guin/pull/7), fusionnée (`ed86066`), CI verte, 87/87 tests.

## 2. Moyennes

| # | Constat de l'audit | Statut | Où |
|---|---|---|---|
| RA-03 | Rate limiting basé sur une IP potentiellement falsifiable (`X-Forwarded-For`) | ✅ Corrigé | `web/lib/rateLimit.ts` (`clientIp()`) — préfère `X-Real-IP` (valeur unique posée par le proxy) ; à défaut retient le **dernier** élément de `X-Forwarded-For` (ajouté par Nginx via `$proxy_add_x_forwarded_for`), pas le premier (fourni par le client, donc falsifiable). Suppose que Nginx est bien configuré ainsi — non vérifiable depuis cette session (voir note) |
| RA-04 | Rate limiting en mémoire non distribué | ✅ Corrigé | `web/lib/rateLimit.ts` — compteur distribué via Redis (`ioredis`, `INCR`/`PEXPIRE`/`PTTL`), obligatoire en production (`REDIS_URL`, échec au démarrage sinon — même garde-fou que `MONGODB_URI`/`JWT_SECRET`). Repli en mémoire locale conservé pour `pnpm dev` sans Redis installé, et en cas de panne Redis temporaire (best-effort, journalisé via `logError`). Redis installé sur la VM Oracle (`redis-server`, lié à `127.0.0.1` uniquement, mot de passe requis) |
| RA-05 | Compatibilité avec d'anciens fichiers médicaux publics | ✅ Corrigé (partiel — voir note) | `web/public/sw.js` — `/uploads/patients/` et `/uploads/conversations/` exclus du cache (jamais `/uploads/doctors/`, public par nature), `CACHE_NAME` passé à `v3` pour purger le cache existant des installations déjà en place. `web/scripts/migrate-legacy-uploads.ts` : script de migration idempotent (dry-run par défaut), prêt à déplacer tout document/pièce jointe legacy vers `private-uploads/` |
| RA-06 | Journaux contenant potentiellement des données sensibles | ✅ Corrigé | `web/lib/logger.ts` (nouveau) : `logError()`/`logWarn()` masquent tout email présent dans une erreur avant écriture (message Mongoose citant la valeur d'un champ, réponse d'erreur Brevo citant le destinataire...). Tous les `console.error('X:', error)` des routes API et de `lib/mailer.ts`/`lib/email.ts` (~30 fichiers) remplacés par `logError`/`logWarn` |
| RA-07 | CSP encore permissive (`unsafe-inline`) | ✅ Corrigé (partiel — voir note) | `web/middleware.ts` — CSP posée dynamiquement avec un nonce par requête ; `script-src` n'a plus `unsafe-inline` (remplacé par `'nonce-<valeur>' 'strict-dynamic'`) ; `app/layout.tsx` lit le nonce (`headers()`) pour que Next.js l'applique à ses propres scripts injectés (hydratation, RSC) ; `web/next.config.js` ne fixe plus de CSP statique (nonce différent à chaque requête) |

**Note RA-05** : vérifié en base de production (`guinee_sante`) qu'il n'existe
**actuellement aucun** document `PatientRecord.documents` ni pièce jointe
`Message.attachments` sans `storedFilename` — la collection `PatientRecord`
est même vide (0 document) et aucun message n'a de pièce jointe. Il n'y a
donc aujourd'hui aucun fichier legacy réellement exposé sous
`public/uploads/{patients,conversations}/` à migrer. Le correctif du service
worker (défense en profondeur) est appliqué dès maintenant ; le script de
migration reste prêt si des documents legacy apparaissaient (import de
données, restauration de sauvegarde, etc.) — l'exécuter avec `--apply` sur le
serveur de production le jour où `recordsWithDocs`/`messagesWithAttachments`
redeviendrait non nul.

**Note RA-07** : `style-src` garde `'unsafe-inline'`. React compile les
`style={{...}}` (6 occurrences dans `app/`/`components/`) en attribut
`style` inline sur l'élément DOM, que ni un nonce ni un hash ne peuvent
couvrir côté React sans passer par une solution CSS-in-JS dédiée — hors
périmètre de cette remédiation. Le risque réel visé par l'audit
(exécution de script) est fermé ; l'injection CSS pure reste un vecteur
beaucoup plus faible en pratique.

**Piège rencontré (RA-12)** : un premier essai avec
`outputFileTracingRoot: path.join(__dirname)` (web/ lui-même, plutôt que la
racine du repo déjà inférée par Next.js) supprime bien l'avertissement,
mais change aussi la structure du build standalone
(`.next/standalone/server.js` au lieu de `.next/standalone/web/server.js`)
— ce dont dépendent `web/scripts/deploy-vm.sh` et la configuration PM2 de
production. Repéré en tentant un déploiement réel sur la VM : `pnpm build`
et `git pull` s'exécutent sans erreur, mais l'étape de copie des assets
échoue ensuite (`cp: cannot create directory '.next/standalone/web/.next/
static/'`) — le script s'arrête avant `pm2 restart` (`set -euo pipefail`),
donc **aucune coupure** : le processus PM2 en cours continue de servir
l'ancien code jusqu'à un restart, qui n'a jamais eu lieu. Corrigé en
pointant `outputFileTracingRoot` vers la racine du repo (`../` depuis
web/) au lieu de web/ lui-même : même structure de build qu'avant,
avertissement toujours supprimé.

**Note RA-11** : couvre ce qui est testable sans rendu React Native complet
— stockage de session (`lib/auth.ts`, natif via `expo-secure-store` vs.
web via `localStorage`), client API (`lib/api.ts` : en-tête
`X-Client-Platform`, injection du Bearer token, déclenchement de
`triggerUnauthorized()` sur 401), bus d'événements (`lib/authEvents.ts`)
et calcul d'horaires (`lib/openingHours.ts`, régression B27). `react-native`
et `expo-secure-store` sont mockés (leurs modules natifs ne s'exécutent
pas sous Node) — c'est pourquoi vitest reste l'outil (déjà en place côté
web) plutôt que d'introduire `jest-expo`, qui aurait résolu ça autrement
mais avec un nouvel outillage.

**Non couvert**, faute de module extractible et testable sans rendu
d'écran complet (React Testing Library + environnement de rendu React
Native, hors périmètre ici) : le flux d'upload de documents
(`app/pro/documents.tsx`, logique `DocumentPicker`/`FormData` intégrée
directement à l'écran, jamais extraite dans `lib/`) et tout test au niveau
écran/composant. `pnpm --dir mobile test` passe désormais (21/21) au lieu
d'échouer faute de fichiers, mais ce n'est pas une couverture exhaustive.

## 3. Faibles et informationnelles

| # | Constat de l'audit | Statut | Où |
|---|---|---|---|
| RA-08 | Middleware décodant le JWT sans vérification de signature | ✅ Corrigé | `web/lib/jwtEdge.ts` (nouveau, vérification `jose` compatible Edge runtime, sans dépendance Mongoose) + `web/middleware.ts` (`verifyTokenEdge()` au lieu d'un simple décodage base64) |
| RA-09 | `acceptTerms` non contrôlé côté serveur | ✅ Corrigé | `web/app/api/auth/signup/route.ts` — refuse (400) si `acceptTerms !== true`, stocke `acceptedTermsAt` (`web/models/User.ts`). `web/app/auth/login/page.tsx` (web) envoie désormais `acceptTerms` au serveur. `mobile/app/(auth)/login.tsx` : la case n'existait pas du tout côté mobile — ajoutée (checkbox + liens CGU/confidentialité + `acceptTerms` dans la requête) |
| RA-10 | `/api/stats` public expose le nombre de patients | ✅ Confirmé intentionnel | `web/app/api/stats/route.ts`, affiché sur `app/page.tsx` (page d'accueil publique) comme preuve sociale, au même titre que le nombre de médecins/pharmacies/laboratoires. Un compteur agrégé n'expose aucune donnée individuelle — pas d'action requise |
| RA-11 | Absence de tests mobiles | ✅ Corrigé (partiel — voir note) | `mobile/vitest.config.ts` (nouveau), `mobile/lib/__tests__/{auth,api,authEvents,openingHours}.test.ts` (21 tests), `.github/workflows/mobile-ci.yml` (nouveau, typecheck+lint+test sur push/PR touchant `mobile/**`) |
| RA-12 | Racine workspace ambiguë au build (lockfiles concurrents) | ✅ Corrigé (voir piège rencontré) | `web/next.config.js` — `outputFileTracingRoot: path.join(__dirname, '..')` déclare explicitement la racine du repo (déjà celle que Next.js inférait) au lieu de laisser Next.js le deviner |
| RA-13 | Avertissements ESLint persistants | ⚠️ Réduit (108 restants, tous préexistants sauf mention contraire) | Tous les `no-unused-vars` mécaniquement sûrs corrigés (imports d'icônes inutilisés, `catch (error)` sans usage → `catch {}` ou `logError()` quand le catch avalait l'erreur sans aucun log, état mort `newPatientId` dans `app/pro/patients/page.tsx`). Les avertissements `no-unescaped-entities` (cosmétique, aucun impact fonctionnel) et `no-explicit-any`/`exhaustive-deps` (changement de comportement potentiel, pas de simple lint fix) laissés tels quels — décision déjà actée dans la remédiation initiale (« volontairement non bloquants »). `components/InstallAppButton.tsx` : `canInstall` laissé en l'état, son retrait poserait la question produit de savoir si le bouton doit changer d'apparence avant que le prompt d'installation soit disponible — hors périmètre d'un lint fix |

**Note RA-04** : en test, `ioredis` est mocké par `ioredis-mock` (voir
`tests/setup/testSetup.ts`), qui simule un vrai serveur Redis en mémoire —
les tests exercent donc le vrai code `INCR`/`PEXPIRE`/`PTTL`, pas le repli
local. `web/tests/api/rate-limit.test.ts` vérifie explicitement que le
compteur est bien stocké côté Redis (avec expiration), pas dans une Map en
mémoire.

## 4. Vérifications effectuées dans cette session

- `pnpm test` (web) : 100/100 tests passants (85 initiaux + nouveaux : révocation au logout, distinction web/mobile sur login, `clientIp()`, `logger.ts`, signature JWT et CSP en middleware, `acceptTerms`)
- `tsc --noEmit` (web et mobile) : 0 erreur
- `next lint` / `expo lint` : aucun nouveau warning
- `next build` : succès
- CI GitHub Actions sur les PR #7, #8, #9 : `build-and-test` ✅ SUCCESS
- Requête directe sur la base Atlas de production pour confirmer l'absence de documents/pièces jointes legacy (RA-05)
- Build de production démarré localement (`node .next/standalone/web/server.js`) : `curl` vérifié que le nonce du header `Content-Security-Policy` correspond bien à celui injecté par Next.js dans les `<script nonce="...">` du HTML rendu, que `/profile` sans cookie redirige toujours vers `/auth/login`, et que `/api/*` n'est pas concerné par le nonce (RA-07/RA-08)
- `pnpm build` ne montre plus l'avertissement « Next.js inferred your workspace root » (RA-12)
- `pnpm build` sans `REDIS_URL` échoue bien dès l'import avec le message attendu (même garde-fou que MONGODB_URI/JWT_SECRET) ; avec `REDIS_URL` (même un placeholder non joignable, grâce à `lazyConnect`), le build réussit normalement (RA-04)
- Redis installé et vérifié sur la VM Oracle : `redis-cli ping` → `PONG`, lié à `127.0.0.1` uniquement, mot de passe requis, service activé au démarrage (`systemctl is-enabled` → `enabled`)

## 5. Note — accès à la VM de production

Cette session n'a pas pu se connecter en SSH à la VM Oracle pour vérifier
la configuration Nginx réelle (`proxy_set_header X-Forwarded-For
$proxy_add_x_forwarded_for;` / `X-Real-IP $remote_addr;`, dont dépend le
correctif RA-03) — bloqué par le mode automatique de l'environnement.
**À vérifier manuellement** (ou dans une session avec les permissions SSH)
avant de considérer RA-03 pleinement fermé : si Nginx ne pose pas ces deux
en-têtes exactement ainsi, `clientIp()` reste contournable.
