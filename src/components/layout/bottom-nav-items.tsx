import Link from "next/link";
import { Building2, House, MessageCircle, type LucideIcon } from "lucide-react";
import { publicNav } from "@/config/site";
import { cn } from "@/lib/cn";

const icons: Record<string, LucideIcon> = {
  "/": House,
  "/propiedades": Building2,
  "/contacto": MessageCircle,
};

/** Ítems de la navegación inferior. Presentacional: el activo lo decide el padre. */
export function BottomNavItems({ activeHref }: { activeHref: string | null }) {
  return (
    <ul className="grid grid-cols-3">
      {publicNav.map((item) => {
        const Icon = icons[item.href] ?? House;
        const active = item.href === activeHref;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                active ? "text-ink" : "text-ink-muted",
              )}
            >
              {active && <span aria-hidden className="absolute top-0 h-0.5 w-8 bg-accent-line" />}
              <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
