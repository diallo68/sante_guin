#!/usr/bin/env bash
# Déploiement sur la VM Oracle (voir etat_mondocteur.md section 2).
# À exécuter directement sur la VM, depuis /home/ubuntu/sante_guin :
#   bash web/scripts/deploy-vm.sh
#
# `pnpm build` reconstruit .next/standalone/ à partir de zéro à chaque
# exécution : tout ce qui y était copié manuellement (assets statiques,
# .env.local) est perdu si on ne le recopie pas après le build. C'est
# l'erreur commise lors du déploiement du 8 septembre 2026 (signup cassé
# en production faute de MONGODB_URI dans le nouveau standalone) — ce
# script existe pour ne plus jamais l'oublier.
set -euo pipefail

cd "$(dirname "$0")/.."  # web/

echo "→ git pull"
git -C .. pull --ff-only

echo "→ pnpm install"
pnpm install

echo "→ pnpm build"
pnpm build

echo "→ copie des assets statiques et de l'environnement dans .next/standalone/"
cp -r .next/static/. .next/standalone/web/.next/static/
cp -r public/. .next/standalone/web/public/
cp .env.local .next/standalone/web/.env.local
chmod 600 .next/standalone/web/.env.local

echo "→ redémarrage PM2"
pm2 restart mondocteur --update-env

sleep 2
CODE=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3020/)
if [ "$CODE" != "200" ]; then
  echo "❌ Le site répond HTTP $CODE après redémarrage — vérifier 'pm2 logs mondocteur'"
  exit 1
fi
echo "✅ Déployé, site en HTTP 200"
