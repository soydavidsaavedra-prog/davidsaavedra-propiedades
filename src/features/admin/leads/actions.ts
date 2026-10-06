"use server";

import { refresh } from "next/cache";
import {
  LEAD_ACTIVITY_TYPES,
  LEAD_PROPERTY_RELATIONS,
  LEAD_STATUSES,
  type LeadActivityType,
  type LeadPropertyRelation,
  type LeadStatus,
} from "@/features/leads/constants";
import { assertAdmin } from "../session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LeadActionResult = { ok: true } | { ok: false; message: string };

/** Tipos que se registran a mano (la consulta web la escribe `submit_lead`). */
const MANUAL_ACTIVITY_TYPES: readonly LeadActivityType[] = LEAD_ACTIVITY_TYPES.filter(
  (type) => type !== "web_inquiry",
);

function isIsoDate(value: string): boolean {
  return value.length <= 40 && !Number.isNaN(Date.parse(value));
}

/** Cambia el estado del embudo. Perdido exige un motivo; el historial lo escribe un trigger. */
export async function setLeadStatusAction(
  id: string,
  status: LeadStatus,
  lostReason?: string,
): Promise<LeadActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(id) || !LEAD_STATUSES.includes(status)) {
    return { ok: false, message: "Solicitud no válida." };
  }
  const reason = lostReason?.trim() ?? "";
  if (status === "lost" && !reason) {
    return { ok: false, message: "Indica el motivo por el que se perdió." };
  }
  if (reason.length > 300) return { ok: false, message: "El motivo es demasiado largo." };

  const { error } = await supabase
    .from("leads")
    .update({ status, lost_reason: status === "lost" ? reason : null })
    .eq("id", id);
  if (error) {
    console.error("[admin] Error al cambiar el estado del lead:", error.message);
    return { ok: false, message: "No se pudo cambiar el estado." };
  }
  refresh();
  return { ok: true };
}

/** Registra una nota o interacción en el timeline. */
export async function addLeadActivityAction(input: {
  leadId: string;
  type: LeadActivityType;
  body: string;
  occurredAt?: string;
}): Promise<LeadActionResult> {
  const { supabase, user } = await assertAdmin();
  const body = input.body.trim();
  if (!UUID.test(input.leadId) || !MANUAL_ACTIVITY_TYPES.includes(input.type)) {
    return { ok: false, message: "Solicitud no válida." };
  }
  if (!body) return { ok: false, message: "Escribe el detalle." };
  if (body.length > 4000) return { ok: false, message: "El texto es demasiado largo." };
  if (input.occurredAt && !isIsoDate(input.occurredAt)) {
    return { ok: false, message: "La fecha no es válida." };
  }
  if (input.occurredAt && Date.parse(input.occurredAt) > Date.now() + 5 * 60_000) {
    return { ok: false, message: "La fecha no puede ser futura." };
  }

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: input.leadId,
    type: input.type,
    body,
    created_by: user.id,
    ...(input.occurredAt ? { occurred_at: input.occurredAt } : {}),
  });
  if (error) {
    console.error("[admin] Error al registrar la actividad:", error.message);
    return { ok: false, message: "No se pudo guardar." };
  }
  refresh();
  return { ok: true };
}

/** Define (o borra, con texto vacío) la próxima acción y su fecha. */
export async function setLeadNextActionAction(
  id: string,
  nextAction: string,
  nextActionAt: string | null,
): Promise<LeadActionResult> {
  const { supabase } = await assertAdmin();
  const text = nextAction.trim();
  if (!UUID.test(id)) return { ok: false, message: "Solicitud no válida." };
  if (text.length > 200) return { ok: false, message: "Máximo 200 caracteres." };
  if (nextActionAt && !isIsoDate(nextActionAt)) {
    return { ok: false, message: "La fecha no es válida." };
  }
  if (!text && nextActionAt) return { ok: false, message: "Describe la próxima acción." };

  const { error } = await supabase
    .from("leads")
    .update({ next_action: text || null, next_action_at: text ? nextActionAt : null })
    .eq("id", id);
  if (error) {
    console.error("[admin] Error al guardar la próxima acción:", error.message);
    return { ok: false, message: "No se pudo guardar." };
  }
  refresh();
  return { ok: true };
}

/** Vincula una propiedad al lead o cambia la relación (sugerida, visitada…). */
export async function setLeadPropertyAction(
  leadId: string,
  propertyId: string,
  relation: LeadPropertyRelation,
): Promise<LeadActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(leadId) || !UUID.test(propertyId) || !LEAD_PROPERTY_RELATIONS.includes(relation)) {
    return { ok: false, message: "Solicitud no válida." };
  }
  const { error } = await supabase
    .from("lead_properties")
    .upsert(
      { lead_id: leadId, property_id: propertyId, relation },
      { onConflict: "lead_id,property_id" },
    );
  if (error) {
    console.error("[admin] Error al vincular la propiedad:", error.message);
    return { ok: false, message: "No se pudo guardar." };
  }
  refresh();
  return { ok: true };
}

/** Quita el vínculo entre el lead y una propiedad. */
export async function removeLeadPropertyAction(
  leadId: string,
  propertyId: string,
): Promise<LeadActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(leadId) || !UUID.test(propertyId)) {
    return { ok: false, message: "Solicitud no válida." };
  }
  const { error } = await supabase
    .from("lead_properties")
    .delete()
    .eq("lead_id", leadId)
    .eq("property_id", propertyId);
  if (error) {
    console.error("[admin] Error al quitar la propiedad:", error.message);
    return { ok: false, message: "No se pudo quitar." };
  }
  refresh();
  return { ok: true };
}
