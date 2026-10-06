import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { SectionLabel } from "@/components/brand/section-label";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PropertyCard } from "@/features/properties/components/property-card";
import type { PropertySummary } from "@/features/properties/types";

const MAX_ITEMS = 3;

/** Propiedades disponibles (modo Día). Carrusel deslizable en móvil, grilla en desktop. */
export function FeaturedProperties({ properties }: { properties: PropertySummary[] }) {
  const items = properties.slice(0, MAX_ITEMS);

  return (
    <section aria-labelledby="featured-title" className="py-14 sm:py-20">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <SectionLabel>Disponibles ahora</SectionLabel>
            <h2 id="featured-title" className="text-3xl font-semibold">
              Locales en arriendo en La Ligua
            </h2>
          </div>
          {items.length > 0 && (
            <Link href="/propiedades" className={buttonStyles({ variant: "secondary" })}>
              Ver todos <ArrowRight />
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Building2 />}
            title="Pronto publicaremos nuevos locales"
            description="Estamos preparando las próximas propiedades. Escríbenos y te avisamos apenas estén disponibles."
            action={
              <Link href="/contacto" className={buttonStyles({ variant: "secondary" })}>
                Contactar
              </Link>
            }
          />
        ) : (
          <ul className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {items.map((property, index) => (
              <li key={property.id} className="flex w-[85%] shrink-0 snap-start sm:w-auto">
                <PropertyCard
                  property={property}
                  preload={index === 0}
                  sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 85vw"
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
