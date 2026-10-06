import {
  businessTypesFixture,
  communesFixture,
  propertiesFixture,
  propertyTypesFixture,
} from "./fixtures";
import type {
  BusinessType,
  Commune,
  PropertyDetail,
  PropertyRecord,
  PropertySummary,
  PropertyType,
} from "./types";

/*
 * Acceso a datos de propiedades (lectura pública).
 *
 * FUENTE TEMPORAL: fixtures locales. Al conectar Supabase se reemplaza la
 * implementación de estas funciones por consultas reales (con RLS); la firma
 * se mantiene y la interfaz no cambia.
 */

function isPublished(property: PropertyRecord): boolean {
  return property.status === "published";
}

/** Destacadas primero (por ranking), luego las más recientes. */
function byListingOrder(a: PropertyRecord, b: PropertyRecord): number {
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
  if (a.isFeatured && b.isFeatured) return (a.featuredRank ?? 999) - (b.featuredRank ?? 999);
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
}

function toSummary(property: PropertyRecord): PropertySummary {
  return {
    id: property.id,
    code: property.code,
    slug: property.slug,
    title: property.title,
    summary: property.summary,
    type: property.type,
    operation: property.operation,
    availability: property.availability,
    availableFrom: property.availableFrom,
    price: property.price,
    commonExpensesClp: property.commonExpensesClp,
    builtAreaM2: property.builtAreaM2,
    landAreaM2: property.landAreaM2,
    bathrooms: property.bathrooms,
    parkingSpots: property.parkingSpots,
    bedrooms: property.bedrooms,
    commune: property.commune,
    sector: property.sector,
    isFeatured: property.isFeatured,
    cover: property.cover,
    publishedAt: property.publishedAt,
  };
}

function toDetail(property: PropertyRecord): PropertyDetail {
  return {
    ...toSummary(property),
    description: property.description,
    guaranteeMonths: property.guaranteeMonths,
    minLeaseMonths: property.minLeaseMonths,
    location: property.location,
    media: property.media,
    features: property.features,
    suitableUses: property.suitableUses,
    seo: property.seo,
  };
}

export async function listPublishedProperties(): Promise<PropertySummary[]> {
  return propertiesFixture.filter(isPublished).sort(byListingOrder).map(toSummary);
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const property = propertiesFixture.find((item) => item.slug === slug && isPublished(item));
  return property ? toDetail(property) : null;
}

/** Todos los tipos (los inactivos se muestran como "Próximamente"). */
export async function listPropertyTypes(): Promise<PropertyType[]> {
  return [...propertyTypesFixture].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listCommunes(): Promise<Commune[]> {
  return [...communesFixture].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listBusinessTypes(): Promise<BusinessType[]> {
  return businessTypesFixture;
}
