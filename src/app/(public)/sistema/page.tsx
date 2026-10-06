import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Bath, Car, MapPin, Ruler, SearchX } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaFrame } from "@/components/ui/media-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { ChipsDemo, FormDemo, SheetDemo } from "./_components/interactive-demo";

export const metadata: Metadata = {
  title: "Sistema visual",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "canvas", className: "bg-canvas", value: "#F6F5F2" },
  { name: "surface", className: "bg-surface", value: "#FFFFFF" },
  { name: "surface-muted", className: "bg-surface-muted", value: "#ECEAE5" },
  { name: "line", className: "bg-line", value: "#E0DDD6" },
  { name: "line-strong", className: "bg-line-strong", value: "#BDB8AE" },
  { name: "ink-muted", className: "bg-ink-muted", value: "#6B675F" },
  { name: "ink-soft", className: "bg-ink-soft", value: "#45433E" },
  { name: "ink / brand", className: "bg-ink", value: "#1B1B19" },
  { name: "accent", className: "bg-accent", value: "#73644F" },
  { name: "success", className: "bg-success", value: "#2E6A4C" },
  { name: "warning", className: "bg-warning", value: "#8A5A12" },
  { name: "danger", className: "bg-danger", value: "#A1352A" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-line py-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Placeholder de fotografía: en producción aquí va `next/image` con `fill`. */
function PhotoPlaceholder() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#d9d4ca_0%,#b9b1a3_45%,#8e8676_100%)]">
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgb(27_27_25/0.35),transparent)]" />
    </div>
  );
}

// Página interna: disponible en desarrollo o con SHOW_DESIGN_SYSTEM=true.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_DESIGN_SYSTEM !== "true") {
    notFound();
  }

  return (
    <Container className="py-10">
      <header className="flex flex-col gap-3 pb-10">
        <Badge tone="warning" className="self-start">
          Provisorio · pendiente identidad de marca
        </Badge>
        <h1 className="text-display font-semibold">Sistema visual</h1>
        <p className="max-w-2xl text-lg text-ink-soft">
          Tokens y componentes base de la plataforma. Paleta neutra y arquitectónica para que la
          fotografía sea protagonista; se ajustará a la identidad existente de la marca.
        </p>
      </header>

      <Section
        title="Marca"
        description="Wordmark provisorio hasta incorporar el logotipo oficial."
      >
        <div className="flex flex-wrap gap-4">
          <div className="rounded-lg border border-line bg-surface p-6">
            <Logo />
          </div>
          <div className="rounded-lg bg-ink p-6 text-white">
            <Logo className="[&_span:last-child]:text-white/70" />
          </div>
        </div>
      </Section>

      <Section
        title="Color"
        description="Solo nombres semánticos; contraste de texto AA verificado."
      >
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((swatch) => (
            <li
              key={swatch.name}
              className="overflow-hidden rounded-lg border border-line bg-surface"
            >
              <div className={`h-16 ${swatch.className}`} />
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{swatch.name}</p>
                <p className="font-mono text-xs text-ink-muted">{swatch.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Tipografía"
        description="Display para titulares, sans para lectura. Cifras tabulares en precios."
      >
        <div className="flex flex-col gap-5">
          <p className="text-display font-semibold">
            Encuentra el espacio para tu próximo proyecto.
          </p>
          <p className="text-3xl font-semibold">Local comercial en La Ligua Centro</p>
          <p className="text-xl font-medium">Título de sección</p>
          <p className="max-w-2xl text-base text-ink-soft">
            Texto de lectura. Local de 70 m² con vitrina hacia la calle, un baño y acceso directo
            desde la vereda, en una de las zonas de mayor flujo peatonal de la comuna.
          </p>
          <p className="text-sm text-ink-muted">Texto secundario y metadatos.</p>
          <p className="text-2xl font-semibold tabular-nums">
            $550.000 <span className="text-base font-normal text-ink-muted">/ mes</span>
          </p>
          <p className="text-xs font-medium tracking-brand text-ink-muted">ETIQUETA DE SECCIÓN</p>
        </div>
      </Section>

      <Section title="Botones" description="Altura mínima de 44 px en tamaños táctiles.">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">
            Quiero visitarla <ArrowRight />
          </Button>
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Terciario</Button>
          <Button size="sm" variant="secondary">
            Pequeño
          </Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="max-w-sm">
          <Button size="lg" fullWidth>
            Ancho completo (CTA móvil)
          </Button>
        </div>
      </Section>

      <Section title="Badges y chips">
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">Disponible</Badge>
          <Badge tone="warning">Reservada</Badge>
          <Badge tone="neutral">Arrendada</Badge>
          <Badge tone="brand">Destacada</Badge>
          <Badge tone="danger">Error</Badge>
        </div>
        <ChipsDemo />
      </Section>

      <Section
        title="Fotografía protagonista"
        description="Composición de ejemplo: proporciones fijas (sin saltos de layout) e información mínima sobre la imagen."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card interactive>
            <MediaFrame ratio="4/3">
              <PhotoPlaceholder />
              <Badge tone="overlay" className="absolute top-3 left-3">
                Disponible
              </Badge>
            </MediaFrame>
            <div className="flex flex-col gap-2 p-4">
              <p className="flex items-center gap-1 text-sm text-ink-muted">
                <MapPin aria-hidden className="size-4" /> La Ligua · Centro
              </p>
              <h3 className="text-lg font-semibold">Local comercial con vitrina</h3>
              <p className="text-xl font-semibold tabular-nums">
                $550.000 <span className="text-sm font-normal text-ink-muted">/ mes</span>
              </p>
              <ul className="flex gap-4 text-sm text-ink-soft">
                <li className="flex items-center gap-1">
                  <Ruler aria-hidden className="size-4" /> 70 m²
                </li>
                <li className="flex items-center gap-1">
                  <Bath aria-hidden className="size-4" /> 1 baño
                </li>
                <li className="flex items-center gap-1">
                  <Car aria-hidden className="size-4" /> 1 estac.
                </li>
              </ul>
            </div>
          </Card>
          <MediaFrame ratio="4/5" className="rounded-lg">
            <PhotoPlaceholder />
            <p className="absolute bottom-4 left-4 text-sm font-medium text-white">
              Vertical 4:5 · formato redes
            </p>
          </MediaFrame>
          <MediaFrame ratio="16/9" className="rounded-lg sm:col-span-2 lg:col-span-1">
            <PhotoPlaceholder />
            <p className="absolute bottom-4 left-4 text-sm font-medium text-white">
              Horizontal 16:9 · video
            </p>
          </MediaFrame>
        </div>
      </Section>

      <Section
        title="Formulario"
        description="Texto de 16 px (sin zoom en iOS), etiquetas visibles y errores accesibles."
      >
        <FormDemo />
      </Section>

      <Section
        title="Panel inferior"
        description="Para filtros y formularios en móvil. Dialog nativo, sin librerías."
      >
        <SheetDemo />
      </Section>

      <Section title="Estados de carga y vacío">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Skeleton className="aspect-4/3 w-full rounded-lg" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/4" />
          </div>
          <EmptyState
            icon={<SearchX />}
            title="Sin resultados"
            description="No hay propiedades que coincidan con estos filtros. Prueba ampliando el presupuesto."
            action={<Button variant="secondary">Limpiar filtros</Button>}
          />
        </div>
      </Section>
    </Container>
  );
}
