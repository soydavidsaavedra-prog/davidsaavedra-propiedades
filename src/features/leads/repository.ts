import { getSupabaseConfig } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import type { LeadSubmission } from "./types";

export type SubmitLeadResult =
  { ok: true; leadId: string } | { ok: false; reason: "not_configured" | "rate_limited" | "error" };

/*
 * Registro de leads.
 *
 * Con Supabase configurado: llama a `public.submit_lead` (RPC) como rol `anon`.
 * Esa función valida, exige consentimiento, limita abuso y deduplica por
 * teléfono; el visitante no tiene ningún otro permiso sobre los leads.
 *
 * Sin Supabase: en desarrollo se guarda en memoria (consola del servidor); en
 * producción NO se finge el éxito, para no perder leads en silencio.
 */

const devLeads: (LeadSubmission & { id: string; createdAt: string })[] = [];

export async function submitLead(submission: LeadSubmission): Promise<SubmitLeadResult> {
  const config = getSupabaseConfig();

  if (config) {
    const { data, error } = await createPublicClient(config).rpc("submit_lead", {
      p_full_name: submission.fullName,
      p_phone: submission.phone,
      p_consent: submission.consent,
      p_lead_type: submission.leadType,
      p_property_id: submission.propertyId,
      p_email: submission.email,
      p_business_type_id: submission.businessTypeId,
      p_business_description: submission.businessDescription,
      p_budget_min_clp: submission.budgetMinClp,
      p_budget_max_clp: submission.budgetMaxClp,
      p_move_timeframe: submission.moveTimeframe,
      p_message: submission.message,
      p_source: submission.source,
      p_utm_source: submission.utm?.source,
      p_utm_medium: submission.utm?.medium,
      p_utm_campaign: submission.utm?.campaign,
    });

    if (error) {
      if (error.message.includes("rate_limited")) return { ok: false, reason: "rate_limited" };
      // Sin datos personales en el registro del servidor.
      console.error("[lead] submit_lead falló:", error.code, error.message);
      return { ok: false, reason: "error" };
    }
    return { ok: true, leadId: String(data) };
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, reason: "not_configured" };
  }

  const lead = { ...submission, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  devLeads.push(lead);
  console.info("[lead] Nuevo lead (solo desarrollo, en memoria):", lead);
  return { ok: true, leadId: lead.id };
}
