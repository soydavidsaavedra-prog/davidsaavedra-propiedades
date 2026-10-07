import type { Metadata } from "next";
import Link from "next/link";
import { AlarmClock, Inbox, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import {
  leadsHref,
  LEAD_VIEWS,
  matchesSearch,
  matchesView,
  parseLeadFilters,
} from "@/features/admin/leads/filters";
import { formatDateTime, formatShortDate, isOverdue } from "@/features/admin/leads/format";
import { CLOSED_LEAD_STATUSES, leadStatusTones } from "@/features/admin/leads/labels";
import { listAdminLeads } from "@/features/admin/leads/queries";
import { requireAdmin } from "@/features/admin/session";
import {
  leadSourceLabels,
  leadStatusLabels,
  leadTypeLabels,
  LEAD_SOURCES,
  LEAD_TYPES,
} from "@/features/leads/constants";
import { CleanGetForm } from "@/features/properties/components/filters/clean-get-form";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Leads" };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireAdmin();
  const leads = await listAdminLeads(context);
  const filters = parseLeadFilters(params);
  const now = new Date().getTime();

  const searched = leads.filter((lead) => matchesSearch(lead, filters));
  const visible = searched
    .filter((lead) => matchesView(lead, filters.view, now))
    .sort((a, b) =>
      filters.view === "vencidos" ? a.nextActionAt!.localeCompare(b.nextActionAt!) : 0,
    );
  const hasSearch = Boolean(filters.type || filters.source || filters.query);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Leads</h1>
          <p className="text-ink-muted">
            Consultas del sitio y contactos en gestión, con su estado y próxima acción.
          </p>
        </div>
        <Link href="/admin/leads/nuevo" className={buttonStyles()}>
          <Plus /> Nuevo lead
        </Link>
      </div>

      {params.eliminado && (
        <p role="status" className="rounded-lg bg-surface-muted px-4 py-3 text-sm">
          Lead eliminado con todo su historial.
        </p>
      )}

      <CleanGetForm
        action="/admin/leads"
        className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        {filters.view !== "abiertos" && <input type="hidden" name="vista" value={filters.view} />}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Buscar
          <Input
            type="search"
            name="q"
            defaultValue={filters.query}
            placeholder="Nombre o teléfono"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Tipo
          <Select name="tipo" defaultValue={filters.type ?? ""}>
            <option value="">Todos</option>
            {LEAD_TYPES.map((type) => (
              <option key={type} value={type}>
                {leadTypeLabels[type]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Origen
          <Select name="origen" defaultValue={filters.source ?? ""}>
            <option value="">Todos</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {leadSourceLabels[source]}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          <Search /> Filtrar
        </Button>
      </CleanGetForm>

      <nav aria-label="Filtrar por estado" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {LEAD_VIEWS.map((view) => {
          const active = view.value === filters.view;
          const count = searched.filter((lead) => matchesView(lead, view.value, now)).length;
          return (
            <Link
              key={view.value}
              href={leadsHref({ ...filters, view: view.value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-primary-contrast"
                  : "text-ink-soft hover:bg-surface-muted",
                view.value === "vencidos" && count > 0 && !active && "text-danger",
              )}
            >
              {view.label} <span className="opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={leads.length === 0 ? "Aún no hay leads" : "No hay leads en esta vista"}
          description={
            leads.length === 0
              ? "Las consultas que lleguen desde el sitio aparecerán aquí."
              : hasSearch
                ? "Prueba con otros filtros."
                : undefined
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {visible.map((lead) => {
            const overdue =
              !CLOSED_LEAD_STATUSES.includes(lead.status) && isOverdue(lead.nextActionAt, now);
            return (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex flex-col gap-2 p-3 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{lead.fullName}</p>
                      <Badge tone={leadStatusTones[lead.status]}>
                        {leadStatusLabels[lead.status]}
                      </Badge>
                      <Badge>{leadTypeLabels[lead.leadType]}</Badge>
                      {lead.pendingReview && <Badge tone="warning">Por revisar</Badge>}
                    </div>
                    <p className="truncate text-sm text-ink-muted">
                      {formatPhone(lead.phone)} · {leadSourceLabels[lead.source]}
                      {lead.propertyCodes.length > 0 && ` · ${lead.propertyCodes.join(", ")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-0.5 text-sm sm:items-end sm:text-right">
                    {lead.nextAction ? (
                      <span
                        className={cn(
                          "flex items-center gap-1.5",
                          overdue ? "font-medium text-danger" : "text-ink-soft",
                        )}
                      >
                        {overdue && <AlarmClock className="size-3.5" aria-label="Vencida" />}
                        <span className="max-w-64 truncate">{lead.nextAction}</span>
                        {lead.nextActionAt && (
                          <span className="whitespace-nowrap">
                            · {formatDateTime(lead.nextActionAt)}
                          </span>
                        )}
                      </span>
                    ) : (
                      !CLOSED_LEAD_STATUSES.includes(lead.status) && (
                        <span className="text-ink-muted">Sin próxima acción</span>
                      )
                    )}
                    <span className="text-ink-muted">
                      Ingresó el {formatShortDate(lead.createdAt)}
                      {lead.lastInteractionAt &&
                        ` · última interacción ${formatShortDate(lead.lastInteractionAt)}`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
