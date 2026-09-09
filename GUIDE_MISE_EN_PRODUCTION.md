# Guide — Mettre en production (mondocteur.org)

**Dernière mise à jour :** 9 septembre 2026.

Ce document explique, étape par étape et avec les commandes exactes,
comment faire passer un changement de code jusqu'au site réel
`mondocteur.org`. Objectif : pouvoir le refaire seul, sans repartir de
zéro. Pour le "quoi" (état du projet, audits, ce qui a déjà été corrigé),
voir [`etat_mondocteur.md`](etat_mondocteur.md) — ce guide-ci ne traite
que le "comment".

## 0. Vue d'ensemble en une image

```
Ton Mac                GitHub                    VM Oracle (production)
┌──────────┐           ┌──────────┐               ┌─────────────────────┐
│  code     │──commit──▶│  branche │──PR + merge──▶│  main                │
│  local    │  + push   │  perso   │               │  (git pull)          │
└──────────┘           └──────────┘               │        │             │
                                                    │  pnpm build          │
                                                    │        │             │
                                                    │  pm2 restart          │
                                                    │        │             │
                                                    │  Nginx → mondocteur   │
                                                    │  .org (HTTP 200)      │
                                                    └─────────────────────┘
```

**Deux mondes distincts** :
- Tout ce que tu fais en local ou sur `main` (GitHub) **ne sert personne** tant que ça n'a pas été déployé.
- La VM Oracle fait tourner une **copie indépendante** du code, qu'il faut explicitement mettre à jour (`git pull` + build + redémarrage). Rien n'est automatique.

## 1. Développer et vérifier en local

Toujours dans `web/` (c'est là que vit l'app déployée) :

```bash
cd /Users/mohamedbenhussein/sante_guin/web

pnpm typecheck        # erreurs de types (app)
pnpm test:typecheck   # erreurs de types (tests)
pnpm test             # suite de tests (MongoDB en mémoire, ~40s)
pnpm lint             # ESLint — doit finir en exit code 0 (les warnings existants sont OK, pas de nouvelle erreur)
pnpm build             # build de production réel — doit réussir sans erreur
```

Si l'une de ces commandes échoue, **ne pas déployer** : c'est exactement
ce qui casserait en production.

## 2. Commiter et envoyer sur GitHub

Ne jamais commiter directement sur `main` — toujours passer par une
branche + une Pull Request (PR), même seul :

```bash
cd /Users/mohamedbenhussein/sante_guin
git checkout main && git pull        # partir d'une base à jour
git checkout -b fix/nom-du-changement

git add <fichiers concernés>          # jamais `git add .` en aveugle —
                                       # vérifier `git status` avant
git commit -m "fix(...): description du changement"

git push -u origin fix/nom-du-changement
```

## 3. Ouvrir et fusionner la Pull Request

```bash
gh pr create --title "..." --body "..."
```

**Piège rencontré plusieurs fois dans cet environnement** : `gh` peut
échouer avec `HTTP 401: Bad credentials` si une variable d'environnement
`GITHUB_TOKEN` invalide est présente. Contournement — préfixer chaque
commande `gh` par `env -u GITHUB_TOKEN` :

```bash
env -u GITHUB_TOKEN gh auth status      # doit montrer "Active account: true"
env -u GITHUB_TOKEN gh pr create --title "..." --body "..."
```

Vérifier que la CI est verte avant de fusionner :

```bash
env -u GITHUB_TOKEN gh pr checks <numéro>
```

Puis fusionner (squash = un seul commit propre sur `main`, et supprime la
branche automatiquement) :

```bash
env -u GITHUB_TOKEN gh pr merge <numéro> --squash --delete-branch
```

Alternative sans terminal : ouvrir l'URL de la PR sur github.com et
cliquer **"Squash and merge"**.

Enfin, remettre son `main` local à jour :

```bash
git checkout main
git pull
```

## 4. Déployer sur la VM de production

**Deux façons de faire, au choix.**

### Option A — depuis le Mac, en une seule commande SSH

```bash
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230 \
  "cd /home/ubuntu/sante_guin && bash web/scripts/deploy-vm.sh"
```

### Option B — en se connectant d'abord à la VM

```bash
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230
cd /home/ubuntu/sante_guin
bash web/scripts/deploy-vm.sh
```

**Ce que fait `deploy-vm.sh`** (le lire une fois avec
`cat web/scripts/deploy-vm.sh` pour se l'approprier) :

1. `git pull --ff-only` — récupère le dernier `main`.
2. `pnpm install` — installe les dépendances si le lockfile a changé.
3. `pnpm build` — reconstruit `.next/standalone/` en entier (**écrase**
   tout ce qui y était copié manuellement auparavant).
4. Recopie les assets statiques et `.env.local` dans le nouveau
   `.next/standalone/web/` (nécessaire : l'étape 3 les avait effacés).
5. `pm2 restart mondocteur --update-env` — bascule réellement le trafic
   vers le nouveau code.
6. `curl` sur `http://127.0.0.1:3020/` pour confirmer un `HTTP 200` avant
   de considérer le déploiement réussi (`set -euo pipefail` : le script
   s'arrête à la moindre erreur, donc si une étape échoue, PM2 continue de
   servir l'**ancienne** version — pas de coupure silencieuse).

⚠️ Cette VM héberge **trois sites** (`mondocteur.org`, `yougouyougou.net`,
`gandall.net`, processus PM2 `mondocteur` / `yougouyougou` /
`gandal-backend` / `gandal-web`) — ne redémarrer/toucher que le processus
`mondocteur`.

## 5. Vérifier que le déploiement a réellement pris effet

Ne jamais supposer que ça a marché parce que la commande n'a rien affiché
d'anormal — toujours vérifier :

```bash
# 1) Le commit tournant sur la VM est bien le dernier de main
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230 \
  "cd /home/ubuntu/sante_guin && git log -1 --oneline"
# comparer avec :
git -C /Users/mohamedbenhussein/sante_guin log -1 --oneline origin/main

# 2) Le site répond
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' https://mondocteur.org/ --max-time 15

# 3) PM2 est "online", process récent
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230 "pm2 list"

# 4) Les logs ne montrent pas de nouvelle erreur
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230 \
  "ls -la --time-style=full-iso /home/ubuntu/.pm2/logs/mondocteur-error.log"
# → comparer la date de dernière modification avec l'heure du déploiement.
# Si le fichier n'a PAS bougé depuis avant le redémarrage : aucune
# nouvelle erreur. S'il a bougé, lire les nouvelles lignes :
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230 \
  "pm2 logs mondocteur --lines 50 --nostream"
```

**Important** : `mondocteur-error.log` accumule l'historique de **tous**
les déploiements passés sans jamais se vider tout seul — un `tail` brut
mélange donc de vieilles erreurs (déjà corrigées) avec d'éventuelles
nouvelles. Toujours comparer la date du fichier avec l'heure du
redémarrage (étape ci-dessus) avant de s'inquiéter d'une ligne d'erreur.

## 6. Smoke test fonctionnel (recommandé après chaque déploiement)

Quelques requêtes réelles contre la prod pour confirmer que les parcours
critiques fonctionnent — voir aussi la checklist complète dans
[`etat_mondocteur.md`](etat_mondocteur.md#6-smoke-test-recommandé-après-toute-nouvelle-livraison).

```bash
# Inscription (utiliser un email @example.com, jamais livré à une vraie boîte)
curl -sS -w '\nHTTP %{http_code}\n' -X POST https://mondocteur.org/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Test","lastName":"Deploy","email":"deploy-check-XXX@example.com","password":"TestPassword123","role":"patient","acceptTerms":true}'

# Login (doit échouer proprement avec un mauvais mot de passe, pas planter)
curl -sS -w '\nHTTP %{http_code}\n' -X POST https://mondocteur.org/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"deploy-check-XXX@example.com","password":"wrong"}'

# Route protégée sans token (doit renvoyer 401, jamais planter/500)
curl -sS -w '\nHTTP %{http_code}\n' -X POST https://mondocteur.org/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

## 7. Revenir en arrière si le déploiement casse quelque chose (rollback)

Le plus simple : redéployer l'ancien commit qui fonctionnait.

```bash
# Trouver le commit précédent qui marchait (sur le Mac, ou noté dans etat_mondocteur.md)
git log --oneline -5

# Sur la VM : forcer le code à cet ancien commit précis, puis rebuild + restart
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230
cd /home/ubuntu/sante_guin
git fetch origin
git checkout <hash-du-commit-precedent>
cd web && pnpm install && pnpm build
cp -r .next/static/. .next/standalone/web/.next/static/
cp -r public/. .next/standalone/web/public/
cp .env.local .next/standalone/web/.env.local
pm2 restart mondocteur --update-env

# Remettre la VM sur main dès que le correctif est prêt :
git checkout main
```

Ne **jamais** faire `git reset --hard`/force-push sur `main` lui-même pour
"annuler" — ça réécrit l'historique partagé. Un rollback se fait en
avançant (nouveau commit qui annule le changement, ou déploiement d'un
ancien commit comme ci-dessus), pas en revenant en arrière sur `main`.

## 8. Aide-mémoire (une fois familier)

```bash
# --- Cycle complet, du code à la prod ---
cd web && pnpm typecheck && pnpm test && pnpm lint && pnpm build   # 1. vérifier
cd .. && git checkout -b fix/xxx && git add -A && git commit -m "..." && git push -u origin fix/xxx   # 2. envoyer
env -u GITHUB_TOKEN gh pr create --title "..." --body "..."       # 3. PR
env -u GITHUB_TOKEN gh pr checks <n> && env -u GITHUB_TOKEN gh pr merge <n> --squash --delete-branch   # 4. fusionner
git checkout main && git pull                                      # 5. main à jour en local
ssh -i ~/.ssh/yougouyou_oracle ubuntu@141.253.110.230 "cd /home/ubuntu/sante_guin && bash web/scripts/deploy-vm.sh"   # 6. déployer
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' https://mondocteur.org/            # 7. vérifier
```

## 9. Où sont les informations sensibles

- **Clé SSH vers la VM** : `~/.ssh/yougouyou_oracle` (sur ce Mac uniquement — jamais commitée).
- **Secrets de production** (`MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, `BREVO_API_KEY`, `GROQ_API_KEY`) : uniquement dans `web/.env.local` **sur la VM** (jamais dans le dépôt Git — ce dépôt est **public** sur GitHub, vérifier `git status` avant tout commit touchant un fichier `.env*`).
- **IP de la VM** : `141.253.110.230` (partagée avec `yougouyougou.net` et `gandall.net`).
