"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Film, ImagePlus, Link2, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { createSessionBrowserClient } from "@/lib/supabase/browser-client";
import type { ActionResult } from "../properties/actions";
import {
  addVideoLinkAction,
  deleteMediaAction,
  moveMediaAction,
  registerUploadedMediaAction,
  setCoverAction,
  updateMediaTextAction,
} from "../properties/media-actions";
import type { AdminMedia } from "../properties/types";

type MediaManagerProps = {
  propertyId: string;
  media: AdminMedia[];
  config: SupabaseConfig;
};

/** Lado mayor de las fotos subidas: suficiente para pantallas grandes, liviano para móviles. */
const MAX_IMAGE_SIDE = 2400;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

type Prepared = {
  blob: Blob;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
};

/** Reduce fotos grandes a JPEG (calidad 85) y obtiene sus dimensiones. */
async function prepareFile(file: File): Promise<Prepared> {
  if (file.type.startsWith("video/")) {
    if (!EXTENSIONS[file.type]) throw new Error("Usa videos MP4 o WebM.");
    if (file.size > MAX_VIDEO_BYTES) throw new Error("El video supera 50 MB. Súbelo a YouTube.");
    return { blob: file, kind: "video", width: null, height: null };
  }
  if (!EXTENSIONS[file.type]) throw new Error("Formato no compatible. Usa JPG, PNG o WebP.");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
  if (scale === 1 && file.size <= 3 * 1024 * 1024) {
    bitmap.close();
    return { blob: file, kind: "image", width, height };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("No se pudo procesar la foto.");
  return { blob, kind: "image", width: canvas.width, height: canvas.height };
}

export function MediaManager({ propertyId, media, config }: MediaManagerProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  /** Ejecuta una acción del servidor y refresca la lista. */
  function run(action: () => Promise<ActionResult>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage({ tone: "error", text: result.message });
      router.refresh();
    });
  }

  async function upload(files: FileList) {
    const supabase = createSessionBrowserClient(config);
    const failures: string[] = [];
    setMessage(null);

    for (const [index, file] of [...files].entries()) {
      setProgress(`Subiendo ${index + 1} de ${files.length}: ${file.name}`);
      try {
        const prepared = await prepareFile(file);
        const path = `${propertyId}/${crypto.randomUUID()}.${EXTENSIONS[prepared.blob.type || file.type]}`;
        const { error } = await supabase.storage
          .from("property-media")
          .upload(path, prepared.blob, {
            contentType: prepared.blob.type || file.type,
            cacheControl: "31536000",
          });
        if (error) throw new Error("No se pudo subir el archivo.");
        const result = await registerUploadedMediaAction({
          propertyId,
          path,
          kind: prepared.kind,
          width: prepared.width,
          height: prepared.height,
        });
        if (!result.ok) {
          await supabase.storage.from("property-media").remove([path]);
          throw new Error(result.message);
        }
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : "error"}`);
      }
    }

    setProgress(null);
    if (fileInput.current) fileInput.current.value = "";
    if (failures.length > 0) setMessage({ tone: "error", text: failures.join(" · ") });
    router.refresh();
  }

  const busy = pending || progress !== null;

  return (
    <section
      aria-labelledby="media-title"
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="media-title" className="text-lg font-semibold">
            Fotos y videos
          </h2>
          <p className="text-sm text-ink-muted">
            La primera foto es la portada. Las fotos grandes se reducen a {MAX_IMAGE_SIDE} px antes
            de subirlas.
          </p>
        </div>
        <Button variant="secondary" disabled={busy} onClick={() => fileInput.current?.click()}>
          <ImagePlus /> Subir fotos o videos
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          multiple
          hidden
          onChange={(event) => event.target.files?.length && upload(event.target.files)}
        />
      </div>

      {progress && (
        <p role="status" className="rounded-lg bg-surface-muted px-4 py-3 text-sm">
          {progress}
        </p>
      )}
      {message && (
        <p
          role="alert"
          className={
            message.tone === "error"
              ? "rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
              : "rounded-lg bg-surface-muted px-4 py-3 text-sm"
          }
        >
          {message.text}
        </p>
      )}

      {media.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
          Aún no hay fotos. Para publicar se necesita al menos una.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item, index) => (
            <MediaItem
              key={item.id}
              item={item}
              first={index === 0}
              last={index === media.length - 1}
              disabled={busy}
              onMove={(direction) => run(() => moveMediaAction(propertyId, item.id, direction))}
              onCover={() => run(() => setCoverAction(propertyId, item.id))}
              onDelete={() => {
                if (confirm("¿Eliminar este archivo? No se puede deshacer.")) {
                  run(() => deleteMediaAction(propertyId, item.id));
                }
              }}
              onSaveText={(text) => run(() => updateMediaTextAction(propertyId, item.id, text))}
            />
          ))}
        </ul>
      )}

      <VideoLinkForm
        disabled={busy}
        onAdd={(url, title) => run(() => addVideoLinkAction(propertyId, url, title))}
      />
    </section>
  );
}

function MediaItem({
  item,
  first,
  last,
  disabled,
  onMove,
  onCover,
  onDelete,
  onSaveText,
}: {
  item: AdminMedia;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onMove: (direction: "up" | "down") => void;
  onCover: () => void;
  onDelete: () => void;
  onSaveText: (text: string) => void;
}) {
  const [text, setText] = useState(item.alt);
  const isImage = item.kind === "image";

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="relative aspect-[4/3] bg-surface-muted">
        {isImage ? (
          <Image
            src={item.url}
            alt={item.alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 300px, 50vw"
            className="object-cover"
          />
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-soft"
          >
            <Film className="size-8" aria-hidden />
            {item.provider === "storage"
              ? "Video subido"
              : `Video de ${item.provider === "youtube" ? "YouTube" : "Vimeo"}`}
          </a>
        )}
        {item.isCover && (
          <Badge tone="overlay" className="absolute top-2 left-2">
            <Star aria-hidden /> Portada
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
          {isImage ? "Descripción de la foto (accesibilidad)" : "Título del video"}
          <span className="flex gap-2">
            <Input
              value={text}
              maxLength={200}
              onChange={(event) => setText(event.target.value)}
              className="h-9 text-sm"
              placeholder={isImage ? "Vitrina hacia la calle" : "Recorrido del local"}
            />
            {text !== item.alt && (
              <Button size="sm" disabled={disabled} onClick={() => onSaveText(text)}>
                Guardar
              </Button>
            )}
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || first}
            onClick={() => onMove("up")}
            aria-label="Mover antes"
          >
            <ArrowUp />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || last}
            onClick={() => onMove("down")}
            aria-label="Mover después"
          >
            <ArrowDown />
          </Button>
          {isImage && !item.isCover && (
            <Button size="sm" variant="ghost" disabled={disabled} onClick={onCover}>
              <Star /> Portada
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onDelete}
            className="ml-auto text-danger"
          >
            <Trash2 /> Eliminar
          </Button>
        </div>
      </div>
    </li>
  );
}

function VideoLinkForm({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (url: string, title: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  return (
    <form
      className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(url, title);
        setUrl("");
        setTitle("");
      }}
    >
      <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
        Enlace de YouTube o Vimeo
        <Input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          required
        />
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
        Título (opcional)
        <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
      </label>
      <Button type="submit" variant="secondary" disabled={disabled || !url}>
        <Link2 /> Agregar video
      </Button>
    </form>
  );
}
