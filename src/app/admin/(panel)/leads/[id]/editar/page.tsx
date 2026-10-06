import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DeleteLeadButton } from "@/features/admin/components/delete-lead-button";
import { LeadAdminForm } from "@/features/admin/components/lead-admin-form";
import { toLeadFormValues } from "@/features/admin/leads/form";
import { getAdminLead, listBusinessTypeOptions } from "@/features/admin/leads/queries";
import { requireAdmin } from "@/features/admin/session";

type PageProps = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: "Editar lead" };

export default async function EditLeadPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const context = await requireAdmin();
  const [lead, businessTypes] = await Promise.all([
    getAdminLead(context, id),
    listBusinessTypeOptions(context),
  ]);
  if (!lead) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/admin/leads/${lead.id}`}
        className="flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> {lead.fullName}
      </Link>
      <h1 className="text-3xl font-semibold">Editar datos</h1>
      <LeadAdminForm
        lead={{ id: lead.id, values: toLeadFormValues(lead) }}
        businessTypes={businessTypes}
      />

      <section className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Eliminar lead</h2>
        <p className="text-sm text-ink-muted">
          Borra sus datos y todo su historial (notas, etapas, propiedades y visitas). Úsalo cuando
          la persona pida que se eliminen sus datos.
        </p>
        <DeleteLeadButton id={lead.id} name={lead.fullName} />
      </section>
    </div>
  );
}
