import type { Metadata } from "next";
import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { OwnerPropertyForm } from "@/features/owner-requests/components/owner-property-form";
import {
  listCommunes,
  listFilterableFeatures,
  listPropertyTypes,
} from "@/features/properties/queries";

export const metadata: Metadata = {
  title: "Publica tu propiedad",
  description: `¿Tienes una propiedad para arrendar o vender en ${siteConfig.location.city} y alrededores? Envíame sus datos y fotos, y te cuento cómo trabajo.`,
  alternates: { canonical: "/publica-tu-propiedad" },
};

export default async function PublishPropertyPage() {
  const [types, communes, features] = await Promise.all([
    listPropertyTypes(),
    listCommunes(),
    listFilterableFeatures(),
  ]);

  return (
    <Container className="flex max-w-3xl flex-col gap-10 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <SectionLabel>Propietarios</SectionLabel>
        <h1 className="text-display font-semibold">Publica tu propiedad.</h1>
        <p className="text-lg text-ink-soft">
          Envíame los datos de tu propiedad. La reviso, coordinamos una visita para la fotografía
          profesional y la publico con información clara para encontrar al arrendatario indicado.
        </p>
      </header>
      <section
        aria-label="Formulario para propietarios"
        className="rounded-xl border border-line bg-surface p-5 sm:p-8"
      >
        <OwnerPropertyForm types={types} communes={communes} features={features} />
      </section>
    </Container>
  );
}
