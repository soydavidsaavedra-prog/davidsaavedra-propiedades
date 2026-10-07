import type {
  LocationPrecision,
  MediaKind,
  MediaProvider,
  PriceCurrency,
  PropertyAvailability,
  PropertyOperation,
  PropertyStatus,
} from "@/features/properties/constants";

/** Fila del listado del panel (todas las propiedades, cualquier estado). */
export type AdminPropertyListItem = {
  id: string;
  code: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  availability: PropertyAvailability;
  typeName: string;
  communeName: string;
  priceAmount: number | null;
  priceCurrency: PriceCurrency;
  coverUrl: string | null;
  mediaCount: number;
  updatedAt: string;
  /** Enviada por un propietario desde el formulario y aún sin revisar. */
  isRequest: boolean;
};

export type AdminMedia = {
  id: string;
  kind: MediaKind;
  provider: MediaProvider;
  storagePath: string | null;
  /** URL pública (Storage) o externa (YouTube/Vimeo). */
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  isCover: boolean;
  sortOrder: number;
};

/** Valores editables de una propiedad (públicos + internos). */
export type PropertyFormData = {
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  propertyTypeId: string;
  operation: PropertyOperation;
  availability: PropertyAvailability;
  availableFrom: string | null;
  priceAmount: number | null;
  priceCurrency: PriceCurrency;
  commonExpensesClp: number | null;
  guaranteeMonths: number | null;
  minLeaseMonths: number | null;
  builtAreaM2: number | null;
  landAreaM2: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  bedrooms: number | null;
  communeId: string;
  sector: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  isFeatured: boolean;
  featuredRank: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featureIds: string[];
  suitableUseIds: string[];
  internal: {
    streetAddress: string | null;
    unit: string | null;
    commissionTerms: string | null;
    keysLocation: string | null;
    internalNotes: string | null;
  };
};

export type AdminPropertyOwner = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};

/** Foto enviada por el propietario (bucket privado, URL firmada temporal). */
export type SubmissionPhoto = { name: string; url: string };

export type AdminPropertyDetail = PropertyFormData & {
  id: string;
  code: string;
  status: PropertyStatus;
  origin: "admin" | "owner_form";
  reviewedAt: string | null;
  owners: AdminPropertyOwner[];
  publishedAt: string | null;
  updatedAt: string;
  media: AdminMedia[];
};

/** Catálogos para los selectores del formulario. */
export type PropertyFormOptions = {
  types: { id: string; name: string; isActive: boolean }[];
  communes: { id: string; name: string; isActive: boolean }[];
  features: { id: string; label: string }[];
  businessTypes: { id: string; name: string }[];
};
