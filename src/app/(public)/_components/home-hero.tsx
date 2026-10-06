import { DiagonalLines } from "@/components/brand/diagonal-lines";
import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import type { PropertyType } from "@/features/properties/types";
import { IntentSelector } from "./intent-selector";

/** Hero de la Home (modo Noche), orientado a intención. */
export function HomeHero({ types }: { types: PropertyType[] }) {
  return (
    <section className="theme-night relative overflow-hidden">
      {/* Luz cálida ambiental + líneas estructurales; la fotografía real se incorporará aquí. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(90%_70%_at_85%_10%,rgb(228_183_123/0.22)_0%,transparent_60%)]"
      />
      <DiagonalLines className="hidden opacity-70 lg:block" />

      <Container className="relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16 lg:py-28">
        <div className="flex flex-col gap-6">
          <SectionLabel>
            {siteConfig.location.city} · {siteConfig.location.region.replace("Región de ", "")}
          </SectionLabel>
          <h1 className="text-display font-semibold">
            Encuentra el espacio para tu próximo proyecto.
          </h1>
          <p className="max-w-lg text-lg text-ink-soft">
            Locales comerciales en arriendo, con información clara, fotografía profesional y
            atención personalizada de principio a fin.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink-muted">¿Qué estás buscando?</p>
          <IntentSelector types={types} />
        </div>
      </Container>
    </section>
  );
}
