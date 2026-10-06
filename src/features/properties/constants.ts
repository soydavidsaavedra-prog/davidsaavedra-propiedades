// Valores espejo de los enums de `supabase/migrations/20261006000100_base.sql`.
// Al conectar Supabase se reemplazarán por los tipos generados (`supabase gen types`).

export const PROPERTY_OPERATIONS = ["rent", "sale"] as const;
export type PropertyOperation = (typeof PROPERTY_OPERATIONS)[number];

export const PROPERTY_STATUSES = ["draft", "published", "archived"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const PROPERTY_AVAILABILITIES = [
  "available",
  "reserved",
  "rented",
  "sold",
  "unavailable",
] as const;
export type PropertyAvailability = (typeof PROPERTY_AVAILABILITIES)[number];

export const PRICE_CURRENCIES = ["CLP", "UF"] as const;
export type PriceCurrency = (typeof PRICE_CURRENCIES)[number];

export const LOCATION_PRECISIONS = ["exact", "approximate"] as const;
export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

export const MEDIA_KINDS = ["image", "video"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_PROVIDERS = ["storage", "youtube", "vimeo"] as const;
export type MediaProvider = (typeof MEDIA_PROVIDERS)[number];

export const PROPERTY_CATEGORIES = ["commercial", "residential", "land"] as const;
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

export const FEATURE_CATEGORIES = [
  "access",
  "services",
  "spaces",
  "commercial",
  "security",
  "other",
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export const operationLabels: Record<PropertyOperation, string> = {
  rent: "Arriendo",
  sale: "Venta",
};

export const statusLabels: Record<PropertyStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
};

export const availabilityLabels: Record<PropertyAvailability, string> = {
  available: "Disponible",
  reserved: "Reservada",
  rented: "Arrendada",
  sold: "Vendida",
  unavailable: "No disponible",
};
