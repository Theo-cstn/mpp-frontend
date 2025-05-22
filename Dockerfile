# Dockerfile pour MPP Frontend (Static Server)
FROM denoland/deno:1.40.2

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY deno.json deno.lock* ./

# Cache des dépendances
RUN deno cache --lock=deno.lock deno.json || deno cache deno.json

# Copier tous les fichiers statiques
COPY . .

# Cache du serveur
RUN deno cache server.ts

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "server.ts", "3000"]