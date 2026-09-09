# État du projet MonDocteur (sante_guin)

Dernière mise à jour : 9 septembre 2026.

Ce document résume, en un seul endroit, l'état courant de `mondocteur.org` : la migration d'hébergement, la migration d'email, et les trois tours d'audit de sécurité menés à ce jour avec leurs corrections. Pour le détail technique, voir [audit123.md](audit123.md)/[correctif_audit123.md](correctif_audit123.md) (audit initial, S01-S21/B01-B28), [audit123_A_nouveau.md](audit123_A_nouveau.md)/[correctif_audit123_A_nouveau.md](correctif_audit123_A_nouveau.md) (ré-audit, RA-01 à RA-16 — inclut le complément Codex du 9 septembre, voir [audit_codex_2026-09-09.md](audit_codex_2026-09-09.md)).

**Production à jour au commit `8686ae2`** (PR [#17](https://github.com/diallo68/sante_guin/pull/17)), vérifié sur `mondocteur.org` le 9 septembre 2026 (voir section 5).

## 1. Contexte

Le service Render de `mondocteur.org` a été suspendu pour facture impayée (`This service has been suspended`), comme celui de YouGouYouGou quelques jours plus tôt. Plutôt que de régler Render, décision de migrer définitivement vers l'infrastructure Oracle Cloud Always Free déjà en place pour YouGouYouGou. Le compte SendGrid a été abandonné dans la foulée (même dépendance à Render) et remplacé par Brevo.

## 2. Migration d'hébergement — Render → Oracle Cloud

**Cible :** la VM Oracle Ampere A1 (ARM) déjà utilisée pour `yougouyougou.net`, IP `141.253.110.230`, plutôt qu'une VM dédiée — pour rester dans le quota Always Free. Cette VM héberge maintenant trois sites : `yougouyougou.net`, `gandall.net` (projet préexistant, découvert sur place, sans historique documenté) et `mondocteur.org`.

**Mise en place :**
- Code cloné dans `/home/ubuntu/sante_guin` via une clé de déploiement GitHub dédiée en lecture seule (`~/.ssh/deploy_key_santeguin`, alias SSH `github-santeguin` — une clé de déploiement GitHub ne peut être associée qu'à un seul dépôt, d'où une clé distincte de celle de YouGouYouGou).
- Application Next.js 15 buildée en mode `standalone` et lancée via PM2 (process `mondocteur`, port local `3020`, lié à `127.0.0.1`). Le serveur standalone (`node .next/standalone/web/server.js`) est utilisé plutôt que `next start`, incompatible avec `output: standalone`.
- Nginx configuré en reverse proxy (`/etc/nginx/sites-available/mondocteur`) vers `127.0.0.1:3020`.
- Certificat SSL Let's Encrypt obtenu via Certbot pour `mondocteur.org` et `www.mondocteur.org` — expire le 2026-12-07, renouvellement automatique.
- DNS basculé chez Namecheap : enregistrements A (`@` et `www` → `141.253.110.230`). Les anciens enregistrements CNAME pointant vers `mondocteur.onrender.com`, ainsi que les enregistrements d'authentification SendGrid désormais inutiles, ont été supprimés — ils étaient en conflit DNS avec les nouveaux A records.
- Variables d'environnement de production copiées directement sur la VM par SSH (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY` récupérées depuis le `.env.local` local ; MongoDB Atlas et Groq restent externes, aucune donnée à migrer de ce côté).
- Nginx et PM2 activés au démarrage (`systemctl is-enabled` confirmé) — le site redémarre automatiquement après un reboot de la VM.

**Statut :** en production, vérifié (`https://mondocteur.org` et `https://www.mondocteur.org` répondent HTTP 200, en-têtes de sécurité présents).

## 3. Migration email — SendGrid → Brevo

- `web/lib/emailProvider.ts` centralise désormais l'appel à l'API Brevo (`api.brevo.com/v3/smtp/email`), utilisé par `lib/email.ts` et `lib/mailer.ts` — qui dupliquaient auparavant chacun leur propre client SendGrid avec des conventions d'erreur différentes.
- Domaine `mondocteur.org` authentifié dans Brevo (TXT de vérification + 2 CNAME DKIM ajoutés chez Namecheap). Le même compte Brevo authentifie aussi `gandall.net` et `yougouyougou.net`.
- Clé API Brevo (`xkeysib-...`, à distinguer de la clé SMTP `xsmtpsib-...` qui ne fonctionne pas avec l'API REST — piège rencontré en cours de route) installée sur la VM et dans le `.env.local` local.
- **Statut : vérifié en conditions réelles.** Emails de test reçus en boîte de réception (pas en spam, signe que SPF/DKIM sont correctement configurés) : email transactionnel simple, code OTP d'inscription, confirmation de rendez-vous.

## 4. Audits de sécurité et corrections

Trois tours d'audit à ce jour, chacun sur l'état du code au moment de sa
réalisation — le détail technique complet est dans les fichiers liés, ce
qui suit n'est qu'un résumé pour n'avoir qu'un seul document à ouvrir.

### 4.1. Audit initial — 7 septembre 2026

[audit123.md](audit123.md) : 21 failles de sécurité classées par criticité
(S01-S21) et 28 bugs fonctionnels (B01-B28), sur la révision `281ff31`.

**Corrections** (détail : [correctif_audit123.md](correctif_audit123.md)),
fusionnées via PR #1 :
- Accès et sessions : rôle admin bloqué à l'inscription publique, secret JWT de secours supprimé, comptes suspendus/non vérifiés bloqués, sessions révocables, protection CSRF sur l'OAuth Google.
- Données médicales : documents déplacés hors de l'espace public, téléchargement par jeton signé, détection réelle du type de fichier, purge du cache hors ligne à la déconnexion.
- Autorisations : garde commune pour les fonctionnalités professionnelles, whitelist des champs éditables, limitation de fréquence sur les endpoints sensibles, annuaire de patients restreint aux relations de soins réelles.
- Socle technique : Next.js 14→15.5, Mongoose 9.5→9.9, en-têtes de sécurité (CSP, HSTS, X-Frame-Options), ESLint configuré et bloquant en CI, suite de tests créée (84 tests, MongoDB en mémoire), pipeline CI GitHub Actions.
- 27 des 28 bugs fonctionnels corrigés.
- Nettoyage : suppression du backend fantôme mobile (tRPC/Drizzle/MySQL2/Express jamais utilisés), dépendances vulnérables résolues (web : 32 → 0 ; mobile : 86 → 48, reste = outillage Expo/Metro non exécuté sur le téléphone).

### 4.2. Ré-audit — 9 septembre 2026 (RA-01 à RA-13)

[audit123_A_nouveau.md](audit123_A_nouveau.md) : confirme que la
remédiation de l'audit initial tient en production, relève 13 risques
résiduels (2 élevés, 5 moyens, 6 faibles/informationnels).

**Corrections** (détail : [correctif_audit123_A_nouveau.md](correctif_audit123_A_nouveau.md)
sections 1-4), fusionnées via PR #7 à #16 :
- JWT révoqué à la déconnexion (`tokenVersion`) et non renvoyé au client web (RA-01, RA-02).
- IP source fiable pour le rate limiting, masquage des emails dans les logs, rate limiting distribué via Redis au lieu d'une Map par processus (RA-03, RA-04, RA-06).
- Anciens documents patients/conversations exclus du cache du service worker (RA-05).
- CSP par nonce (suppression de `unsafe-inline` sur `script-src`), vérification cryptographique du JWT en middleware, `acceptTerms` contrôlé côté serveur — web et mobile (RA-07, RA-08, RA-09).
- Racine de workspace explicite au build, nettoyage ESLint mécaniquement sûr (RA-12, RA-13).
- Première suite de tests mobile + CI dédiée, 21 tests (RA-11).

### 4.3. Complément d'audit (Codex) — 9 septembre 2026 (RA-14 à RA-16)

[audit_codex_2026-09-09.md](audit_codex_2026-09-09.md) : second passage,
mené avec Codex sur l'état post-RA-13. 3 failles réelles sur 5 points
relevés (2 étaient déjà corrects).

**Corrections** (détail : [correctif_audit123_A_nouveau.md](correctif_audit123_A_nouveau.md#6-ré-audit-complémentaire-codex-9-septembre-2026--ra-14-à-ra-16)
section 6), fusionnées via PR #17 :
- Échappement HTML de `adminNote`/`nom`/`planName` dans les emails envoyés depuis `/api/admin/subscription-requests` (RA-14).
- Validation stricte du statut de souscription côté serveur (RA-15).
- Quota Redis (30 req/10 min par compte) sur `/api/ai/chat`, jusque-là sans aucune limite (RA-16).
- 5 tests de régression ajoutés (102 → 107).

### 4.4. Points restés ouverts

- Journalisation structurée avec masquage des données personnelles (S21) : partiel, voir RA-06 pour ce qui est couvert.
- Endpoint dédié de disponibilités réelles des médecins (B04) : partiel — la contrainte anti-double-réservation est en place, pas la vérification des horaires.
- Dépendances mobiles restantes liées à l'outillage Expo/Metro : nécessite une montée de version SDK coordonnée, testée sur un vrai build EAS.
- `style-src` CSP garde `unsafe-inline` (RA-07, partiel) : les `style={{...}}` React compilés en attribut inline ne peuvent pas être couverts par un nonce/hash sans passer par une solution CSS-in-JS dédiée ; le risque réel visé (exécution de script) est fermé.
- RA-03 (IP source fiable) suppose une configuration Nginx précise (`X-Real-IP`/`X-Forwarded-For` posés par le proxy, pas par le client) — jamais vérifiée directement sur la config Nginx de la VM, seulement déduite du comportement du site.
- Couverture des tests mobiles : ce qui est extractible en modules purs (auth, stockage, client API, horaires) est testé (21 tests) ; les écrans (React Native, upload de documents) ne le sont pas.
- Comportement réel du quota `/api/ai/chat` (RA-16) avec un compte Pro effectivement abonné : couvert par les tests automatisés (Redis simulé), pas vérifié manuellement en production (le test de fumée s'est arrêté à la garde d'authentification, `401`, faute de compte Pro actif jetable disponible pour le test).
- `adminNote` (texte libre saisi par l'admin) n'a pas de limite de longueur/type explicite avant écriture en base — actuellement sans conséquence connue (échappé à l'affichage depuis RA-14), mais à border si ce champ devient plus exposé.
- Avertissements ESLint restants (`no-explicit-any`, `no-unescaped-entities`) : RA-13 les a réduits mais pas éliminés, laissés volontairement non bloquants (voir correctif_audit123_A_nouveau.md).
- `next lint` est en cours de dépréciation par Next.js au profit de l'ESLint CLI natif — migration à prévoir avant une évolution majeure de version.
- Pas de suivi récurrent formalisé : `pnpm audit` (dépendances), coûts/usage réels de l'API Groq après mise en place du quota RA-16, et absence de secret dans les commits (aucune fuite connue à ce jour, mais aucune vérification automatisée type secret-scanning en CI).

## 5. Vérification finale en production

**Parcours utilisateur** (après le déploiement de l'audit initial, compte
de test créé puis supprimé de la base après vérification) :

| Parcours | Résultat |
|---|---|
| Inscription → email OTP → vérification du compte → connexion | ✅ Email reçu, compte activé |
| Prise de rendez-vous → création automatique de la conversation → email de confirmation | ✅ Email reçu, conversation liée au bon rendez-vous |

**Déploiement du 9 septembre 2026** (PR #17, commit `8686ae2`,
`bash web/scripts/deploy-vm.sh`) :

| Vérification | Résultat |
|---|---|
| Build + redémarrage PM2 sur la VM | ✅ `pnpm build` réussi, `pm2 restart mondocteur` → `online` |
| Commit effectivement en cours d'exécution (`git log -1` sur la VM) | ✅ `8686ae2` |
| Site accessible | ✅ `https://mondocteur.org/` → `HTTP 200` |
| Logs PM2 (`mondocteur-error.log`) après redémarrage | ✅ Inchangés — aucune nouvelle erreur |
| `POST /api/ai/chat` sans token | ✅ `401` (nouvel import `rateLimit.ts` ne casse pas le module) |
| `POST /api/auth/signup` (compte jetable `deploy-check-*@example.com`) | ✅ `201`, email OTP mis en file |
| `POST /api/auth/login` (mauvais mot de passe) | ✅ `401` |

Compte de test `deploy-check-1788947263@example.com` (patient, non vérifié)
laissé en base à l'issue de cette vérification — à supprimer depuis
l'admin si besoin.

## 6. Smoke test recommandé après toute nouvelle livraison

Checklist manuelle à parcourir après chaque déploiement en production
(au-delà des vérifications automatiques CI) :

1. Page d'accueil → `HTTP 200`.
2. Inscription + validation OTP.
3. Connexion web puis déconnexion (vérifier que la session est bien révoquée — RA-01).
4. Création et consultation d'un rendez-vous.
5. Accès `/pro/*` : accepté avec abonnement actif, refusé sans abonnement.
6. Upload puis téléchargement d'un document autorisé.
7. Messagerie : envoi d'un message, contrôle d'accès à une conversation tierce refusé.
8. Demande d'abonnement Pro + changement de statut côté admin (vérifie aussi RA-14/RA-15 : email reçu correctement formaté, statut invalide refusé).
9. Quota `/api/ai/chat` : réponse `429` après dépassement (RA-16) — nécessite un compte Pro actif pour aller au-delà de la garde d'authentification.
10. Logs PM2 (`pm2 logs mondocteur --lines 100 --nostream`) : comparer la taille/mtime de `mondocteur-error.log` avant/après pour isoler les erreurs réellement nouvelles (le fichier n'est jamais purgé automatiquement) ; vérifier l'absence de secrets ou données personnelles en clair.

## 7. Récapitulatif des liens

- Dépôt : [github.com/diallo68/sante_guin](https://github.com/diallo68/sante_guin)
- PR #1 — remédiation de l'audit de sécurité initial : fusionnée
- PR #2 — migration SendGrid → Brevo : fusionnée
- PR #7 à #16 — remédiation du ré-audit RA-01 à RA-13 : fusionnées
- PR #17 — remédiation du complément d'audit Codex RA-14 à RA-16 : fusionnée
- Site : [mondocteur.org](https://mondocteur.org)
- VM Oracle : `141.253.110.230` (partagée avec `yougouyougou.net` et `gandall.net`), accès SSH `ubuntu@141.253.110.230` (clé `~/.ssh/yougouyou_oracle` en local sur ce Mac)
- Déploiement production : `bash web/scripts/deploy-vm.sh`, exécuté depuis `/home/ubuntu/sante_guin` sur la VM (`git pull` + `pnpm build` + copie assets/`.env.local` + `pm2 restart mondocteur --update-env`)
