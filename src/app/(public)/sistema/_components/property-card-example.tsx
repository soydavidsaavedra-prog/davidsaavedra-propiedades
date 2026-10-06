import { Bath, Car, MapPin, Ruler } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { cn } from "@/lib/cn";
import { PhotoPlaceholder, type PhotoTone } from "./photo-placeholder";

export type PropertyCardExampleProps = {
  title: string;
  location: string;
  price: string;
  area: number;
  bathrooms: number;
  parking: number;
  status: { label: string; tone: BadgeTone };
  featured?: boolean;
  photo?: PhotoTone;
  className?: string;
};

/**
 * EJEMPLO de composición para el Design System. La tarjeta real se construirá
 * en `features/properties` cuando exista el modelo de datos.
 */
export function PropertyCardExample({
  title,
  location,
  price,
  area,
  bathrooms,
  parking,
  status,
  featured = false,
  photo = "day",
  className,
}: PropertyCardExampleProps) {
  return (
    <Card interactive className={cn("flex flex-col", className)}>
      <MediaFrame ratio="4/3" media={<PhotoPlaceholder tone={photo} />}>
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge tone="overlay">{status.label}</Badge>
          {featured && (
            <Badge tone="brand" className="rounded-none pr-3 pl-3.5 corner-cut">
              Destacada
            </Badge>
          )}
        </div>
      </MediaFrame>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <MapPin aria-hidden className="size-4" /> {location}
          </p>
          <h3 className="text-lg leading-snug font-semibold">{title}</h3>
        </div>
        <p className="font-display text-xl font-semibold tabular-nums">
          {price} <span className="font-sans text-sm font-normal text-ink-muted">/ mes</span>
        </p>
        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-sm whitespace-nowrap text-ink-soft">
          <li className="flex items-center gap-1.5">
            <Ruler aria-hidden className="size-4 text-ink-muted" /> {area} m²
          </li>
          <li className="flex items-center gap-1.5">
            <Bath aria-hidden className="size-4 text-ink-muted" /> {bathrooms}{" "}
            {bathrooms === 1 ? "baño" : "baños"}
          </li>
          <li className="flex items-center gap-1.5">
            <Car aria-hidden className="size-4 text-ink-muted" /> {parking} estac.
          </li>
        </ul>
      </div>
    </Card>
  );
}

export const sampleProperties: PropertyCardExampleProps[] = [
  {
    title: "Local comercial con vitrina a la calle",
    location: "La Ligua · Centro",
    price: "$550.000",
    area: 70,
    bathrooms: 1,
    parking: 1,
    status: { label: "Disponible", tone: "success" },
    featured: true,
    photo: "day",
  },
  {
    title: "Local en esquina, alto flujo peatonal",
    location: "La Ligua · Av. Ortiz de Rozas",
    price: "$780.000",
    area: 95,
    bathrooms: 2,
    parking: 2,
    status: { label: "Disponible", tone: "success" },
    photo: "interior",
  },
  {
    title: "Local para oficina o consulta",
    location: "La Ligua · Sector Plaza",
    price: "$420.000",
    area: 48,
    bathrooms: 1,
    parking: 0,
    status: { label: "Reservada", tone: "warning" },
    photo: "dusk",
  },
];
