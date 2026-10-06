import { Bath, Car, Ruler } from "lucide-react";
import { formatArea, pluralize } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PropertySummary } from "../types";

type PropertyFactsProps = {
  property: Pick<PropertySummary, "builtAreaM2" | "bathrooms" | "parkingSpots">;
  className?: string;
};

/** Datos clave: superficie, baños y estacionamientos (solo los informados). */
export function PropertyFacts({ property, className }: PropertyFactsProps) {
  const facts = [
    property.builtAreaM2 !== null && {
      icon: Ruler,
      label: formatArea(property.builtAreaM2),
    },
    property.bathrooms !== null && {
      icon: Bath,
      label: pluralize(property.bathrooms, "baño", "baños"),
    },
    property.parkingSpots !== null &&
      property.parkingSpots > 0 && {
        icon: Car,
        label: pluralize(property.parkingSpots, "estacionamiento", "estacionamientos"),
      },
  ].filter((fact) => fact !== false);

  if (facts.length === 0) return null;

  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1.5 text-sm whitespace-nowrap text-ink-soft",
        className,
      )}
    >
      {facts.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon aria-hidden className="size-4 text-ink-muted" />
          {label}
        </li>
      ))}
    </ul>
  );
}
