"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "../session";
import type { ActionResult } from "./actions";

/*
 * Fotos y videos. Los archivos se suben desde el navegador directo al Storage
 * (bucket `property-media`, ruta `{property_id}/{archivo}`); aquí solo se
 * registran y ordenan. Cada acción verifica el rol de administrador y RLS lo
 * vuelve a exigir.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm)$/;

type MediaRow = {
  id: string;
  kind: "image" | "video";
  provider: string;
  storage_path: string | null;
  is_cover: boolean;
  sort_order: number;
};

function refreshSite() {
  revalidatePath("/", "layout");
}

const invalid: ActionResult = { ok: false, message: "Solicitud no válida." };

async function listMedia(propertyId: string) {
  const context = await assertAdmin();
  const { data, error } = await context.supabase
    .from("property_media")
    .select("id, kind, provider, storage_path, is_cover, sort_order")
    .eq("property_id", propertyId)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return { ...context, media: (data ?? []) as MediaRow[] };
}

/** Contexto del administrador + posición al final de la galería. */
async function appendContext(propertyId: string) {
  const context = await listMedia(propertyId);
  return { ...context, sortOrder: (context.media.at(-1)?.sort_order ?? 0) + 10 };
}

/** Registra un archivo ya subido al Storage. La primera foto queda de portada. */
export async function registerUploadedMediaAction(input: {
  propertyId: string;
  path: string;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
}): Promise<ActionResult> {
  const { propertyId, path, kind } = input;
  const [folder, fileName, ...rest] = path.split("/");
  if (
    !UUID.test(propertyId) ||
    folder !== propertyId ||
    !fileName ||
    rest.length > 0 ||
    !FILE_NAME.test(fileName) ||
    (kind !== "image" && kind !== "video")
  ) {
    return invalid;
  }
  const dimension = (value: number | null) =>
    Number.isInteger(value) && value! > 0 && value! < 100_000 ? value : null;

  const { supabase, media, sortOrder } = await appendContext(propertyId);
  const hasCover = media.some((item) => item.is_cover);

  const { error } = await supabase.from("property_media").insert({
    property_id: propertyId,
    kind,
    provider: "storage",
    storage_path: path,
    width: dimension(input.width),
    height: dimension(input.height),
    sort_order: sortOrder,
    is_cover: kind === "image" && !hasCover,
  });
  if (error) {
    console.error("[admin] Error al registrar media:", error.message);
    return { ok: false, message: "No se pudo registrar el archivo." };
  }
  refreshSite();
  return { ok: true };
}

/** YouTube o Vimeo → URL canónica; null si no es un enlace reconocido. */
function parseVideoUrl(raw: string): { provider: "youtube" | "vimeo"; url: string } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const youtubeId =
    host === "youtu.be"
      ? url.pathname.slice(1)
      : host === "youtube.com"
        ? url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/)?.[2]
        : null;
  if (youtubeId && /^[\w-]{6,20}$/.test(youtubeId)) {
    return { provider: "youtube", url: `https://www.youtube.com/watch?v=${youtubeId}` };
  }
  const vimeoId = host === "vimeo.com" ? url.pathname.match(/^\/(\d{5,12})/)?.[1] : null;
  if (vimeoId) return { provider: "vimeo", url: `https://vimeo.com/${vimeoId}` };
  return null;
}

export async function addVideoLinkAction(
  propertyId: string,
  rawUrl: string,
  title: string,
): Promise<ActionResult> {
  if (!UUID.test(propertyId)) return invalid;
  const video = parseVideoUrl(String(rawUrl).slice(0, 500));
  if (!video) return { ok: false, message: "Pega un enlace de YouTube o Vimeo." };

  const { supabase, sortOrder } = await appendContext(propertyId);
  const { error } = await supabase.from("property_media").insert({
    property_id: propertyId,
    kind: "video",
    provider: video.provider,
    external_url: video.url,
    alt_text: String(title).trim().slice(0, 200) || null,
    sort_order: sortOrder,
  });
  if (error) {
    console.error("[admin] Error al agregar video:", error.message);
    return { ok: false, message: "No se pudo agregar el video." };
  }
  refreshSite();
  return { ok: true };
}

/** Texto alternativo (accesibilidad y SEO de imágenes) o título del video. */
export async function updateMediaTextAction(
  propertyId: string,
  mediaId: string,
  text: string,
): Promise<ActionResult> {
  if (!UUID.test(propertyId) || !UUID.test(mediaId)) return invalid;
  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("property_media")
    .update({ alt_text: String(text).trim().slice(0, 200) || null })
    .eq("id", mediaId)
    .eq("property_id", propertyId);
  if (error) return { ok: false, message: "No se pudo guardar el texto." };
  refreshSite();
  return { ok: true };
}

export async function setCoverAction(propertyId: string, mediaId: string): Promise<ActionResult> {
  if (!UUID.test(propertyId) || !UUID.test(mediaId)) return invalid;
  const { supabase, media } = await listMedia(propertyId);
  const target = media.find((item) => item.id === mediaId);
  if (!target || target.kind !== "image") return { ok: false, message: "Elige una foto." };

  // Índice único: solo una portada por propiedad. Primero se quita la actual.
  const { error: clearError } = await supabase
    .from("property_media")
    .update({ is_cover: false })
    .eq("property_id", propertyId)
    .eq("is_cover", true);
  const { error } = clearError
    ? { error: clearError }
    : await supabase.from("property_media").update({ is_cover: true }).eq("id", mediaId);
  if (error) return { ok: false, message: "No se pudo cambiar la portada." };
  refreshSite();
  return { ok: true };
}

export async function moveMediaAction(
  propertyId: string,
  mediaId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  if (!UUID.test(propertyId) || !UUID.test(mediaId)) return invalid;
  const { supabase, media } = await listMedia(propertyId);
  const index = media.findIndex((item) => item.id === mediaId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= media.length) return { ok: true };

  const ordered = media.map((item, position) =>
    position === index ? media[swapWith]! : position === swapWith ? media[index]! : item,
  );
  const results = await Promise.all(
    ordered.map((item, position) =>
      item.sort_order === (position + 1) * 10
        ? null
        : supabase
            .from("property_media")
            .update({ sort_order: (position + 1) * 10 })
            .eq("id", item.id),
    ),
  );
  if (results.some((result) => result?.error)) {
    return { ok: false, message: "No se pudo reordenar." };
  }
  refreshSite();
  return { ok: true };
}

/** Quita el registro y el archivo. Si era la portada, la siguiente foto la reemplaza. */
export async function deleteMediaAction(
  propertyId: string,
  mediaId: string,
): Promise<ActionResult> {
  if (!UUID.test(propertyId) || !UUID.test(mediaId)) return invalid;
  const { supabase, media } = await listMedia(propertyId);
  const target = media.find((item) => item.id === mediaId);
  if (!target) return { ok: true };

  const { error } = await supabase.from("property_media").delete().eq("id", mediaId);
  if (error) return { ok: false, message: "No se pudo eliminar." };
  if (target.provider === "storage" && target.storage_path) {
    await supabase.storage.from("property-media").remove([target.storage_path]);
  }
  if (target.is_cover) {
    const next = media.find((item) => item.id !== mediaId && item.kind === "image");
    if (next) await supabase.from("property_media").update({ is_cover: true }).eq("id", next.id);
  }
  refreshSite();
  return { ok: true };
}

/**
 * Pasa fotos enviadas por el propietario (bucket privado) a la galería
 * pública de la propiedad. La primera queda de portada si no había.
 */
export async function importSubmissionPhotosAction(
  propertyId: string,
  names: string[],
): Promise<ActionResult> {
  if (!UUID.test(propertyId) || names.length === 0 || names.length > 50) return invalid;
  if (!names.every((name) => FILE_NAME.test(name))) return invalid;

  const { supabase, media, sortOrder } = await appendContext(propertyId);
  let order = sortOrder;
  let hasCover = media.some((item) => item.is_cover);
  let failed = 0;

  for (const name of names) {
    const path = `${propertyId}/${name}`;
    const { error: copyError } = await supabase.storage
      .from("property-submissions")
      .copy(path, path, { destinationBucket: "property-media" });
    if (copyError) {
      console.error("[admin] Error al copiar la foto de la solicitud:", copyError.message);
      failed++;
      continue;
    }
    const { error } = await supabase.from("property_media").insert({
      property_id: propertyId,
      kind: "image",
      provider: "storage",
      storage_path: path,
      sort_order: order,
      is_cover: !hasCover,
    });
    if (error) {
      await supabase.storage.from("property-media").remove([path]);
      failed++;
      continue;
    }
    await supabase.storage.from("property-submissions").remove([path]);
    order += 10;
    hasCover = true;
  }

  refreshSite();
  return failed === 0
    ? { ok: true }
    : { ok: false, message: `${failed} foto(s) no se pudieron agregar.` };
}
