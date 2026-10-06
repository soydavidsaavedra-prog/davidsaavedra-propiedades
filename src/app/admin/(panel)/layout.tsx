import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { signOutAction } from "@/features/admin/auth-actions";
import { requireAdmin } from "@/features/admin/session";

export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href="/admin/propiedades" size="sm" />
            <nav aria-label="Panel" className="text-sm font-medium">
              <Link href="/admin/propiedades" className="text-ink-soft hover:text-ink">
                Propiedades
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-ink-soft hover:bg-surface-muted hover:text-ink sm:flex"
            >
              Ver sitio <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <span className="hidden px-2 text-ink-muted md:inline">{user.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-ink-soft hover:bg-surface-muted hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden /> Salir
              </button>
            </form>
          </div>
        </Container>
      </header>
      <main className="flex-1 py-8 sm:py-10">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
