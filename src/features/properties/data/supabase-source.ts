import type { SupabaseClient } from "@supabase/supabase-js";
import { publicMediaUrl, type SupabaseConfig } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import type {
  FeatureCategory,
  LocationPrecision,
  MediaKind,
  MediaProvider,
  PriceCurrency,
  PropertyAvailability,
  PropertyCategory,
  PropertyOperation,
  PropertyStatus,
} from "../constants";
import type { PropertyMedia, PropertyRecord } from "../types";
import type { PropertySource } from "./source";

/*
 * Lecturas públicas desde Supabase (PostgREST), como rol `anon`: RLS solo
 * entrega propiedades publicadas y nunca datos internos.
 */

/** Columnas y relaciones que se leen de una propiedad. */
export const PROPERTY_SELECT = `
  id, code, slug, title, summary, description, operation, status, availability,
  available_from, price_amount, price_currency, common_expenses_clp, guarantee_months,
  min_lease_months, built_area_m2, land_area_m2, bathrooms, parking_spots, bedrooms,
  sector, latitude, longitude, location_precision, is_featured, featured_rank,
  seo_title, seo_description, published_at,
  property_types ( slug, name ),
  communes ( slug, name ),
  property_media ( id, kind, provider, storage_path, external_url, poster_path, alt_text,
    width, height, is_cover, sort_order ),
  property_features ( features ( key, label, category ) ),
  property_suitable_uses ( business_types ( id, slug, name ) )
`;

type Num = number | string | null;

/** Fila tal como la entrega PostgREST para PROPERTY_SELECT. */
export type PropertyRow = {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  operation: PropertyOperation;
  status: PropertyStatus;
  availability: PropertyAvailability;
  available_from: string | null;
  price_amount: Num;
  price_currency: PriceCurrency;
  common_expenses_clp: Num;
  guarantee_months: Num;
  min_lease_months: number | null;
  built_area_m2: Num;
  land_area_m2: Num;
  bathrooms: number | null;
  parking_spots: number | null;
  bedrooms: number | null;
  sector: string | null;
  latitude: Num;
  longitude: Num;
  location_precision: LocationPrecision;
  is_featured: boolean;
  featured_rank: number | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  property_types: { slug: string; name: string } | null;
  communes: { slug: string; name: string } | null;
  property_media: {
    id: string;
    kind: MediaKind;
    provider: MediaProvider;
    storage_path: string | null;
    external_url: string | null;
    poster_path: string | null;
    alt_text: string | null;
    width: number | null;
    height: number | null;
    is_cover: boolean;
    sort_order: number;
  }[];
  property_features: {
    features: { key: string; label: string; category: FeatureCategory } | null;
  }[];
  property_suitable_uses: { business_types: { id: string; slug: string; name: string } | null }[];
};

/** numeric de Postgres puede llegar como número o texto según su precisión. */
function num(value: Num): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapMedia(
  config: SupabaseConfig,
  row: PropertyRow["property_media"][number],
): PropertyMedia | null {
  const source =
    row.provider === "storage"
      ? row.storage_path && publicMediaUrl(config, row.storage_path)
      : row.external_url;
  if (!source) return null;
  return {
    id: row.id,
    kind: row.kind,
    provider: row.provider,
    source,
    posterSource: row.poster_path ? publicMediaUrl(config, row.poster_path) : null,
    alt: row.alt_text ?? "",
    width: row.width,
    height: row.height,
    isCover: row.is_cover,
    sortOrder: row.sort_order,
  };
}

export function mapPropertyRow(config: SupabaseConfig, row: PropertyRow): PropertyRecord {
  const media = row.property_media
    .map((item) => mapMedia(config, item))
    .filter((item): item is PropertyMedia => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const latitude = num(row.latitude);
  const longitude = num(row.longitude);

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    type: row.property_types ?? { slug: "", name: "" },
    operation: row.operation,
    status: row.status,
    availability: row.availability,
    availableFrom: row.available_from,
    price: { amount: num(row.price_amount), currency: row.price_currency },
    commonExpensesClp: num(row.common_expenses_clp),
    guaranteeMonths: num(row.guarantee_months),
    minLeaseMonths: row.min_lease_months,
    builtAreaM2: num(row.built_area_m2),
    landAreaM2: num(row.land_area_m2),
    bathrooms: row.bathrooms,
    parkingSpots: row.parking_spots,
    bedrooms: row.bedrooms,
    commune: row.communes ?? { slug: "", name: "" },
    sector: row.sector,
    location:
      latitude !== null && longitude !== null
        ? { latitude, longitude, precision: row.location_precision }
        : null,
    isFeatured: row.is_featured,
    featuredRank: row.featured_rank,
    cover: media.find((item) => item.isCover && item.kind === "image") ?? null,
    media,
    features: row.property_features.flatMap((item) => (item.features ? [item.features] : [])),
    suitableUses: row.property_suitable_uses.flatMap((item) =>
      item.business_types ? [item.business_types] : [],
    ),
    seo: { title: row.seo_title, description: row.seo_description },
    publishedAt: row.published_at,
  };
}

/**
 * Ejecuta una consulta y devuelve sus filas con el tipo declarado.
 * Sin tipos generados (`supabase gen types`), PostgREST no conoce el esquema:
 * el tipo de cada fila se declara junto a su `select`.
 */
async function run<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []) as T;
}

export function createSupabaseSource(config: SupabaseConfig): PropertySource {
  const client: SupabaseClient = createPublicClient(config);

  return {
    async loadPublishedProperties() {
      const rows = await run<PropertyRow[]>(
        client.from("properties").select(PROPERTY_SELECT).eq("status", "published"),
      );
      return rows.map((row) => mapPropertyRow(config, row));
    },
    async loadPropertyTypes() {
      const rows = await run<
        {
          id: string;
          slug: string;
          name: string;
          name_plural: string;
          category: PropertyCategory;
          is_active: boolean;
          sort_order: number;
        }[]
      >(
        client
          .from("property_types")
          .select("id, slug, name, name_plural, category, is_active, sort_order"),
      );
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        namePlural: row.name_plural,
        category: row.category,
        isActive: row.is_active,
        sortOrder: row.sort_order,
      }));
    },
    async loadCommunes() {
      const rows = await run<
        {
          id: string;
          slug: string;
          name: string;
          region: string;
          is_active: boolean;
          sort_order: number;
        }[]
      >(client.from("communes").select("id, slug, name, region, is_active, sort_order"));
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        region: row.region,
        isActive: row.is_active,
        sortOrder: row.sort_order,
      }));
    },
    async loadFeatures() {
      const rows = await run<
        {
          id: string;
          key: string;
          label: string;
          category: FeatureCategory;
          is_filterable: boolean;
        }[]
      >(
        client
          .from("features")
          .select("id, key, label, category, is_filterable")
          .order("sort_order"),
      );
      return rows.map((row) => ({
        id: row.id,
        key: row.key,
        label: row.label,
        category: row.category,
        isFilterable: row.is_filterable,
      }));
    },
    async loadBusinessTypes() {
      // RLS ya entrega solo los activos.
      return run<{ id: string; slug: string; name: string }[]>(
        client.from("business_types").select("id, slug, name").order("sort_order"),
      );
    },
  };
}
