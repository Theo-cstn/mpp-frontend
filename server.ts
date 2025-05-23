// server.ts - Version finale Dokku (PORT dynamique)
import { Application } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const app = new Application();
const ROOT = `${Deno.cwd()}/`;

const PORT = parseInt(Deno.env.get("PORT") || "3000");
const environment = Deno.env.get("NODE_ENV") || "development";

console.log("🎨 Démarrage serveur statique MPP Frontend");
console.log(`📁 Racine: ${ROOT}`);
console.log(`🌐 Port: ${PORT} ${Deno.env.get("PORT") ? "(fourni par Dokku)" : "(développement local)"}`);
console.log(`🔧 Environment: ${environment}`);

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
      environment: environment
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

// Démarrer le serveur sur 0.0.0.0 
console.log(`🚀 Serveur statique démarré sur le port ${PORT}`);
console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);

await app.listen({ 
  port: PORT,
  hostname: "0.0.0.0"  
});