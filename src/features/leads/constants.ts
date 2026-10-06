// Valores espejo de los enums de `supabase/migrations/20261006000100_base.sql`.

/** Embudo comercial, en orden. */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "visit_scheduled",
  "visited",
  "interested",
  "documentation",
  "negotiation",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  visit_scheduled: "Visita agendada",
  visited: "Visitó",
  interested: "Interesado",
  documentation: "Documentación",
  negotiation: "Negociación",
  won: "Arrendado",
  lost: "Perdido",
};

export const LEAD_TYPES = ["tenant", "buyer", "owner"] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

export const leadTypeLabels: Record<LeadType, string> = {
  tenant: "Arrendatario",
  buyer: "Comprador",
  owner: "Propietario",
};

export const LEAD_SOURCES = [
  "website",
  "whatsapp",
  "instagram",
  "tiktok",
  "facebook",
  "referral",
  "walk_in",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const leadSourceLabels: Record<LeadSource, string> = {
  website: "Sitio web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  referral: "Referido",
  walk_in: "Presencial",
  other: "Otro",
};

export const MOVE_TIMEFRAMES = [
  "immediate",
  "within_30_days",
  "within_90_days",
  "exploring",
] as const;
export type MoveTimeframe = (typeof MOVE_TIMEFRAMES)[number];

export const moveTimeframeLabels: Record<MoveTimeframe, string> = {
  immediate: "Lo antes posible",
  within_30_days: "Próximos 30 días",
  within_90_days: "Próximos 3 meses",
  exploring: "Solo estoy explorando",
};

export const LEAD_PROPERTY_RELATIONS = ["inquired", "suggested", "visited", "discarded"] as const;
export type LeadPropertyRelation = (typeof LEAD_PROPERTY_RELATIONS)[number];

export const leadPropertyRelationLabels: Record<LeadPropertyRelation, string> = {
  inquired: "Consultó",
  suggested: "Sugerida",
  visited: "Visitada",
  discarded: "Descartada",
};

export const LEAD_ACTIVITY_TYPES = [
  "note",
  "call",
  "whatsapp",
  "email",
  "meeting",
  "web_inquiry",
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

export const leadActivityLabels: Record<LeadActivityType, string> = {
  note: "Nota",
  call: "Llamada",
  whatsapp: "WhatsApp",
  email: "Correo",
  meeting: "Reunión",
  web_inquiry: "Consulta web",
};

export const VISIT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const visitStatusLabels: Record<VisitStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};
