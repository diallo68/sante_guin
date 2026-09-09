# Correctifs apportés suite au ré-audit du 9 septembre 2026

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
| RA-04 | Rate limiting en mémoire non distribué | ⚠️ Accepté (limite documentée) | `web/lib/rateLimit.ts` — le déploiement actuel tourne en **un seul** processus PM2 sur la VM Oracle (pas de cluster/multi-instance), donc la limite « chaque instance a son propre compteur » ne s'applique pas en pratique aujourd'hui. Introduire Redis serait une dépendance d'infrastructure supplémentaire non justifiée tant que le déploiement reste mono-instance ; à revisiter si une mise à l'échelle horizontale est envisagée |
| RA-05 | Compatibilité avec d'anciens fichiers médicaux publics | ✅ Corrigé (partiel — voir note) | `web/public/sw.js` — `/uploads/patients/` et `/uploads/conversations/` exclus du cache (jamais `/uploads/doctors/`, public par nature), `CACHE_NAME` passé à `v3` pour purger le cache existant des installations déjà en place. `web/scripts/migrate-legacy-uploads.ts` : script de migration idempotent (dry-run par défaut), prêt à déplacer tout document/pièce jointe legacy vers `private-uploads/` |
| RA-06 | Journaux contenant potentiellement des données sensibles | ✅ Corrigé | `web/lib/logger.ts` (nouveau) : `logError()`/`logWarn()` masquent tout email présent dans une erreur avant écriture (message Mongoose citant la valeur d'un champ, réponse d'erreur Brevo citant le destinataire...). Tous les `console.error('X:', error)` des routes API et de `lib/mailer.ts`/`lib/email.ts` (~30 fichiers) remplacés par `logError`/`logWarn` |
| RA-07 | CSP encore permissive (`unsafe-inline`) | ⏳ Ouvert | `web/next.config.js` |

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

## 3. Faibles et informationnelles

| # | Constat de l'audit | Statut | Où |
|---|---|---|---|
| RA-08 | Middleware décodant le JWT sans vérification de signature | ⏳ Ouvert | `web/middleware.ts` |
| RA-09 | `acceptTerms` non contrôlé côté serveur | ⏳ Ouvert | `web/app/api/auth/signup/route.ts` |
| RA-10 | `/api/stats` public expose le nombre de patients | ⏳ À confirmer avec l'utilisateur | `web/app/api/stats/route.ts` |
| RA-11 | Absence de tests mobiles | ⏳ Ouvert | `mobile/package.json` |
| RA-12 | Racine workspace ambiguë au build (lockfiles concurrents) | ⏳ Ouvert | lockfiles racine/web, `next.config.js` |
| RA-13 | Avertissements ESLint persistants | ⏳ Ouvert | plusieurs fichiers web |

## 4. Vérifications effectuées dans cette session

- `pnpm test` (web) : 95/95 tests passants (85 initiaux + 10 nouveaux : révocation au logout, distinction web/mobile sur login, `clientIp()`, `logger.ts`)
- `tsc --noEmit` (web et mobile) : 0 erreur
- `next lint` : aucun nouveau warning
- `next build` : succès
- CI GitHub Actions sur les PR #7 et #8 : `build-and-test` ✅ SUCCESS
- Requête directe sur la base Atlas de production pour confirmer l'absence de documents/pièces jointes legacy (RA-05)

## 5. Note — accès à la VM de production

Cette session n'a pas pu se connecter en SSH à la VM Oracle pour vérifier
la configuration Nginx réelle (`proxy_set_header X-Forwarded-For
$proxy_add_x_forwarded_for;` / `X-Real-IP $remote_addr;`, dont dépend le
correctif RA-03) — bloqué par le mode automatique de l'environnement.
**À vérifier manuellement** (ou dans une session avec les permissions SSH)
avant de considérer RA-03 pleinement fermé : si Nginx ne pose pas ces deux
en-têtes exactement ainsi, `clientIp()` reste contournable.
