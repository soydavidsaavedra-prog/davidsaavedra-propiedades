import type { LeadSubmission } from "./types";

export type SubmitLeadResult =
  { ok: true; leadId: string } | { ok: false; reason: "not_configured" | "rate_limited" | "error" };

/*
 * Registro de leads.
 *
 * TEMPORAL (sin base de datos): en desarrollo los leads se guardan en memoria y
 * se muestran en la consola del servidor. En producción NO se finge el éxito:
 * devuelve `not_configured` y la interfaz ofrece contacto alternativo, para no
 * perder ningún lead en silencio.
 *
 * Al conectar Supabase esta función llamará a `public.submit_lead` (RPC), que
 * valida, limita abuso y deduplica por teléfono.
 */

const devLeads: (LeadSubmission & { id: string; createdAt: string })[] = [];

export async function submitLead(submission: LeadSubmission): Promise<SubmitLeadResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, reason: "not_configured" };
  }

  const lead = { ...submission, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  devLeads.push(lead);
  console.info("[lead] Nuevo lead (solo desarrollo, en memoria):", lead);
  return { ok: true, leadId: lead.id };
}
