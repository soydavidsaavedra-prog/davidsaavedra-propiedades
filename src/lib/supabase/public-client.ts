import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./config";

/**
 * Cliente sin sesión para lecturas públicas y para `submit_lead`. Actúa como
 * rol `anon`: solo ve lo que permiten las políticas RLS. Sirve también en
 * generación estática (no depende de cookies).
 */
export function createPublicClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
