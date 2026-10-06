"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  LEAD_ACTIVITY_TYPES,
  LEAD_PROPERTY_RELATIONS,
  LEAD_STATUSES,
  type LeadActivityType,
  type LeadPropertyRelation,
  type LeadStatus,
} from "@/features/leads/constants";
import { assertAdmin } from "../session";
import { parseLeadAdminForm, toLeadColumns, type LeadFieldErrors } from "./form";

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

/** Valores enviados, para restaurar el formulario si hay que corregir algo. */
export type LeadFormState =
  | { status: "idle" }
  | { status: "saved"; savedAt: number }
  | {
      status: "invalid" | "error";
      message: string;
      fieldErrors: LeadFieldErrors;
      values: Record<string, string>;
      attempt: number;
      /** Lead abierto con el mismo teléfono (alta manual). */
      duplicateId?: string;
    };

function leadFailure(
  formData: FormData,
  status: "invalid" | "error",
  message: string,
  fieldErrors: LeadFieldErrors = {},
  duplicateId?: string,
): LeadFormState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$") && typeof value === "string") values[key] = value.slice(0, 2000);
  }
  return { status, message, fieldErrors, values, attempt: Date.now(), duplicateId };
}

/**
 * Alta manual (sin `id`: contactos por WhatsApp, Instagram, presenciales…) o
 * edición de los datos de un lead. El alta no duplica un lead abierto con el
 * mismo teléfono.
 */
export async function saveLeadAction(
  _previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const { supabase, user } = await assertAdmin();
  const parsed = parseLeadAdminForm(formData);
  if (!parsed.ok) {
    return leadFailure(formData, "invalid", "Revisa los campos marcados.", parsed.fieldErrors);
  }
  const data = parsed.data;
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && UUID.test(rawId) ? rawId : null;

  if (id) {
    const { error } = await supabase.from("leads").update(toLeadColumns(data)).eq("id", id);
    if (error) {
      console.error("[admin] Error al actualizar el lead:", error.message);
      return leadFailure(formData, "error", "No se pudo guardar. Inténtalo de nuevo.");
    }
    refresh();
    return { status: "saved", savedAt: Date.now() };
  }

  const { data: open } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", data.phone)
    .not("status", "in", "(won,lost)")
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (open) {
    return leadFailure(
      formData,
      "invalid",
      "Ya hay un lead abierto con este teléfono. Registra la nueva consulta en su timeline.",
      { telefono: "Teléfono ya registrado en un lead abierto." },
      open.id,
    );
  }

  const { data: created, error } = await supabase
    .from("leads")
    .insert({
      ...toLeadColumns(data),
      assigned_to: user.id,
      consent_at: data.consent ? new Date().toISOString() : null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) {
    console.error("[admin] Error al crear el lead:", error.message);
    return leadFailure(formData, "error", "No se pudo crear el lead. Inténtalo de nuevo.");
  }

  if (data.propertyId) {
    const { error: linkError } = await supabase
      .from("lead_properties")
      .insert({ lead_id: created.id, property_id: data.propertyId, relation: "inquired" });
    if (linkError) console.error("[admin] Error al vincular la propiedad:", linkError.message);
  }
  redirect(`/admin/leads/${created.id}?creado=1`);
}

/**
 * Elimina un lead con todo su historial (timeline, etapas, propiedades y
 * visitas): solicitud de supresión del titular de los datos (Ley 21.719).
 */
export async function deleteLeadAction(id: string): Promise<LeadActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Solicitud no válida." };
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) {
    console.error("[admin] Error al eliminar el lead:", error.message);
    return { ok: false, message: "No se pudo eliminar el lead." };
  }
  redirect("/admin/leads?eliminado=1");
}
