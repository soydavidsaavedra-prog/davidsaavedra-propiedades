import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {/* Espacio reservado para la barra inferior en móvil. */}
      <div className="theme-night pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <SiteFooter />
      </div>
      <BottomNav />
    </div>
  );
}
