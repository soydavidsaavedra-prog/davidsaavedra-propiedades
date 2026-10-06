import { cache } from "react";
import { todayInChile } from "@/lib/format";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { fixturesSource } from "./data/fixtures-source";
import type { PropertySource } from "./data/source";
import { createSupabaseSource } from "./data/supabase-source";
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
 * Fuente: Supabase cuando está configurado (NEXT_PUBLIC_SUPABASE_URL y la
 * clave publishable); si no, los fixtures locales. En el despliegue de
 * producción de Vercel la falta de configuración es un error: nunca se
 * publican datos de ejemplo.
 *
 * Con el inventario actual (decenas de propiedades) se cargan las publicadas
 * y se filtran aquí, igual para ambas fuentes. Si el inventario crece a
 * cientos, los filtros pasan a SQL sin cambiar estas funciones.
 */

function resolveSource(): PropertySource {
  const config = getSupabaseConfig();
  if (config) return createSupabaseSource(config);
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Supabase no está configurado en producción.");
  }
  return fixturesSource;
}

const source = resolveSource();

// Una sola lectura por petición, aunque varias funciones la usen.
const loadPublished = cache(() => source.loadPublishedProperties());

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
  return [...(await loadPublished())].sort(byListingOrder).map(toSummary);
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
  return (await loadPublished())
    .filter((property) => matchesFilters(property, filters, today))
    .sort(bySort(filters.sort))
    .map(toSummary);
}

/** Propiedad publicada por id (p. ej. para validar un formulario de interés). */
export async function getPublishedPropertyById(id: string): Promise<PropertySummary | null> {
  const property = (await loadPublished()).find((item) => item.id === id);
  return property ? toSummary(property) : null;
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const property = (await loadPublished()).find((item) => item.slug === slug);
  return property ? toDetail(property) : null;
}

/** Otras propiedades publicadas del mismo tipo (para "Otras propiedades"). */
export async function listRelatedProperties(
  property: Pick<PropertySummary, "id" | "type">,
  limit = 3,
): Promise<PropertySummary[]> {
  return (await loadPublished())
    .filter((item) => item.id !== property.id && item.type.slug === property.type.slug)
    .sort(byListingOrder)
    .slice(0, limit)
    .map(toSummary);
}

/** Todos los tipos (los inactivos se muestran como "Próximamente"). */
export async function listPropertyTypes(): Promise<PropertyType[]> {
  return [...(await source.loadPropertyTypes())].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listCommunes(): Promise<Commune[]> {
  return [...(await source.loadCommunes())].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listBusinessTypes(): Promise<BusinessType[]> {
  return source.loadBusinessTypes();
}

/** Características disponibles como filtro. */
export async function listFilterableFeatures(): Promise<Feature[]> {
  return (await source.loadFeatures()).filter((feature) => feature.isFilterable);
}
