import type { Metadata } from "next";
import { listPropertyTypes, listPublishedProperties } from "@/features/properties/queries";
import { AgentBlock } from "./_components/agent-block";
import { FeaturedProperties } from "./_components/featured-properties";
import { HomeHero } from "./_components/home-hero";
import { HowItWorks } from "./_components/how-it-works";

// Regenera la página con datos nuevos cada 5 minutos.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Locales comerciales en arriendo en La Ligua | David Saavedra Propiedades" },
  description:
    "Locales comerciales en arriendo en La Ligua, Región de Valparaíso. Fichas con fotografías, medidas y condiciones claras, y atención personalizada.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [types, properties] = await Promise.all([listPropertyTypes(), listPublishedProperties()]);

  return (
    <>
      <HomeHero types={types} />
      <FeaturedProperties properties={properties} />
      <HowItWorks />
      <AgentBlock />
    </>
  );
}
