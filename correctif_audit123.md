# Correctifs apportés suite à l'audit du 7 septembre 2026

Ce document fait le suivi de la remédiation de [`audit123.md`](audit123.md).
Il liste, point par point, ce qui a été corrigé et vérifié, et ce qui reste
ouvert.

Travail réalisé sur la branche `fix/audit-security-remediation`,
[PR #1](https://github.com/diallo68/sante_guin/pull/1), 3 commits :

- `373c3ab` — remédiation principale (S01-S21, B01-B28)
- `41e47da` — configuration ESLint (web)
- `6c40e9f` — dépendances web restantes
- `3c8df32` — backend fantôme mobile, ESLint mobile, dépendances mobile

À date, la PR n'est **pas fusionnée** dans `main` — décision laissée à
l'utilisateur.

## 1. Vulnérabilités de sécurité (S01-S21)

| # | Constat de l'audit | Statut | Où |
|---|---|---|---|
| S01 | Inscription publique comme administrateur | ✅ Corrigé | `web/app/api/auth/signup/route.ts` — whitelist `PUBLIC_SIGNUP_ROLES`, `admin` exclu |
| S02 | Secret JWT public de secours | ✅ Corrigé | `web/lib/auth.ts` — `throw` si `JWT_SECRET` absent, plus de valeur par défaut |
| S03 | Comptes suspendus/non vérifiés autorisés à se connecter | ✅ Corrigé | `web/app/api/auth/login/route.ts` + `google/callback/route.ts` — `isSuspended`/`isVerified` contrôlés |
| S04 | Sessions non révocables et rôles périmés | ✅ Corrigé | `web/lib/auth.ts` — `resolveSession()` revalide le compte (suspension, `tokenVersion`, rôle) à chaque requête |
| S05 | Usurpation d'expéditeur et association arbitraire de rendez-vous | ✅ Corrigé | `web/app/api/conversations/route.ts` — patient dérivé de la session, rendez-vous vérifié ; `web/lib/conversationAccess.ts` |
| S06 | Documents médicaux dans un espace public | ✅ Corrigé | Déplacés vers `web/private-uploads/` (hors `public/`), téléchargement par jeton signé (`web/lib/downloadToken.ts`) |
| S07 | Upload de contenu actif et XSS stockée | ✅ Corrigé | `web/lib/fileValidation.ts` — détection du type réel par signature binaire, SVG exclu des photos |
| S08 | Cache hors ligne partagé entre utilisateurs | ✅ Corrigé | `web/public/sw.js`, `web/lib/clientLogout.ts` — purge du cache à la déconnexion |
| S09 | Mots de passe/requêtes sensibles dans la file hors ligne | ✅ Corrigé | `web/components/PWAProvider.tsx` — authentification exclue de la file |
| S10 | Autorisations professionnelles appliquées surtout côté UI | ✅ Corrigé | `web/lib/proAccess.ts` — garde commune (rôle, abonnement) réutilisée par documents, IA, cabinet |
| S11 | Modification de champs administratifs du cabinet | ✅ Corrigé | `web/app/api/pro/cabinet/route.ts` — whitelist `EDITABLE_FIELDS`, `userId`/`isVerified`/`rating` exclus |
| S12 | Next.js vulnérable / SSRF potentielle | ✅ Corrigé | Next.js 14.2.35 → 15.5.25 |
| S13 | Aucune limitation des tentatives/volumes | ✅ Corrigé | `web/lib/rateLimit.ts` — appliqué à login, signup, resend-otp, delete-request ; OTP via `crypto.randomInt` (`web/lib/otp.ts`) |
| S14 | Seed destructif et identifiants partagés | ✅ Corrigé | `web/scripts/seed.ts` — refus si `NODE_ENV=production`, confirmation explicite `SEED_CONFIRM_DB`, upserts idempotents, mot de passe aléatoire |
| S15 | OAuth sans protection `state` | ✅ Corrigé | `web/lib/oauthState.ts` + `google/route.ts`/`google/callback/route.ts` |
| S16 | Annuaire de patients trop largement accessible | ✅ Corrigé | `web/app/api/conversations/new/route.ts` — restreint aux patients ayant un rendez-vous ou un dossier avec le professionnel |
| S17 | Entrées insuffisamment validées, regex non échappées | ✅ Corrigé | `web/lib/queryHelpers.ts` (`escapeRegex`, `parsePagination`), appliqué à doctors/laboratories/pharmacies |
| S18 | Pollution de prototype Mongoose | ✅ Corrigé | Mongoose 9.5.0 → 9.9.5 ; suppression de l'update libre du cabinet (voir S11) |
| S19 | Injection HTML dans les emails | ✅ Corrigé | `web/lib/htmlEscape.ts`, appliqué à `email.ts`, `mailer.ts`, subscribe, delete-request |
| S20 | Flux de données vers l'IA insuffisamment encadré | ✅ Corrigé | `web/app/api/ai/chat/route.ts` — abonnement actif requis, rôles/contenu des messages validés et bornés ; `privacy/page.tsx` mentionne désormais Groq |
| S21 | Protections navigateur et journalisation | ✅ Partiellement corrigé | `web/next.config.js` — CSP, X-Frame-Options, HSTS, Permissions-Policy ajoutés. Journalisation structurée avec masquage **non traitée**. |

## 2. Bugs fonctionnels (B01-B28)

| # | Constat | Statut | Note |
|---|---|---|---|
| B01 | Boucle de requêtes dans la messagerie | ✅ Corrigé | `web/app/messages/page.tsx`, `pro/messages/page.tsx` — déclenchement découplé de `convs` |
| B02 | `/profile` traité comme `/pro` par le middleware | ✅ Corrigé | `web/middleware.ts` — comparaison par segment |
| B03 | Double réservation de rendez-vous | ✅ Corrigé | `web/models/Appointment.ts` — index unique partiel `{doctorId, date, time}` sur statuts actifs |
| B04 | Aucun contrôle de disponibilité du créneau | ⚠️ Partiel | Contrainte d'unicité en place (B03) ; pas de endpoint dédié de disponibilités réelles |
| B05 | File hors ligne dupliquée en mémoire | ✅ Corrigé | Voir S09 — traité avec le nettoyage de la file |
| B06 | Métadonnées documents en mémoire de processus | ✅ Corrigé | `web/models/Document.ts` — persistance MongoDB (voir S06) |
| B07 | Promesse de connexion MongoDB rejetée mise en cache | ✅ Corrigé | `web/lib/db.ts` — `cached.promise` réinitialisée après échec |
| B08 | Mot de passe oublié non fonctionnel (web + mobile) | ✅ Corrigé | `web/app/api/auth/forgot-password/{request,verify,reset}/route.ts` |
| B09 | Fausse page verify-otp | ✅ Corrigé | `web/app/auth/verify-otp/page.tsx` supprimée |
| B10 | Champ `phone` absent du schéma User | ✅ Corrigé | `web/models/User.ts` |
| B11 | `getAuthUser()` appelé sans requête (Bearer mobile ignoré) | ✅ Corrigé | Passé partout où c'était manquant (dashboard, cabinet, etc.) |
| B12 | Contrats de réponse différents mobile/API (doctor/cabinet/dashboard) | ✅ Corrigé | `mobile/app/pro/{profile,cabinet,dashboard}.tsx` ajustés |
| B13 | Genre patient invalide, structure de liste incohérente | ✅ Corrigé | `mobile/app/pro/patients.tsx`, `web/app/api/pro/patients/route.ts` |
| B14 | Favoris laboratoires non implémentés | ✅ Corrigé | `web/app/api/favorites/route.ts` |
| B15 | DTO avis incohérent (patientName/date vs patientId/createdAt) | ✅ Corrigé | `web/app/api/reviews/route.ts`, `pro/reviews/route.ts` |
| B16 | Pagination admin cassée au-delà de 20 éléments | ✅ Corrigé | `web/app/api/admin/gestion-pro/route.ts` |
| B17 | Suppression sans gestion des références | ✅ Corrigé | `web/app/api/admin/users/[id]/route.ts`, `pro/reviews/route.ts` |
| B18 | Écritures liées non transactionnelles | ✅ Corrigé | `web/app/api/appointments/route.ts` |
| B19 | Échec SendGrid traité comme succès | ✅ Corrigé | `web/models/DeletionRequest.ts` — demande persistée indépendamment de l'envoi |
| B20 | Activation d'abonnement non idempotente | ✅ Corrigé | `web/app/api/admin/subscription-requests/route.ts` |
| B21 | Filtres avancés non lus par l'API/la liste | ✅ Corrigé | `web/app/api/doctors/route.ts` (minRating, maxPrice, language) |
| B22 | Pagination mobile absente, spécialités mal filtrées | ✅ Corrigé | `mobile/app/(tabs)/{doctors,laboratories,pharmacies}.tsx` |
| B23 | Upload documents mobile sans vérification | ✅ Corrigé | `mobile/app/pro/documents.tsx` |
| B24 | Compteur de conversations non lues incorrect par rôle | ✅ Corrigé | `web/app/api/conversations/unread/route.ts` |
| B25 | AuthContext mobile sans gestion d'erreur | ✅ Corrigé | `mobile/contexts/AuthContext.tsx`, `mobile/lib/authEvents.ts` |
| B26 | États de requête (sending/saving) sans try/finally | ✅ Corrigé | `web/app/messages/page.tsx`, `admin/demandes-pro/page.tsx` |
| B27 | Horaires laboratoire/pharmacie en heure locale du navigateur | ✅ Corrigé | `web/lib/openingHours.ts`, `mobile/lib/openingHours.ts` — fuseau Africa/Conakry |
| B28 | Statistiques mensuelles sans borne, `$last` sans tri | ✅ Corrigé | `web/app/api/pro/dashboard/route.ts`, `patients/route.ts` |

## 3. Socle technique

| Sujet | Statut | Détail |
|---|---|---|
| TypeScript web | ✅ 0 erreur | 5 erreurs préexistantes corrigées |
| TypeScript mobile | ✅ 0 erreur | 4 erreurs préexistantes corrigées + `newArchEnabled` (obsolète depuis Expo 55) retiré de `app.config.ts` |
| ESLint web | ✅ Configuré et bloquant | `web/eslint.config.mjs` ; `next.config.js` : `ignoreDuringBuilds: false` ; `no-explicit-any`/`no-unescaped-entities` en avertissement (126 occurrences préexistantes hors périmètre) |
| ESLint mobile | ✅ Configuré et bloquant | `mobile/eslint.config.js` ; dossier `components/` vestigial vide supprimé (faisait échouer `expo lint`) ; mêmes règles abaissées en avertissement (21 occurrences) |
| Suite de tests web | ✅ Créée et passante | `web/tests/` — 84 tests, 21 fichiers, MongoDB en mémoire (vitest + mongodb-memory-server) |
| Suite de tests mobile | ⚠️ Non traité | Toujours aucun fichier de test (état préexistant, non introduit par cette remédiation) |
| CI | ✅ Ajoutée | `.github/workflows/web-ci.yml` — typecheck, lint, tests, build sur push/PR ; vérifiée verte sur la PR #1 |
| Dépendances web (`pnpm audit`) | ✅ 32 → 0 vulnérabilité | nodemailer inutilisé retiré ; overrides `postcss`/`nanoid`/`brace-expansion` |
| Dépendances mobile (`pnpm audit`) | ⚠️ 86 → 48 vulnérabilités | Backend fantôme retiré (tRPC/Drizzle/MySQL2/Express/cookie/jose/superjson/qrcode, jamais importés) ; axios 1.13→1.15 ; vitest 2.1.9→3.2.7 (CVE critique corrigée). Le reliquat (shell-quote, ws, vite, js-yaml, postcss, image-size, xmldom...) est embarqué dans l'outillage interne Expo/Metro CLI — dev-only, non exécuté sur le téléphone. Non forcé par override : risque de casser la chaîne de build Expo sans pouvoir vérifier un vrai build EAS dans cet environnement. |
| Dépendances racine (`npm audit`) | ✅ 0 vulnérabilité | Puppeteer déjà à jour |

## 4. Ce qui reste ouvert

- **PR non fusionnée** : https://github.com/diallo68/sante_guin/pull/1 (CI verte, `MERGEABLE`) — en attente de décision.
- **S21 (journalisation)** : les erreurs brutes sont encore journalisées sans masquage systématique des données personnelles ni identifiant de corrélation.
- **B04** : pas d'endpoint dédié de disponibilités réelles des médecins (seule la contrainte d'unicité empêche le double booking, elle ne vérifie pas les horaires d'ouverture).
- **Dépendances mobile restantes (48)** : nécessitent une montée de version coordonnée du SDK Expo, testée sur un vrai build EAS — non réalisable dans cet environnement.
- **Tests mobile** : aucune suite n'existe. La commande `pnpm test` échoue immédiatement faute de fichiers.
- **Limites déjà actées par l'audit, non revérifiées ici** : permissions MongoDB Atlas, configuration Render (volumes, reverse proxy, certificats), validité réelle des clés (Groq, SendGrid, Google OAuth) en production.

## 5. Vérifications effectuées dans cette session

- `pnpm test` (web) : 84/84 tests passants
- `tsc --noEmit` (web et mobile) : 0 erreur
- `next lint` / `expo lint` : 0 erreur bloquante
- `next build` : build de production réussi avec ESLint/TypeScript bloquants activés
- `pnpm audit` (web et mobile) : vérifié avant/après chaque changement de dépendance
- CI GitHub Actions sur la PR #1 : `build-and-test` ✅ SUCCESS
