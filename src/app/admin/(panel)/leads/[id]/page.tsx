import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ClipboardList,
  Mail,
  MessageCircle,
  Phone,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { LeadActivityForm } from "@/features/admin/components/lead-activity-form";
import { LeadNextAction } from "@/features/admin/components/lead-next-action";
import { LeadProperties } from "@/features/admin/components/lead-properties";
import { LeadStatusControl } from "@/features/admin/components/lead-status-control";
import { formatDateTime } from "@/features/admin/leads/format";
import { leadStatusTones } from "@/features/admin/leads/labels";
import { getAdminLead, listLeadPropertyOptions } from "@/features/admin/leads/queries";
import type { AdminLeadDetail, LeadTimelineEntry } from "@/features/admin/leads/types";
import { requireAdmin } from "@/features/admin/session";
import {
  leadActivityLabels,
  leadSourceLabels,
  leadStatusLabels,
  leadTypeLabels,
  moveTimeframeLabels,
} from "@/features/leads/constants";
import { formatCLP } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { whatsappUrl } from "@/lib/whatsapp";

type PageProps = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: "Lead" };

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold [&_svg]:size-4.5 [&_svg]:text-accent">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function budgetText(lead: AdminLeadDetail): string | null {
  const { budgetMinClp: min, budgetMaxClp: max } = lead;
  if (min !== null && max !== null) return `${formatCLP(min)} – ${formatCLP(max)}`;
  if (max !== null) return `Hasta ${formatCLP(max)}`;
  if (min !== null) return `Desde ${formatCLP(min)}`;
  return null;
}

function TimelineItem({ entry }: { entry: LeadTimelineEntry }) {
  return (
    <li className="relative flex flex-col gap-1 pb-5 pl-6 last:pb-0">
      <span
        aria-hidden
        className="absolute top-1.5 left-0 size-2.5 rounded-full border-2 border-accent bg-surface"
      />
      {entry.kind === "activity" ? (
        <>
          <p className="text-sm">
            <span className="font-medium">{leadActivityLabels[entry.type]}</span>
            <span className="text-ink-muted"> · {formatDateTime(entry.at)}</span>
          </p>
          {entry.body && <p className="whitespace-pre-line text-ink-soft">{entry.body}</p>}
        </>
      ) : (
        <p className="text-sm">
          <span className="font-medium">
            {entry.from === null ? "Lead creado" : "Cambio de etapa"}
          </span>
          {entry.from !== null && (
            <>
              {": "}
              {leadStatusLabels[entry.from]}
              <ArrowRight className="mx-1 inline size-3.5 text-ink-muted" aria-label="a" />
            </>
          )}
          {entry.from === null ? ` como ${leadStatusLabels[entry.to]}` : leadStatusLabels[entry.to]}
          <span className="text-ink-muted"> · {formatDateTime(entry.at)}</span>
        </p>
      )}
    </li>
  );
}

export default async function LeadPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const context = await requireAdmin();
  const [lead, propertyOptions] = await Promise.all([
    getAdminLead(context, id),
    listLeadPropertyOptions(context),
  ]);
  if (!lead) notFound();

  const budget = budgetText(lead);
  const firstName = lead.fullName.split(" ")[0];
  const details: { label: string; value: string }[] = [
    budget && { label: "Presupuesto", value: budget },
    lead.moveTimeframe && { label: "Plazo", value: moveTimeframeLabels[lead.moveTimeframe] },
    lead.businessTypeName && { label: "Rubro", value: lead.businessTypeName },
    lead.businessDescription && { label: "Negocio", value: lead.businessDescription },
    { label: "Origen", value: leadSourceLabels[lead.source] },
    lead.utm.campaign && { label: "Campaña", value: lead.utm.campaign },
    (lead.utm.source || lead.utm.medium) && {
      label: "UTM",
      value: [lead.utm.source, lead.utm.medium].filter(Boolean).join(" / "),
    },
    { label: "Ingresó", value: formatDateTime(lead.createdAt) },
    lead.lastInteractionAt && {
      label: "Última interacción",
      value: formatDateTime(lead.lastInteractionAt),
    },
    lead.consentAt && { label: "Consentimiento", value: formatDateTime(lead.consentAt) },
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link
        href="/admin/leads"
        className="flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Leads
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={leadStatusTones[lead.status]}>{leadStatusLabels[lead.status]}</Badge>
          <Badge>{leadTypeLabels[lead.leadType]}</Badge>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{lead.fullName}</h1>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${lead.phone}`} className={buttonStyles({ size: "sm" })}>
            <Phone /> {formatPhone(lead.phone)}
          </a>
          <a
            href={whatsappUrl(lead.phone, `Hola ${firstName}, te escribe David Saavedra.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ size: "sm", variant: "secondary" })}
          >
            <MessageCircle /> WhatsApp
          </a>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className={buttonStyles({ size: "sm", variant: "secondary" })}
            >
              <Mail /> {lead.email}
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          {lead.message && (
            <Panel title="Mensaje" icon={<MessageCircle />}>
              <p className="whitespace-pre-line text-ink-soft">{lead.message}</p>
            </Panel>
          )}

          <Panel title="Timeline" icon={<ClipboardList />}>
            <LeadActivityForm leadId={lead.id} />
            <ol className="mt-2 border-l border-line pl-0 [&>li]:-ml-[5px]">
              {lead.timeline.map((entry) => (
                <TimelineItem key={`${entry.kind}-${entry.id}`} entry={entry} />
              ))}
            </ol>
          </Panel>

          <Panel title="Propiedades" icon={<Building2 />}>
            <LeadProperties leadId={lead.id} linked={lead.properties} options={propertyOptions} />
          </Panel>
        </div>

        <div className="order-first flex flex-col gap-6 lg:order-none">
          <Panel title="Etapa" icon={<Workflow />}>
            <LeadStatusControl id={lead.id} status={lead.status} lostReason={lead.lostReason} />
          </Panel>

          <Panel title="Próxima acción" icon={<ArrowRight />}>
            <LeadNextAction
              id={lead.id}
              nextAction={lead.nextAction}
              nextActionAt={lead.nextActionAt}
            />
          </Panel>

          <Panel title="Datos" icon={<ClipboardList />}>
            <dl className="flex flex-col gap-3 text-sm">
              {details.map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <dt className="text-ink-muted">{item.label}</dt>
                  <dd className="font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
