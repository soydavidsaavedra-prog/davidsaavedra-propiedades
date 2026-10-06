import Link from "next/link";
import { X } from "lucide-react";
import { formatArea, formatCLP } from "@/lib/format";
import { listingHref, type PropertyFilters } from "../../filters";
import type { FilterOptions } from "./filter-form";

type ActiveFilter = { key: string; label: string; href: string };

/** Filtros aplicados como chips; cada uno enlaza a la misma búsqueda sin él. */
function describe(filters: PropertyFilters, options: FilterOptions): ActiveFilter[] {
  const without = (patch: Partial<PropertyFilters>) => listingHref({ ...filters, ...patch });
  const items: ActiveFilter[] = [];

  if (filters.commune) {
    const name = options.communes.find((c) => c.slug === filters.commune)?.name ?? filters.commune;
    items.push({ key: "comuna", label: name, href: without({ commune: undefined }) });
  }
  if (filters.priceMin) {
    items.push({
      key: "precio_min",
      label: `Desde ${formatCLP(filters.priceMin)}`,
      href: without({ priceMin: undefined }),
    });
  }
  if (filters.priceMax) {
    items.push({
      key: "precio_max",
      label: `Hasta ${formatCLP(filters.priceMax)}`,
      href: without({ priceMax: undefined }),
    });
  }
  if (filters.areaMin) {
    items.push({
      key: "m2_min",
      label: `Desde ${formatArea(filters.areaMin)}`,
      href: without({ areaMin: undefined }),
    });
  }
  if (filters.bathroomsMin) {
    items.push({
      key: "banos",
      label: `${filters.bathroomsMin}+ ${filters.bathroomsMin === 1 ? "baño" : "baños"}`,
      href: without({ bathroomsMin: undefined }),
    });
  }
  if (filters.availableNow) {
    items.push({
      key: "disponible",
      label: "Disponible ahora",
      href: without({ availableNow: undefined }),
    });
  }
  if (filters.withParking) {
    items.push({
      key: "estacionamiento",
      label: "Con estacionamiento",
      href: without({ withParking: undefined }),
    });
  }
  for (const key of filters.features) {
    const label = options.features.find((f) => f.key === key)?.label ?? key;
    items.push({
      key: `caracteristica-${key}`,
      label,
      href: without({ features: filters.features.filter((item) => item !== key) }),
    });
  }
  return items;
}

export function ActiveFilters({
  filters,
  options,
}: {
  filters: PropertyFilters;
  options: FilterOptions;
}) {
  const items = describe(filters, options);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="contents">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              scroll={false}
              aria-label={`Quitar filtro: ${item.label}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface pr-2.5 pl-3.5 text-sm transition-colors hover:border-ink"
            >
              {item.label}
              <X aria-hidden className="size-3.5 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={listingHref({ features: [], sort: filters.sort, type: filters.type })}
        scroll={false}
        className="px-2 text-sm font-medium text-ink-soft underline-offset-4 hover:underline"
      >
        Limpiar filtros
      </Link>
    </div>
  );
}
