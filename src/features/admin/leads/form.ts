import {
  LEAD_SOURCES,
  LEAD_TYPES,
  MOVE_TIMEFRAMES,
  type LeadSource,
  type LeadType,
  type MoveTimeframe,
} from "@/features/leads/constants";
import { formatPhone, normalizePhone } from "@/lib/phone";

/*
 * Formulario de lead del panel (alta manual y edición de datos). Repite las
 * restricciones de `leads` (supabase/migrations/…000500_crm.sql); la base de
 * datos vuelve a validar.
 */

export type LeadFormData = {
  fullName: string;
  phone: string;
  email: string | null;
  leadType: LeadType;
  source: LeadSource;
  businessTypeId: string | null;
  businessDescription: string | null;
  budgetMinClp: number | null;
  budgetMaxClp: number | null;
  moveTimeframe: MoveTimeframe | null;
  message: string | null;
  /** Solo en el alta: la persona autorizó guardar sus datos. */
  consent: boolean;
  /** Solo en el alta: propiedad por la que consultó. */
  propertyId: string | null;
};

export type LeadFieldErrors = Partial<Record<string, string>>;

export type LeadParseResult =
  { ok: true; data: LeadFormData } | { ok: false; fieldErrors: LeadFieldErrors };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function oneOf<T extends string>(options: readonly T[], value: unknown): T | null {
  return options.includes(value as T) ? (value as T) : null;
}

export function parseLeadAdminForm(formData: FormData): LeadParseResult {
  const fieldErrors: LeadFieldErrors = {};

  const text = (name: string, max: number, multiline = false): string | null => {
    const raw = formData.get(name);
    if (typeof raw !== "string") return null;
    const value = multiline ? raw.trim().replace(/\r\n/g, "\n") : raw.trim().replace(/\s+/g, " ");
    if (!value) return null;
    if (value.length > max) fieldErrors[name] = `Máximo ${max} caracteres.`;
    return value;
  };

  /** Monto en pesos: "450.000" o "450000". */
  const amount = (name: string): number | null => {
    const raw = text(name, 20);
    if (!raw) return null;
    const digits = raw.replace(/[$.\s]/g, "");
    if (!/^\d+$/.test(digits)) {
      fieldErrors[name] = "Ingresa un monto en pesos, sin decimales.";
      return null;
    }
    return Number(digits);
  };

  const fullName = text("nombre", 120);
  if (!fullName || fullName.length < 2) fieldErrors.nombre = "Ingresa el nombre.";

  const rawPhone = text("telefono", 30);
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (!phone) fieldErrors.telefono = "Ingresa un teléfono válido, por ejemplo 9 1234 5678.";

  const email = text("email", 254);
  if (email && !EMAIL.test(email)) fieldErrors.email = "Correo no válido.";

  const businessTypeId = text("rubro", 36);
  const propertyId = text("propiedad", 36);
  const budgetMinClp = amount("presupuesto_min");
  const budgetMaxClp = amount("presupuesto_max");
  if (budgetMinClp !== null && budgetMaxClp !== null && budgetMinClp > budgetMaxClp) {
    fieldErrors.presupuesto_max = "El máximo debe ser mayor o igual al mínimo.";
  }

  const data: LeadFormData = {
    fullName: fullName ?? "",
    phone: phone ?? "",
    email,
    leadType: oneOf(LEAD_TYPES, formData.get("tipo")) ?? "tenant",
    source: oneOf(LEAD_SOURCES, formData.get("origen")) ?? "other",
    businessTypeId: businessTypeId && UUID.test(businessTypeId) ? businessTypeId : null,
    businessDescription: text("rubro_detalle", 200),
    budgetMinClp,
    budgetMaxClp,
    moveTimeframe: oneOf(MOVE_TIMEFRAMES, formData.get("plazo")),
    message: text("mensaje", 2000, true),
    consent: formData.get("consentimiento") === "1",
    propertyId: propertyId && UUID.test(propertyId) ? propertyId : null,
  };

  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, data };
}

/** Columnas editables de `leads`. */
export function toLeadColumns(data: LeadFormData) {
  return {
    full_name: data.fullName,
    phone: data.phone,
    email: data.email,
    lead_type: data.leadType,
    source: data.source,
    business_type_id: data.businessTypeId,
    business_description: data.businessDescription,
    budget_min_clp: data.budgetMinClp,
    budget_max_clp: data.budgetMaxClp,
    move_timeframe: data.moveTimeframe,
    message: data.message,
  };
}

const clp = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

/** Valores iniciales del formulario de edición. */
export function toLeadFormValues(lead: {
  fullName: string;
  phone: string;
  email: string | null;
  leadType: LeadType;
  source: LeadSource;
  businessTypeId: string | null;
  businessDescription: string | null;
  budgetMinClp: number | null;
  budgetMaxClp: number | null;
  moveTimeframe: MoveTimeframe | null;
  message: string | null;
}): Record<string, string> {
  return {
    nombre: lead.fullName,
    telefono: formatPhone(lead.phone),
    email: lead.email ?? "",
    tipo: lead.leadType,
    origen: lead.source,
    rubro: lead.businessTypeId ?? "",
    rubro_detalle: lead.businessDescription ?? "",
    presupuesto_min: lead.budgetMinClp === null ? "" : clp.format(lead.budgetMinClp),
    presupuesto_max: lead.budgetMaxClp === null ? "" : clp.format(lead.budgetMaxClp),
    plazo: lead.moveTimeframe ?? "",
    mensaje: lead.message ?? "",
  };
}
