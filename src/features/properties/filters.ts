/*
 * Filtros del listado. El estado vive en la URL (compartible por WhatsApp e
 * indexable), con nombres de parámetros en español:
 *
 *   /propiedades?tipo=local-comercial&comuna=la-ligua&precio_max=600000
 *     &m2_min=50&banos=1&estacionamiento=1&disponible=1
 *     &caracteristica=storefront&orden=precio-asc
 *
 * Solo existen filtros con respaldo en el modelo de datos. Los valores
 * inválidos se ignoran (nunca rompen la página).
 */

export const SORT_OPTIONS = ["recientes", "precio-asc", "precio-desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const sortLabels: Record<SortOption, string> = {
  recientes: "Más recientes",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
};

export const AREA_OPTIONS = [30, 50, 80, 100, 150] as const;
export const BATHROOM_OPTIONS = [1, 2] as const;

export type PropertyFilters = {
  type?: string;
  commune?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  bathroomsMin?: number;
  withParking?: boolean;
  availableNow?: boolean;
  features: string[];
  sort: SortOption;
};

export type SearchParams = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function slug(value: string | string[] | undefined): string | undefined {
  const text = first(value)?.trim().toLowerCase();
  return text && SLUG.test(text) ? text : undefined;
}

/** Entero positivo; acepta "600.000" o "600000". */
function positiveInt(value: string | string[] | undefined): number | undefined {
  const digits = first(value)?.replace(/[.\s$]/g, "");
  if (!digits || !/^\d{1,12}$/.test(digits)) return undefined;
  const number = Number(digits);
  return number > 0 ? number : undefined;
}

function flag(value: string | string[] | undefined): boolean | undefined {
  return first(value) === "1" ? true : undefined;
}

export function parseFilters(params: SearchParams): PropertyFilters {
  let priceMin = positiveInt(params.precio_min);
  let priceMax = positiveInt(params.precio_max);
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }
  const sort = first(params.orden);

  return {
    type: slug(params.tipo),
    commune: slug(params.comuna),
    priceMin,
    priceMax,
    areaMin: positiveInt(params.m2_min),
    bathroomsMin: positiveInt(params.banos),
    withParking: flag(params.estacionamiento),
    availableNow: flag(params.disponible),
    features: [
      ...new Set(
        all(params.caracteristica)
          .map((v) => slug(v))
          .filter((v) => v !== undefined),
      ),
    ],
    sort: SORT_OPTIONS.includes(sort as SortOption) ? (sort as SortOption) : "recientes",
  };
}

/** Filtros → parámetros de URL (omite los vacíos y el orden por defecto). */
export function toSearchParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.type) params.set("tipo", filters.type);
  if (filters.commune) params.set("comuna", filters.commune);
  if (filters.priceMin) params.set("precio_min", String(filters.priceMin));
  if (filters.priceMax) params.set("precio_max", String(filters.priceMax));
  if (filters.areaMin) params.set("m2_min", String(filters.areaMin));
  if (filters.bathroomsMin) params.set("banos", String(filters.bathroomsMin));
  if (filters.withParking) params.set("estacionamiento", "1");
  if (filters.availableNow) params.set("disponible", "1");
  for (const feature of filters.features) params.append("caracteristica", feature);
  if (filters.sort !== "recientes") params.set("orden", filters.sort);
  return params;
}

export function listingHref(filters: PropertyFilters): string {
  const query = toSearchParams(filters).toString();
  return query ? `/propiedades?${query}` : "/propiedades";
}

/** Cantidad de filtros activos (sin contar tipo ni orden). */
export function countRefinements(filters: PropertyFilters): number {
  return (
    [
      filters.commune,
      filters.priceMin,
      filters.priceMax,
      filters.areaMin,
      filters.bathroomsMin,
      filters.withParking,
      filters.availableNow,
    ].filter((value) => value !== undefined).length + filters.features.length
  );
}
