import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { DiagonalLines } from "@/components/brand/diagonal-lines";
import { SectionLabel } from "@/components/brand/section-label";
import { Container } from "@/components/ui/container";
import { brandAssets } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { LeadForm } from "@/features/leads/components/lead-form";
import { listBusinessTypes } from "@/features/properties/queries";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escríbele a David Saavedra: arriendo de locales comerciales en ${siteConfig.location.city} y publicación de propiedades para propietarios.`,
  alternates: { canonical: "/contacto" },
};

type Channel = { label: string; detail: string; href: string };

function channels(): Channel[] {
  const list: Channel[] = [];
  if (siteConfig.whatsappNumber) {
    list.push({
      label: "WhatsApp",
      detail: "Respuesta directa",
      href: whatsappUrl(siteConfig.whatsappNumber, "Hola David, te escribo desde tu sitio web."),
    });
  }
  list.push(
    { label: "Instagram", detail: siteConfig.social.handle, href: siteConfig.social.instagram },
    { label: "TikTok", detail: siteConfig.social.handle, href: siteConfig.social.tiktok },
  );
  return list;
}

export default async function ContactPage() {
  const businessTypes = await listBusinessTypes();

  return (
    <Container className="flex flex-col gap-10 py-12 sm:py-16">
      <header className="flex max-w-2xl flex-col gap-3">
        <SectionLabel>Contacto</SectionLabel>
        <h1 className="text-display font-semibold">Conversemos.</h1>
        <p className="text-lg text-ink-soft">
          ¿Buscas un local para tu negocio o tienes una propiedad para arrendar? Déjame tus datos y
          te respondo personalmente.
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <section
          aria-label="Formulario de contacto"
          className="rounded-xl border border-line bg-surface p-5 sm:p-8"
        >
          <LeadForm variant="contact" businessTypes={businessTypes} />
        </section>

        <aside className="theme-night relative overflow-hidden rounded-xl">
          <DiagonalLines />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <Image
                src={brandAssets.symbol.src}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="size-16 shrink-0 rounded-full ring-1 ring-accent-line ring-offset-4 ring-offset-canvas"
              />
              <div className="flex flex-col gap-1">
                <SectionLabel>Tu contacto directo</SectionLabel>
                <p className="font-display text-xl font-semibold">David Saavedra</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin aria-hidden className="size-4 shrink-0 text-accent" />
              {siteConfig.location.city}, {siteConfig.location.region}
            </p>
            <ul className="flex flex-col gap-2">
              {channels().map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-line-strong px-4 transition-colors hover:border-accent-line"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{channel.label}</span>
                      <span className="text-sm text-ink-muted">{channel.detail}</span>
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
