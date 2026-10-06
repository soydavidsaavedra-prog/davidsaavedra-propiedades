import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MediaFrame } from "@/components/ui/media-frame";
import { cn } from "@/lib/cn";
import type { PropertyDetail, PropertyMedia } from "../../types";
import { AvailabilityBadge } from "../availability-badge";
import { PropertyCover } from "../property-cover";
import { GalleryDialog } from "./gallery-dialog";

const MAX_GRID = 5;

/** Distribución sin huecos para 1 a 5 fotos en una grilla de 4×2. */
function tileSpan(index: number, count: number): string | false {
  if (count === 1) return false;
  if (index === 0) return "col-span-2 row-span-2";
  if (count === 2) return "col-span-2 row-span-2";
  if (count === 3) return "col-span-2";
  if (count === 4 && index === 1) return "col-span-2";
  return false;
}

function altText(image: PropertyMedia, title: string, index: number) {
  return image.alt || `${title}, foto ${index + 1}`;
}

/**
 * Galería de la ficha. Móvil: carrusel deslizable a ancho completo.
 * Desktop: foto principal + 4 miniaturas y visor con todas las fotos.
 */
export function PropertyGallery({ property }: { property: PropertyDetail }) {
  const images = property.media
    .filter((media) => media.kind === "image")
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
  const badge = (
    <AvailabilityBadge
      availability={property.availability}
      overlay
      className="absolute top-3 left-3 z-10"
    />
  );

  if (images.length === 0) {
    return (
      <div className="relative -mx-4 aspect-4/3 overflow-hidden bg-surface-muted sm:mx-0 sm:aspect-video sm:rounded-xl md:aspect-auto md:h-[30rem]">
        <PropertyCover cover={null} sizes="100vw" />
        {badge}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Móvil */}
      <ul className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto md:hidden">
        {images.map((image, index) => (
          <li key={image.id} className="w-full shrink-0 snap-center">
            <MediaFrame
              ratio="4/3"
              media={
                <Image
                  src={image.source}
                  alt={altText(image, property.title, index)}
                  fill
                  sizes="100vw"
                  preload={index === 0}
                  className="object-cover"
                />
              }
            >
              {index === 0 && badge}
              <Badge tone="overlay" className="absolute right-3 bottom-3 tabular-nums">
                {index + 1} / {images.length}
              </Badge>
            </MediaFrame>
          </li>
        ))}
      </ul>

      {/* Desktop */}
      <div
        className={cn(
          "relative hidden h-[30rem] gap-2 overflow-hidden rounded-xl md:grid",
          images.length === 1 ? "grid-cols-1" : "grid-cols-4 grid-rows-2",
        )}
      >
        {images.slice(0, MAX_GRID).map((image, index) => (
          <div
            key={image.id}
            className={cn(
              "relative overflow-hidden bg-surface-muted",
              tileSpan(index, Math.min(images.length, MAX_GRID)),
            )}
          >
            <Image
              src={image.source}
              alt={altText(image, property.title, index)}
              fill
              sizes={
                index === 0 ? "(min-width: 1152px) 576px, 50vw" : "(min-width: 1152px) 288px, 25vw"
              }
              preload={index === 0}
              className="object-cover"
            />
          </div>
        ))}
        {badge}
        {images.length > 1 && <GalleryDialog images={images} title={property.title} />}
      </div>
    </div>
  );
}
