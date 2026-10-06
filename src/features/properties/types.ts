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
} from "./constants";

/*
 * Tipos de dominio que consume la interfaz pública. Solo contienen datos
 * públicos: la información interna (dirección exacta, propietarios, notas)
 * vive en otras tablas y nunca forma parte de estos tipos.
 */

export type PropertyType = {
  id: string;
  slug: string;
  name: string;
  namePlural: string;
  category: PropertyCategory;
  /** Inactivo = "Próximamente". */
  isActive: boolean;
  sortOrder: number;
};

export type Commune = {
  id: string;
  slug: string;
  name: string;
  region: string;
  isActive: boolean;
  sortOrder: number;
};

export type Feature = {
  id: string;
  key: string;
  label: string;
  category: FeatureCategory;
  isFilterable: boolean;
};

export type BusinessType = {
  id: string;
  slug: string;
  name: string;
};

/** `amount: null` = precio a consultar. */
export type Price = {
  amount: number | null;
  currency: PriceCurrency;
};

export type PropertyMedia = {
  id: string;
  kind: MediaKind;
  provider: MediaProvider;
  /**
   * URL lista para usar en la interfaz: pública de Storage o externa
   * (YouTube/Vimeo). La capa de datos resuelve la URL desde la ruta guardada.
   */
  source: string;
  posterSource: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  isCover: boolean;
  sortOrder: number;
};

export type PropertyLocation = {
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
};

/** Datos para tarjetas y listados. */
export type PropertySummary = {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string | null;
  type: Pick<PropertyType, "slug" | "name">;
  operation: PropertyOperation;
  availability: PropertyAvailability;
  availableFrom: string | null;
  price: Price;
  commonExpensesClp: number | null;
  builtAreaM2: number | null;
  landAreaM2: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  bedrooms: number | null;
  commune: Pick<Commune, "slug" | "name">;
  sector: string | null;
  isFeatured: boolean;
  cover: PropertyMedia | null;
  publishedAt: string | null;
};

/** Datos completos para la ficha. */
export type PropertyDetail = PropertySummary & {
  description: string | null;
  guaranteeMonths: number | null;
  minLeaseMonths: number | null;
  location: PropertyLocation | null;
  media: PropertyMedia[];
  features: Pick<Feature, "key" | "label" | "category">[];
  suitableUses: BusinessType[];
  seo: { title: string | null; description: string | null };
};

/** Registro tal como existe en la fuente de datos (incluye estado de publicación). */
export type PropertyRecord = PropertyDetail & {
  status: PropertyStatus;
  featuredRank: number | null;
};
