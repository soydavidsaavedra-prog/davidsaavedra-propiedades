import type {
  LeadActivityType,
  LeadPropertyRelation,
  LeadSource,
  LeadStatus,
  LeadType,
  MoveTimeframe,
} from "@/features/leads/constants";
import type { PropertyStatus } from "@/features/properties/constants";

export type AdminLeadListItem = {
  id: string;
  fullName: string;
  phone: string;
  leadType: LeadType;
  status: LeadStatus;
  source: LeadSource;
  createdAt: string;
  lastInteractionAt: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  propertyCodes: string[];
};

/** Entrada del timeline: una actividad registrada o un cambio de estado. */
export type LeadTimelineEntry =
  | {
      kind: "activity";
      id: string;
      type: LeadActivityType;
      body: string | null;
      at: string;
    }
  | {
      kind: "status";
      id: string;
      from: LeadStatus | null;
      to: LeadStatus;
      at: string;
    };

export type LeadLinkedProperty = {
  propertyId: string;
  code: string;
  title: string;
  status: PropertyStatus;
  relation: LeadPropertyRelation;
  linkedAt: string;
};

export type AdminLeadDetail = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  leadType: LeadType;
  status: LeadStatus;
  lostReason: string | null;
  source: LeadSource;
  utm: { source: string | null; medium: string | null; campaign: string | null };
  businessTypeId: string | null;
  businessTypeName: string | null;
  businessDescription: string | null;
  budgetMinClp: number | null;
  budgetMaxClp: number | null;
  moveTimeframe: MoveTimeframe | null;
  message: string | null;
  consentAt: string | null;
  lastInteractionAt: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  createdAt: string;
  properties: LeadLinkedProperty[];
  timeline: LeadTimelineEntry[];
};

/** Propiedad que se puede vincular a un lead (sugerir). */
export type LeadPropertyOption = { id: string; code: string; title: string };
