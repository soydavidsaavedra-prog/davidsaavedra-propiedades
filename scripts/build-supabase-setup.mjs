// Une las migraciones (en orden) y el seed en un solo archivo para pegar en el
// SQL Editor de Supabase: supabase/setup.sql. Uso: pnpm db:setup-file
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = "supabase/migrations";
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const parts = [
  "-- =============================================================================",
  "-- ARCHIVO GENERADO por scripts/build-supabase-setup.mjs. No editar a mano.",
  "-- Instalación inicial completa: migraciones (en orden) + catálogos (seed).",
  "-- Ejecutar UNA sola vez en un proyecto de Supabase vacío (SQL Editor → Run).",
  "-- =============================================================================",
  "",
];
for (const file of [...files.map((f) => `${dir}/${f}`), "supabase/seed.sql"]) {
  parts.push(`-- >>> ${file}`, readFileSync(file, "utf8").trim(), "");
}
writeFileSync("supabase/setup.sql", parts.join("\n"));
console.log(`supabase/setup.sql: ${files.length} migraciones + seed`);
