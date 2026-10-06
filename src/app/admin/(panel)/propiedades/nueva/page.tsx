import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyForm } from "@/features/admin/components/property-form";
import { getPropertyFormOptions } from "@/features/admin/properties/queries";
import { requireAdmin } from "@/features/admin/session";

export const metadata: Metadata = { title: "Nueva propiedad" };

export default async function NewPropertyPage() {
  const context = await requireAdmin();
  const options = await getPropertyFormOptions(context);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/admin/propiedades"
        className="flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Propiedades
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Nueva propiedad</h1>
        <p className="text-ink-muted">
          Se guarda como borrador. Después podrás subir fotos y publicarla.
        </p>
      </div>
      <PropertyForm options={options} />
    </div>
  );
}
