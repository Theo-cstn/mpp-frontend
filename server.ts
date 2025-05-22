// server.ts - Version production Dokku (corrigée)
import { Application } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const app = new Application();
const ROOT = `${Deno.cwd()}/`;

// Configuration du port pour Dokku
const isProduction = Deno.env.get("NODE_ENV") === "production";

// En production, forcer le port 80 (ignorer la variable PORT de Dokku)
// En développement, utiliser PORT ou 3000 par défaut
const PORT = isProduction ? 80 : parseInt(Deno.env.get("PORT") || "3000");

console.log("🎨 Démarrage serveur statique MPP Frontend");
console.log(`📁 Racine: ${ROOT}`);
console.log(`🌐 Port: ${PORT}`);
console.log(`🔧 Environment: ${isProduction ? "production" : "development"}`);

// Middleware pour servir des fichiers statiques
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: ROOT,
      index: "login.html",
    });
  } catch {
    await next();
  }
});

// Route health check pour monitoring
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/health") {
    ctx.response.body = {
      status: "ok",
      service: "mpp-frontend",
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: isProduction ? "production" : "development"
    };
    return;
  }
  await next();
});

// Middleware pour gérer les requêtes non traitées
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "404 File not found";
});

// Démarrer le serveur
console.log(`🚀 Serveur statique démarré sur le port ${PORT}`);
if (isProduction) {
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
} else {
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}

await app.listen({ 
  port: PORT,
  hostname: isProduction ? "0.0.0.0" : "localhost"
});