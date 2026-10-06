import { ArrowRight, Bath, Car, Menu, Play, Ruler, SlidersHorizontal } from "lucide-react";
import { DiagonalLines } from "@/components/brand/diagonal-lines";
import { Divider } from "@/components/brand/divider";
import { Logo } from "@/components/brand/logo";
import { SectionLabel } from "@/components/brand/section-label";
import { BottomNavItems } from "@/components/layout/bottom-nav-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { IconButton } from "@/components/ui/icon-button";
import { MediaFrame } from "@/components/ui/media-frame";
import { publicNav } from "@/config/site";
import { BrowserFrame, DemoSection, PhoneFrame } from "./demo";
import { IntentDemo } from "./interactive-demo";
import { PhotoPlaceholder } from "./photo-placeholder";
import { PropertyCardExample, sampleProperties } from "./property-card-example";

function Price({ amount, size = "md" }: { amount: string; size?: "md" | "lg" }) {
  return (
    <p
      className={
        size === "lg"
          ? "font-display text-3xl font-semibold tabular-nums"
          : "font-display text-xl font-semibold tabular-nums"
      }
    >
      {amount} <span className="font-sans text-sm font-normal text-ink-muted">/ mes</span>
    </p>
  );
}

/** Bloque "Tu corredor": presentación personal (modo Noche). */
export function AgentBlock() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      <DiagonalLines />
      <div className="relative flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full ring-1 ring-accent-line ring-offset-4 ring-offset-surface">
            <PhotoPlaceholder tone="interior" />
            <span className="absolute inset-0 flex items-center justify-center text-[0.5625rem] font-medium tracking-wider text-ivory uppercase">
              Retrato
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Tu corredor</SectionLabel>
            <p className="font-display text-2xl font-semibold">David Saavedra</p>
          </div>
        </div>
        <p className="max-w-md text-ink-soft">
          Te atiendo personalmente, desde la primera consulta hasta la firma del contrato.
        </p>
        <Button variant="secondary" size="lg" className="self-start">
          Conversemos
        </Button>
      </div>
    </div>
  );
}

/** Tarjeta destacada sobre fotografía (galerías destacadas, modo Noche). */
export function FeaturedPropertyCard() {
  return (
    <article className="theme-night overflow-hidden rounded-xl">
      <MediaFrame ratio="16/9" overlay="bottom" media={<PhotoPlaceholder tone="interior" />}>
        <Badge tone="brand" className="absolute top-4 left-4 rounded-none pr-3 pl-3.5 corner-cut">
          Destacada
        </Badge>
        <span className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full border border-outline bg-night/40 backdrop-blur">
          <Play aria-hidden className="size-4" />
          <span className="sr-only">Ver video</span>
        </span>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5 sm:p-6">
          <SectionLabel className="hidden sm:flex">Galería destacada</SectionLabel>
          <h3 className="text-xl font-semibold sm:text-2xl">
            Local en esquina, Av. Ortiz de Rozas
          </h3>
          <Price amount="$780.000" />
        </div>
      </MediaFrame>
    </article>
  );
}

/* ---------------------------------------------------------------- Noche */

export function NightShowcase() {
  return (
    <section id="noche" className="theme-night scroll-mt-32">
      <div className="relative overflow-hidden">
        <div className="grid lg:min-h-[620px] lg:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-4/5 max-h-[58dvh] w-full sm:aspect-video lg:order-2 lg:aspect-auto lg:max-h-none">
            <PhotoPlaceholder tone="dusk" label="Fotografía real" />
            <DiagonalLines />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-night)_0%,transparent_45%)] lg:bg-[linear-gradient(90deg,var(--color-night)_0%,transparent_35%)]" />
          </div>
          <div className="relative -mt-24 flex flex-col justify-center gap-7 px-4 pb-14 sm:px-6 lg:mt-0 lg:py-20 lg:pr-10 lg:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]">
            <SectionLabel>01 · Modo Noche</SectionLabel>
            <h1 className="text-display font-semibold lg:text-[3.5rem] xl:text-[4rem]">
              Encuentra el espacio para tu próximo proyecto.
            </h1>
            <p className="max-w-md text-lg text-ink-soft">
              Locales comerciales en arriendo en La Ligua, presentados con información clara y
              atención personalizada.
            </p>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-ink-muted">¿Qué estás buscando?</p>
              <IntentDemo />
            </div>
          </div>
        </div>
      </div>

      <Container className="flex flex-col gap-6 pb-14">
        <Divider variant="cut" />
        <p className="max-w-2xl text-ink-muted">
          Modo Noche: hero, bloques de marca, presentación personal, galerías destacadas y footer.
          Fondo #0F0F0E, superficies #1A1918 y #252424, texto secundario #B8B4AE y champagne solo en
          detalles.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <AgentBlock />
          <FeaturedPropertyCard />
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ Día */

const facts = [
  ["Superficie", "70 m²"],
  ["Baños", "1"],
  ["Estacionamientos", "1"],
  ["Disponibilidad", "Inmediata"],
  ["Garantía", "1 mes"],
  ["Contrato mínimo", "12 meses"],
];

export function DayShowcase() {
  return (
    <Container>
      <DemoSection
        id="dia"
        title="Modo Día"
        description="Listados, información de propiedades, formularios y contenido funcional. Fondo #F7F5F1, superficies blancas, texto #0F0F0E y bronze como acento de texto."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-soft">
            <span className="font-display text-lg font-semibold text-ink">4 locales</span> en
            arriendo en La Ligua
          </p>
          <Button variant="secondary" size="sm">
            <SlidersHorizontal /> Filtros
          </Button>
        </div>
        <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Chip selected>Locales</Chip>
          <Chip>Hasta $600.000</Chip>
          <Chip>Con estacionamiento</Chip>
          <Chip>Con baño</Chip>
          <Chip>Disponible ya</Chip>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleProperties.map((property) => (
            <PropertyCardExample key={property.title} {...property} />
          ))}
        </div>
        <div className="grid gap-6 rounded-xl border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-3">
            <SectionLabel>Información de la propiedad</SectionLabel>
            <h3 className="text-2xl font-semibold">Local comercial con vitrina a la calle</h3>
            <p className="text-ink-soft">
              Local a nivel de calle con vitrina amplia, baño y acceso directo desde la vereda, en
              una zona de alto flujo peatonal.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {facts.map(([term, value]) => (
              <div key={term} className="flex flex-col gap-0.5 bg-surface p-4">
                <dt className="text-xs text-ink-muted">{term}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </DemoSection>
    </Container>
  );
}

/* ----------------------------------------------------------- Navegación */

function MobileHeader() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-line bg-canvas px-4">
      <Logo size="sm" href={null} />
      <IconButton label="Menú">
        <Menu />
      </IconButton>
    </div>
  );
}

function DesktopHeader() {
  return (
    <div className="flex h-16 items-center justify-between border-b border-line bg-canvas px-8">
      <Logo href={null} />
      <ul className="flex items-center gap-8 text-sm font-medium text-ink-soft">
        {publicNav.map((item, index) => (
          <li key={item.href} className={index === 1 ? "text-ink" : undefined}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NavigationShowcase() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[360px_1fr]">
      <PhoneFrame label="Móvil: header compacto + navegación inferior">
        <MobileHeader />
        <div className="flex h-56 flex-col justify-center gap-2 bg-canvas px-4">
          <SectionLabel>Contenido</SectionLabel>
          <p className="text-sm text-ink-muted">
            La navegación principal vive abajo, al alcance del pulgar. El indicador champagne marca
            la sección activa.
          </p>
        </div>
        <nav aria-label="Ejemplo de navegación inferior" className="border-t border-line bg-canvas">
          <BottomNavItems activeHref="/propiedades" />
        </nav>
      </PhoneFrame>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="hidden md:block">
          <BrowserFrame label="Desktop: navegación en el header">
            <DesktopHeader />
            <div className="h-24 bg-canvas" />
          </BrowserFrame>
        </div>
        <p className="text-sm text-ink-muted">
          El header real (arriba, modo Día) y el footer (abajo, modo Noche) de esta página son los
          componentes de producción.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ CTA */

export function CtaShowcase() {
  return (
    <div className="flex flex-col gap-6">
      <div className="theme-night relative overflow-hidden rounded-xl">
        <PhotoPlaceholder tone="dusk" />
        <div aria-hidden className="absolute inset-0 bg-night/60" />
        <div className="relative flex min-h-80 flex-col items-start justify-center gap-5 p-6 sm:p-10">
          <SectionLabel>Para propietarios</SectionLabel>
          <h3 className="max-w-lg text-3xl font-semibold">¿Tienes una propiedad para arrendar?</h3>
          <p className="max-w-md text-ink-soft">
            Producción audiovisual, publicación, prospectos calificados y seguimiento hasta el
            arriendo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">
              Quiero publicar mi propiedad <ArrowRight />
            </Button>
            <Button size="lg" variant="secondary">
              Cómo trabajo
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <p className="font-display text-xl font-semibold">¿No encuentras lo que buscas?</p>
            <p className="text-ink-muted">Cuéntame qué necesitas y te aviso cuando aparezca.</p>
          </div>
          <Button variant="secondary">Dejar mi búsqueda</Button>
        </div>

        <PhoneFrame label="Barra de acción fija en la ficha (móvil)">
          <div className="relative">
            <MediaFrame ratio="4/3" media={<PhotoPlaceholder tone="day" />}>
              <Badge tone="overlay" className="absolute bottom-3 left-3">
                1 / 12
              </Badge>
            </MediaFrame>
            <div className="flex flex-col gap-2 px-4 py-4">
              <h4 className="text-lg font-semibold">Local comercial con vitrina</h4>
              <ul className="flex gap-4 text-sm text-ink-soft">
                <li className="flex items-center gap-1">
                  <Ruler aria-hidden className="size-4" /> 70 m²
                </li>
                <li className="flex items-center gap-1">
                  <Bath aria-hidden className="size-4" /> 1
                </li>
                <li className="flex items-center gap-1">
                  <Car aria-hidden className="size-4" /> 1
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 border-t border-line bg-canvas/95 px-4 py-3">
              <p className="font-display text-lg leading-tight font-semibold tabular-nums">
                $550.000 <span className="font-sans text-sm font-normal text-ink-muted">/ mes</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary">Consultar</Button>
                <Button>Agendar visita</Button>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Responsive */

export function ResponsiveShowcase() {
  const [first, second, third] = sampleProperties;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[360px_1fr]">
      <PhoneFrame label="Móvil (360 px)">
        <MobileHeader />
        <div className="theme-night">
          <MediaFrame ratio="4/5" overlay="bottom" media={<PhotoPlaceholder tone="dusk" />}>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4">
              <SectionLabel>La Ligua</SectionLabel>
              <p className="font-display text-[1.75rem] leading-tight font-semibold">
                Encuentra el espacio para tu próximo proyecto.
              </p>
              <Button fullWidth>Ver locales disponibles</Button>
            </div>
          </MediaFrame>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <SectionLabel>Destacados</SectionLabel>
          {first && <PropertyCardExample {...first} />}
        </div>
        <nav aria-label="Ejemplo de navegación inferior" className="border-t border-line bg-canvas">
          <BottomNavItems activeHref="/" />
        </nav>
      </PhoneFrame>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="hidden lg:block">
          <BrowserFrame label="Desktop (1280 px, escalado)">
            <DesktopHeader />
            <div className="theme-night grid grid-cols-2">
              <div className="flex flex-col justify-center gap-4 p-10">
                <SectionLabel>La Ligua · Valparaíso</SectionLabel>
                <p className="font-display text-4xl leading-tight font-semibold">
                  Encuentra el espacio para tu próximo proyecto.
                </p>
                <div className="flex gap-3">
                  <Button>Ver locales</Button>
                  <Button variant="secondary">Publicar mi propiedad</Button>
                </div>
              </div>
              <div className="relative min-h-72">
                <PhotoPlaceholder tone="dusk" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-night)_0%,transparent_40%)]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5 p-8">
              {[first, second, third].map(
                (property) =>
                  property && <PropertyCardExample key={property.title} {...property} />,
              )}
            </div>
          </BrowserFrame>
        </div>
        <p className="text-sm text-ink-muted lg:hidden">
          La versión desktop se muestra en pantallas anchas. En móvil, esta misma página es el
          ejemplo real.
        </p>
        <ul className="grid gap-2 text-sm text-ink-soft">
          <li>• Móvil primero: una columna, CTA a ancho completo, navegación inferior.</li>
          <li>• Desktop: hero en dos columnas (texto y fotografía), grilla de 3 tarjetas.</li>
          <li>• Mismos componentes; solo cambia la composición.</li>
        </ul>
      </div>
    </div>
  );
}
