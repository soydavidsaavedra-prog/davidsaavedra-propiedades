import { Badge, type BadgeTone } from "@/components/ui/badge";
import { availabilityLabels, type PropertyAvailability } from "../constants";

const tones: Record<PropertyAvailability, BadgeTone> = {
  available: "success",
  reserved: "warning",
  rented: "neutral",
  sold: "neutral",
  unavailable: "neutral",
};

type AvailabilityBadgeProps = {
  availability: PropertyAvailability;
  /** Sobre fotografía: fondo blanco translúcido. */
  overlay?: boolean;
  className?: string;
};

export function AvailabilityBadge({ availability, overlay, className }: AvailabilityBadgeProps) {
  return (
    <Badge tone={overlay ? "overlay" : tones[availability]} className={className}>
      {availabilityLabels[availability]}
    </Badge>
  );
}
