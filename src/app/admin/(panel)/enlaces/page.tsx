import type { Metadata } from "next";
import { ShareLinkCard } from "@/features/admin/components/share-link-card";
import { requireAdmin } from "@/features/admin/session";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Enlaces para compartir" };

/** `utm_source=whatsapp`: los leads de este enlace quedan con origen WhatsApp. */
function link(path: string): string {
  const url = new URL(path, siteConfig.url);
  url.searchParams.set("utm_source", "whatsapp");
  return url.toString();
}

export default async function ShareLinksPage() {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Enlaces para compartir</h1>
        <p className="text-ink-muted">
          Envía estos formularios por WhatsApp. Lo que completen llega al panel para que lo revises.
        </p>
      </div>
      <ShareLinkCard
        title="Propietarios: publica tu propiedad"
        description="El propietario envía los datos y, si quiere, fotos. Queda como borrador en Propiedades → Solicitudes; nada se publica hasta que tú lo hagas."
        url={link("/publica-tu-propiedad")}
        message="Hola, para publicar tu propiedad completa este formulario con sus datos (y fotos si tienes). Toma unos minutos:"
      />
      <ShareLinkCard
        title="Clientes: cuéntame qué buscas"
        description="El cliente indica qué propiedad busca, dónde y su presupuesto. Queda como lead en Leads → Por revisar, para que decidas si lo mantienes."
        url={link("/busco-propiedad")}
        message="Hola, cuéntame qué propiedad buscas en este formulario y te envío las opciones que se ajusten:"
      />
    </div>
  );
}
