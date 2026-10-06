import type { BadgeTone } from "@/components/ui/badge";
import type { PropertyStatus } from "@/features/properties/constants";

export const statusTones: Record<PropertyStatus, BadgeTone> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};
