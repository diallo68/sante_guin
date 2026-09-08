# Ré-audit indépendant — Santé Guinée / Mondocteur

**Révision examinée :** `main` à partir de `aeacc41`  
**Remédiation précédente fusionnée par :** `f41141d`  
**Date :** 9 septembre 2026  
**Nature :** audit statique, tests locaux et vérifications de build, sans exploitation distante ni modification de données.

## Résumé exécutif

La remédiation de l’audit initial est bien intégrée dans `main`. Les tests web passent et le build de production réussit. Plusieurs protections importantes sont présentes : contrôle des rôles, vérification du compte à chaque requête, stockage privé des nouveaux documents, validation par signature binaire, protection OAuth `state`, limites de fréquence et cache hors ligne réduit.

Des risques résiduels restent toutefois ouverts, notamment la révocation des JWT à la déconnexion, l’exposition du JWT dans la réponse JSON de connexion, les anciens documents potentiellement encore publics, le rate limiting non distribué et les journaux pouvant contenir des données sensibles.

## Critiques

Aucune vulnérabilité critique nouvelle n’a été démontrée.

## Élevées

### RA-01 — JWT non révoqué à la déconnexion

- **Endpoint :** `web/app/api/auth/logout/route.ts:4-7`
- **Sévérité :** Élevée
- **Confiance :** Confirmée dans le code
- **Observation :** le logout supprime seulement le cookie `gs_token`; il n’incrémente pas `tokenVersion`.
- **Impact :** un JWT copié avant le logout reste valable jusqu’à son expiration (7 jours).
- **Correction :** incrémenter `tokenVersion` côté serveur ou utiliser des sessions révocables.

### RA-02 — JWT renvoyé dans la réponse JSON web

- **Endpoint :** `web/app/api/auth/login/route.ts:78-80`
- **Sévérité :** Élevée
- **Confiance :** Confirmée
- **Observation :** la réponse contient `token` alors qu’un cookie HttpOnly est déjà créé.
- **Impact :** une XSS ou une compromission du code client peut récupérer un bearer token réutilisable.
- **Correction :** ne pas retourner le JWT au client web; séparer le flux mobile Bearer du flux web cookie.

## Moyennes

### RA-03 — Rate limiting basé sur une IP potentiellement falsifiable

- **Fichier :** `web/lib/rateLimit.ts:50-53`
- **Sévérité :** Moyenne
- **Confiance :** Probable
- **Observation :** le premier élément de `X-Forwarded-For` est accepté sans garantie que le proxy l’a réécrit.
- **Impact :** contournement possible des limites login, OTP et inscription.
- **Correction :** utiliser uniquement une IP fournie par un proxy de confiance et configurer celui-ci pour écraser l’en-tête.

### RA-04 — Rate limiting en mémoire non distribué

- **Fichier :** `web/lib/rateLimit.ts`
- **Sévérité :** Moyenne
- **Confiance :** Confirmée
- **Observation :** les compteurs sont stockés dans une `Map` locale au processus.
- **Impact :** en multi-instance, chaque instance possède ses propres limites.
- **Correction :** utiliser Redis ou un autre compteur distribué atomique.

### RA-05 — Compatibilité avec d’anciens fichiers médicaux publics

- **Fichiers :** routes de téléchargement patients/conversations et `web/public/sw.js`
- **Sévérité :** Moyenne à élevée selon l’historique
- **Confiance :** Probable
- **Observation :** les documents sans `storedFilename` sont encore lus depuis `public/uploads`; le service worker met en cache les chemins `/uploads/`.
- **Impact :** d’anciens documents pourraient rester accessibles directement ou être conservés dans un cache partagé.
- **Correction :** migrer puis supprimer les anciennes copies publiques et exclure tous les documents sensibles du cache.

### RA-06 — Journaux contenant potentiellement des données sensibles

- **Fichiers :** `web/lib/mailer.ts` et routes API
- **Sévérité :** Moyenne
- **Confiance :** Probable
- **Observation :** certains logs incluent le destinataire d’un email ou l’erreur brute.
- **Impact :** exposition d’emails, chemins ou détails internes dans les logs de production.
- **Correction :** masquer les données personnelles et utiliser un logger structuré.

### RA-07 — CSP encore permissive

- **Fichier :** `web/next.config.js`
- **Sévérité :** Moyenne
- **Confiance :** Confirmée
- **Observation :** `script-src` et `style-src` utilisent `unsafe-inline`.
- **Impact :** efficacité réduite contre certaines XSS inline.
- **Correction :** utiliser des nonces ou hashes et supprimer progressivement `unsafe-inline`.

## Faibles et informationnelles

### RA-08 — Middleware utilisant un décodage JWT non vérifié

- **Fichier :** `web/middleware.ts:7-18, 42-56`
- **Sévérité :** Faible à moyenne
- **Confiance :** Confirmée pour le contrôle de page
- **Observation :** le middleware décode le rôle sans vérifier la signature; les API vérifient correctement le token.
- **Impact :** affichage possible d’une coquille de page professionnelle avant refus par l’API.
- **Correction :** vérifier cryptographiquement le token dans le middleware ou déplacer la décision côté serveur.

### RA-09 — Acceptation des conditions non contrôlée côté serveur

- **Fichiers :** formulaire d’inscription et `web/app/api/auth/signup/route.ts`
- **Sévérité :** Faible
- **Confiance :** Confirmée
- **Observation :** la case est client-only; `acceptTerms` n’est pas exigé par l’API.
- **Correction :** valider et enregistrer l’acceptation côté serveur.

### RA-10 — Statistiques publiques incluant le nombre de patients

- **Endpoint :** `web/app/api/stats/route.ts`
- **Sévérité :** Faible / Informationnelle
- **Confiance :** Confirmée
- **Observation :** l’endpoint public renvoie le compteur `patients`.
- **Correction :** vérifier que cette divulgation est volontaire.

### RA-11 — Absence de tests mobiles

- **Fichier :** `mobile/package.json`
- **Sévérité :** Moyenne au niveau qualité
- **Confiance :** Confirmée
- **Observation :** `pnpm --dir mobile test` échoue car aucun test n’existe.
- **Correction :** ajouter des tests d’authentification, stockage local, uploads et gestion d’erreurs.

### RA-12 — Racine workspace ambiguë au build

- **Fichiers :** lockfiles racine/web et configuration Next.js
- **Sévérité :** Faible
- **Confiance :** Confirmée
- **Observation :** Next.js sélectionne le `package-lock.json` racine malgré le `pnpm-lock.yaml` de `web`.
- **Correction :** définir `outputFileTracingRoot` ou supprimer les lockfiles concurrents inutiles.

### RA-13 — Avertissements ESLint persistants

- **Fichiers :** plusieurs fichiers web
- **Sévérité :** Faible
- **Confiance :** Confirmée
- **Observation :** `any`, variables inutilisées et textes non échappés restent des avertissements.
- **Correction :** traiter progressivement ces avertissements, en priorité dans les routes sensibles.

## Contrôles vérifiés comme corrigés

- rôle `admin` exclu de l’inscription publique ;
- secret JWT obligatoire ;
- comptes suspendus/non vérifiés refusés ;
- revalidation du compte et de `tokenVersion` à chaque requête ;
- routes administratives protégées ;
- nouveaux documents stockés hors de `public/` ;
- types de fichiers vérifiés par signatures binaires ;
- OAuth protégé par `state` ;
- limites de fréquence présentes sur plusieurs routes ;
- cache hors ligne limité aux annuaires publics ;
- TypeScript web/mobile sans erreur ;
- build de production réussi ;
- tests web : **84/84 passants**.

## Tests non réalisés

- aucun POST de modification ;
- aucune injection SQL/NoSQL ou XSS active ;
- aucun accès à un fichier système ou à un dossier tiers ;
- aucune vérification des permissions MongoDB Atlas, du reverse proxy ou de la configuration de production ;
- aucun test mobile, faute de suite existante.

## Priorités de correction

1. Révoquer réellement les JWT à la déconnexion.
2. Ne plus renvoyer le JWT dans les réponses web.
3. Migrer et supprimer les anciennes copies de documents dans `public/uploads`.
4. Remplacer le rate limiting mémoire par une solution distribuée et fiabiliser l’adresse IP source.
5. Réduire les logs sensibles et renforcer la CSP sans `unsafe-inline`.

