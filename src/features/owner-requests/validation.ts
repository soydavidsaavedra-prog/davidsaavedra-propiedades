import { normalizePhone } from "@/lib/phone";

/*
 * Formulario "Publica tu propiedad" (propietarios). Mismas reglas que
 * `public.submit_property_request` (la base de datos vuelve a validar).
 */

export type PropertyRequest = {
  fullName: string;
  phone: string;
  email?: string;
  propertyTypeId: string;
  communeId: string;
  operation: "rent" | "sale";
  streetAddress?: string;
  sector?: string;
  priceAmount?: number;
  builtAreaM2?: number;
  landAreaM2?: number;
  bathrooms?: number;
  parkingSpots?: number;
  bedrooms?: number;
  availableFrom?: string;
  description?: string;
  message?: string;
  featureIds: string[];
};

export type PropertyRequestErrors = Partial<Record<string, string>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parsePropertyRequest(
  formData: FormData,
): { ok: true; data: PropertyRequest } | { ok: false; fieldErrors: PropertyRequestErrors } {
  const fieldErrors: PropertyRequestErrors = {};

  const text = (name: string, max: number, multiline = false): string | undefined => {
    const raw = formData.get(name);
    if (typeof raw !== "string") return undefined;
    const value = multiline ? raw.trim().replace(/\r\n/g, "\n") : raw.trim().replace(/\s+/g, " ");
    if (!value) return undefined;
    if (value.length > max) fieldErrors[name] = `Máximo ${max} caracteres.`;
    return value;
  };

  /** Número en formato chileno: "450.000" o "70,5". */
  const number = (name: string, { integer = false, max = 100_000_000 } = {}) => {
    const raw = text(name, 20);
    if (!raw) return undefined;
    const normalized = raw.replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);
    if (!/^\d+(\.\d+)?$/.test(normalized) || (integer && !Number.isInteger(value)) || value > max) {
      fieldErrors[name] = integer ? "Ingresa un número entero." : "Ingresa un número válido.";
      return undefined;
    }
    return value;
  };

  const fullName = text("nombre", 120);
  if (!fullName || fullName.length < 2) fieldErrors.nombre = "Ingresa tu nombre.";

  const rawPhone = text("whatsapp", 30);
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (!phone) fieldErrors.whatsapp = "Ingresa un WhatsApp válido, por ejemplo 9 1234 5678.";

  const email = text("email", 254);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "Correo no válido.";

  const propertyTypeId = text("tipo", 36);
  if (!propertyTypeId || !UUID.test(propertyTypeId))
    fieldErrors.tipo = "Elige el tipo de propiedad.";
  const communeId = text("comuna", 36);
  if (!communeId || !UUID.test(communeId)) fieldErrors.comuna = "Elige la comuna.";

  const availableFrom = text("disponible_desde", 10);
  if (availableFrom && !/^\d{4}-\d{2}-\d{2}$/.test(availableFrom)) {
    fieldErrors.disponible_desde = "Fecha no válida.";
  }

  if (formData.get("consentimiento") !== "1") {
    fieldErrors.consentimiento = "Necesitamos tu autorización para contactarte.";
  }

  const data: PropertyRequest = {
    fullName: fullName ?? "",
    phone: phone ?? "",
    email,
    propertyTypeId: propertyTypeId ?? "",
    communeId: communeId ?? "",
    operation: formData.get("operacion") === "sale" ? "sale" : "rent",
    streetAddress: text("direccion", 200),
    sector: text("sector", 80),
    priceAmount: number("precio", { integer: true }),
    builtAreaM2: number("superficie_construida", { max: 1_000_000 }),
    landAreaM2: number("superficie_terreno"),
    bathrooms: number("banos", { integer: true, max: 100 }),
    parkingSpots: number("estacionamientos", { integer: true, max: 1000 }),
    bedrooms: number("dormitorios", { integer: true, max: 100 }),
    availableFrom,
    description: text("descripcion", 5000, true),
    message: text("mensaje", 2000, true),
    featureIds: formData
      .getAll("caracteristicas")
      .filter((value): value is string => typeof value === "string" && UUID.test(value))
      .slice(0, 50),
  };

  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, data };
}
