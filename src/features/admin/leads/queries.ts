import "server-only";
import type {
  LeadActivityType,
  LeadPropertyRelation,
  LeadSource,
  LeadStatus,
  LeadType,
  MoveTimeframe,
} from "@/features/leads/constants";
import type { PropertyStatus } from "@/features/properties/constants";
import type { AdminContext } from "../session";
import type {
  AdminLeadDetail,
  AdminLeadListItem,
  LeadPropertyOption,
  LeadTimelineEntry,
} from "./types";

/*
 * Lecturas del CRM con la sesión del administrador: RLS entrega todos los
 * leads, su timeline y su historial de estados.
 */

type Num = number | string | null;

function num(value: Num): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function rows<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as T;
}

type PropertyRef = { code: string; title: string; status: PropertyStatus } | null;

export async function listAdminLeads({ supabase }: AdminContext): Promise<AdminLeadListItem[]> {
  const data = await rows<
    {
      id: string;
      full_name: string;
      phone: string;
      lead_type: LeadType;
      status: LeadStatus;
      source: LeadSource;
      created_at: string;
      last_interaction_at: string | null;
      next_action: string | null;
      next_action_at: string | null;
      reviewed_at: string | null;
      lead_properties: { relation: LeadPropertyRelation; properties: PropertyRef }[];
    }[]
  >(
    supabase
      .from("leads")
      .select(
        `id, full_name, phone, lead_type, status, source, created_at, last_interaction_at,
         next_action, next_action_at, reviewed_at,
         lead_properties ( relation, properties ( code, title, status ) )`,
      )
      .order("created_at", { ascending: false }),
  );

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    leadType: row.lead_type,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    lastInteractionAt: row.last_interaction_at,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    propertyCodes: row.lead_properties
      .filter((link) => link.relation === "inquired" && link.properties)
      .map((link) => link.properties!.code),
    pendingReview: row.reviewed_at === null,
  }));
}

type DetailRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  lead_type: LeadType;
  status: LeadStatus;
  lost_reason: string | null;
  source: LeadSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  business_type_id: string | null;
  business_description: string | null;
  budget_min_clp: Num;
  budget_max_clp: Num;
  move_timeframe: MoveTimeframe | null;
  message: string | null;
  consent_at: string | null;
  last_interaction_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  created_at: string;
  business_types: { name: string } | null;
  reviewed_at: string | null;
  desired_min_area_m2: Num;
  property_types: { name: string } | null;
  communes: { name: string } | null;
  lead_properties: {
    property_id: string;
    relation: LeadPropertyRelation;
    created_at: string;
    properties: PropertyRef;
  }[];
  lead_activities: {
    id: string;
    type: LeadActivityType;
    body: string | null;
    occurred_at: string;
  }[];
  lead_status_history: {
    id: string;
    from_status: LeadStatus | null;
    to_status: LeadStatus;
    created_at: string;
  }[];
};

export async function getAdminLead(
  { supabase }: AdminContext,
  id: string,
): Promise<AdminLeadDetail | null> {
  const row = await rows<DetailRow | null>(
    supabase
      .from("leads")
      .select(
        `*, business_types ( name ), property_types ( name ), communes ( name ),
         lead_properties ( property_id, relation, created_at, properties ( code, title, status ) ),
         lead_activities ( id, type, body, occurred_at ),
         lead_status_history ( id, from_status, to_status, created_at )`,
      )
      .eq("id", id)
      .maybeSingle(),
  );
  if (!row) return null;

  const timeline: LeadTimelineEntry[] = [
    ...row.lead_activities.map((activity): LeadTimelineEntry => ({
      kind: "activity",
      id: activity.id,
      type: activity.type,
      body: activity.body,
      at: activity.occurred_at,
    })),
    ...row.lead_status_history.map((change): LeadTimelineEntry => ({
      kind: "status",
      id: change.id,
      from: change.from_status,
      to: change.to_status,
      at: change.created_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    leadType: row.lead_type,
    status: row.status,
    lostReason: row.lost_reason,
    source: row.source,
    utm: { source: row.utm_source, medium: row.utm_medium, campaign: row.utm_campaign },
    businessTypeId: row.business_type_id,
    reviewedAt: row.reviewed_at,
    desiredPropertyTypeName: row.property_types?.name ?? null,
    desiredCommuneName: row.communes?.name ?? null,
    desiredMinAreaM2: num(row.desired_min_area_m2),
    businessTypeName: row.business_types?.name ?? null,
    businessDescription: row.business_description,
    budgetMinClp: num(row.budget_min_clp),
    budgetMaxClp: num(row.budget_max_clp),
    moveTimeframe: row.move_timeframe,
    message: row.message,
    consentAt: row.consent_at,
    lastInteractionAt: row.last_interaction_at,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    createdAt: row.created_at,
    properties: row.lead_properties
      .filter((link) => link.properties)
      .map((link) => ({
        propertyId: link.property_id,
        code: link.properties!.code,
        title: link.properties!.title,
        status: link.properties!.status,
        relation: link.relation,
        linkedAt: link.created_at,
      }))
      .sort((a, b) => a.linkedAt.localeCompare(b.linkedAt)),
    timeline,
  };
}

/** Propiedades que se pueden sugerir a un lead: todas menos las archivadas. */
export async function listLeadPropertyOptions({
  supabase,
}: AdminContext): Promise<LeadPropertyOption[]> {
  return rows<LeadPropertyOption[]>(
    supabase.from("properties").select("id, code, title").neq("status", "archived").order("code"),
  );
}

/** Rubros para el formulario del lead (incluye inactivos: RLS de administración). */
export async function listBusinessTypeOptions({
  supabase,
}: AdminContext): Promise<{ id: string; name: string }[]> {
  return rows<{ id: string; name: string }[]>(
    supabase.from("business_types").select("id, name").order("sort_order"),
  );
}
