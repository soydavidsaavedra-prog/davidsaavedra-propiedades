import type { BadgeTone } from "@/components/ui/badge";
import type { LeadStatus } from "@/features/leads/constants";

export const leadStatusTones: Record<LeadStatus, BadgeTone> = {
  new: "accent",
  contacted: "neutral",
  qualified: "neutral",
  visit_scheduled: "warning",
  visited: "neutral",
  interested: "neutral",
  documentation: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

/** Estados cerrados: el lead ya no está en gestión. */
export const CLOSED_LEAD_STATUSES: readonly LeadStatus[] = ["won", "lost"];
