"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/features/properties/constants";
import { assertAdmin } from "../session";
import {
  parsePropertyForm,
  slugify,
  toInternalColumns,
  toPropertyColumns,
  type PropertyFieldErrors,
} from "./form";
import type { PropertyFormData } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valores enviados, para restaurar el formulario si hay que corregir algo. */
export type PropertyFormValues = Record<string, string | string[]>;

export type PropertyFormState =
  | { status: "idle" }
  | { status: "saved"; savedAt: number }
  | {
      status: "invalid" | "error";
      message: string;
      fieldErrors: PropertyFieldErrors;
      values: PropertyFormValues;
      attempt: number;
    };

export type ActionResult = { ok: true } | { ok: false; message: string };

/** El sitio público se regenera con los cambios (listado, fichas, sitemap). */
function refreshSite() {
  revalidatePath("/", "layout");
}

function submittedValues(formData: FormData): PropertyFormValues {
  const values: PropertyFormValues = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$")) continue;
    const all = formData.getAll(key).filter((value): value is string => typeof value === "string");
    values[key] = key === "caracteristicas" || key === "usos" ? all : (all[0] ?? "");
  }
  return values;
}

/** Primer slug libre: base, base-2, base-3… */
async function availableSlug(supabase: SupabaseClient, base: string): Promise<string> {
  const { data } = await supabase.from("properties").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((row: { slug: string }) => row.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Sincroniza una tabla de relación: borra lo desmarcado y agrega lo nuevo. */
async function syncRelation(
  supabase: SupabaseClient,
  table: "property_features" | "property_suitable_uses",
  column: "feature_id" | "business_type_id",
  propertyId: string,
  ids: string[],
) {
  let remove = supabase.from(table).delete().eq("property_id", propertyId);
  if (ids.length > 0) remove = remove.not(column, "in", `(${ids.join(",")})`);
  const { error: removeError } = await remove;
  if (removeError) throw removeError;
  if (ids.length === 0) return;
  const { error } = await supabase.from(table).upsert(
    ids.map((id) => ({ property_id: propertyId, [column]: id })),
    { onConflict: `property_id,${column}`, ignoreDuplicates: true },
  );
  if (error) throw error;
}

async function saveRelated(supabase: SupabaseClient, propertyId: string, data: PropertyFormData) {
  const { error } = await supabase
    .from("property_internal")
    .upsert({ property_id: propertyId, ...toInternalColumns(data) }, { onConflict: "property_id" });
  if (error) throw error;
  await syncRelation(supabase, "property_features", "feature_id", propertyId, data.featureIds);
  await syncRelation(
    supabase,
    "property_suitable_uses",
    "business_type_id",
    propertyId,
    data.suitableUseIds,
  );
}

function failure(
  formData: FormData,
  status: "invalid" | "error",
  message: string,
  fieldErrors: PropertyFieldErrors = {},
): PropertyFormState {
  return { status, message, fieldErrors, values: submittedValues(formData), attempt: Date.now() };
}

/** Crea (sin `id`) o actualiza una propiedad. Las nuevas quedan en borrador. */
export async function savePropertyAction(
  _previous: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const { supabase, user } = await assertAdmin();

  const parsed = parsePropertyForm(formData);
  if (!parsed.ok) {
    return failure(formData, "invalid", "Revisa los campos marcados.", parsed.fieldErrors);
  }
  const data = parsed.data;
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && UUID.test(rawId) ? rawId : null;
  let createdId: string | null = null;

  try {
    if (!id) {
      const slug = formData.get("slug")
        ? data.slug
        : await availableSlug(supabase, slugify(data.title));
      const { data: created, error } = await supabase
        .from("properties")
        .insert({ ...toPropertyColumns({ ...data, slug }), status: "draft", created_by: user.id })
        .select("id")
        .single<{ id: string }>();
      if (error) throw error;
      createdId = created.id;
      await saveRelated(supabase, created.id, data);
    } else {
      const { error } = await supabase
        .from("properties")
        .update(toPropertyColumns(data))
        .eq("id", id);
      if (error) throw error;
      await saveRelated(supabase, id, data);
    }
  } catch (error) {
    if (createdId) {
      // La propiedad ya existe: se sigue en su edición para no duplicarla.
      console.error("[admin] Propiedad creada con datos incompletos:", describe(error));
      redirect(`/admin/propiedades/${createdId}?creada=1&incompleta=1`);
    }
    if (isUniqueViolation(error, "slug")) {
      return failure(formData, "invalid", "Revisa los campos marcados.", {
        slug: "Ya existe otra propiedad con esta URL.",
      });
    }
    console.error("[admin] Error al guardar la propiedad:", describe(error));
    return failure(formData, "error", "No se pudo guardar. Inténtalo de nuevo.");
  }

  refreshSite();
  if (createdId) redirect(`/admin/propiedades/${createdId}?creada=1`);
  return { status: "saved", savedAt: Date.now() };
}

/** Publicar, volver a borrador o archivar. Publicar exige una foto de portada. */
export async function setPropertyStatusAction(
  id: string,
  status: PropertyStatus,
): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(id) || !PROPERTY_STATUSES.includes(status)) {
    return { ok: false, message: "Solicitud no válida." };
  }

  if (status === "published") {
    const { count } = await supabase
      .from("property_media")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id)
      .eq("is_cover", true);
    if (!count)
      return { ok: false, message: "Agrega al menos una foto (portada) antes de publicar." };
  }

  const { error } = await supabase.from("properties").update({ status }).eq("id", id);
  if (error) {
    console.error("[admin] Error al cambiar el estado:", describe(error));
    return { ok: false, message: "No se pudo cambiar el estado." };
  }
  // Publicar una solicitud de propietario la da por revisada.
  if (status === "published") {
    await supabase
      .from("properties")
      .update({ reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .is("reviewed_at", null);
  }
  refreshSite();
  return { ok: true };
}

/** Elimina una propiedad no publicada, con sus archivos del Storage. */
export async function deletePropertyAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Solicitud no válida." };

  const { data: property } = await supabase
    .from("properties")
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: PropertyStatus }>();
  if (!property) return { ok: false, message: "La propiedad no existe." };
  if (property.status === "published") {
    return { ok: false, message: "Pasa la propiedad a borrador antes de eliminarla." };
  }

  // Archivos de la galería y fotos enviadas por el propietario (si las hay).
  for (const bucketId of ["property-media", "property-submissions"]) {
    const bucket = supabase.storage.from(bucketId);
    const { data: files } = await bucket.list(id, { limit: 1000 });
    if (files && files.length > 0) {
      await bucket.remove(files.map((file) => `${id}/${file.name}`));
    }
  }

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) {
    console.error("[admin] Error al eliminar la propiedad:", describe(error));
    return { ok: false, message: "No se pudo eliminar la propiedad." };
  }
  refreshSite();
  redirect("/admin/propiedades?eliminada=1");
}

/** Da por revisada una solicitud de propietario (deja de aparecer como pendiente). */
export async function markPropertyReviewedAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Solicitud no válida." };
  const { error } = await supabase
    .from("properties")
    .update({ reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "No se pudo guardar." };
  refreshSite();
  return { ok: true };
}

function isUniqueViolation(error: unknown, column: string): boolean {
  const pg = error as { code?: string; message?: string; details?: string } | null;
  return pg?.code === "23505" && `${pg.message} ${pg.details}`.includes(column);
}

function describe(error: unknown): string {
  const pg = error as { code?: string; message?: string } | null;
  return pg?.message ? `${pg.code ?? ""} ${pg.message}` : String(error);
}
