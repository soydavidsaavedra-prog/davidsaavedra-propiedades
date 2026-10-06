import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseConfig } from "./config";

/**
 * Cliente con la sesión del usuario (cookies), para el panel de
 * administración. Actúa como rol `authenticated`: RLS decide qué puede ver y
 * modificar. Nunca usa la clave `service_role`.
 */
export async function createSessionClient(config: SupabaseConfig): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // En un Server Component no se pueden escribir cookies; el proxy ya
          // renovó la sesión en esta misma petición.
        }
      },
    },
  });
}
