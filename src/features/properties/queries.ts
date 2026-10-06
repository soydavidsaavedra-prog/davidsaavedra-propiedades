import {
  businessTypesFixture,
  communesFixture,
  featuresFixture,
  propertiesFixture,
  propertyTypesFixture,
} from "./fixtures";
import { todayInChile } from "@/lib/format";
import type { PropertyFilters } from "./filters";
import type {
  BusinessType,
  Commune,
  Feature,
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

function matchesFilters(
  property: PropertyRecord,
  filters: PropertyFilters,
  today: string,
): boolean {
  const price = property.price.amount;
  const hasPriceFilter = filters.priceMin !== undefined || filters.priceMax !== undefined;

  if (filters.type && property.type.slug !== filters.type) return false;
  if (filters.commune && property.commune.slug !== filters.commune) return false;
  // "Precio a consultar" no entra en búsquedas con rango de precio.
  if (hasPriceFilter && price === null) return false;
  if (filters.priceMin !== undefined && price !== null && price < filters.priceMin) return false;
  if (filters.priceMax !== undefined && price !== null && price > filters.priceMax) return false;
  if (filters.areaMin !== undefined && (property.builtAreaM2 ?? 0) < filters.areaMin) return false;
  if (filters.bathroomsMin !== undefined && (property.bathrooms ?? 0) < filters.bathroomsMin) {
    return false;
  }
  if (filters.withParking && (property.parkingSpots ?? 0) < 1) return false;
  if (
    filters.availableNow &&
    (property.availability !== "available" ||
      (property.availableFrom !== null && property.availableFrom > today))
  ) {
    return false;
  }
  const keys = new Set(property.features.map((feature) => feature.key));
  return filters.features.every((key) => keys.has(key));
}

function bySort(sort: PropertyFilters["sort"]) {
  if (sort === "recientes") return byListingOrder;
  const direction = sort === "precio-asc" ? 1 : -1;
  return (a: PropertyRecord, b: PropertyRecord): number => {
    const priceA = a.price.amount;
    const priceB = b.price.amount;
    // "Precio a consultar" siempre al final.
    if (priceA === null || priceB === null) {
      if (priceA === priceB) return byListingOrder(a, b);
      return priceA === null ? 1 : -1;
    }
    return (priceA - priceB) * direction || byListingOrder(a, b);
  };
}

/** Listado público filtrado y ordenado. */
export async function searchPublishedProperties(
  filters: PropertyFilters,
): Promise<PropertySummary[]> {
  const today = todayInChile();
  return propertiesFixture
    .filter((property) => isPublished(property) && matchesFilters(property, filters, today))
    .sort(bySort(filters.sort))
    .map(toSummary);
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const property = propertiesFixture.find((item) => item.slug === slug && isPublished(item));
  return property ? toDetail(property) : null;
}

/** Otras propiedades publicadas del mismo tipo (para "Otras propiedades"). */
export async function listRelatedProperties(
  property: Pick<PropertySummary, "id" | "type">,
  limit = 3,
): Promise<PropertySummary[]> {
  return propertiesFixture
    .filter(
      (item) =>
        isPublished(item) && item.id !== property.id && item.type.slug === property.type.slug,
    )
    .sort(byListingOrder)
    .slice(0, limit)
    .map(toSummary);
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

/** Características disponibles como filtro. */
export async function listFilterableFeatures(): Promise<Feature[]> {
  return featuresFixture.filter((feature) => feature.isFilterable);
}
