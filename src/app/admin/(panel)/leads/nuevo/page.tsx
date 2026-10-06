import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeadAdminForm } from "@/features/admin/components/lead-admin-form";
import { listBusinessTypeOptions, listLeadPropertyOptions } from "@/features/admin/leads/queries";
import { requireAdmin } from "@/features/admin/session";

export const metadata: Metadata = { title: "Nuevo lead" };

export default async function NewLeadPage() {
  const context = await requireAdmin();
  const [businessTypes, propertyOptions] = await Promise.all([
    listBusinessTypeOptions(context),
    listLeadPropertyOptions(context),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/admin/leads"
        className="flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Leads
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Nuevo lead</h1>
        <p className="text-ink-muted">
          Para contactos que llegan por WhatsApp, redes sociales, referidos o en persona. Las
          consultas del sitio se registran solas.
        </p>
      </div>
      <LeadAdminForm businessTypes={businessTypes} propertyOptions={propertyOptions} />
    </div>
  );
}
