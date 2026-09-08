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
| RA-03 | Rate limiting basé sur une IP potentiellement falsifiable (`X-Forwarded-For`) | ⏳ Ouvert | `web/lib/rateLimit.ts` |
| RA-04 | Rate limiting en mémoire non distribué | ⏳ Ouvert | `web/lib/rateLimit.ts` |
| RA-05 | Compatibilité avec d'anciens fichiers médicaux publics | ✅ Corrigé (partiel — voir note) | `web/public/sw.js` — `/uploads/patients/` et `/uploads/conversations/` exclus du cache (jamais `/uploads/doctors/`, public par nature), `CACHE_NAME` passé à `v3` pour purger le cache existant des installations déjà en place. `web/scripts/migrate-legacy-uploads.ts` : script de migration idempotent (dry-run par défaut), prêt à déplacer tout document/pièce jointe legacy vers `private-uploads/` |
| RA-06 | Journaux contenant potentiellement des données sensibles | ⏳ Ouvert | `web/lib/mailer.ts` et routes API |
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

- `pnpm test` (web) : 87/87 tests passants (85 précédents + 2 nouveaux : révocation au logout, distinction web/mobile sur login)
- `tsc --noEmit` (web et mobile) : 0 erreur
- `next lint` : aucun nouveau warning
- `next build` : succès
- CI GitHub Actions sur la PR #7 : `build-and-test` ✅ SUCCESS
- Requête directe sur la base Atlas de production pour confirmer l'absence de documents/pièces jointes legacy (RA-05)
