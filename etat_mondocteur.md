# État du projet MonDocteur (sante_guin)

Dernière mise à jour : 8 septembre 2026.

Ce document résume, en un seul endroit, les trois chantiers menés début septembre 2026 sur `mondocteur.org` : la migration d'hébergement, la migration d'email, et l'audit de sécurité avec ses corrections. Pour le détail technique de l'audit, voir [audit123.md](audit123.md) (constats) et [correctif_audit123.md](correctif_audit123.md) (suivi point par point).

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

## 4. Audit de sécurité et corrections

Audit complet réalisé le 7 septembre 2026 ([audit123.md](audit123.md)) : 21 failles de sécurité classées par criticité (S01-S21) et 28 bugs fonctionnels (B01-B28), sur l'état du code à ce moment (révision `281ff31`).

**Corrections apportées** (détail dans [correctif_audit123.md](correctif_audit123.md)), fusionnées dans `main` via PR #1 :
- Accès et sessions : rôle admin bloqué à l'inscription publique, secret JWT de secours supprimé, comptes suspendus/non vérifiés bloqués, sessions révocables, protection CSRF sur l'OAuth Google.
- Données médicales : documents déplacés hors de l'espace public, téléchargement par jeton signé, détection réelle du type de fichier, purge du cache hors ligne à la déconnexion.
- Autorisations : garde commune pour les fonctionnalités professionnelles, whitelist des champs éditables, limitation de fréquence sur les endpoints sensibles, annuaire de patients restreint aux relations de soins réelles.
- Socle technique : Next.js 14→15.5, Mongoose 9.5→9.9, en-têtes de sécurité (CSP, HSTS, X-Frame-Options), ESLint configuré et bloquant en CI (jusque-là inexécutable), suite de tests créée (84 tests, MongoDB en mémoire), pipeline CI GitHub Actions.
- 27 des 28 bugs fonctionnels corrigés (boucle de messagerie, profil patient inaccessible, doubles réservations, reconnexion MongoDB, etc.).
- Nettoyage : suppression du backend fantôme mobile (tRPC/Drizzle/MySQL2/Express jamais utilisés), dépendances vulnérables résolues (web : 32 → 0 ; mobile : 86 → 48, le reste étant de l'outillage Expo/Metro interne non exécuté sur le téléphone).

**Points restés ouverts** (voir correctif_audit123.md section 4 pour le détail) :
- Journalisation structurée avec masquage des données personnelles (S21, partiel).
- Endpoint dédié de disponibilités réelles des médecins (B04, partiel — la contrainte anti-double-réservation est en place, pas la vérification des horaires).
- Dépendances mobiles restantes liées à l'outillage Expo/Metro (nécessite une montée de version SDK coordonnée, testée sur un vrai build EAS).
- Aucune suite de tests automatisés côté mobile.

## 5. Vérification finale en production

Après déploiement, les deux parcours utilisateur critiques ont été testés de bout en bout directement sur `mondocteur.org` (compte de test créé puis entièrement supprimé de la base après vérification) :

| Parcours | Résultat |
|---|---|
| Inscription → email OTP → vérification du compte → connexion | ✅ Email reçu, compte activé |
| Prise de rendez-vous → création automatique de la conversation → email de confirmation | ✅ Email reçu, conversation liée au bon rendez-vous |

## 6. Récapitulatif des liens

- Dépôt : [github.com/diallo68/sante_guin](https://github.com/diallo68/sante_guin)
- PR #1 — remédiation de l'audit de sécurité : fusionnée dans `main`
- PR #2 — migration SendGrid → Brevo : fusionnée dans `main`
- Site : [mondocteur.org](https://mondocteur.org)
- VM Oracle : `141.253.110.230` (partagée avec `yougouyougou.net` et `gandall.net`)
