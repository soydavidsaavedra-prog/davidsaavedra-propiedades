/**
 * Configuración pública de Supabase. La clave "publishable" (o la anon key
 * legacy) es segura en el navegador: el acceso a datos lo controla RLS.
 */
export type SupabaseConfig = { url: string; key: string };

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

/** URL pública de un archivo del bucket de media de propiedades. */
export function publicMediaUrl(config: SupabaseConfig, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${config.url}/storage/v1/object/public/property-media/${encoded}`;
}
