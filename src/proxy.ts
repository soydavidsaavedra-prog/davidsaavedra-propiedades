import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/*
 * Panel de administración: renueva la sesión de Supabase (cookies) y redirige
 * al ingreso si no hay sesión. Es un filtro optimista: cada página y cada
 * Server Action del panel vuelven a verificar el rol de administrador, y RLS
 * lo exige en la base de datos.
 */
export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  const isLogin = request.nextUrl.pathname === "/admin/ingresar";
  if (!config) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && !isLogin) {
    const login = new URL("/admin/ingresar", request.url);
    login.searchParams.set("volver", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  // Páginas privadas: nunca en cachés compartidas.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
