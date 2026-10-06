import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./config";

/**
 * Cliente del navegador con la sesión del administrador. Se usa solo para
 * subir archivos directo al Storage (sin pasar por el servidor de la app);
 * las políticas del bucket exigen rol de administrador.
 */
export function createSessionBrowserClient(config: SupabaseConfig): SupabaseClient {
  return createBrowserClient(config.url, config.key);
}
