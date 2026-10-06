"use client";

import { usePathname } from "next/navigation";
import { publicNav } from "@/config/site";
import { BottomNavItems } from "./bottom-nav-items";

function resolveActive(pathname: string): string | null {
  const match = publicNav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  return match?.href ?? null;
}

/** Navegación inferior tipo app, solo en móvil. */
export function BottomNav() {
  const pathname = usePathname();

  // En la ficha de propiedad la reemplaza la barra de acción (PropertyCtaBar).
  if (/^\/propiedades\/[^/]+$/.test(pathname)) return null;

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-safe backdrop-blur-md md:hidden"
    >
      <BottomNavItems activeHref={resolveActive(pathname)} />
    </nav>
  );
}
