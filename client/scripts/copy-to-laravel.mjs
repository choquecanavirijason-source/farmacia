import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(clientRoot);
const src = path.join(clientRoot, "out");
const dest = path.join(repoRoot, "server", "public");

if (!existsSync(src)) {
  console.error('No existe "out/". Corre "npm run build" antes de copiar.');
  process.exit(1);
}

// Todo lo que hay en server/public es del build de Next, EXCEPTO estos archivos
// propios de Laravel. Se borra todo lo demás antes de copiar, para que una
// pagina eliminada en el codigo tambien desaparezca del build anterior
// (en vez de mantener una lista manual de paginas que hay que recordar actualizar).
const laravelOwnedEntries = new Set([".htaccess", "index.php", "robots.txt", "storage", "deploy-migrate.php"]);
if (existsSync(dest)) {
  for (const entry of readdirSync(dest)) {
    if (!laravelOwnedEntries.has(entry)) {
      rmSync(path.join(dest, entry), { recursive: true, force: true });
    }
  }
}

cpSync(src, dest, { recursive: true });
console.log(`Frontend copiado a ${dest}`);
