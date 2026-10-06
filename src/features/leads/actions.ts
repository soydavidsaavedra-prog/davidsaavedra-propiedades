"use server";

import { siteConfig } from "@/config/site";
import { getPublishedPropertyById } from "@/features/properties/queries";
import { propertyPath } from "@/features/properties/seo";
import { whatsappUrl } from "@/lib/whatsapp";
import { submitLead } from "./repository";
import { parseLeadForm, type LeadFieldErrors } from "./validation";

/** Valores ingresados, para restaurarlos si hay que corregir algo. */
export type LeadFormValues = Partial<
  Record<
    | "nombre"
    | "whatsapp"
    | "rubro"
    | "presupuesto"
    | "plazo"
    | "mensaje"
    | "consentimiento"
    | "tipo_cliente",
    string
  >
>;

export type LeadFormState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: LeadFieldErrors; values: LeadFormValues; attempt: number }
  | {
      status: "error";
      message: string;
      values: LeadFormValues;
      attempt: number;
      /** Contacto alternativo por WhatsApp (si está configurado). */
      whatsappUrl: string | null;
    }
  | { status: "success"; firstName: string; whatsappUrl: string | null };

/** Mensaje prellenado para continuar la conversación por WhatsApp. */
function whatsappMessage(
  name: string,
  property: Awaited<ReturnType<typeof getPublishedPropertyById>>,
  leadType: "tenant" | "owner",
): string {
  if (leadType === "owner") {
    return `Hola David, soy ${name}. Tengo una propiedad para arrendar y me gustaría conversar.`;
  }
  if (!property) return `Hola David, soy ${name}. Te escribí desde tu sitio web.`;
  const url = new URL(propertyPath(property.slug), siteConfig.url).toString();
  return `Hola David, soy ${name}. Me interesa el ${property.type.name.toLowerCase()} ${property.code} en ${property.commune.name} (${url}). ¿Podemos coordinar una visita?`;
}

const FORM_FIELDS = [
  "nombre",
  "whatsapp",
  "rubro",
  "presupuesto",
  "plazo",
  "mensaje",
  "consentimiento",
  "tipo_cliente",
] as const;

function submittedValues(formData: FormData): LeadFormValues {
  const values: LeadFormValues = {};
  for (const field of FORM_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value.slice(0, 2000);
  }
  return values;
}

export async function submitLeadAction(
  _previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  // Trampa para bots: campo invisible que una persona no completa.
  if (formData.get("sitio_web")) {
    return { status: "success", firstName: "", whatsappUrl: null };
  }

  const parsed = parseLeadForm(formData);
  if (!parsed.ok) {
    return {
      status: "invalid",
      fieldErrors: parsed.fieldErrors,
      values: submittedValues(formData),
      attempt: Date.now(),
    };
  }

  // La propiedad se valida en el servidor (no se confía en el formulario).
  const property = parsed.data.propertyId
    ? await getPublishedPropertyById(parsed.data.propertyId)
    : null;
  const submission = { ...parsed.data, propertyId: property?.id };

  const result = await submitLead(submission);
  const firstName = submission.fullName.split(" ")[0] ?? submission.fullName;
  const contactUrl = siteConfig.whatsappNumber
    ? whatsappUrl(
        siteConfig.whatsappNumber,
        whatsappMessage(firstName, property, submission.leadType),
      )
    : null;

  if (!result.ok) {
    return {
      status: "error",
      values: submittedValues(formData),
      attempt: Date.now(),
      whatsappUrl: contactUrl,
      message:
        result.reason === "rate_limited"
          ? "Recibimos varias solicitudes seguidas. Intenta nuevamente en unos minutos."
          : "No pudimos registrar tu solicitud en este momento. Escríbeme directamente y te respondo a la brevedad.",
    };
  }

  return { status: "success", firstName, whatsappUrl: contactUrl };
}
