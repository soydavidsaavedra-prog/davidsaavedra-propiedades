import {
  LOCATION_PRECISIONS,
  PRICE_CURRENCIES,
  PROPERTY_AVAILABILITIES,
  PROPERTY_OPERATIONS,
} from "@/features/properties/constants";
import type { PropertyFormData } from "./types";

/*
 * Validación del formulario de propiedad. Repite las restricciones de
 * `properties` (supabase/migrations/…000400_properties.sql) para mostrar
 * errores claros; la base de datos vuelve a validar.
 */

export type PropertyFieldErrors = Partial<Record<string, string>>;

export type PropertyParseResult =
  { ok: true; data: PropertyFormData } | { ok: false; fieldErrors: PropertyFieldErrors };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "Local en esquina, Ñuñoa" → "local-en-esquina-nunoa" */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

function oneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

/** Lee el formulario acumulando errores por campo. */
function reader(formData: FormData) {
  const fieldErrors: PropertyFieldErrors = {};

  function text(name: string, max: number, { multiline = false } = {}): string | null {
    const raw = formData.get(name);
    if (typeof raw !== "string") return null;
    const value = multiline ? raw.trim().replace(/\r\n/g, "\n") : raw.trim().replace(/\s+/g, " ");
    if (!value) return null;
    if (value.length > max) fieldErrors[name] = `Máximo ${max} caracteres.`;
    return value;
  }

  /**
   * Número en formato chileno: "450.000" (miles con punto) o "12,5" (decimal
   * con coma). Vacío = null.
   */
  function number(
    name: string,
    { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false, positive = false } = {},
  ): number | null {
    const raw = formData.get(name);
    if (typeof raw !== "string" || !raw.trim()) return null;
    const normalized = raw.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);
    if (!/^-?\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(value)) {
      fieldErrors[name] = "Ingresa un número válido.";
      return null;
    }
    if (integer && !Number.isInteger(value)) fieldErrors[name] = "Ingresa un número entero.";
    else if (positive && value <= 0) fieldErrors[name] = "Debe ser mayor que 0.";
    else if (value < min || value > max) fieldErrors[name] = `Debe estar entre ${min} y ${max}.`;
    return value;
  }

  /** Coordenadas: aceptan punto decimal (formato de Google Maps). */
  function coordinate(name: string, limit: number): number | null {
    const raw = formData.get(name);
    if (typeof raw !== "string" || !raw.trim()) return null;
    const value = Number(raw.trim().replace(",", "."));
    if (!Number.isFinite(value) || Math.abs(value) > limit) {
      fieldErrors[name] = "Coordenada no válida.";
      return null;
    }
    return Math.round(value * 1e6) / 1e6;
  }

  function ids(name: string): string[] {
    return [
      ...new Set(formData.getAll(name).filter((v): v is string => typeof v === "string")),
    ].filter((value) => UUID.test(value));
  }

  return { fieldErrors, text, number, coordinate, ids };
}

export function parsePropertyForm(formData: FormData): PropertyParseResult {
  const { fieldErrors, text, number, coordinate, ids } = reader(formData);

  const title = text("titulo", 120);
  if (!title || title.length < 5)
    fieldErrors.titulo = "El título debe tener entre 5 y 120 caracteres.";

  const slug = text("slug", 80) ?? (title ? slugify(title) : "");
  if (!SLUG.test(slug)) {
    fieldErrors.slug = "Solo minúsculas, números y guiones (ej. local-centro-la-ligua).";
  }

  const propertyTypeId = text("tipo", 36);
  if (!propertyTypeId || !UUID.test(propertyTypeId))
    fieldErrors.tipo = "Elige el tipo de propiedad.";

  const communeId = text("comuna", 36);
  if (!communeId || !UUID.test(communeId)) fieldErrors.comuna = "Elige la comuna.";

  const availableFrom = text("disponible_desde", 10);
  if (availableFrom && !DATE.test(availableFrom)) fieldErrors.disponible_desde = "Fecha no válida.";

  const priceCurrency = oneOf(PRICE_CURRENCIES, formData.get("moneda"), "CLP");
  const priceAmount = number("precio", { integer: priceCurrency === "CLP" });

  const latitude = coordinate("latitud", 90);
  const longitude = coordinate("longitud", 180);
  if ((latitude === null) !== (longitude === null)) {
    fieldErrors.longitud = "Ingresa latitud y longitud, o deja ambas vacías.";
  }

  const isFeatured = formData.get("destacada") === "1";

  const data: PropertyFormData = {
    title: title ?? "",
    slug,
    summary: text("resumen", 280),
    description: text("descripcion", 5000, { multiline: true }),
    propertyTypeId: propertyTypeId ?? "",
    operation: oneOf(PROPERTY_OPERATIONS, formData.get("operacion"), "rent"),
    availability: oneOf(PROPERTY_AVAILABILITIES, formData.get("disponibilidad"), "available"),
    availableFrom,
    priceAmount,
    priceCurrency,
    commonExpensesClp: number("gastos_comunes", { integer: true }),
    guaranteeMonths: number("garantia_meses", { max: 99 }),
    minLeaseMonths: number("plazo_minimo_meses", { integer: true, positive: true, max: 600 }),
    builtAreaM2: number("superficie_construida", { positive: true, max: 1_000_000 }),
    landAreaM2: number("superficie_terreno", { positive: true, max: 100_000_000 }),
    bathrooms: number("banos", { integer: true, max: 100 }),
    parkingSpots: number("estacionamientos", { integer: true, max: 1000 }),
    bedrooms: number("dormitorios", { integer: true, max: 100 }),
    communeId: communeId ?? "",
    sector: text("sector", 80),
    latitude,
    longitude,
    locationPrecision: oneOf(
      LOCATION_PRECISIONS,
      formData.get("precision_ubicacion"),
      "approximate",
    ),
    isFeatured,
    featuredRank: isFeatured ? number("orden_destacada", { integer: true, max: 999 }) : null,
    seoTitle: text("seo_titulo", 70),
    seoDescription: text("seo_descripcion", 170),
    featureIds: ids("caracteristicas"),
    suitableUseIds: ids("usos"),
    internal: {
      streetAddress: text("direccion", 200),
      unit: text("unidad", 50),
      commissionTerms: text("comision", 1000, { multiline: true }),
      keysLocation: text("llaves", 200),
      internalNotes: text("notas_internas", 5000, { multiline: true }),
    },
  };

  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, data };
}

/** Columnas de `properties` para insertar o actualizar. */
export function toPropertyColumns(data: PropertyFormData) {
  return {
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    property_type_id: data.propertyTypeId,
    operation: data.operation,
    availability: data.availability,
    available_from: data.availableFrom,
    price_amount: data.priceAmount,
    price_currency: data.priceCurrency,
    common_expenses_clp: data.commonExpensesClp,
    guarantee_months: data.guaranteeMonths,
    min_lease_months: data.minLeaseMonths,
    built_area_m2: data.builtAreaM2,
    land_area_m2: data.landAreaM2,
    bathrooms: data.bathrooms,
    parking_spots: data.parkingSpots,
    bedrooms: data.bedrooms,
    commune_id: data.communeId,
    sector: data.sector,
    latitude: data.latitude,
    longitude: data.longitude,
    location_precision: data.locationPrecision,
    is_featured: data.isFeatured,
    featured_rank: data.featuredRank,
    seo_title: data.seoTitle,
    seo_description: data.seoDescription,
  };
}

export function toInternalColumns(data: PropertyFormData) {
  return {
    street_address: data.internal.streetAddress,
    unit: data.internal.unit,
    commission_terms: data.internal.commissionTerms,
    keys_location: data.internal.keysLocation,
    internal_notes: data.internal.internalNotes,
  };
}

const decimalFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

/** 450000 → "450.000" · 12.5 → "12,5" (el mismo formato que acepta el formulario). */
function formatNumber(value: number | null): string {
  return value === null ? "" : decimalFormat.format(value);
}

/** Valores iniciales del formulario a partir de una propiedad guardada. */
export function toFormValues(data: PropertyFormData): Record<string, string | string[]> {
  return {
    titulo: data.title,
    slug: data.slug,
    resumen: data.summary ?? "",
    descripcion: data.description ?? "",
    tipo: data.propertyTypeId,
    operacion: data.operation,
    disponibilidad: data.availability,
    disponible_desde: data.availableFrom ?? "",
    precio: formatNumber(data.priceAmount),
    moneda: data.priceCurrency,
    gastos_comunes: formatNumber(data.commonExpensesClp),
    garantia_meses: formatNumber(data.guaranteeMonths),
    plazo_minimo_meses: formatNumber(data.minLeaseMonths),
    superficie_construida: formatNumber(data.builtAreaM2),
    superficie_terreno: formatNumber(data.landAreaM2),
    banos: formatNumber(data.bathrooms),
    estacionamientos: formatNumber(data.parkingSpots),
    dormitorios: formatNumber(data.bedrooms),
    comuna: data.communeId,
    sector: data.sector ?? "",
    latitud: data.latitude === null ? "" : String(data.latitude),
    longitud: data.longitude === null ? "" : String(data.longitude),
    precision_ubicacion: data.locationPrecision,
    destacada: data.isFeatured ? "1" : "",
    orden_destacada: formatNumber(data.featuredRank),
    seo_titulo: data.seoTitle ?? "",
    seo_descripcion: data.seoDescription ?? "",
    caracteristicas: data.featureIds,
    usos: data.suitableUseIds,
    direccion: data.internal.streetAddress ?? "",
    unidad: data.internal.unit ?? "",
    comision: data.internal.commissionTerms ?? "",
    llaves: data.internal.keysLocation ?? "",
    notas_internas: data.internal.internalNotes ?? "",
  };
}
