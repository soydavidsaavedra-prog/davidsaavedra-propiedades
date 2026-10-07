import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, ImageOff, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { statusTones } from "@/features/admin/properties/labels";
import { listAdminProperties } from "@/features/admin/properties/queries";
import type { AdminPropertyListItem } from "@/features/admin/properties/types";
import { requireAdmin } from "@/features/admin/session";
import {
  availabilityLabels,
  PROPERTY_STATUSES,
  statusLabels,
  type PropertyStatus,
} from "@/features/properties/constants";
import { formatPrice } from "@/features/properties/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Propiedades" };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const updatedFormat = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  timeZone: "America/Santiago",
});

export default async function AdminPropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await requireAdmin();
  const properties = await listAdminProperties(context);
  // Vista: un estado de publicación o las solicitudes de propietarios por revisar.
  const filter: PropertyStatus | "solicitudes" | undefined =
    params.estado === "solicitudes"
      ? "solicitudes"
      : PROPERTY_STATUSES.find((status) => status === params.estado);
  const matches = (item: AdminPropertyListItem, tab?: PropertyStatus | "solicitudes") =>
    !tab || (tab === "solicitudes" ? item.isRequest : item.status === tab);
  const visible = properties.filter((item) => matches(item, filter));
  const count = (tab?: PropertyStatus | "solicitudes") =>
    properties.filter((item) => matches(item, tab)).length;

  const tabs: { label: string; status?: PropertyStatus | "solicitudes" }[] = [
    { label: "Todas" },
    { label: "Solicitudes", status: "solicitudes" },
    { label: "Publicadas", status: "published" },
    { label: "Borradores", status: "draft" },
    { label: "Archivadas", status: "archived" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Propiedades</h1>
          <p className="text-ink-muted">Crea, edita y publica las propiedades del sitio.</p>
        </div>
        <Link href="/admin/propiedades/nueva" className={buttonStyles()}>
          <Plus /> Nueva propiedad
        </Link>
      </div>

      {params.eliminada && (
        <p role="status" className="rounded-lg bg-surface-muted px-4 py-3 text-sm">
          Propiedad eliminada.
        </p>
      )}

      <nav aria-label="Filtrar por estado" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {tabs.map((tab) => {
          const active = tab.status === filter;
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/admin/propiedades?estado=${tab.status}` : "/admin/propiedades"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-primary-contrast"
                  : "text-ink-soft hover:bg-surface-muted",
                tab.status === "solicitudes" && count(tab.status) > 0 && !active && "text-warning",
              )}
            >
              {tab.label} <span className="opacity-70">{count(tab.status)}</span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title={
            properties.length === 0 ? "Aún no hay propiedades" : "No hay propiedades en este estado"
          }
          description={
            properties.length === 0
              ? "Crea la primera: queda como borrador hasta que la publiques."
              : undefined
          }
          action={
            properties.length === 0 ? (
              <Link
                href="/admin/propiedades/nueva"
                className={buttonStyles({ variant: "secondary" })}
              >
                Nueva propiedad
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {visible.map((property) => (
            <li key={property.id}>
              <Link
                href={`/admin/propiedades/${property.id}`}
                className="flex items-center gap-4 p-3 transition-colors hover:bg-surface-muted/60 sm:p-4"
              >
                <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted sm:h-16 sm:w-24">
                  {property.coverUrl ? (
                    <Image
                      src={property.coverUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <ImageOff className="size-5 text-ink-muted" aria-hidden />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium tracking-wide text-ink-muted">
                      {property.code}
                    </span>
                    {property.isRequest && <Badge tone="warning">Solicitud</Badge>}
                    <Badge tone={statusTones[property.status]}>
                      {statusLabels[property.status]}
                    </Badge>
                    {property.availability !== "available" && (
                      <Badge>{availabilityLabels[property.availability]}</Badge>
                    )}
                  </div>
                  <p className="truncate font-medium">{property.title}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {property.typeName} · {property.communeName} ·{" "}
                    {formatPrice({
                      amount: property.priceAmount,
                      currency: property.priceCurrency,
                    })}
                  </p>
                </div>
                <span className="hidden shrink-0 text-sm text-ink-muted sm:block">
                  {updatedFormat.format(new Date(property.updatedAt))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
