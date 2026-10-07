import { normalizePhone } from "@/lib/phone";
import { LEAD_SOURCES, MOVE_TIMEFRAMES, type LeadSource, type MoveTimeframe } from "./constants";
import { BUDGET_RANGES } from "./options";
import type { LeadSubmission } from "./types";

export type LeadFieldErrors = Partial<
  Record<"fullName" | "phone" | "consent" | "message" | "email" | "area", string>
>;

export type LeadParseResult =
  { ok: true; data: LeadSubmission } | { ok: false; fieldErrors: LeadFieldErrors };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string, max: number): string | undefined {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function uuidOrUndefined(value: string | undefined): string | undefined {
  return value && UUID.test(value) ? value : undefined;
}

/** utm_source → canal del CRM. */
function sourceFromUtm(utmSource: string | undefined): LeadSource {
  const normalized = utmSource?.toLowerCase();
  if (normalized === "ig") return "instagram";
  if (normalized === "fb") return "facebook";
  return LEAD_SOURCES.includes(normalized as LeadSource) ? (normalized as LeadSource) : "website";
}

/**
 * Valida y normaliza el formulario de interés. Mismas reglas que
 * `public.submit_lead` (la base de datos vuelve a validar).
 */
export function parseLeadForm(formData: FormData): LeadParseResult {
  const fieldErrors: LeadFieldErrors = {};

  const fullName = text(formData, "nombre", 120);
  if (!fullName || fullName.length < 2) fieldErrors.fullName = "Ingresa tu nombre.";

  const rawPhone = text(formData, "whatsapp", 30);
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (!phone) fieldErrors.phone = "Ingresa un WhatsApp válido, por ejemplo 9 1234 5678.";

  if (formData.get("consentimiento") !== "1") {
    fieldErrors.consent = "Necesitamos tu autorización para contactarte.";
  }

  const rawMessage = formData.get("mensaje");
  if (typeof rawMessage === "string" && rawMessage.trim().length > 2000) {
    fieldErrors.message = "El mensaje puede tener hasta 2.000 caracteres.";
  }

  const email = text(formData, "email", 254);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "Correo no válido.";

  const rawArea = text(formData, "superficie_min", 10)?.replace(/\./g, "").replace(",", ".");
  const area = rawArea ? Number(rawArea) : undefined;
  if (area !== undefined && !(area >= 1 && area <= 100000)) {
    fieldErrors.area = "Ingresa una superficie en m², por ejemplo 60.";
  }

  if (!fullName || !phone || Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const propertyId = text(formData, "propiedad", 36);
  const businessTypeId = text(formData, "rubro", 36);
  const budget = BUDGET_RANGES.find((range) => range.value === formData.get("presupuesto"));
  const timeframe = text(formData, "plazo", 30);
  const utm = {
    source: text(formData, "utm_source", 100),
    medium: text(formData, "utm_medium", 100),
    campaign: text(formData, "utm_campaign", 100),
  };

  return {
    ok: true,
    data: {
      fullName,
      phone,
      consent: true,
      leadType: formData.get("tipo_cliente") === "owner" ? "owner" : "tenant",
      propertyId: propertyId && UUID.test(propertyId) ? propertyId : undefined,
      businessTypeId: businessTypeId && UUID.test(businessTypeId) ? businessTypeId : undefined,
      businessDescription: text(formData, "rubro_detalle", 200),
      budgetMinClp: budget?.min,
      budgetMaxClp: budget?.max,
      moveTimeframe: MOVE_TIMEFRAMES.includes(timeframe as MoveTimeframe)
        ? (timeframe as MoveTimeframe)
        : undefined,
      message: typeof rawMessage === "string" && rawMessage.trim() ? rawMessage.trim() : undefined,
      email,
      desiredPropertyTypeId: uuidOrUndefined(text(formData, "tipo_buscado", 36)),
      desiredCommuneId: uuidOrUndefined(text(formData, "comuna_buscada", 36)),
      desiredMinAreaM2: area,
      source: sourceFromUtm(utm.source),
      utm: utm.source || utm.medium || utm.campaign ? utm : undefined,
    },
  };
}
