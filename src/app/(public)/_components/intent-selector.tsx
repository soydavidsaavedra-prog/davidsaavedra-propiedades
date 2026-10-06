import Link from "next/link";
import { ChevronRight, House, Store, Trees, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PropertyCategory } from "@/features/properties/constants";
import type { PropertyType } from "@/features/properties/types";

const intents: { category: PropertyCategory; label: string; icon: LucideIcon }[] = [
  { category: "commercial", label: "Un local para mi negocio", icon: Store },
  { category: "residential", label: "Una propiedad para vivir", icon: House },
  { category: "land", label: "Un terreno", icon: Trees },
];

/** Destino de cada intención según los tipos activos del catálogo. */
function intentHref(category: PropertyCategory, types: PropertyType[]): string | null {
  const active = types.filter((type) => type.category === category && type.isActive);
  if (active.length === 0) return null;
  return active.length === 1 ? `/propiedades?tipo=${active[0]?.slug}` : "/propiedades";
}

/**
 * "¿Qué estás buscando?". Las categorías sin tipos activos se muestran como
 * "Próximamente": habilitarlas es activar el tipo en el catálogo.
 */
export function IntentSelector({ types }: { types: PropertyType[] }) {
  return (
    <ul className="grid gap-2.5">
      {intents.map(({ category, label, icon: Icon }) => {
        const href = intentHref(category, types);
        const content = (
          <>
            <Icon
              aria-hidden
              className={href ? "size-5 shrink-0 text-accent" : "size-5 shrink-0"}
            />
            <span className="flex-1 text-[0.9375rem] font-medium">{label}</span>
            {href ? (
              <ChevronRight
                aria-hidden
                className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5"
              />
            ) : (
              <Badge>Próximamente</Badge>
            )}
          </>
        );

        return (
          <li key={category}>
            {href ? (
              <Link
                href={href}
                className="group flex min-h-16 items-center gap-3 rounded-lg border border-outline bg-surface/60 px-4 transition-colors hover:border-ink"
              >
                {content}
              </Link>
            ) : (
              <div
                aria-disabled="true"
                className="flex min-h-16 items-center gap-3 rounded-lg border border-line px-4 text-ink-muted"
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
