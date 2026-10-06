import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/admin/auth-actions";
import { SignInForm } from "@/features/admin/components/sign-in-form";
import { getAdminAccess } from "@/features/admin/session";

export const metadata: Metadata = { title: "Ingresar" };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const access = await getAdminAccess();
  if (access.status === "ok") redirect("/admin/propiedades");
  const returnTo = typeof params.volver === "string" ? params.volver : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <Logo href="/" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <p className="text-ink-muted">Ingresa con tu cuenta de administrador.</p>
      </div>

      {access.status === "not_configured" ? (
        <p role="alert" className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
          Supabase no está configurado en este entorno.
        </p>
      ) : access.status === "forbidden" ? (
        <div className="flex flex-col gap-4">
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            Tu cuenta no tiene permisos de administración.
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" fullWidth>
              Cerrar sesión
            </Button>
          </form>
        </div>
      ) : (
        <SignInForm returnTo={returnTo} />
      )}
    </main>
  );
}
