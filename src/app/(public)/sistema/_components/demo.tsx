import { SectionLabel } from "@/components/brand/section-label";
import { cn } from "@/lib/cn";

export const sistemaSections = [
  { id: "noche", label: "Modo Noche" },
  { id: "dia", label: "Modo Día" },
  { id: "logo", label: "Logo" },
  { id: "tipografia", label: "Tipografía" },
  { id: "color", label: "Color" },
  { id: "botones", label: "Botones" },
  { id: "cards", label: "Cards" },
  { id: "badges", label: "Badges" },
  { id: "inputs", label: "Inputs" },
  { id: "chips", label: "Chips" },
  { id: "navegacion", label: "Navegación" },
  { id: "property-card", label: "Property card" },
  { id: "cta", label: "CTA" },
  { id: "separadores", label: "Separadores" },
  { id: "fotografia", label: "Fotografía" },
  { id: "responsive", label: "Responsive" },
] as const;

export type SistemaSectionId = (typeof sistemaSections)[number]["id"];

/** Índice fijo con anclas a cada sección (desplazable en móvil). */
export function SistemaIndex() {
  return (
    <nav
      aria-label="Secciones del sistema"
      className="sticky top-16 z-30 border-b border-line bg-canvas/90 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-6xl [scrollbar-width:none] gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {sistemaSections.map((section, index) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <span className="text-xs text-ink-muted tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DemoSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: SistemaSectionId;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const index = sistemaSections.findIndex((section) => section.id === id) + 1;

  return (
    <section id={id} className={cn("flex scroll-mt-32 flex-col gap-6 py-14", className)}>
      <div className="flex flex-col gap-2">
        <SectionLabel>{String(index).padStart(2, "0")}</SectionLabel>
        <h2 className="text-3xl font-semibold">{title}</h2>
        {description && <p className="max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Muestra el mismo contenido en modo Día y en modo Noche. */
export function ModeCompare({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["Día", "Noche"] as const).map((mode) => (
        <div
          key={mode}
          className={cn(
            "flex flex-col gap-5 rounded-xl border border-line bg-canvas p-5 sm:p-6",
            mode === "Noche" && "theme-night border-transparent",
          )}
        >
          <p className="text-xs font-medium tracking-wider text-ink-muted uppercase">Modo {mode}</p>
          {children}
        </div>
      ))}
    </div>
  );
}

/** Marco de teléfono (360 px de ancho útil) para ejemplos móviles. */
export function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="flex min-w-0 flex-col items-center gap-3">
      <div className="w-full max-w-[360px] overflow-hidden rounded-[2.25rem] border-[6px] border-night-soft bg-canvas shadow-raised">
        <div className="flex h-6 items-center justify-center bg-canvas">
          <span className="h-1.5 w-16 rounded-full bg-line-strong" />
        </div>
        {children}
      </div>
      <figcaption className="text-sm text-ink-muted">{label}</figcaption>
    </figure>
  );
}

/** Marco de navegador para ejemplos desktop. */
export function BrowserFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-line-strong bg-canvas shadow-raised">
        <div className="flex h-9 items-center gap-1.5 border-b border-line bg-surface-muted px-4">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-4 h-5 flex-1 rounded-sm bg-surface px-3 text-xs leading-5 text-ink-muted">
            davidsaavedra.cl
          </span>
        </div>
        {children}
      </div>
      <figcaption className="text-center text-sm text-ink-muted">{label}</figcaption>
    </figure>
  );
}
