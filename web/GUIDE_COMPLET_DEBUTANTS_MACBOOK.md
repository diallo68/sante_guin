# Guide Complet pour Débutants - Guinée Santé Mobile
## MacBook Pro | Web & Mobile | Architecture Complète

---

## TABLE DES MATIÈRES

1. [Concepts Fondamentaux](#concepts-fondamentaux)
2. [Architecture Générale](#architecture-générale)
3. [Outils et Leur Rôle](#outils-et-leur-rôle)
4. [Structure des Fichiers](#structure-des-fichiers)
5. [Installation et Configuration](#installation-et-configuration)
6. [Commandes Terminal Expliquées](#commandes-terminal-expliquées)
7. [Développement Web](#développement-web)
8. [Développement Mobile](#développement-mobile)
9. [Intégration Backend](#intégration-backend)
10. [Déploiement](#déploiement)

---

# 1. CONCEPTS FONDAMENTAUX

## 1.1 Qu'est-ce qu'une Application Web et Mobile ?

### Application Web
- **Accès**: Via navigateur (Chrome, Safari, Firefox)
- **Plateforme**: Fonctionne sur n'importe quel ordinateur/téléphone avec un navigateur
- **Technologie**: HTML, CSS, JavaScript
- **Exemple**: Gmail, Facebook.com

### Application Mobile
- **Accès**: Installée sur le téléphone (App Store, Google Play)
- **Plateforme**: Spécifique à iOS (iPhone) ou Android
- **Technologie**: React Native, Swift (iOS), Kotlin (Android)
- **Exemple**: WhatsApp, Instagram App

### Application Hybride (Notre cas)
- **Web + Mobile**: Une seule codebase pour web ET mobile
- **Technologie**: React Native + Next.js
- **Avantage**: Développer une fois, déployer partout

---

## 1.2 Frontend vs Backend

### Frontend (Ce que l'utilisateur voit)
```
┌─────────────────────────────────────┐
│         INTERFACE UTILISATEUR        │
│  (Boutons, Formulaires, Images)     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Écran d'Accueil           │   │
│  │  ┌─────────────────────┐   │   │
│  │  │ [Médecins] [Pharm] │   │   │
│  │  │ [Rendez-vous]      │   │   │
│  │  └─────────────────────┘   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Technologie: React, React Native  │
│  Langage: JavaScript/TypeScript    │
└─────────────────────────────────────┘
```

**Responsabilités du Frontend:**
- Afficher les données à l'utilisateur
- Collecter les entrées utilisateur
- Valider les formulaires
- Afficher les erreurs/succès
- Gérer l'état de l'application

### Backend (Ce que l'utilisateur ne voit pas)
```
┌─────────────────────────────────────┐
│         SERVEUR BACKEND             │
│  (Logique métier, Données)          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   API REST / tRPC           │   │
│  │  /api/doctors               │   │
│  │  /api/appointments          │   │
│  │  /api/payments              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Base de Données           │   │
│  │  MongoDB / MySQL            │   │
│  │  - Utilisateurs             │   │
│  │  - Rendez-vous              │   │
│  │  - Paiements                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Technologie: Node.js, Express     │
│  Langage: JavaScript/TypeScript    │
└─────────────────────────────────────┘
```

**Responsabilités du Backend:**
- Traiter les demandes du frontend
- Accéder à la base de données
- Valider les données
- Gérer la sécurité (authentification)
- Envoyer des emails/SMS
- Traiter les paiements

---

## 1.3 Comment Frontend et Backend Communiquent

```
┌──────────────┐                    ┌──────────────┐
│   FRONTEND   │                    │   BACKEND    │
│  (Navigateur)│                    │   (Serveur)  │
└──────────────┘                    └──────────────┘
      │                                    │
      │  1. Utilisateur clique            │
      │     "Chercher un médecin"         │
      │                                    │
      ├──────────────────────────────────>│
      │  2. Envoie une requête HTTP       │
      │     GET /api/doctors?specialty=   │
      │     cardiologue                   │
      │                                    │
      │                                    │ 3. Backend recherche
      │                                    │    dans la BD
      │                                    │
      │<──────────────────────────────────┤
      │  4. Reçoit les données JSON       │
      │     [{id: 1, name: "Dr Ahmed"}]   │
      │                                    │
      │  5. Affiche les résultats         │
      │     à l'utilisateur               │
      │                                    │
```

---

# 2. ARCHITECTURE GÉNÉRALE

## 2.1 Architecture Complète de Guinée Santé Mobile

```
┌─────────────────────────────────────────────────────────────────┐
│                    UTILISATEUR FINAL                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  COUCHE PRÉSENTATION                        │ │
│  │                                                              │ │
│  │  ┌──────────────────┐         ┌──────────────────┐         │ │
│  │  │   APPLICATION    │         │   APPLICATION    │         │ │
│  │  │   WEB (Next.js)  │         │  MOBILE (Expo)   │         │ │
│  │  │                  │         │                  │         │ │
│  │  │ - Page d'accueil │         │ - Écran accueil  │         │ │
│  │  │ - Médecins       │         │ - Médecins       │         │ │
│  │  │ - Pharmacies     │         │ - Pharmacies     │         │ │
│  │  │ - Profil         │         │ - Profil         │         │ │
│  │  └──────────────────┘         └──────────────────┘         │ │
│  │           │                              │                  │ │
│  │           └──────────────────┬───────────┘                  │ │
│  │                              │                              │ │
│  │                    (HTTP/HTTPS)                             │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              COUCHE API (tRPC/REST)                        │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Endpoints:                                        │   │ │
│  │  │  - POST /api/auth/login                           │   │ │
│  │  │  - GET  /api/doctors                              │   │ │
│  │  │  - POST /api/appointments                         │   │ │
│  │  │  - POST /api/payments                             │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         COUCHE LOGIQUE MÉTIER (Backend)                   │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  Services:                                          │  │ │
│  │  │  - AuthService (authentification)                  │  │ │
│  │  │  - DoctorService (gestion médecins)                │  │ │
│  │  │  - AppointmentService (rendez-vous)                │  │ │
│  │  │  - PaymentService (paiements Wave)                 │  │ │
│  │  │  - NotificationService (SMS/Email)                 │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         COUCHE DONNÉES (Base de Données)                  │ │
│  │                                                              │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │ │
│  │  │  Users    │  │ Doctors    │  │Appointments│           │ │
│  │  │           │  │            │  │            │           │ │
│  │  │ - id      │  │ - id       │  │ - id       │           │ │
│  │  │ - email   │  │ - name     │  │ - doctorId │           │ │
│  │  │ - password│  │ - specialty│  │ - date     │           │ │
│  │  │ - type    │  │ - rating   │  │ - status   │           │ │
│  │  └────────────┘  └────────────┘  └────────────┘           │ │
│  │                                                              │ │
│  │  MongoDB / MySQL                                           │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         SERVICES EXTERNES                                 │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │ Africa's     │  │  SendGrid    │  │  Wave        │     │ │
│  │  │ Talking      │  │              │  │  Payment     │     │ │
│  │  │ (SMS)        │  │ (Email)      │  │ (Paiement)   │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. OUTILS ET LEUR RÔLE

## 3.1 Outils Frontend

### Next.js (Web)
**Rôle**: Framework React pour créer l'application web
**Fonction**: 
- Créer les pages web (accueil, médecins, pharmacies, etc.)
- Gérer le routage (navigation entre pages)
- Optimiser les performances

**Fichiers clés**:
```
app/
├── page.tsx          ← Page d'accueil
├── doctors/
│   └── page.tsx      ← Page des médecins
├── pharmacies/
│   └── page.tsx      ← Page des pharmacies
└── layout.tsx        ← Layout principal
```

### React Native + Expo (Mobile)
**Rôle**: Framework pour créer l'application mobile
**Fonction**:
- Créer les écrans mobiles (accueil, médecins, pharmacies, etc.)
- Accéder aux fonctionnalités du téléphone (caméra, GPS, notifications)
- Compiler pour iOS et Android

**Fichiers clés**:
```
app/
├── (tabs)/
│   ├── index.tsx     ← Écran d'accueil
│   ├── doctors.tsx   ← Écran des médecins
│   └── profile.tsx   ← Écran du profil
└── _layout.tsx       ← Navigation par onglets
```

### Tailwind CSS
**Rôle**: Système de design pour styliser l'interface
**Fonction**:
- Ajouter des couleurs, espacements, polices
- Créer un design cohérent et responsive

**Exemple**:
```tsx
<div className="bg-blue-500 p-4 rounded-lg">
  Texte blanc sur fond bleu
</div>
```

### TypeScript
**Rôle**: Langage de programmation typé
**Fonction**:
- Détecter les erreurs avant l'exécution
- Rendre le code plus maintenable

**Exemple**:
```typescript
// Sans TypeScript (JavaScript)
function addNumbers(a, b) {
  return a + b;
}

// Avec TypeScript
function addNumbers(a: number, b: number): number {
  return a + b;
}
```

---

## 3.2 Outils Backend

### Node.js
**Rôle**: Environnement d'exécution JavaScript côté serveur
**Fonction**:
- Exécuter le code JavaScript sur le serveur
- Gérer les requêtes HTTP
- Accéder à la base de données

### Express.js
**Rôle**: Framework pour créer l'API backend
**Fonction**:
- Créer des endpoints (routes)
- Gérer les requêtes HTTP (GET, POST, PUT, DELETE)
- Middleware pour la sécurité, validation

**Exemple**:
```typescript
// Créer un endpoint pour récupérer les médecins
app.get('/api/doctors', (req, res) => {
  const doctors = db.getDoctors();
  res.json(doctors);
});
```

### tRPC
**Rôle**: Framework pour créer une API type-safe
**Fonction**:
- Créer des endpoints avec validation automatique
- Partager les types entre frontend et backend
- Meilleure expérience développeur

**Exemple**:
```typescript
// Backend
export const doctorRouter = router({
  list: publicProcedure.query(async () => {
    return db.doctors.findMany();
  }),
});

// Frontend
const doctors = await trpc.doctors.list.query();
```

### MongoDB / MySQL
**Rôle**: Base de données pour stocker les données
**Fonction**:
- Stocker les utilisateurs, rendez-vous, paiements
- Rechercher et filtrer les données
- Mettre à jour les données

**Exemple**:
```
Utilisateurs:
- id: 1
- email: "user@example.com"
- type: "patient"

Médecins:
- id: 1
- name: "Dr Ahmed"
- specialty: "Cardiologue"
```

### Drizzle ORM
**Rôle**: Outil pour interagir avec la base de données
**Fonction**:
- Écrire des requêtes SQL en TypeScript
- Éviter les injections SQL
- Typage automatique

**Exemple**:
```typescript
// Récupérer tous les médecins
const doctors = await db.select().from(doctorsTable);

// Créer un utilisateur
await db.insert(usersTable).values({
  email: "user@example.com",
  type: "patient",
});
```

---

## 3.3 Outils de Communication

### Africa's Talking
**Rôle**: Service d'envoi de SMS
**Fonction**:
- Envoyer des SMS pour les notifications
- Envoyer des codes OTP pour la vérification
- Envoyer des rappels de rendez-vous

**Exemple**:
```typescript
await africasTalking.sms.send({
  to: "+224612345678",
  message: "Votre rendez-vous est confirmé pour demain à 14h"
});
```

### SendGrid
**Rôle**: Service d'envoi d'emails
**Fonction**:
- Envoyer des emails de confirmation
- Envoyer des reçus de paiement
- Envoyer des notifications

**Exemple**:
```typescript
await sendgrid.send({
  to: "user@example.com",
  subject: "Confirmation de rendez-vous",
  html: "<p>Votre rendez-vous est confirmé</p>"
});
```

### Wave
**Rôle**: Service de paiement mobile
**Fonction**:
- Traiter les paiements des consultations
- Gérer les transactions
- Générer les reçus

**Exemple**:
```typescript
const payment = await wave.charge({
  amount: 50000,
  currency: "GNF",
  phone: "+224612345678"
});
```

---

## 3.4 Outils de Déploiement

### Render
**Rôle**: Plateforme pour héberger le backend
**Fonction**:
- Déployer l'API sur internet
- Gérer les variables d'environnement
- Monitorer les performances

### Vercel
**Rôle**: Plateforme pour héberger l'application web
**Fonction**:
- Déployer l'application Next.js
- Optimiser les performances
- Déployer automatiquement à chaque push

### Google Play Store
**Rôle**: Plateforme pour distribuer l'application mobile Android
**Fonction**:
- Publier l'application
- Gérer les versions
- Collecter les avis utilisateurs

---

# 4. STRUCTURE DES FICHIERS

## 4.1 Structure Complète du Projet

```
guinee-sante-mobile/                    ← Dossier principal du projet
│
├── app/                                 ← Code source (partagé web + mobile)
│   ├── (tabs)/                          ← Onglets de navigation mobile
│   │   ├── _layout.tsx                  ← Configuration des onglets
│   │   ├── index.tsx                    ← Écran d'accueil
│   │   ├── doctors.tsx                  ← Écran des médecins
│   │   ├── pharmacies.tsx               ← Écran des pharmacies
│   │   └── profile.tsx                  ← Écran du profil
│   │
│   ├── auth/                            ← Pages d'authentification
│   │   ├── login/
│   │   │   └── page.tsx                 ← Page de connexion
│   │   └── signup/
│   │       └── page.tsx                 ← Page d'inscription
│   │
│   ├── admin/                           ← Pages administrateur
│   │   ├── dashboard/
│   │   │   └── page.tsx                 ← Tableau de bord admin
│   │   └── users/
│   │       └── page.tsx                 ← Gestion des utilisateurs
│   │
│   ├── _layout.tsx                      ← Layout principal (web + mobile)
│   └── page.tsx                         ← Page d'accueil web
│
├── components/                          ← Composants réutilisables
│   ├── screen-container.tsx             ← Conteneur pour les écrans
│   ├── doctor-card.tsx                  ← Carte d'affichage d'un médecin
│   ├── pharmacy-card.tsx                ← Carte d'affichage d'une pharmacie
│   ├── appointment-form.tsx             ← Formulaire de rendez-vous
│   └── ui/
│       ├── button.tsx                   ← Composant bouton
│       ├── input.tsx                    ← Composant input
│       └── modal.tsx                    ← Composant modal
│
├── hooks/                               ← Hooks React personnalisés
│   ├── use-auth.ts                      ← Hook pour l'authentification
│   ├── use-doctors.ts                   ← Hook pour récupérer les médecins
│   ├── use-appointments.ts              ← Hook pour les rendez-vous
│   └── use-notifications.ts             ← Hook pour les notifications
│
├── lib/                                 ← Utilitaires et services
│   ├── trpc.ts                          ← Configuration tRPC
│   ├── auth-service.ts                  ← Service d'authentification
│   ├── notifications-service.ts         ← Service de notifications
│   ├── payment-service.ts               ← Service de paiement Wave
│   └── utils.ts                         ← Fonctions utilitaires
│
├── server/                              ← Code backend
│   ├── _core/
│   │   └── index.ts                     ← Point d'entrée du serveur
│   ├── routers.ts                       ← Définition des routes tRPC
│   ├── auth.ts                          ← Logique d'authentification
│   ├── db.ts                            ← Fonctions de base de données
│   └── README.md                        ← Documentation backend
│
├── drizzle/                             ← Schéma de base de données
│   ├── schema.ts                        ← Définition des tables
│   └── migrations/                      ← Historique des changements BD
│
├── assets/                              ← Ressources (images, polices)
│   ├── images/
│   │   ├── icon.png                     ← Icône de l'app
│   │   ├── splash-icon.png              ← Image de démarrage
│   │   └── logo.png                     ← Logo de l'app
│   └── fonts/
│       └── custom-font.ttf              ← Polices personnalisées
│
├── constants/                           ← Constantes de l'application
│   ├── theme.ts                         ← Couleurs et thème
│   └── config.ts                        ← Configuration générale
│
├── public/                              ← Fichiers statiques (web)
│   ├── favicon.ico                      ← Icône du navigateur
│   └── robots.txt                       ← Configuration SEO
│
├── tests/                               ← Tests unitaires
│   ├── auth.test.ts                     ← Tests d'authentification
│   ├── appointments.test.ts             ← Tests des rendez-vous
│   └── payments.test.ts                 ← Tests des paiements
│
├── .env.local                           ← Variables d'environnement (local)
├── .env.production                      ← Variables d'environnement (production)
├── app.config.ts                        ← Configuration Expo
├── tailwind.config.js                   ← Configuration Tailwind
├── tsconfig.json                        ← Configuration TypeScript
├── package.json                         ← Dépendances du projet
├── pnpm-lock.yaml                       ← Verrous des dépendances
└── README.md                            ← Documentation du projet
```

## 4.2 Fichiers Web vs Mobile

### Fichiers Web (Next.js)
```
app/
├── page.tsx                    ← Page d'accueil web
├── doctors/page.tsx            ← Page des médecins web
├── pharmacies/page.tsx         ← Page des pharmacies web
├── auth/
│   ├── login/page.tsx          ← Page de connexion web
│   └── signup/page.tsx         ← Page d'inscription web
└── admin/
    └── dashboard/page.tsx      ← Dashboard admin web
```

### Fichiers Mobile (React Native)
```
app/
├── (tabs)/
│   ├── index.tsx               ← Écran d'accueil mobile
│   ├── doctors.tsx             ← Écran des médecins mobile
│   ├── pharmacies.tsx          ← Écran des pharmacies mobile
│   └── profile.tsx             ← Écran du profil mobile
├── auth/
│   ├── login.tsx               ← Écran de connexion mobile
│   └── signup.tsx              ← Écran d'inscription mobile
└── admin/
    └── dashboard.tsx           ← Écran admin mobile
```

---

# 5. INSTALLATION ET CONFIGURATION

## 5.1 Prérequis sur MacBook Pro

Avant de commencer, vous devez installer:

### 1. Homebrew (Gestionnaire de paquets)
```bash
# Qu'est-ce que c'est ?
# Homebrew permet d'installer des logiciels depuis le terminal

# Installation
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Vérification
brew --version
# Résultat attendu: Homebrew 4.0.0 (ou version plus récente)
```

### 2. Node.js et npm
```bash
# Qu'est-ce que c'est ?
# Node.js permet d'exécuter JavaScript en dehors du navigateur
# npm est le gestionnaire de paquets pour JavaScript

# Installation via Homebrew
brew install node

# Vérification
node --version     # Résultat: v18.0.0 ou plus
npm --version      # Résultat: 9.0.0 ou plus
```

### 3. pnpm (Gestionnaire de paquets optimisé)
```bash
# Qu'est-ce que c'est ?
# pnpm est plus rapide et utilise moins d'espace disque que npm

# Installation
npm install -g pnpm

# Vérification
pnpm --version     # Résultat: 8.0.0 ou plus
```

### 4. Git (Contrôle de version)
```bash
# Qu'est-ce que c'est ?
# Git permet de versionner le code et de collaborer

# Installation
brew install git

# Vérification
git --version      # Résultat: git version 2.40.0 ou plus

# Configuration
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
```

### 5. Xcode Command Line Tools (Pour iOS)
```bash
# Qu'est-ce que c'est ?
# Outils nécessaires pour compiler les applications iOS

# Installation
xcode-select --install

# Vérification
xcode-select -p    # Résultat: /Applications/Xcode.app/Contents/Developer
```

### 6. Android Studio (Pour Android)
```bash
# Qu'est-ce que c'est ?
# IDE pour développer les applications Android

# Installation manuelle
# Télécharger depuis: https://developer.android.com/studio
# Installer en double-cliquant le fichier DMG

# Après installation, ajouter au PATH
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
source ~/.zshrc

# Vérification
$ANDROID_HOME/emulator/emulator -list-avds
```

### 7. Expo CLI (Pour React Native)
```bash
# Qu'est-ce que c'est ?
# Outil pour développer et tester les applications React Native

# Installation
npm install -g expo-cli

# Vérification
expo --version     # Résultat: 5.0.0 ou plus
```

---

## 5.2 Créer le Projet

### Étape 1: Cloner le Projet Existant

```bash
# Qu'est-ce qu'on fait ?
# On télécharge le code du projet depuis GitHub

# Commande
git clone https://github.com/diallo68/guinee-sante-mobile.git

# Qu'est-ce que ça fait ?
# - Crée un dossier "guinee-sante-mobile"
# - Télécharge tout le code du projet
# - Crée un lien vers le repository GitHub

# Résultat
cd guinee-sante-mobile
```

### Étape 2: Installer les Dépendances

```bash
# Qu'est-ce qu'on fait ?
# On installe tous les paquets nécessaires

# Commande
pnpm install

# Qu'est-ce que ça fait ?
# - Lit le fichier package.json
# - Télécharge tous les paquets listés
# - Crée un dossier node_modules/
# - Crée un fichier pnpm-lock.yaml (verrous des versions)

# Temps estimé: 5-10 minutes
# Résultat: Tous les paquets sont installés
```

### Étape 3: Configurer les Variables d'Environnement

```bash
# Qu'est-ce qu'on fait ?
# On configure les clés API et informations sensibles

# Créer le fichier .env.local
cat > .env.local << 'EOF'
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Wave Payment
WAVE_API_KEY=your_wave_api_key
WAVE_MERCHANT_ID=your_merchant_id

# Africa's Talking
AFRICA_TALKING_API_KEY=your_at_api_key
AFRICA_TALKING_USERNAME=your_at_username

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/guinee-sante

# JWT Secret
JWT_SECRET=your_super_secret_key_change_this_in_production

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EOF

# Qu'est-ce que ça fait ?
# - Crée un fichier .env.local
# - Stocke les variables d'environnement
# - Ces variables ne sont pas versionnées (sécurité)
```

---

# 6. COMMANDES TERMINAL EXPLIQUÉES

## 6.1 Commandes de Développement

### Démarrer le Serveur de Développement

```bash
# Commande
pnpm dev

# Qu'est-ce que ça fait ?
# 1. Lance le backend (Express) sur le port 3000
# 2. Lance le frontend web (Next.js) sur le port 3001
# 3. Lance le serveur Metro (React Native) sur le port 8081
# 4. Affiche les URLs pour accéder à l'application

# Résultat
# ✓ Backend running on http://localhost:3000
# ✓ Web running on http://localhost:3001
# ✓ Mobile running on exp://localhost:8081

# Accès
# Web: Ouvrez http://localhost:3001 dans le navigateur
# Mobile: Scannez le code QR avec Expo Go
```

### Démarrer Uniquement le Backend

```bash
# Commande
pnpm dev:server

# Qu'est-ce que ça fait ?
# Lance uniquement le serveur backend (Express)
# Utile pour tester l'API seule

# Résultat
# ✓ Server running on http://localhost:3000
```

### Démarrer Uniquement le Frontend Web

```bash
# Commande
pnpm dev:web

# Qu'est-ce que ça fait ?
# Lance uniquement l'application web (Next.js)
# Utile pour développer l'interface web

# Résultat
# ✓ Web running on http://localhost:3001
```

### Démarrer Uniquement le Frontend Mobile

```bash
# Commande
pnpm dev:mobile

# Qu'est-ce que ça fait ?
# Lance uniquement le serveur Metro (React Native)
# Utile pour développer l'interface mobile

# Résultat
# ✓ Metro running on exp://localhost:8081
```

---

## 6.2 Commandes de Build

### Compiler pour Production

```bash
# Commande
pnpm build

# Qu'est-ce que ça fait ?
# 1. Compile le code TypeScript en JavaScript
# 2. Optimise le code pour la production
# 3. Crée les fichiers de distribution

# Résultat
# ✓ Build successful
# Fichiers créés dans le dossier .next/ et dist/
```

### Compiler l'Application Web

```bash
# Commande
pnpm build:web

# Qu'est-ce que ça fait ?
# Compile uniquement l'application web (Next.js)
# Crée les fichiers optimisés pour le déploiement

# Résultat
# ✓ Web build successful
```

### Compiler l'Application Mobile

```bash
# Commande
eas build --platform android

# Qu'est-ce que ça fait ?
# Compile l'application pour Android
# Crée un fichier APK ou AAB (Android App Bundle)

# Résultat
# ✓ Build successful
# Fichier: app-release.apk ou app-release.aab
```

---

## 6.3 Commandes de Test

### Exécuter les Tests

```bash
# Commande
pnpm test

# Qu'est-ce que ça fait ?
# Lance tous les tests unitaires
# Affiche les résultats de chaque test

# Résultat
# ✓ auth.test.ts (5 tests)
# ✓ appointments.test.ts (3 tests)
# ✓ payments.test.ts (2 tests)
# Total: 10 tests passed
```

### Exécuter les Tests en Mode Watch

```bash
# Commande
pnpm test:watch

# Qu'est-ce que ça fait ?
# Lance les tests et les relance à chaque modification de fichier
# Utile pendant le développement

# Résultat
# Tests relancés automatiquement à chaque sauvegarde
```

---

## 6.4 Commandes de Linting et Formatage

### Vérifier les Erreurs TypeScript

```bash
# Commande
pnpm check

# Qu'est-ce que ça fait ?
# Vérifie que le code TypeScript est correct
# Affiche les erreurs de type

# Résultat
# ✓ No TypeScript errors found
# ou
# ✗ 2 errors found
#   - app/page.tsx:10: Type 'string' is not assignable to type 'number'
```

### Formater le Code

```bash
# Commande
pnpm format

# Qu'est-ce que ça fait ?
# Formate automatiquement le code
# Ajoute des espaces, indentations, etc.

# Résultat
# ✓ Code formatted successfully
```

### Linter le Code

```bash
# Commande
pnpm lint

# Qu'est-ce que ça fait ?
# Vérifie les bonnes pratiques du code
# Affiche les avertissements et erreurs

# Résultat
# ✓ No linting errors found
# ou
# ⚠ 3 warnings
#   - app/page.tsx:5: Unused variable 'count'
```

---

## 6.5 Commandes de Base de Données

### Générer les Migrations

```bash
# Commande
pnpm db:push

# Qu'est-ce que ça fait ?
# 1. Génère les migrations Drizzle
# 2. Crée les tables dans la base de données
# 3. Met à jour le schéma

# Résultat
# ✓ Database updated successfully
```

### Voir les Données de la Base de Données

```bash
# Commande
pnpm db:studio

# Qu'est-ce que ça fait ?
# Lance une interface visuelle pour voir les données
# Permet de créer, modifier, supprimer des données

# Résultat
# ✓ Database studio running on http://localhost:5555
```

---

# 7. DÉVELOPPEMENT WEB

## 7.1 Architecture Web

```
┌─────────────────────────────────────┐
│      NAVIGATEUR WEB                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Page d'Accueil            │   │
│  │  ┌─────────────────────┐   │   │
│  │  │ [Médecins] [Pharm] │   │   │
│  │  │ [Rendez-vous]      │   │   │
│  │  └─────────────────────┘   │   │
│  │                             │   │
│  │  Technologie:              │   │
│  │  - React (composants)      │   │
│  │  - Next.js (pages)         │   │
│  │  - Tailwind CSS (styles)   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Page des Médecins         │   │
│  │  - Liste des médecins       │   │
│  │  - Filtrage par spécialité  │   │
│  │  - Recherche                │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
         │
         │ HTTP Request
         ▼
┌─────────────────────────────────────┐
│      BACKEND API                    │
│                                     │
│  GET /api/doctors                   │
│  GET /api/pharmacies                │
│  POST /api/appointments             │
│                                     │
└─────────────────────────────────────┘
         │
         │ Database Query
         ▼
┌─────────────────────────────────────┐
│      BASE DE DONNÉES                │
│                                     │
│  - Utilisateurs                     │
│  - Médecins                         │
│  - Pharmacies                       │
│  - Rendez-vous                      │
│                                     │
└─────────────────────────────────────┘
```

## 7.2 Créer une Page Web

### Étape 1: Créer le Fichier

```bash
# Créer le dossier
mkdir -p app/doctors

# Créer le fichier
cat > app/doctors/page.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les médecins
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => {
        setDoctors(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Nos Médecins</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {doctors.map(doctor => (
          <div key={doctor.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-bold">{doctor.name}</h2>
            <p className="text-gray-600">{doctor.specialty}</p>
            <p className="mt-2">⭐ {doctor.rating}/5</p>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
```

### Étape 2: Ajouter le Routage

```bash
# Le fichier app/doctors/page.tsx crée automatiquement la route
# Accès: http://localhost:3001/doctors
```

### Étape 3: Tester la Page

```bash
# Démarrer le serveur
pnpm dev

# Ouvrir le navigateur
# http://localhost:3001/doctors
```

---

## 7.3 Créer un Composant Web

```tsx
// components/doctor-card.tsx
interface DoctorCardProps {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  image?: string;
}

export function DoctorCard({ id, name, specialty, rating, image }: DoctorCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
      {image && (
        <img src={image} alt={name} className="w-full h-48 object-cover rounded mb-4" />
      )}
      
      <h3 className="text-xl font-bold text-gray-900">{name}</h3>
      <p className="text-gray-600 mb-2">{specialty}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-yellow-500">⭐ {rating}/5</span>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Rendez-vous
        </button>
      </div>
    </div>
  );
}

// Utilisation
import { DoctorCard } from '@/components/doctor-card';

export default function DoctorsPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <DoctorCard
        id={1}
        name="Dr Ahmed"
        specialty="Cardiologue"
        rating={4.8}
      />
    </div>
  );
}
```

---

# 8. DÉVELOPPEMENT MOBILE

## 8.1 Architecture Mobile

```
┌─────────────────────────────────────┐
│      TÉLÉPHONE (iOS/Android)        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Écran d'Accueil           │   │
│  │  ┌─────────────────────┐   │   │
│  │  │ [Médecins] [Pharm] │   │   │
│  │  │ [Rendez-vous]      │   │   │
│  │  └─────────────────────┘   │   │
│  │                             │   │
│  │  Technologie:              │   │
│  │  - React Native            │   │
│  │  - Expo                    │   │
│  │  - NativeWind (Tailwind)   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Écran des Médecins        │   │
│  │  - Liste des médecins       │   │
│  │  - Filtrage par spécialité  │   │
│  │  - Recherche                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Écran de Profil           │   │
│  │  - Informations utilisateur │   │
│  │  - Rendez-vous              │   │
│  │  - Paramètres               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
         │
         │ HTTP Request (tRPC)
         ▼
┌─────────────────────────────────────┐
│      BACKEND API                    │
│                                     │
│  POST /api/trpc/doctors.list        │
│  POST /api/trpc/appointments.create │
│  POST /api/trpc/payments.create     │
│                                     │
└─────────────────────────────────────┘
         │
         │ Database Query
         ▼
┌─────────────────────────────────────┐
│      BASE DE DONNÉES                │
│                                     │
│  - Utilisateurs                     │
│  - Médecins                         │
│  - Pharmacies                       │
│  - Rendez-vous                      │
│                                     │
└─────────────────────────────────────┘
```

## 8.2 Créer un Écran Mobile

### Étape 1: Créer le Fichier

```bash
# Créer le fichier
cat > app/doctors.tsx << 'EOF'
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les médecins via tRPC
    trpc.doctors.list.query().then(data => {
      setDoctors(data);
      setLoading(false);
    });
  }, []);

  const renderDoctor = ({ item }: any) => (
    <View className="border border-gray-200 rounded-lg p-4 mb-4">
      <Text className="text-xl font-bold">{item.name}</Text>
      <Text className="text-gray-600">{item.specialty}</Text>
      <Text className="mt-2">⭐ {item.rating}/5</Text>
      
      <TouchableOpacity className="bg-blue-500 p-3 rounded mt-4">
        <Text className="text-white font-bold text-center">Rendez-vous</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <Text className="text-2xl font-bold mb-4">Nos Médecins</Text>
      
      {loading ? (
        <Text>Chargement...</Text>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={item => item.id.toString()}
        />
      )}
    </ScreenContainer>
  );
}
EOF
```

### Étape 2: Ajouter à la Navigation

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="doctors"
        options={{
          title: "Médecins",
          tabBarIcon: ({ color }) => <Icon name="medical" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### Étape 3: Tester sur Téléphone

```bash
# Démarrer le serveur
pnpm dev

# Télécharger Expo Go sur votre téléphone
# Scannez le code QR affiché dans le terminal
```

---

## 8.3 Créer un Composant Mobile

```tsx
// components/doctor-card.tsx
import { View, Text, TouchableOpacity } from 'react-native';

interface DoctorCardProps {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  onPress?: () => void;
}

export function DoctorCard({ id, name, specialty, rating, onPress }: DoctorCardProps) {
  return (
    <View className="border border-gray-200 rounded-lg p-4 mb-4">
      <Text className="text-xl font-bold text-gray-900">{name}</Text>
      <Text className="text-gray-600 mb-2">{specialty}</Text>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-yellow-500">⭐ {rating}/5</Text>
        <TouchableOpacity
          onPress={onPress}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          <Text className="text-white font-bold">Rendez-vous</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Utilisation
import { DoctorCard } from '@/components/doctor-card';
import { useRouter } from 'expo-router';

export default function DoctorsScreen() {
  const router = useRouter();

  return (
    <View>
      <DoctorCard
        id={1}
        name="Dr Ahmed"
        specialty="Cardiologue"
        rating={4.8}
        onPress={() => router.push('/doctor-detail/1')}
      />
    </View>
  );
}
```

---

# 9. INTÉGRATION BACKEND

## 9.1 Architecture Backend

```
┌─────────────────────────────────────┐
│      CLIENT (Web/Mobile)            │
│                                     │
│  Envoie une requête HTTP            │
│  GET /api/doctors                   │
│                                     │
└─────────────────────────────────────┘
         │
         │ HTTP Request
         ▼
┌─────────────────────────────────────┐
│      EXPRESS SERVER                 │
│      (server/_core/index.ts)        │
│                                     │
│  1. Reçoit la requête               │
│  2. Valide les paramètres           │
│  3. Appelle le service              │
│  4. Retourne les données            │
│                                     │
└─────────────────────────────────────┘
         │
         │ Query
         ▼
┌─────────────────────────────────────┐
│      DRIZZLE ORM                    │
│      (server/db.ts)                 │
│                                     │
│  Convertit en SQL:                  │
│  SELECT * FROM doctors              │
│                                     │
└─────────────────────────────────────┘
         │
         │ SQL Query
         ▼
┌─────────────────────────────────────┐
│      BASE DE DONNÉES                │
│      (MongoDB / MySQL)              │
│                                     │
│  Retourne les données               │
│  [{id: 1, name: "Dr Ahmed"}]        │
│                                     │
└─────────────────────────────────────┘
```

## 9.2 Créer une Route Backend

### Étape 1: Définir le Schéma de Base de Données

```typescript
// drizzle/schema.ts
import { mysqlTable, int, varchar, decimal } from 'drizzle-orm/mysql-core';

export const doctorsTable = mysqlTable('doctors', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  specialty: varchar('specialty', { length: 255 }).notNull(),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Étape 2: Créer les Fonctions de Base de Données

```typescript
// server/db.ts
import { db } from './db-connection';
import { doctorsTable } from '@/drizzle/schema';

export async function getDoctors(specialty?: string) {
  let query = db.select().from(doctorsTable);
  
  if (specialty) {
    query = query.where(eq(doctorsTable.specialty, specialty));
  }
  
  return query;
}

export async function getDoctorById(id: number) {
  return db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
}

export async function createDoctor(data: any) {
  return db.insert(doctorsTable).values(data);
}
```

### Étape 3: Créer la Route tRPC

```typescript
// server/routers.ts
import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { getDoctors, getDoctorById } from './db';

export const appRouter = router({
  doctors: router({
    // Route pour récupérer tous les médecins
    list: publicProcedure
      .input(z.object({ specialty: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getDoctors(input?.specialty);
      }),

    // Route pour récupérer un médecin par ID
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getDoctorById(input);
      }),

    // Route pour créer un médecin
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        specialty: z.string(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        return createDoctor(input);
      }),
  }),
});
```

### Étape 4: Tester la Route

```bash
# Démarrer le serveur
pnpm dev:server

# Tester avec curl
curl http://localhost:3000/api/trpc/doctors.list

# Résultat
# [{"id":1,"name":"Dr Ahmed","specialty":"Cardiologue","rating":"4.8"}]
```

---

## 9.3 Utiliser la Route dans le Frontend

### Web

```tsx
// app/doctors/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    // Appeler la route tRPC
    trpc.doctors.list.query().then(setDoctors);
  }, []);

  return (
    <div>
      {doctors.map(doctor => (
        <div key={doctor.id}>
          <h2>{doctor.name}</h2>
          <p>{doctor.specialty}</p>
        </div>
      ))}
    </div>
  );
}
```

### Mobile

```tsx
// app/doctors.tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { trpc } from '@/lib/trpc';

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    // Appeler la route tRPC
    trpc.doctors.list.query().then(setDoctors);
  }, []);

  return (
    <View>
      <FlatList
        data={doctors}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.specialty}</Text>
          </View>
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}
```

---

# 10. DÉPLOIEMENT

## 10.1 Déployer le Backend sur Render

### Étape 1: Créer un Compte Render

```bash
# Aller sur https://render.com
# Créer un compte avec GitHub
```

### Étape 2: Créer un Service Web

```bash
# 1. Cliquer sur "New +" → "Web Service"
# 2. Connecter votre repository GitHub
# 3. Remplir les informations:
#    - Name: guinee-sante-api
#    - Environment: Node
#    - Build Command: pnpm build
#    - Start Command: pnpm start
# 4. Ajouter les variables d'environnement
# 5. Déployer
```

### Étape 3: Configurer les Variables d'Environnement

```bash
# Dans Render, ajouter:
# - MONGODB_URI
# - JWT_SECRET
# - WAVE_API_KEY
# - AFRICA_TALKING_API_KEY
# - SENDGRID_API_KEY
```

### Résultat

```
Backend URL: https://guinee-sante-api.onrender.com
```

---

## 10.2 Déployer le Frontend Web sur Vercel

### Étape 1: Créer un Compte Vercel

```bash
# Aller sur https://vercel.com
# Créer un compte avec GitHub
```

### Étape 2: Importer le Projet

```bash
# 1. Cliquer sur "Import Project"
# 2. Sélectionner votre repository GitHub
# 3. Vercel détecte automatiquement Next.js
# 4. Ajouter les variables d'environnement
# 5. Déployer
```

### Résultat

```
Web URL: https://guinee-sante.vercel.app
```

---

## 10.3 Publier sur Google Play Store

### Étape 1: Créer un Compte Google Play Developer

```bash
# Coût: 25$
# URL: https://play.google.com/console
```

### Étape 2: Générer l'APK Signé

```bash
# Générer le keystore
keytool -genkey -v -keystore guinee-sante.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias guinee-sante-key

# Générer l'APK
eas build --platform android --non-interactive
```

### Étape 3: Soumettre à Google Play

```bash
# 1. Aller à Google Play Console
# 2. Créer une nouvelle application
# 3. Remplir les informations
# 4. Télécharger l'APK
# 5. Soumettre pour examen
```

---

## RÉSUMÉ

Vous avez maintenant un guide complet pour:

✅ **Installer** tous les outils nécessaires
✅ **Configurer** le projet
✅ **Développer** l'application web et mobile
✅ **Créer** des routes backend
✅ **Tester** l'application
✅ **Déployer** sur Render, Vercel et Google Play Store

**Prochaines étapes:**
1. Installer les prérequis (Node.js, pnpm, etc.)
2. Cloner le projet
3. Installer les dépendances
4. Configurer les variables d'environnement
5. Démarrer le développement

Bonne chance ! 🚀
