import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listPropertyTypes, listPublishedProperties } from "@/features/properties/queries";
import { propertyPath } from "@/features/properties/seo";

// Se regenera con las propiedades publicadas cada 5 minutos, como las páginas.
export const revalidate = 300;

function absolute(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, types] = await Promise.all([listPublishedProperties(), listPropertyTypes()]);

  return [
    { url: absolute("/"), changeFrequency: "daily", priority: 1 },
    { url: absolute("/propiedades"), changeFrequency: "daily", priority: 0.9 },
    // Mismas URLs canónicas que el listado: solo tipos activos.
    ...types
      .filter((type) => type.isActive)
      .map((type) => ({
        url: absolute(`/propiedades?tipo=${type.slug}`),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ...properties.map((property) => ({
      url: absolute(propertyPath(property.slug)),
      lastModified: property.publishedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: absolute("/busco-propiedad"), changeFrequency: "monthly", priority: 0.5 },
    { url: absolute("/publica-tu-propiedad"), changeFrequency: "monthly", priority: 0.5 },
    { url: absolute("/contacto"), changeFrequency: "monthly", priority: 0.5 },
    { url: absolute("/privacidad"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
