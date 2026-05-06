# Suivi des Tâches — Mondocteur
> Dernière mise à jour : 05 mai 2026

---

## Vue d'ensemble

**Mondocteur** est une plateforme de santé numérique pour la Guinée permettant aux patients de trouver des médecins, pharmacies et laboratoires, et aux professionnels de santé de gérer leur cabinet via un espace Pro complet.

- **Web** : Next.js 14 (App Router) — déployé sur Render → [mondocteur.org](https://mondocteur.org)
- **Mobile** : Expo React Native
- **Base de données** : MongoDB Atlas
- **Auth** : JWT (cookie `gs_token`)
- **Email** : SendGrid HTTP API
- **IA** : Groq (llama-3.3-70b-versatile + llama-4-scout vision)

---

## Historique des tâches

### Phase 1 — Fondations (15–16 avril 2026)

| Date | Tâche | Description |
|------|-------|-------------|
| 15/04 | **Initialisation du projet** | Création de la structure web (Next.js) et mobile (Expo). Base de données MongoDB, modèles User, Doctor, Pharmacy, Appointment. |
| 16/04 | **Espace Pro — Phase 5** | Dashboard, gestion des rendez-vous, documents, planning, profil, avis. Mise en place du layout Pro avec sidebar. |
| 16/04 | **Application mobile** | Structure Expo React Native avec configuration EAS. |
| 16/04 | **Manuel opérationnel** | Documentation complète des commandes et de l'architecture. |

---

### Phase 2 — Fonctionnalités core (27–28 avril 2026)

| Date | Tâche | Description |
|------|-------|-------------|
| 27/04 | **Messagerie interne** | Conversations entre patients et professionnels, favoris, avis/notation. |
| 27/04 | **OAuth Google** | Connexion/inscription via compte Google. |
| 27/04 | **Footer & UX** | Pagination, debounce sur la recherche, footer complet. |
| 27/04 | **Rendu dynamique** | `force-dynamic` global pour corriger les problèmes SSR avec les cookies JWT. |
| 27/04 | **Bloc unifié page d'accueil** | Fusion des sections Pro, Partenaires et Comment ça marche en un seul bloc cohérent. |
| 27/04 | **Dashboard Admin** | Tableau de bord complet : stats, gestion utilisateurs, médecins, rendez-vous. |
| 27/04 | **Gestion Pro Admin** | Suspension de comptes, gestion des abonnements, emails SendGrid, renommage en "Mondocteur Pro". |
| 28/04 | **Correction inscription médecin** | Création automatique du document Doctor lors de l'inscription avec rôle `doctor`. |

---

### Phase 3 — Espace Pro avancé (03–04 mai 2026)

| Date | Tâche | Description |
|------|-------|-------------|
| 03/05 | **Laboratoires** | Ajout du type Laboratorist (inscription, profil, dashboard). |
| 03/05 | **Admin — Laboratoires** | Support laboratoires dans Gestion Pro + résiliation et suppression. |
| 03/05 | **Profil Admin** | Page de profil pour l'administrateur. |
| 04/05 | **Inscription OTP** | Vérification par code email à l'inscription. Pages login/signup fusionnées. |
| 04/05 | **Navbar améliorée** | Suppression bouton S'inscrire, barre de recherche déplacée dans la navbar (`flex-1`). |
| 04/05 | **Restriction espace Pro** | Accès Pro réservé aux abonnés actifs (`subscriptionStatus === 'active'`). |
| 04/05 | **Dashboard par rôle** | Dashboard Pro adapté automatiquement selon le rôle (médecin / pharmacie / laboratoire). |
| 04/05 | **Sidebar Pro** | Items distincts Créer / Gérer selon le type d'établissement. |
| 04/05 | **Nos Patients** | Section patients dans l'espace Pro médecin. |
| 04/05 | **Upload photo de profil** | Les médecins peuvent uploader leur photo depuis leur espace Pro. |
| 04/05 | **Rebranding** | Remplacement de "Guinée Santé" par "Mondocteur" sur toute la page d'accueil. |
| 04/05 | **Lien Mon Cabinet/Ma Pharmacie** | Lien dynamique dans la navbar selon le rôle Pro connecté. |
| 04/05 | **Ham — Assistant IA** | Intégration Groq (llama-3.3-70b-versatile) gratuit pour les professionnels de santé. Interface chat avec suggestions médicales et disclaimer. |
| 04/05 | **Correction modèle IA** | Mise à jour vers `llama-3.3-70b-versatile` (l'ancien 3.1 était déprécié). |
| 04/05 | **Renommage Assistant** | "Assistant IA" → "Votre Collaborateur" dans toute l'interface. |
| 04/05 | **Upload image pour Ham** | Envoi d'ordonnances et résultats d'examens à l'IA pour interprétation (modèle vision `llama-4-scout`). |
| 04/05 | **Section Ham — Page d'accueil** | Bloc de présentation de Ham sur la homepage avec chat simulé et CTA. |
| 04/05 | **Enregistrement manuel de patients** | Formulaire complet (prénom, nom, date de naissance, genre, téléphone, email, groupe sanguin, notes, documents). Upload multi-fichiers (images + PDF). Deux sections dans Nos Patients : patients manuels + patients RDV. |

---

### Phase 4 — PWA & Installation (05 mai 2026)

| Date | Tâche | Description |
|------|-------|-------------|
| 05/05 | **PWA — Mode hors ligne** | Service Worker (`/sw.js`) avec cache-first pour assets, network-first pour API. Précache des pages principales. Page `/offline` de fallback. |
| 05/05 | **PWA — Background sync** | File d'attente des requêtes hors ligne stockée dans localStorage. Synchronisation automatique au retour de la connexion. |
| 05/05 | **Manifest.json** | Manifest PWA avec icônes, shortcuts (Patients, RDV, Ham IA), thème teal. |
| 05/05 | **PWAProvider** | Composant dans le root layout : enregistrement SW, bannière offline (orange), bannière sync (teal), capture du prompt d'installation. |
| 05/05 | **Bouton d'installation** | `InstallAppButton` sur la page d'accueil : Pro → prompt natif, Non-Pro → modal "Souscrivez à l'option Pro". |
| 05/05 | **Section PWA page d'accueil** | Bloc "Continuez à travailler sans être connecté" avec avantages (vert) et limites (orange) juste avant le footer. |
| 05/05 | **Correction icônes manifest** | Utilisation de `logo_m.png` (1024×1024) avec déclaration correcte des tailles (192/512/1024). |
| 05/05 | **Installation Windows/Edge** | `display_override: window-controls-overlay`, shortcuts avec icônes, `edge_side_panel`. App installable nativement dans Windows via Edge. |
| 05/05 | **Instructions manuelles** | Modal avec guide pas-à-pas pour Chrome/Edge PC, Safari iOS, Chrome Android quand le prompt automatique n'est pas disponible. |

---

### Phase 5 — Abonnements Pro & Admin (05 mai 2026)

| Date | Tâche | Description |
|------|-------|-------------|
| 05/05 | **Mailer SendGrid** | Remplacement de nodemailer SMTP (bloqué par Render) par l'API HTTP SendGrid. Résout le problème de non-réception des emails OTP. |
| 05/05 | **Redirection "Découvrir l'offre Pro"** | Bouton de l'écran "Abonnement requis" redirige vers `/pro-avantages` (était `/pro`). |
| 05/05 | **Pré-remplissage formulaire souscription** | Le formulaire de contact dans `/pro-avantages` se pré-remplit avec le nom, téléphone et email de l'utilisateur connecté. |
| 05/05 | **Système de demandes d'abonnement** | Modèle `SubscriptionRequest` (MongoDB). API `POST /api/pro/subscribe`. Sauvegarde en base + email de notification à l'admin via SendGrid. |
| 05/05 | **Dashboard Admin — Demandes Pro** | Page `/admin/demandes-pro` : tableau filtrable (En attente / Contacté / Actif / Refusé), modal détail avec coordonnées, message, note interne. |
| 05/05 | **Badge notifications Admin sidebar** | Badge rouge dans la sidebar admin indiquant le nombre de demandes Pro en attente. |
| 05/05 | **3 actions dans le modal demande** | Remplacement des anciens boutons par 3 actions claires : ✅ Approuver + Activer / ❌ Refuser / ✉️ Envoyer un message sans décision. |
| 05/05 | **Activation automatique Pro** | Quand admin approuve : mise à jour de `subscriptionStatus = active` sur le profil Doctor/Pharmacy/Laboratory en MongoDB + calcul de la date d'expiration (Essentiel=1m, Confort=3m, Excellence=12m). |
| 05/05 | **Email activation/refus** | Email de félicitations envoyé à l'utilisateur à l'activation. Email de refus avec motif si rejeté. |
| 05/05 | **Refresh automatique global** | `PWAProvider` poll `/api/auth/me` toutes les 30s. Si rôle/statut change (activation Pro, suspension…) → `router.refresh()` automatique sans déconnexion. |
| 05/05 | **Poll espace Pro** | L'écran "Abonnement requis" poll `/api/pro/access` toutes les 10s. Redirection automatique vers le dashboard dès que l'admin active l'abonnement. |
| 05/05 | **Badge notifications Navbar** | Badge rouge sur l'avatar utilisateur : messages non lus + demandes Pro en attente (admin). Poll toutes les 30s. |

---

## Architecture technique

### Modèles MongoDB
| Collection | Rôle |
|---|---|
| `users` | Comptes utilisateurs (patient, doctor, pharmacist, laboratorist, admin) |
| `doctors` | Profils médecins + `subscriptionStatus/Plan/ExpiresAt` |
| `pharmacies` | Profils pharmacies + abonnement |
| `laboratories` | Profils laboratoires + abonnement |
| `appointments` | Rendez-vous patients/médecins |
| `conversations` / `messages` | Messagerie interne |
| `patientrecords` | Patients enregistrés manuellement par les Pro |
| `subscriptionrequests` | Demandes d'abonnement Pro depuis le site |
| `reviews` | Avis et notations |

### APIs principales
| Route | Méthode | Description |
|---|---|---|
| `/api/auth/signup` | POST | Inscription + envoi OTP |
| `/api/auth/verify-otp` | POST | Vérification du code OTP |
| `/api/auth/me` | GET | Session utilisateur (lecture DB fraîche) |
| `/api/pro/access` | GET | Vérifie l'abonnement Pro actif |
| `/api/pro/subscribe` | POST | Soumettre une demande d'abonnement |
| `/api/pro/patients` | GET/POST | Patients du professionnel |
| `/api/ai/chat` | POST | Chat avec Ham (Groq) |
| `/api/admin/subscription-requests` | GET/PATCH | Gestion des demandes Pro |

### Variables d'environnement (Render)
| Variable | Usage |
|---|---|
| `MONGODB_URI` | Connexion MongoDB Atlas |
| `JWT_SECRET` | Signature des tokens JWT |
| `GROQ_API_KEY` | API Ham (assistant IA) |
| `SENDGRID_API_KEY` | Envoi d'emails |
| `SENDGRID_FROM_EMAIL` | Adresse expéditeur + notifications admin |
| `NEXT_PUBLIC_APP_URL` | URL de l'application |

---

## Fonctionnalités en production

### ✅ Patients
- Recherche de médecins, pharmacies, laboratoires
- Prise de rendez-vous en ligne
- Messagerie avec les professionnels
- Profil et historique des RDV
- Favoris

### ✅ Professionnels de santé (Pro)
- Dashboard adapté par rôle (médecin / pharmacie / laboratoire)
- Agenda et gestion des rendez-vous
- Dossiers patients numériques
- Enregistrement manuel de patients avec documents
- Upload de photo de profil
- Ham — Assistant IA médical (Groq, gratuit)
- Interprétation d'ordonnances et examens par vision IA
- Mode hors ligne (PWA) — abonnés Pro uniquement

### ✅ Administration
- Tableau de bord : stats, utilisateurs, médecins
- Gestion Pro : abonnements, suspension, résiliation
- Demandes d'abonnement : réception, traitement, emails automatiques
- Notifications en temps réel (badge sidebar)

### ✅ PWA
- Installation sur PC (Chrome, Edge, Windows)
- Installation sur mobile (Android Chrome, iOS Safari)
- Mode hors ligne avec cache intelligent
- Synchronisation automatique au retour de connexion
- Refresh automatique sans déconnexion

---

---

### Phase 6 — Application mobile Android & Google Play (06 mai 2026)

| Date | Tâche | Description |
|------|-------|-------------|
| 06/05 | **Correction build EAS** | Remplacement des 6 PNG placeholders (70 octets) par de vraies images 1024×1024 générées depuis `logo_m.png`. Suppression de `edgeToEdgeEnabled` dans `app.config.ts` (déprécié Android 16). |
| 06/05 | **Assets mobile** | Génération de `icon.png`, `adaptive-icon-foreground/background/monochrome.png`, `splash-icon.png`, `favicon.png`. |
| 06/05 | **Page suppression de compte** | `/delete-account` (web) avec formulaire nom+email → notification admin via SendGrid. Requis par Google Play. |
| 06/05 | **Publication Google Play** | Création de l'app `org.mondocteur.mobile` sur Play Console. Configuration complète : confidentialité, annonces, classification IARC, sécurité des données, catégorie "Style de vie". |
| 06/05 | **Test fermé Alpha** | AAB version 4 (1.0.0) publié — disponible dans 177 pays. En attente de 12 testeurs pour démarrer le compteur 14 jours. |
| 06/05 | **Tab bar — 7 → 5 onglets** | Fusion Médecins/Pharmacies/Laboratoires en un seul onglet "Recherche" avec segment control. Résout le débordement de la tab bar sur Android. |
| 06/05 | **Safe area — edge-to-edge** | `SafeAreaProvider` ajouté au root layout. `SafeAreaView` remplacé par `react-native-safe-area-context` dans 21 écrans. Gestion correcte des encoches et home indicator Android. |
| 06/05 | **Page Pro Avantages (mobile)** | Écran `/pro-avantages` avec les 3 offres (Essentiel/Confort/Excellence), grille des fonctionnalités, bouton de souscription par email. Bouton "Découvrir" branché depuis la home. |
| 06/05 | **APK standard signé** | Build production disponible (89,6 Mo). Installable sur tout Android sans restriction testeur Google Play. |

---

## Build history

| Version | versionCode | Date | Statut | Notes |
|---------|-------------|------|--------|-------|
| 1.0.0 | 4 | 06/05/2026 | ✅ Alpha Play Store | Première soumission — test fermé en cours |

---

*Document mis à jour le 06/05/2026*
