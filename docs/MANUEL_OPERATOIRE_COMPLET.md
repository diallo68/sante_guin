MANUEL OPERATOIRE COMPLET - Guinée Santé

Version 1.0 - Date: 16 Avril 2026

## TABLE DES MATIERES

1. Vue d'Ensemble
2. Architecture du Projet
3. Structure des Dossiers
4. Phases de Developpement
5. Guide Complet des Commandes
6. Details des Elements
7. Guide d'Integration
8. Guide de Test
9. Depannage
10. Bonnes Pratiques

## VUE D'ENSEMBLE

Plateforme complete de gestion de la sante en Guinee

### Technologies Utilisees

Frontend Web: Next.js 14, React 19, TypeScript, Tailwind CSS
Frontend Mobile: Expo 54, React Native, TypeScript, NativeWind
Backend: Express, tRPC, Node.js
Base de Donnees: MySQL, Drizzle ORM
Authentication: JWT, OAuth
Paiements: Wave Money API

## PHASES DE DEVELOPPEMENT

Phase 1: Accueil (Completee)
Phase 2: Authentification (Completee)
Phase 3: Recherche (Completee)
Phase 4: Details et Profils (Completee)
Phase 5: Espace Pro (Completee)
Phase 6: Admin (A Faire)
Phase 7: Paiements (A Faire)
Phase 8: Notifications (A Faire)

## GUIDE COMPLET DES COMMANDES

### Installation

git clone https://github.com/diallo68/sante_guin.git
cd sante_guin
cd web && pnpm install
cd ../mobile && pnpm install

### Developpement

cd web && pnpm dev
cd mobile && pnpm dev

### Build

cd web && pnpm build && pnpm start
cd mobile && pnpm ios
cd mobile && pnpm android

### Git

git add .
git commit -m 'Add: Manual and documentation'
git push origin main

## ESPACE PRO - ELEMENTS

1. Tableau de Bord (Dashboard )
   - Statistiques cles
   - Rendez-vous a venir
   - Actions rapides
   - Historique des activites

2. Gestion des Rendez-vous (Appointments)
   - Tableau des rendez-vous
   - Recherche par patient
   - Filtres par statut
   - Ajouter/modifier/supprimer

3. Gestion des Documents (Documents)
   - Grille des documents
   - Recherche et filtres
   - Upload de documents
   - Telecharger/supprimer

4. Gestion des Horaires (Schedule)
   - Horaires par jour
   - Modifier horaires
   - Marquer comme ferme
   - Appliquer a plusieurs jours

5. Profil Professionnel (Profile)
   - Informations professionnelles
   - Edition du profil
   - Photo de profil
   - Adresse

6. Avis et Notation (Reviews)
   - Note moyenne
   - Total d'avis
   - Taux de satisfaction
   - Filtrer par etoiles

## BONNES PRATIQUES

1. Nommage: Utiliser kebab-case pour les fichiers
2. Composants: Toujours definir les types TypeScript
3. Etat: Utiliser useState pour l'etat local, Context pour global
4. Erreurs: Toujours utiliser try-catch
5. Performance: Utiliser useMemo et useCallback

Version: 1.0
Date: 16 Avril 2026
Auteur: Equipe Guinee Sante
