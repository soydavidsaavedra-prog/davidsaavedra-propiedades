import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { cn } from "@/lib/cn";
import { formatPrice } from "../format";
import type { PropertySummary } from "../types";
import { AvailabilityBadge } from "./availability-badge";
import { PropertyCover } from "./property-cover";
import { PropertyFacts } from "./property-facts";

type PropertyCardProps = {
  property: PropertySummary;
  /** Atributo `sizes` de la foto según la grilla donde se muestra. */
  sizes?: string;
  preload?: boolean;
  className?: string;
};

export function PropertyCard({
  property,
  sizes = "(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw",
  preload,
  className,
}: PropertyCardProps) {
  const location = [property.commune.name, property.sector].filter(Boolean).join(" · ");
  const hasPrice = property.price.amount !== null;

  return (
    <Card interactive className={cn("group relative flex flex-col", className)}>
      <MediaFrame
        ratio="4/3"
        media={<PropertyCover cover={property.cover} sizes={sizes} preload={preload} />}
      >
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <AvailabilityBadge availability={property.availability} overlay />
          {property.isFeatured && (
            <Badge tone="brand" className="rounded-none pr-3 pl-3.5 corner-cut">
              Destacada
            </Badge>
          )}
        </div>
      </MediaFrame>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <MapPin aria-hidden className="size-4 shrink-0" />
            {location}
          </p>
          <h3 className="text-lg leading-snug font-semibold">
            {/* El enlace cubre toda la tarjeta (área táctil completa). */}
            <Link
              href={`/propiedades/${property.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {property.title}
            </Link>
          </h3>
        </div>
        <p className="font-display text-xl font-semibold tabular-nums">
          {formatPrice(property.price)}
          {hasPrice && property.operation === "rent" && (
            <span className="font-sans text-sm font-normal text-ink-muted"> / mes</span>
          )}
        </p>
        <PropertyFacts property={property} className="mt-auto border-t border-line pt-3" />
      </div>
    </Card>
  );
}
