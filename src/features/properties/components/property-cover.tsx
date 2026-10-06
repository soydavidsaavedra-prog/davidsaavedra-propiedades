import Image from "next/image";
import { Building2 } from "lucide-react";
import type { PropertyMedia } from "../types";

type PropertyCoverProps = {
  cover: PropertyMedia | null;
  /** Atributo `sizes` de la imagen según el layout donde se usa. */
  sizes: string;
  /** Solo para la imagen principal visible al cargar (LCP). */
  preload?: boolean;
};

/**
 * Foto de portada dentro de un MediaFrame. Sin foto, muestra un marcador sobrio
 * (nunca una imagen de stock).
 */
export function PropertyCover({ cover, sizes, preload = false }: PropertyCoverProps) {
  if (!cover) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-muted text-ink-muted">
        <Building2 aria-hidden className="size-7" strokeWidth={1.25} />
        <span className="text-xs font-medium tracking-wider uppercase">Fotos próximamente</span>
      </div>
    );
  }

  return (
    <Image
      src={cover.source}
      alt={cover.alt}
      fill
      sizes={sizes}
      preload={preload}
      className="object-cover"
    />
  );
}
