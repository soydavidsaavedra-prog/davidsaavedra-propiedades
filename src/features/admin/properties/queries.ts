import "server-only";
import type {
  LocationPrecision,
  MediaKind,
  MediaProvider,
  PriceCurrency,
  PropertyAvailability,
  PropertyOperation,
  PropertyStatus,
} from "@/features/properties/constants";
import { publicMediaUrl, type SupabaseConfig } from "@/lib/supabase/config";
import type { AdminContext } from "../session";
import type {
  AdminMedia,
  AdminPropertyDetail,
  AdminPropertyListItem,
  PropertyFormOptions,
} from "./types";

/*
 * Lecturas del panel, con la sesión del administrador: RLS entrega todas las
 * propiedades (cualquier estado) y los datos internos.
 */

type Num = number | string | null;

function num(value: Num): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function rows<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as T;
}

type MediaRow = {
  id: string;
  kind: MediaKind;
  provider: MediaProvider;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  is_cover: boolean;
  sort_order: number;
};

const MEDIA_SELECT =
  "id, kind, provider, storage_path, external_url, alt_text, width, height, is_cover, sort_order";

function mapMedia(config: SupabaseConfig, row: MediaRow): AdminMedia {
  return {
    id: row.id,
    kind: row.kind,
    provider: row.provider,
    storagePath: row.storage_path,
    url:
      row.provider === "storage" && row.storage_path
        ? publicMediaUrl(config, row.storage_path)
        : (row.external_url ?? ""),
    alt: row.alt_text ?? "",
    width: row.width,
    height: row.height,
    isCover: row.is_cover,
    sortOrder: row.sort_order,
  };
}

export async function listAdminProperties({
  supabase,
  config,
}: AdminContext): Promise<AdminPropertyListItem[]> {
  const data = await rows<
    {
      id: string;
      code: string;
      slug: string;
      title: string;
      status: PropertyStatus;
      availability: PropertyAvailability;
      price_amount: Num;
      price_currency: PriceCurrency;
      updated_at: string;
      property_types: { name: string } | null;
      communes: { name: string } | null;
      property_media: Pick<MediaRow, "kind" | "provider" | "storage_path" | "is_cover">[];
    }[]
  >(
    supabase
      .from("properties")
      .select(
        `id, code, slug, title, status, availability, price_amount, price_currency, updated_at,
         property_types ( name ), communes ( name ),
         property_media ( kind, provider, storage_path, is_cover )`,
      )
      .order("updated_at", { ascending: false }),
  );

  return data.map((row) => {
    const cover = row.property_media.find((media) => media.is_cover && media.storage_path);
    return {
      id: row.id,
      code: row.code,
      slug: row.slug,
      title: row.title,
      status: row.status,
      availability: row.availability,
      typeName: row.property_types?.name ?? "",
      communeName: row.communes?.name ?? "",
      priceAmount: num(row.price_amount),
      priceCurrency: row.price_currency,
      coverUrl: cover?.storage_path ? publicMediaUrl(config, cover.storage_path) : null,
      mediaCount: row.property_media.length,
      updatedAt: row.updated_at,
    };
  });
}

type DetailRow = {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  property_type_id: string;
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
  commune_id: string;
  sector: string | null;
  latitude: Num;
  longitude: Num;
  location_precision: LocationPrecision;
  is_featured: boolean;
  featured_rank: number | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
  property_internal: {
    street_address: string | null;
    unit: string | null;
    commission_terms: string | null;
    keys_location: string | null;
    internal_notes: string | null;
  } | null;
  property_media: MediaRow[];
  property_features: { feature_id: string }[];
  property_suitable_uses: { business_type_id: string }[];
};

export async function getAdminProperty(
  { supabase, config }: AdminContext,
  id: string,
): Promise<AdminPropertyDetail | null> {
  const row = await rows<DetailRow | null>(
    supabase
      .from("properties")
      .select(
        `*, property_internal ( street_address, unit, commission_terms, keys_location, internal_notes ),
         property_media ( ${MEDIA_SELECT} ),
         property_features ( feature_id ),
         property_suitable_uses ( business_type_id )`,
      )
      .eq("id", id)
      .maybeSingle(),
  );
  if (!row) return null;

  const internal = row.property_internal;
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    propertyTypeId: row.property_type_id,
    operation: row.operation,
    availability: row.availability,
    availableFrom: row.available_from,
    priceAmount: num(row.price_amount),
    priceCurrency: row.price_currency,
    commonExpensesClp: num(row.common_expenses_clp),
    guaranteeMonths: num(row.guarantee_months),
    minLeaseMonths: row.min_lease_months,
    builtAreaM2: num(row.built_area_m2),
    landAreaM2: num(row.land_area_m2),
    bathrooms: row.bathrooms,
    parkingSpots: row.parking_spots,
    bedrooms: row.bedrooms,
    communeId: row.commune_id,
    sector: row.sector,
    latitude: num(row.latitude),
    longitude: num(row.longitude),
    locationPrecision: row.location_precision,
    isFeatured: row.is_featured,
    featuredRank: row.featured_rank,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    featureIds: row.property_features.map((item) => item.feature_id),
    suitableUseIds: row.property_suitable_uses.map((item) => item.business_type_id),
    internal: {
      streetAddress: internal?.street_address ?? null,
      unit: internal?.unit ?? null,
      commissionTerms: internal?.commission_terms ?? null,
      keysLocation: internal?.keys_location ?? null,
      internalNotes: internal?.internal_notes ?? null,
    },
    media: row.property_media
      .map((media) => mapMedia(config, media))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getPropertyFormOptions({
  supabase,
}: AdminContext): Promise<PropertyFormOptions> {
  const [types, communes, features, businessTypes] = await Promise.all([
    rows<{ id: string; name: string; is_active: boolean }[]>(
      supabase.from("property_types").select("id, name, is_active").order("sort_order"),
    ),
    rows<{ id: string; name: string; is_active: boolean }[]>(
      supabase.from("communes").select("id, name, is_active").order("sort_order"),
    ),
    rows<{ id: string; label: string }[]>(
      supabase.from("features").select("id, label").order("sort_order"),
    ),
    rows<{ id: string; name: string }[]>(
      supabase.from("business_types").select("id, name").order("sort_order"),
    ),
  ]);

  return {
    types: types.map((type) => ({ id: type.id, name: type.name, isActive: type.is_active })),
    communes: communes.map((commune) => ({
      id: commune.id,
      name: commune.name,
      isActive: commune.is_active,
    })),
    features,
    businessTypes,
  };
}
