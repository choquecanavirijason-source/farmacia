import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "out");
const dest = path.join(root, "backend", "public");

if (!existsSync(src)) {
  console.error('No existe "out/". Corre "npm run build" antes de copiar.');
  process.exit(1);
}

// Limpia solo lo que el build anterior pudo haber dejado, sin tocar los
// archivos propios de Laravel (index.php, .htaccess, storage, etc.).
const nextOwnedEntries = [
  "_next", "dashboard", "login", "caja", "categorias", "clientes", "compras",
  "configuracion", "inventario", "lotes", "medicamentos", "proveedores",
  "reportes", "usuarios", "ventas", "_not-found", "index.html", "404.html",
  "favicon.ico", "file.svg", "globe.svg", "next.svg", "vercel.svg", "window.svg",
];
for (const entry of nextOwnedEntries) {
  rmSync(path.join(dest, entry), { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true });
console.log(`Frontend copiado a ${dest}`);
