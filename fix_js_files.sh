#!/bin/bash
# Script pour corriger automatiquement tous les fichiers .js

cd ~/Desktop/mpp-frontend

echo "🔧 Correction des fichiers JavaScript..."

# Liste des fichiers à corriger
files=("script.js" "register.js" "dashboard.js" "chat.js" "pronostics.js" "classement.js" "private-leagues.js" "league-detail.js" "admin-database.js" "admin-matches.js")

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "📝 Correction de $file..."
        
        # Ajouter l'import en haut si pas déjà présent
        if ! grep -q "import.*API_URL.*from.*config.mjs" "$file"; then
            sed -i '1i import { API_URL, WS_URL } from '\''./config.mjs'\'';' "$file"
        fi
        
        # Remplacer toutes les URLs hardcodées
        sed -i 's|"http://localhost:8000|`${API_URL}|g' "$file"
        sed -i 's|"ws://localhost:8000|`${WS_URL}|g' "$file"
        sed -i 's|http://localhost:8000"|${API_URL}`|g' "$file"
        sed -i 's|ws://localhost:8000"|${WS_URL}`|g' "$file"
        
        echo "✅ $file corrigé"
    else
        echo "⚠️ $file non trouvé"
    fi
done

echo "🎉 Toutes les corrections terminées !"