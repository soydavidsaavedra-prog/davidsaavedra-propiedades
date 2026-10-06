"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, House, MessageCircle, type LucideIcon } from "lucide-react";
import { publicNav } from "@/config/site";
import { cn } from "@/lib/cn";

const icons: Record<string, LucideIcon> = {
  "/": House,
  "/propiedades": Building2,
  "/contacto": MessageCircle,
};

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Navegación inferior tipo app, solo en móvil. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-3">
        {publicNav.map((item) => {
          const Icon = icons[item.href] ?? House;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-muted",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
