import type { Metadata } from "next";
import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { InterestForm } from "@/features/leads/components/interest-form";
import { listBusinessTypes, listCommunes, listPropertyTypes } from "@/features/properties/queries";

export const metadata: Metadata = {
  title: "Cuéntame qué buscas",
  description: `Dime qué propiedad buscas en ${siteConfig.location.city} y alrededores, y te aviso con las opciones que se ajusten a tu presupuesto.`,
  alternates: { canonical: "/busco-propiedad" },
};

export default async function InterestPage() {
  const [types, communes, businessTypes] = await Promise.all([
    listPropertyTypes(),
    listCommunes(),
    listBusinessTypes(),
  ]);

  return (
    <Container className="flex max-w-3xl flex-col gap-10 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <SectionLabel>Busco propiedad</SectionLabel>
        <h1 className="text-display font-semibold">Cuéntame qué buscas.</h1>
        <p className="text-lg text-ink-soft">
          Completa lo que sepas y te escribo con las opciones que se ajusten. Toma un minuto.
        </p>
      </header>
      <section
        aria-label="Formulario de búsqueda"
        className="rounded-xl border border-line bg-surface p-5 sm:p-8"
      >
        <InterestForm types={types} communes={communes} businessTypes={businessTypes} />
      </section>
    </Container>
  );
}
