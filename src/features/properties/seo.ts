import { siteConfig } from "@/config/site";
import { formatArea } from "@/lib/format";
import { formatPrice } from "./format";
import type { PropertyDetail } from "./types";

export function propertyPath(slug: string): string {
  return `/propiedades/${slug}`;
}

function absolute(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

/** "Local comercial en arriendo en La Ligua, 70 m²" (sin texto artificial). */
export function propertyMetaTitle(property: PropertyDetail): string {
  if (property.seo.title) return property.seo.title;
  const operation = property.operation === "rent" ? "en arriendo" : "en venta";
  const area = property.builtAreaM2 ? `, ${formatArea(property.builtAreaM2)}` : "";
  return `${property.type.name} ${operation} en ${property.commune.name}${area}`;
}

export function propertyMetaDescription(property: PropertyDetail): string {
  if (property.seo.description) return property.seo.description;
  const parts = [
    property.summary ?? property.title,
    `${formatPrice(property.price)}${property.price.amount !== null && property.operation === "rent" ? " mensuales" : ""}.`,
    `${property.commune.name}, ${siteConfig.location.region}.`,
  ];
  return parts.join(" ").slice(0, 170);
}

const availabilitySchema: Record<PropertyDetail["availability"], string> = {
  available: "https://schema.org/InStock",
  reserved: "https://schema.org/LimitedAvailability",
  rented: "https://schema.org/SoldOut",
  sold: "https://schema.org/SoldOut",
  unavailable: "https://schema.org/OutOfStock",
};

/** schema.org RealEstateListing con solo los datos disponibles. */
export function propertyJsonLd(property: PropertyDetail): Record<string, unknown> {
  const images = property.media.filter((media) => media.kind === "image").map((m) => m.source);
  const exactGeo = property.location?.precision === "exact" ? property.location : null;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description ?? property.summary ?? undefined,
    url: absolute(propertyPath(property.slug)),
    identifier: property.code,
    datePosted: property.publishedAt ?? undefined,
    image: images.length > 0 ? images : undefined,
    offers: {
      "@type": "Offer",
      businessFunction:
        property.operation === "rent"
          ? "http://purl.org/goodrelations/v1#LeaseOut"
          : "http://purl.org/goodrelations/v1#Sell",
      ...(property.price.amount !== null && {
        price: property.price.amount,
        priceCurrency: property.price.currency,
      }),
      availability: availabilitySchema[property.availability],
      seller: { "@type": "RealEstateAgent", name: siteConfig.name, url: siteConfig.url },
    },
    contentLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: property.commune.name,
        addressRegion: siteConfig.location.region,
        addressCountry: "CL",
      },
      ...(exactGeo && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: exactGeo.latitude,
          longitude: exactGeo.longitude,
        },
      }),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}
