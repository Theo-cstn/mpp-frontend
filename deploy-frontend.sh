#!/bin/bash

# Déploiement rapide du frontend MPP
# Usage: ./deploy-frontend.sh

set -e

DOKKU_DOMAIN="cluster-ig3.igpolytech.fr"
APP_FRONTEND="mpp-frontend"
BACKEND_URL="https://mpp-backend.cluster-ig3.igpolytech.fr"

echo "🎨 === DÉPLOIEMENT FRONTEND MPP ==="
echo "Backend: $BACKEND_URL (✅ Fonctionnel)"
echo "Frontend: $APP_FRONTEND"
echo ""

# Vérifier qu'on est dans le bon dossier
if [[ ! -f "server.ts" ]]; then
    echo "❌ Pas dans le dossier frontend (server.ts introuvable)"
    echo "💡 Veuillez aller dans le dossier mpp-frontend"
    exit 1
fi

# Vérifier que config.mjs existe et a la bonne URL
if [[ ! -f "config.mjs" ]]; then
    echo "⚠️ config.mjs manquant, création automatique..."
    cat > config.mjs << EOF
// Configuration URLs pour MPP Frontend
export const API_URL = location.hostname.includes("localhost")
  ? "http://localhost:8000"
  : "https://mpp-backend.cluster-ig3.igpolytech.fr";

export const WS_URL = location.hostname.includes("localhost")
  ? "ws://localhost:8000"
  : "wss://mpp-backend.cluster-ig3.igpolytech.fr";

console.log("🔗 Configuration frontend:", { API_URL, WS_URL });
EOF
    echo "✅ config.mjs créé avec les bonnes URLs"
fi

echo "📋 Vérification de la configuration actuelle..."
grep -E "(API_URL|WS_URL)" config.mjs || echo "⚠️ URLs pas trouvées dans config.mjs"

echo ""
echo "🚀 Déploiement du frontend..."

# Créer l'app si elle n'existe pas
echo "📱 Création/Vérification de l'application frontend..."
ssh dokku@$DOKKU_DOMAIN apps:create $APP_FRONTEND 2>/dev/null || echo "App déjà existante"

# Configurer les variables d'environnement
echo "⚙️ Configuration des variables d'environnement..."
ssh dokku@$DOKKU_DOMAIN config:set $APP_FRONTEND \
  BACKEND_URL=$BACKEND_URL \
  NODE_ENV=production

# Déploiement
echo "📦 Push vers Dokku..."
git remote remove dokku 2>/dev/null || true
git remote add dokku dokku@$DOKKU_DOMAIN:$APP_FRONTEND
git push dokku main:master

echo "⏳ Attendre 15 secondes pour le démarrage..."
sleep 15

echo ""
echo "🎉 === DÉPLOIEMENT FRONTEND TERMINÉ ==="
echo ""
echo "🌐 URLs de votre application:"
echo "   Frontend: https://$APP_FRONTEND.$DOKKU_DOMAIN"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "🧪 Test rapide:"
echo "   curl https://$APP_FRONTEND.$DOKKU_DOMAIN"
echo ""
echo "📊 Logs frontend:"
echo "   ssh dokku@$DOKKU_DOMAIN logs $APP_FRONTEND -t"