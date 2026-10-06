import type { Metadata } from "next";
import Link from "next/link";
import { Building2, SearchX } from "lucide-react";
import { SectionLabel } from "@/components/brand/section-label";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { siteConfig } from "@/config/site";
import { ActiveFilters } from "@/features/properties/components/filters/active-filters";
import {
  FilterForm,
  type FilterOptions,
} from "@/features/properties/components/filters/filter-form";
import { MobileFilters } from "@/features/properties/components/filters/mobile-filters";
import { PropertyCard } from "@/features/properties/components/property-card";
import {
  countRefinements,
  listingHref,
  parseFilters,
  toSearchParams,
  type PropertyFilters,
} from "@/features/properties/filters";
import {
  listCommunes,
  listFilterableFeatures,
  listPropertyTypes,
  searchPublishedProperties,
} from "@/features/properties/queries";
import type { PropertyType } from "@/features/properties/types";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function heading(type: PropertyType | undefined): string {
  return `${type ? type.namePlural : "Propiedades"} en arriendo en ${siteConfig.location.city}`;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const type = (await listPropertyTypes()).find((item) => item.slug === filters.type);
  // Solo se indexan el listado general y los tipos activos; las combinaciones
  // de filtros y los tipos sin publicar no (evita páginas duplicadas o vacías).
  const refined = countRefinements(filters) > 0 || filters.sort !== "recientes";
  const indexable = !refined && (!filters.type || type?.isActive === true);

  return {
    title: heading(type),
    description: `${heading(type)}, ${siteConfig.location.region}. Filtra por precio, superficie y condiciones, con fichas claras y fotografía profesional.`,
    alternates: { canonical: type ? `/propiedades?tipo=${type.slug}` : "/propiedades" },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

function resultsLabel(count: number): string {
  return count === 1 ? "1 resultado" : `${count} resultados`;
}

function NoResults({
  filters,
  type,
  refinements,
}: {
  filters: PropertyFilters;
  type?: PropertyType;
  refinements: number;
}) {
  if (type && !type.isActive) {
    return (
      <EmptyState
        icon={<SearchX />}
        title={`Pronto publicaremos ${type.namePlural.toLowerCase()}`}
        description="Por ahora trabajamos con locales comerciales. Escríbenos y te avisamos cuando haya opciones."
        action={
          <Link href="/propiedades" className={buttonStyles({ variant: "secondary" })}>
            Ver locales disponibles
          </Link>
        }
      />
    );
  }

  // Sin filtros que quitar: no hay inventario publicado (no es la búsqueda).
  if (refinements === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title={`Pronto publicaremos nuevos ${type ? type.namePlural.toLowerCase() : "locales"}`}
        description="Estamos preparando las próximas propiedades. Escríbenos y te avisamos apenas estén disponibles."
        action={
          <Link href="/contacto" className={buttonStyles({ variant: "secondary" })}>
            Contactar
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<SearchX />}
      title="No hay propiedades con estos filtros"
      description="Prueba ampliando el presupuesto o quitando alguna condición."
      action={
        <Link
          href={listingHref({ features: [], sort: filters.sort, type: filters.type })}
          scroll={false}
          className={buttonStyles({ variant: "secondary" })}
        >
          Limpiar filtros
        </Link>
      }
    />
  );
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const filters = parseFilters(await searchParams);
  const [properties, types, communes, features] = await Promise.all([
    searchPublishedProperties(filters),
    listPropertyTypes(),
    listCommunes(),
    listFilterableFeatures(),
  ]);
  const options: FilterOptions = { types, communes, features };
  const type = types.find((item) => item.slug === filters.type);
  // Cambia con cada búsqueda: remonta los formularios con los valores nuevos.
  const searchKey = toSearchParams(filters).toString();
  const refinements = countRefinements(filters);

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <SectionLabel>Arriendo · {siteConfig.location.city}</SectionLabel>
        <h1 className="text-3xl font-semibold sm:text-4xl">{heading(type)}</h1>
        <p className="text-ink-muted" aria-live="polite">
          {resultsLabel(properties.length)}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-line bg-surface p-5">
            <FilterForm key={searchKey} id="filtros" filters={filters} options={options} />
          </div>
        </aside>

        <section aria-label="Resultados" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="lg:hidden">
              <MobileFilters key={searchKey} formId="filtros-movil" activeCount={refinements}>
                <FilterForm
                  id="filtros-movil"
                  filters={filters}
                  options={options}
                  showSubmit={false}
                />
              </MobileFilters>
            </div>
            <ActiveFilters filters={filters} options={options} />
          </div>

          {properties.length === 0 ? (
            <NoResults filters={filters} type={type} refinements={refinements} />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {properties.map((property, index) => (
                <li key={property.id} className="flex">
                  <PropertyCard
                    property={property}
                    preload={index === 0}
                    sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}
