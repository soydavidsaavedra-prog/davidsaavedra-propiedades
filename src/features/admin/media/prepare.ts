/*
 * Preparación de fotos y videos en el navegador, antes de subirlos al
 * Storage (sin pasar por el servidor de la app):
 *
 * - Fotos: HEIC/HEIF (iPhone) se convierte a JPEG; las fotos de más de
 *   2400 px o de más de 3 MB se reducen a JPEG calidad 85.
 * - Videos: MOV (iPhone), MP4 y otros se recodifican a MP4 H.264, con el lado
 *   mayor en 1920 px como máximo, usando el códec del navegador (WebCodecs).
 *
 * Las librerías de conversión (libheif y mediabunny) se cargan solo cuando se
 * elige un archivo que las necesita.
 */

export const MAX_IMAGE_SIDE = 2400;
const MAX_VIDEO_SIDE = 1920;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Tipos que acepta el bucket `property-media` → extensión del archivo. */
export const UPLOAD_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** Para el selector de archivos (los navegadores no siempre reconocen HEIC/MOV por tipo). */
export const ACCEPTED_FILES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  ".heic",
  ".heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  ".mov",
  ".m4v",
].join(",");

export type PreparedFile = {
  blob: Blob;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
};

/** Avance de una conversión larga (videos), de 0 a 1. */
export type ProgressCallback = (fraction: number) => void;

function extension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function isHeic(file: File): boolean {
  return /^image\/hei[cf]/.test(file.type) || ["heic", "heif"].includes(extension(file));
}

function isVideo(file: File): boolean {
  return file.type.startsWith("video/") || ["mov", "m4v", "mp4", "webm"].includes(extension(file));
}

export async function prepareFile(
  file: File,
  onProgress?: ProgressCallback,
): Promise<PreparedFile> {
  if (isVideo(file)) return prepareVideo(file, onProgress);
  if (isHeic(file)) return prepareHeic(file);
  if (!UPLOAD_EXTENSIONS[file.type]) {
    throw new Error("Formato no compatible. Usa JPG, PNG, WebP o HEIC.");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const small =
    Math.max(bitmap.width, bitmap.height) <= MAX_IMAGE_SIDE && file.size <= 3 * 1024 * 1024;
  if (small) {
    const { width, height } = bitmap;
    bitmap.close();
    return { blob: file, kind: "image", width, height };
  }
  return toJpeg(bitmap);
}

async function prepareHeic(file: File): Promise<PreparedFile> {
  let bitmap: ImageBitmap;
  try {
    const { heicTo } = await import("heic-to");
    bitmap = await heicTo({ blob: file, type: "bitmap" });
  } catch {
    throw new Error("No se pudo leer la foto HEIC.");
  }
  return toJpeg(bitmap);
}

/** Dibuja la imagen (reducida si hace falta) y la codifica en JPEG calidad 85. */
async function toJpeg(bitmap: ImageBitmap): Promise<PreparedFile> {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("No se pudo procesar la foto.");
  return { blob, kind: "image", width: canvas.width, height: canvas.height };
}

async function prepareVideo(file: File, onProgress?: ProgressCallback): Promise<PreparedFile> {
  const converted = await compressVideo(file, onProgress);
  if (converted) {
    if (converted.blob.size > MAX_UPLOAD_BYTES) {
      throw new Error("El video sigue pesando más de 50 MB. Acórtalo o súbelo a YouTube.");
    }
    return converted;
  }

  // Sin WebCodecs: MP4/WebM se suben tal cual; MOV necesita conversión.
  if (!UPLOAD_EXTENSIONS[file.type]?.match(/mp4|webm/)) {
    throw new Error(
      "Este navegador no puede convertir videos MOV. Usa Chrome o Safari actualizados, o súbelo a YouTube.",
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("El video supera 50 MB. Súbelo a YouTube.");
  return { blob: file, kind: "video", width: null, height: null };
}

/** MP4 H.264 (lado mayor ≤ 1920 px, calidad media). `null` si el navegador no puede codificar. */
async function compressVideo(
  file: File,
  onProgress?: ProgressCallback,
): Promise<PreparedFile | null> {
  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    canEncodeVideo,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    QUALITY_MEDIUM,
  } = await import("mediabunny");
  if (typeof VideoEncoder === "undefined" || !(await canEncodeVideo("avc"))) return null;

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const track = await input.getPrimaryVideoTrack().catch(() => null);
  if (!track) throw new Error("No se pudo leer el video.");

  const landscape = track.displayWidth >= track.displayHeight;
  const tooLarge = Math.max(track.displayWidth, track.displayHeight) > MAX_VIDEO_SIDE;
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target });

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: "avc",
      bitrate: QUALITY_MEDIUM,
      forceTranscode: true,
      ...(tooLarge ? (landscape ? { width: MAX_VIDEO_SIDE } : { height: MAX_VIDEO_SIDE }) : {}),
    },
    showWarnings: false,
  });
  if (!conversion.isValid) throw new Error("No se pudo convertir este video.");
  if (onProgress) conversion.onProgress = (progress) => onProgress(progress);
  await conversion.execute();
  if (!target.buffer) throw new Error("No se pudo convertir este video.");

  const scale = tooLarge ? MAX_VIDEO_SIDE / Math.max(track.displayWidth, track.displayHeight) : 1;
  return {
    blob: new Blob([target.buffer], { type: "video/mp4" }),
    kind: "video",
    width: Math.round(track.displayWidth * scale),
    height: Math.round(track.displayHeight * scale),
  };
}
