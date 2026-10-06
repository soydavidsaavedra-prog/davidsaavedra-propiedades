import {
  LEAD_SOURCES,
  LEAD_TYPES,
  type LeadSource,
  type LeadType,
} from "@/features/leads/constants";
import { CLOSED_LEAD_STATUSES } from "./labels";
import { isOverdue } from "./format";
import type { AdminLeadListItem } from "./types";

/** Vistas de la bandeja. La primera es la predeterminada. */
export const LEAD_VIEWS = [
  { value: "abiertos", label: "En gestión" },
  { value: "nuevos", label: "Nuevos" },
  { value: "vencidos", label: "Acción vencida" },
  { value: "ganados", label: "Ganados" },
  { value: "perdidos", label: "Perdidos" },
  { value: "todos", label: "Todos" },
] as const;
export type LeadView = (typeof LEAD_VIEWS)[number]["value"];

export type LeadFilters = {
  view: LeadView;
  type?: LeadType;
  source?: LeadSource;
  query?: string;
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLeadFilters(params: Params): LeadFilters {
  const view = LEAD_VIEWS.find((item) => item.value === first(params.vista))?.value;
  const type = LEAD_TYPES.find((item) => item === first(params.tipo));
  const source = LEAD_SOURCES.find((item) => item === first(params.origen));
  const query = first(params.q)?.trim().slice(0, 100);
  return { view: view ?? "abiertos", type, source, query: query || undefined };
}

export function matchesView(lead: AdminLeadListItem, view: LeadView, now: number): boolean {
  const closed = CLOSED_LEAD_STATUSES.includes(lead.status);
  switch (view) {
    case "abiertos":
      return !closed;
    case "nuevos":
      return lead.status === "new";
    case "vencidos":
      return !closed && isOverdue(lead.nextActionAt, now);
    case "ganados":
      return lead.status === "won";
    case "perdidos":
      return lead.status === "lost";
    case "todos":
      return true;
  }
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Tipo, origen y búsqueda por nombre o teléfono (ignora tildes, espacios y signos). */
export function matchesSearch(lead: AdminLeadListItem, filters: LeadFilters): boolean {
  if (filters.type && lead.leadType !== filters.type) return false;
  if (filters.source && lead.source !== filters.source) return false;
  if (!filters.query) return true;
  const digits = filters.query.replace(/\D/g, "");
  if (digits.length >= 4 && lead.phone.replace(/\D/g, "").includes(digits)) return true;
  return normalize(lead.fullName).includes(normalize(filters.query));
}

/** URL de la bandeja con los filtros dados (omite los vacíos y la vista predeterminada). */
export function leadsHref(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.view !== "abiertos") params.set("vista", filters.view);
  if (filters.type) params.set("tipo", filters.type);
  if (filters.source) params.set("origen", filters.source);
  if (filters.query) params.set("q", filters.query);
  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}
