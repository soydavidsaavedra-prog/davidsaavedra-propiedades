import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSupabaseConfig, type SupabaseConfig } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server-client";

export type AdminUser = { id: string; email: string | null; fullName: string | null };

export type AdminContext = {
  user: AdminUser;
  supabase: SupabaseClient;
  config: SupabaseConfig;
};

export type AdminAccess =
  | { status: "ok"; context: AdminContext }
  | { status: "not_configured" | "signed_out" | "forbidden" };

/**
 * Verifica la sesión (firma del JWT) y el rol de administrador en `profiles`.
 * Una sola vez por petición. Es la verificación de seguridad del panel: el
 * proxy solo filtra de forma optimista.
 */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  const config = getSupabaseConfig();
  if (!config) return { status: "not_configured" };

  const supabase = await createSessionClient(config);
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { status: "signed_out" };

  // RLS: cada usuario autenticado puede leer solo su propio perfil.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", claims.sub)
    .maybeSingle<{ role: string; full_name: string | null }>();
  if (profile?.role !== "admin") return { status: "forbidden" };

  return {
    status: "ok",
    context: {
      supabase,
      config,
      user: {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
        fullName: profile.full_name,
      },
    },
  };
});

/** Para páginas del panel: redirige al ingreso si no hay un administrador. */
export async function requireAdmin(): Promise<AdminContext> {
  const access = await getAdminAccess();
  if (access.status === "ok") return access.context;
  redirect(access.status === "forbidden" ? "/admin/ingresar?motivo=sin-acceso" : "/admin/ingresar");
}

/** Para Server Actions: lanza un error en vez de redirigir. */
export async function assertAdmin(): Promise<AdminContext> {
  const access = await getAdminAccess();
  if (access.status !== "ok") throw new Error("No autorizado.");
  return access.context;
}
