"use server";

import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server-client";

export type SignInState = { error: string | null; email: string };

/** Solo rutas internas del panel (evita redirecciones abiertas). */
function safeReturnPath(value: FormDataEntryValue | null): string {
  return typeof value === "string" && /^\/admin(\/[\w\-/]*)?$/.test(value)
    ? value
    : "/admin/propiedades";
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .slice(0, 254);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña.", email };

  const config = getSupabaseConfig();
  if (!config) return { error: "Supabase no está configurado.", email };

  const supabase = await createSessionClient(config);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return {
      error:
        error?.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "Correo o contraseña incorrectos.",
      email,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<{ role: string }>();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel.", email };
  }

  redirect(safeReturnPath(formData.get("volver")));
}

export async function signOutAction(): Promise<void> {
  const config = getSupabaseConfig();
  if (config) {
    const supabase = await createSessionClient(config);
    await supabase.auth.signOut();
  }
  redirect("/admin/ingresar");
}
