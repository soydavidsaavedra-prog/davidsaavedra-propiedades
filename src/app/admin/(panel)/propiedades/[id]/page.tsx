import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MediaManager } from "@/features/admin/components/media-manager";
import { OwnerRequestPanel } from "@/features/admin/components/owner-request-panel";
import { PropertyForm } from "@/features/admin/components/property-form";
import { StatusControls } from "@/features/admin/components/status-controls";
import { statusTones } from "@/features/admin/properties/labels";
import {
  getAdminProperty,
  getPropertyFormOptions,
  listSubmissionPhotos,
} from "@/features/admin/properties/queries";
import { requireAdmin } from "@/features/admin/session";
import { statusLabels } from "@/features/properties/constants";
import { propertyPath } from "@/features/properties/seo";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: "Editar propiedad" };

export default async function EditPropertyPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  const context = await requireAdmin();
  const [property, options, submissionPhotos] = await Promise.all([
    getAdminProperty(context, id),
    getPropertyFormOptions(context),
    listSubmissionPhotos(context, id),
  ]);
  if (!property) notFound();
  const pendingRequest = property.origin === "owner_form" && !property.reviewedAt;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/admin/propiedades"
        className="flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Propiedades
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tracking-wide text-ink-muted">
              {property.code}
            </span>
            {pendingRequest && <Badge tone="warning">Solicitud</Badge>}
            <Badge tone={statusTones[property.status]}>{statusLabels[property.status]}</Badge>
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{property.title}</h1>
          {property.status === "published" && (
            <Link
              href={propertyPath(property.slug)}
              target="_blank"
              className="flex w-fit items-center gap-1.5 text-sm text-accent hover:underline"
            >
              Ver en el sitio <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
        <StatusControls id={property.id} status={property.status} />
      </div>

      {(property.owners.length > 0 || submissionPhotos.length > 0) && (
        <OwnerRequestPanel
          propertyId={property.id}
          code={property.code}
          owners={property.owners}
          pendingReview={pendingRequest}
          photos={submissionPhotos}
        />
      )}

      {query.creada && property.status === "draft" && (
        <p
          role="status"
          className="rounded-lg bg-success-soft px-4 py-3 text-sm font-medium text-success"
        >
          Borrador creado. Sube las fotos y publícalo cuando esté listo.
        </p>
      )}
      {query.incompleta && (
        <p role="alert" className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
          La propiedad se creó, pero no se guardaron todos los datos. Revísalos y guarda de nuevo.
        </p>
      )}

      <MediaManager propertyId={property.id} media={property.media} config={context.config} />
      <PropertyForm property={property} options={options} />
    </div>
  );
}
