"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Images, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { PropertyMedia } from "../../types";

/** Botón "Ver las N fotos" + visor a pantalla completa (dialog nativo). */
export function GalleryDialog({ images, title }: { images: PropertyMedia[]; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-4 bottom-4 inline-flex h-10 items-center gap-2 rounded-md bg-white/95 px-4 text-sm font-medium text-night shadow-soft backdrop-blur transition-colors hover:bg-white"
      >
        <Images aria-hidden className="size-4" />
        Ver las {images.length} fotos
      </button>
      <dialog
        ref={ref}
        aria-label={`Fotografías: ${title}`}
        onClose={() => setOpen(false)}
        className="theme-night m-0 h-dvh max-h-none w-full max-w-none bg-canvas p-0 backdrop:bg-night"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-canvas/90 py-2 pr-2 pl-5 backdrop-blur">
          <p className="truncate font-display font-semibold">{title}</p>
          <IconButton label="Cerrar" onClick={() => setOpen(false)}>
            <X />
          </IconButton>
        </div>
        <ul className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-6">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="relative aspect-3/2 overflow-hidden rounded-lg bg-surface"
            >
              <Image
                src={image.source}
                alt={image.alt || `${title}, foto ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
