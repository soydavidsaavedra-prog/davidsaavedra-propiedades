import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Heart, Play, Share2, X } from "lucide-react";
import { Divider } from "@/components/brand/divider";
import { Logo } from "@/components/brand/logo";
import { SectionLabel } from "@/components/brand/section-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Select } from "@/components/ui/input";
import { MediaFrame, type MediaRatio } from "@/components/ui/media-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { brandAssets } from "@/config/brand";
import { DemoSection, ModeCompare, SistemaIndex } from "./_components/demo";
import { ChipsDemo, FormDemo, IntentDemo, SheetDemo } from "./_components/interactive-demo";
import { PhotoPlaceholder } from "./_components/photo-placeholder";
import { PropertyCardExample, sampleProperties } from "./_components/property-card-example";
import {
  CtaShowcase,
  DayShowcase,
  FeaturedPropertyCard,
  NavigationShowcase,
  NightShowcase,
  ResponsiveShowcase,
} from "./_components/showcases";

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

const brandPalette = [
  { name: "night", className: "bg-night", value: "#0F0F0E", use: "Fondo Noche" },
  { name: "night-soft", className: "bg-night-soft", value: "#252424", use: "Superficie Noche" },
  { name: "ivory", className: "bg-ivory", value: "#F7F5F1", use: "Fondo Día" },
  { name: "silver", className: "bg-silver", value: "#B8B4AE", use: "Texto secundario Noche" },
  { name: "champagne", className: "bg-champagne", value: "#C9A57A", use: "Detalle de marca" },
  {
    name: "champagne-light",
    className: "bg-champagne-light",
    value: "#E9CDA4",
    use: "Énfasis puntual",
  },
  { name: "bronze", className: "bg-bronze", value: "#7A5F40", use: "Acento de texto Día" },
  { name: "ink", className: "bg-ink", value: "#0F0F0E", use: "Texto y CTA Día" },
];

const typeScale = [
  { name: "Display", className: "text-display font-semibold", sample: "Tu próximo local" },
  { name: "H1 · 36", className: "text-4xl font-semibold", sample: "Locales en La Ligua" },
  { name: "H2 · 30", className: "text-3xl font-semibold", sample: "Propiedades destacadas" },
  { name: "H3 · 20", className: "text-xl font-semibold", sample: "Local comercial con vitrina" },
];

const photoRatios: { ratio: MediaRatio; use: string }[] = [
  { ratio: "4/3", use: "Tarjetas" },
  { ratio: "3/2", use: "Galería" },
  { ratio: "4/5", use: "Vertical / redes" },
  { ratio: "16/9", use: "Hero / video" },
];

const logoFiles = [
  { label: "Horizontal para fondo claro", ready: Boolean(brandAssets.logo.onLight) },
  { label: "Horizontal para fondo oscuro", ready: Boolean(brandAssets.logo.onDark) },
  { label: "Símbolo (favicon / perfil)", ready: Boolean(brandAssets.symbol) },
];

function ScaleRow({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-24 shrink-0 text-xs text-ink-muted">{name}</span>
      {children}
    </div>
  );
}

// Página interna: disponible en desarrollo o con SHOW_DESIGN_SYSTEM=true.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_DESIGN_SYSTEM !== "true") {
    notFound();
  }

  return (
    <>
      <Container className="flex flex-col gap-4 py-12">
        <SectionLabel>Design System · v0.2</SectionLabel>
        <h1 className="text-4xl font-semibold sm:text-5xl">David Saavedra | Propiedades</h1>
        <p className="max-w-2xl text-lg text-ink-soft">
          Arquitectura contemporánea, geometría y líneas finas. Fotografía protagonista, marca
          personal y una interfaz sobria: modo Noche para la marca, modo Día para la información.
        </p>
      </Container>

      <SistemaIndex />

      <NightShowcase />

      <DayShowcase />

      <Container className="divide-y divide-line">
        <DemoSection
          id="logo"
          title="Logo"
          description="El logotipo se renderiza siempre a través de <Logo />. Mientras no exista el SVG oficial, muestra el nombre en la tipografía de marca."
        >
          <ModeCompare>
            <div className="flex min-h-48 items-center justify-center py-6">
              <Logo size="lg" align="center" href={null} />
            </div>
            <div className="flex flex-wrap items-center gap-8">
              <Logo href={null} />
              <Logo size="sm" href={null} />
            </div>
          </ModeCompare>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-3 p-5">
              <p className="font-display font-semibold">Reemplazo por SVG</p>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink-soft">
                <li>
                  Copiar los archivos a <code className="font-mono text-xs">public/brand/</code>.
                </li>
                <li>
                  Completar las rutas en{" "}
                  <code className="font-mono text-xs">src/config/brand.ts</code>.
                </li>
                <li>Header, footer y páginas se actualizan sin modificar componentes.</li>
              </ol>
              <p className="text-sm text-ink-muted">
                La referencia visual del logo no se incorporó al repositorio.
              </p>
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <p className="font-display font-semibold">Archivos esperados</p>
              <ul className="flex flex-col gap-2.5 text-sm">
                {logoFiles.map((file) => (
                  <li key={file.label} className="flex items-center justify-between gap-3">
                    <span className="text-ink-soft">{file.label}</span>
                    <Badge tone={file.ready ? "success" : "warning"}>
                      {file.ready ? "Listo" : "Pendiente SVG"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </DemoSection>

        <DemoSection
          id="tipografia"
          title="Tipografía"
          description="Montserrat para display, títulos y elementos de marca. Inter para lectura, formularios y contenido funcional."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-4 p-6">
              <p className="text-xs font-medium tracking-wider text-ink-muted uppercase">
                Montserrat · Display y marca
              </p>
              <p className="font-display text-7xl leading-none font-semibold">Aa</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 font-display text-lg">
                <span className="font-light">Light</span>
                <span className="font-medium">Medium</span>
                <span className="font-semibold">Semibold</span>
                <span className="font-bold">Bold</span>
              </div>
            </Card>
            <Card className="flex flex-col gap-4 p-6">
              <p className="text-xs font-medium tracking-wider text-ink-muted uppercase">
                Inter · Lectura y formularios
              </p>
              <p className="text-7xl leading-none font-medium">Aa</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-lg">
                <span>Regular</span>
                <span className="font-medium">Medium</span>
                <span className="font-semibold">Semibold</span>
              </div>
            </Card>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {typeScale.map((item) => (
              <ScaleRow key={item.name} name={item.name}>
                <span className={item.className}>{item.sample}</span>
              </ScaleRow>
            ))}
            <ScaleRow name="Cuerpo · 16">
              <p className="max-w-2xl text-ink-soft">
                Local de 70 m² con vitrina hacia la calle, un baño y acceso directo desde la vereda,
                en una de las zonas de mayor flujo peatonal de la comuna.
              </p>
            </ScaleRow>
            <ScaleRow name="Precio">
              <p className="font-display text-2xl font-semibold tabular-nums">
                $550.000 <span className="font-sans text-sm font-normal text-ink-muted">/ mes</span>
              </p>
            </ScaleRow>
            <ScaleRow name="Etiqueta">
              <SectionLabel>Propiedades destacadas</SectionLabel>
            </ScaleRow>
          </div>
        </DemoSection>

        <DemoSection
          id="color"
          title="Color"
          description="Paleta aprobada. Champagne es detalle de marca, nunca relleno de botones. Contraste de texto AA en ambos modos."
        >
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {brandPalette.map((swatch) => (
              <li
                key={swatch.name}
                className="overflow-hidden rounded-lg border border-line bg-surface"
              >
                <div className={`h-16 ${swatch.className}`} />
                <div className="flex flex-col gap-0.5 px-3 py-2.5">
                  <p className="text-sm font-medium">{swatch.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{swatch.value}</p>
                  <p className="text-xs text-ink-muted">{swatch.use}</p>
                </div>
              </li>
            ))}
          </ul>
          <ModeCompare>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ["canvas", "bg-canvas border border-line"],
                ["surface", "bg-surface"],
                ["surface-muted", "bg-surface-muted"],
                ["ink", "bg-ink"],
                ["ink-muted", "bg-ink-muted"],
                ["accent", "bg-accent"],
              ].map(([name, className]) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className={`h-10 rounded-md ${className}`} />
                  <span className="text-ink-muted">{name}</span>
                </div>
              ))}
            </div>
          </ModeCompare>
        </DemoSection>

        <DemoSection
          id="botones"
          title="Botones"
          description="CTA primario sobrio: tinta en Día, marfil en Noche. Secundario con borde fino; en Noche el borde es champagne."
        >
          <ModeCompare>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">
                Agendar visita <ArrowRight />
              </Button>
              <Button size="lg" variant="secondary">
                Ver propiedades
              </Button>
              <Button variant="ghost">Terciario</Button>
              <Button size="sm" variant="secondary">
                Pequeño
              </Button>
              <Button disabled>Deshabilitado</Button>
            </div>
            <div className="flex items-center gap-2">
              <IconButton label="Guardar" variant="secondary">
                <Heart />
              </IconButton>
              <IconButton label="Compartir" variant="secondary">
                <Share2 />
              </IconButton>
              <IconButton label="Cerrar">
                <X />
              </IconButton>
            </div>
            <Button size="lg" fullWidth>
              Ancho completo (CTA móvil)
            </Button>
          </ModeCompare>
        </DemoSection>

        <DemoSection
          id="cards"
          title="Cards"
          description="Superficie, borde fino y radios contenidos. Sin sombras pesadas; la elevación aparece solo al interactuar."
        >
          <ModeCompare>
            <Card className="flex flex-col gap-3 p-5">
              <SectionLabel>Condiciones</SectionLabel>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-ink-muted">Garantía</dt>
                  <dd className="font-medium">1 mes</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Contrato mínimo</dt>
                  <dd className="font-medium">12 meses</dd>
                </div>
              </dl>
            </Card>
            <Card interactive className="flex items-center justify-between gap-4 p-5">
              <div className="flex flex-col gap-1">
                <p className="font-display font-semibold">Tarjeta interactiva</p>
                <p className="text-sm text-ink-muted">Elevación suave al pasar el cursor.</p>
              </div>
              <ArrowRight aria-hidden className="size-5 text-accent" />
            </Card>
          </ModeCompare>
        </DemoSection>

        <DemoSection
          id="badges"
          title="Badges"
          description="Estados de disponibilidad y etiquetas de marca."
        >
          <ModeCompare>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Disponible</Badge>
              <Badge tone="warning">Reservada</Badge>
              <Badge>Arrendada</Badge>
              <Badge tone="brand" className="rounded-none pr-3 pl-3.5 corner-cut">
                Destacada
              </Badge>
              <Badge tone="accent">@davidsaavedra.cl</Badge>
              <Badge tone="danger">Error</Badge>
            </div>
          </ModeCompare>
        </DemoSection>

        <DemoSection
          id="inputs"
          title="Inputs"
          description="Texto de 16 px (sin zoom en iOS), etiquetas visibles, ayuda y errores accesibles."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
              <FormDemo />
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-canvas p-5 sm:p-6">
                <p className="text-xs font-medium tracking-wider text-ink-muted uppercase">
                  Estados
                </p>
                <Field id="input-disabled" label="Propiedad de interés">
                  {(control) => (
                    <Input {...control} disabled defaultValue="DS-001 · Local Centro" />
                  )}
                </Field>
                <Field id="input-commune" label="Comuna">
                  {(control) => (
                    <Select {...control} defaultValue="la-ligua">
                      <option value="la-ligua">La Ligua</option>
                    </Select>
                  )}
                </Field>
              </div>
              <div className="theme-night flex flex-col gap-4 rounded-xl p-5 sm:p-6">
                <p className="text-xs font-medium tracking-wider text-ink-muted uppercase">
                  Modo Noche
                </p>
                <Field id="night-email" label="Correo" hint="Uso puntual en bloques de marca.">
                  {(control) => <Input {...control} type="email" placeholder="tu@correo.cl" />}
                </Field>
                <Button variant="secondary">Enviar</Button>
              </div>
            </div>
          </div>
        </DemoSection>

        <DemoSection
          id="chips"
          title="Chips"
          description="Filtros seleccionables y selector de intención. Áreas táctiles de 40 a 64 px."
        >
          <ModeCompare>
            <ChipsDemo />
            <IntentDemo />
          </ModeCompare>
          <div className="flex flex-wrap items-center gap-3">
            <SheetDemo />
            <p className="text-sm text-ink-muted">
              Los filtros en móvil se abren en un panel inferior.
            </p>
          </div>
        </DemoSection>

        <DemoSection
          id="navegacion"
          title="Navegación"
          description="Móvil: header compacto y navegación inferior. Desktop: navegación en el header. Footer en modo Noche."
        >
          <NavigationShowcase />
        </DemoSection>

        <DemoSection
          id="property-card"
          title="Property card"
          description="Fotografía primero (4:3), estado sobre la imagen, precio en Montserrat y datos clave separados por líneas finas."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sampleProperties.map((property) => (
              <PropertyCardExample key={property.title} {...property} />
            ))}
          </div>
          <FeaturedPropertyCard />
        </DemoSection>

        <DemoSection
          id="cta"
          title="CTA"
          description="Bloque de marca sobre fotografía (modo Noche), CTA secundario en modo Día y barra de acción fija en la ficha móvil."
        >
          <CtaShowcase />
        </DemoSection>

        <DemoSection
          id="separadores"
          title="Separadores de sección"
          description="Líneas finas y etiquetas espaciadas, del lenguaje del logotipo. El rombo a 45° se usa con moderación."
        >
          <ModeCompare>
            <div className="flex flex-col gap-6">
              <SectionLabel>Etiqueta de sección</SectionLabel>
              <SectionLabel align="center">Propiedades</SectionLabel>
              <Divider variant="accent" />
              <Divider />
              <Divider variant="cut" />
            </div>
          </ModeCompare>
        </DemoSection>

        <DemoSection
          id="fotografia"
          title="Tratamiento fotográfico"
          description="La fotografía es protagonista. Proporciones fijas, tratamientos solo para dar legibilidad y una dirección cálida y natural."
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {photoRatios.map(({ ratio, use }) => (
              <figure key={ratio} className="flex flex-col gap-2">
                <MediaFrame
                  ratio={ratio}
                  className="rounded-lg"
                  media={<PhotoPlaceholder tone="day" />}
                />
                <figcaption className="text-sm">
                  <span className="font-medium">{ratio}</span>{" "}
                  <span className="text-ink-muted">· {use}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <figure className="flex flex-col gap-2">
              <MediaFrame
                ratio="4/3"
                className="rounded-lg"
                media={<PhotoPlaceholder tone="interior" />}
              />
              <figcaption className="text-sm text-ink-muted">Sin tratamiento: listados.</figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              <MediaFrame
                ratio="4/3"
                overlay="bottom"
                className="theme-night rounded-lg"
                media={<PhotoPlaceholder tone="interior" />}
              >
                <p className="absolute bottom-4 left-4 font-display text-lg font-semibold">
                  Texto sobre foto
                </p>
              </MediaFrame>
              <figcaption className="text-sm text-ink-muted">
                Degradado inferior: destacadas y hero.
              </figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              <MediaFrame
                ratio="4/3"
                overlay="scrim"
                className="theme-night rounded-lg"
                media={<PhotoPlaceholder tone="interior" />}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-outline">
                    <Play aria-hidden className="size-5" />
                  </span>
                </span>
              </MediaFrame>
              <figcaption className="text-sm text-ink-muted">
                Velo uniforme: video y CTA centrados.
              </figcaption>
            </figure>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Galería deslizable (móvil)</p>
            <ul className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {(["day", "interior", "dusk", "day", "interior"] as const).map((tone, index) => (
                <li key={index} className="w-[78%] shrink-0 snap-start sm:w-[40%] lg:w-[28%]">
                  <MediaFrame
                    ratio="3/2"
                    className="rounded-lg"
                    media={<PhotoPlaceholder tone={tone} />}
                  >
                    <Badge tone="overlay" className="absolute bottom-3 left-3 tabular-nums">
                      {index + 1} / 5
                    </Badge>
                  </MediaFrame>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-3 p-5">
              <p className="font-display font-semibold text-success">Sí</p>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-soft">
                <li>Luz natural cálida: hora dorada o interiores iluminados.</li>
                <li>Verticales corregidas y horizonte nivelado (lectura arquitectónica).</li>
                <li>Primera foto: fachada o espacio principal, sin texto encima.</li>
                <li>Secuencia ordenada: exterior, acceso, interior y detalles.</li>
              </ul>
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <p className="font-display font-semibold text-danger">No</p>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-soft">
                <li>Filtros dorados, viñetas pesadas o HDR exagerado.</li>
                <li>Logos, marcas de agua o textos sobre la fotografía de la ficha.</li>
                <li>Gran angular extremo que deforma el espacio.</li>
                <li>Fotos verticales de celular como imagen principal.</li>
              </ul>
            </Card>
          </div>
        </DemoSection>

        <DemoSection
          id="responsive"
          title="Responsive"
          description="Mobile first: la misma base de componentes, compuesta para móvil y para desktop."
        >
          <ResponsiveShowcase />
        </DemoSection>

        <section className="flex flex-col gap-4 py-14">
          <SectionLabel>Estados de carga</SectionLabel>
          <div className="grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex flex-col gap-3">
                <Skeleton className="aspect-4/3 w-full rounded-lg" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
