import { Application } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const app = new Application();
const ROOT = `${Deno.cwd()}/`;

// Middleware pour servir des fichiers statiques
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: ROOT,
      index: "login.html",
    });
    // Si le fichier est trouvé, il est envoyé et cette fonction se termine
  } catch {
    // Si le fichier n'est pas trouvé, on passe au middleware suivant
    await next();
  }
});

// Middleware pour gérer les requêtes non traitées
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "404 File not found";
});

// Fonction pour lancer le serveur avec ou sans HTTPS
async function startServer() {
  if (Deno.args.length < 1) {
    console.log(`Usage: $ deno run --allow-net --allow-read=./ server.ts PORT [CERT_PATH KEY_PATH]`);
    Deno.exit(1);
  }

  const port = parseInt(Deno.args[0]);
  const options: any = { port };

  if (Deno.args.length >= 3) {
    try {
      options.secure = true;
      options.cert = await Deno.readTextFile(Deno.args[1]);
      options.key = await Deno.readTextFile(Deno.args[2]);
      console.log(`SSL configuration ready (utilisez https)`);
    } catch (error) {
      console.error("Erreur lors du chargement des certificats SSL:", error);
      Deno.exit(1);
    }
  }

  console.log(`Serveur statique Oak en cours d'exécution sur le port ${options.port} pour les fichiers dans ${ROOT}`);
  return await app.listen(options);
}

// Démarrer le serveur
startServer().catch(err => {
  console.error("Erreur de démarrage du serveur:", err);
  Deno.exit(1);
});