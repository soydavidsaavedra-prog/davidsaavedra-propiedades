import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, MapPin } from "lucide-react";
import { SectionLabel } from "@/components/brand/section-label";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { brandAssets } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { AvailabilityBadge } from "@/features/properties/components/availability-badge";
import {
  PropertyCtaBar,
  PropertyCtaCard,
  acceptsInquiries,
} from "@/features/properties/components/detail/property-cta";
import { PropertyGallery } from "@/features/properties/components/detail/property-gallery";
import { PropertyKeyFacts } from "@/features/properties/components/detail/property-key-facts";
import { PropertyVideos } from "@/features/properties/components/detail/property-videos";
import { PropertyCard } from "@/features/properties/components/property-card";
import { formatPrice } from "@/features/properties/format";
import {
  getPublishedPropertyBySlug,
  listPublishedProperties,
  listRelatedProperties,
} from "@/features/properties/queries";
import {
  breadcrumbJsonLd,
  propertyJsonLd,
  propertyMetaDescription,
  propertyMetaTitle,
  propertyPath,
} from "@/features/properties/seo";
import { cn } from "@/lib/cn";
import { todayInChile } from "@/lib/format";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const properties = await listPublishedProperties();
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const property = await getPublishedPropertyBySlug((await params).slug);
  if (!property) return {};

  const cover = property.media.find((media) => media.isCover) ?? property.media[0];
  const title = propertyMetaTitle(property);
  const description = propertyMetaDescription(property);

  return {
    title,
    description,
    alternates: { canonical: propertyPath(property.slug) },
    openGraph: {
      type: "website",
      title,
      description,
      url: propertyPath(property.slug),
      images: cover?.kind === "image" ? [{ url: cover.source, alt: cover.alt }] : undefined,
    },
  };
}

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4 border-t border-line pt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function PropertyPage({ params }: PageProps) {
  const property = await getPublishedPropertyBySlug((await params).slug);
  if (!property) notFound();

  const today = todayInChile();
  const related = await listRelatedProperties(property);
  const videos = property.media.filter((media) => media.kind === "video");
  const location = [property.commune.name, property.sector].filter(Boolean).join(" · ");
  const open = acceptsInquiries(property);
  const mapUrl = property.location
    ? `https://www.google.com/maps/search/?api=1&query=${property.location.latitude},${property.location.longitude}`
    : null;

  return (
    <>
      <JsonLd data={propertyJsonLd(property)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Propiedades", path: "/propiedades" },
          { name: property.title, path: propertyPath(property.slug) },
        ])}
      />

      <Container className="flex flex-col gap-6 pt-4 pb-14 sm:pt-6">
        <nav aria-label="Ruta de navegación" className="text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-ink">
                Inicio
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3.5" />
            <li>
              <Link href="/propiedades" className="hover:text-ink">
                Propiedades
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3.5" />
            <li aria-current="page" className="max-w-[60vw] truncate text-ink-soft">
              {property.code}
            </li>
          </ol>
        </nav>

        <PropertyGallery property={property} />

        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
          <article className="flex min-w-0 flex-col gap-8">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <AvailabilityBadge availability={property.availability} />
                <Badge tone="accent">{property.type.name}</Badge>
                <span className="text-sm text-ink-muted">{property.code}</span>
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">{property.title}</h1>
              <p className="flex items-center gap-1.5 text-ink-soft">
                <MapPin aria-hidden className="size-4 shrink-0 text-ink-muted" />
                {location}
              </p>
              {/* En desktop el precio está en la tarjeta lateral. */}
              <p className="font-display text-2xl font-semibold tabular-nums lg:hidden">
                {formatPrice(property.price)}
                {property.price.amount !== null && property.operation === "rent" && (
                  <span className="font-sans text-sm font-normal text-ink-muted"> / mes</span>
                )}
              </p>
              {!open && (
                <p className="rounded-lg border border-line bg-surface-muted p-4 text-sm text-ink-soft">
                  Esta propiedad ya no está disponible. Revisa otras opciones similares más abajo.
                </p>
              )}
            </header>

            <PropertyKeyFacts property={property} today={today} />

            {property.description && (
              <Section title="Descripción">
                <div className="flex max-w-prose flex-col gap-3 text-ink-soft">
                  {property.description.split(/\n{2,}/).map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </div>
              </Section>
            )}

            {videos.length > 0 && (
              <Section title="Video">
                <PropertyVideos videos={videos} title={property.title} />
              </Section>
            )}

            {property.features.length > 0 && (
              <Section title="Características">
                <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {property.features.map((feature) => (
                    <li key={feature.key} className="flex items-center gap-2.5">
                      <Check aria-hidden className="size-4 shrink-0 text-accent" />
                      {feature.label}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {property.suitableUses.length > 0 && (
              <Section title="Usos posibles">
                <ul className="flex flex-wrap gap-2">
                  {property.suitableUses.map((use) => (
                    <li
                      key={use.slug}
                      className="rounded-full border border-line-strong px-3.5 py-1.5 text-sm"
                    >
                      {use.name}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-muted">
                  Usos referenciales. La patente para cada rubro se confirma con la municipalidad.
                </p>
              </Section>
            )}

            <Section title="Ubicación">
              <p className="flex items-center gap-1.5">
                <MapPin aria-hidden className="size-4 shrink-0 text-accent" />
                {location}, {siteConfig.location.region}
              </p>
              {property.location?.precision !== "exact" && (
                <p className="text-sm text-ink-muted">
                  Ubicación aproximada. La dirección exacta se entrega al coordinar la visita.
                </p>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonStyles({ variant: "secondary" }), "self-start")}
                >
                  Ver zona en Google Maps
                </a>
              )}
            </Section>

            <Section title="¿Te interesa esta propiedad?" id="visitar">
              <div className="theme-night flex flex-col gap-5 rounded-xl p-6 sm:flex-row sm:items-center">
                <Image
                  src={brandAssets.symbol.src}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="size-16 shrink-0 rounded-full ring-1 ring-accent-line ring-offset-4 ring-offset-canvas"
                />
                <div className="flex flex-1 flex-col gap-1.5">
                  <SectionLabel>Tu contacto directo</SectionLabel>
                  <p className="font-display text-xl font-semibold">David Saavedra</p>
                  <p className="text-ink-soft">
                    Escríbeme indicando el código {property.code} y coordinamos una visita.
                  </p>
                </div>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "secondary" })}
                >
                  {siteConfig.social.handle}
                </a>
              </div>
            </Section>
          </article>

          <aside aria-label="Precio y contacto" className="hidden lg:block">
            <div className="sticky top-24">
              <PropertyCtaCard property={property} today={today} />
            </div>
          </aside>
        </div>
      </Container>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line bg-surface py-14">
          <Container className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <SectionLabel>También en arriendo</SectionLabel>
              <h2 id="related-title" className="text-2xl font-semibold">
                Otras propiedades
              </h2>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="flex">
                  <PropertyCard property={item} className="w-full" />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <PropertyCtaBar property={property} />
    </>
  );
}
