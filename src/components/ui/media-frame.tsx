import { cn } from "@/lib/cn";

export type MediaRatio = "16/9" | "4/3" | "3/2" | "4/5" | "1/1";

const ratios: Record<MediaRatio, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "3/2": "aspect-3/2",
  "4/5": "aspect-4/5",
  "1/1": "aspect-square",
};

/** Tratamientos sobre la fotografía para dar legibilidad al contenido superpuesto. */
const overlays = {
  none: null,
  // Texto en la parte inferior (tarjetas destacadas, hero).
  bottom: "bg-[linear-gradient(0deg,rgb(15_15_14/0.92)_0%,rgb(15_15_14/0.55)_35%,transparent_70%)]",
  // Velo uniforme para CTA o texto centrado.
  scrim: "bg-night/55",
} as const;

type MediaFrameProps = React.ComponentProps<"div"> & {
  ratio?: MediaRatio;
  /** La foto o video (`next/image` con `fill`). Va debajo del tratamiento. */
  media?: React.ReactNode;
  overlay?: keyof typeof overlays;
};

/**
 * Contenedor de proporción fija para fotografía y video. Reserva el espacio
 * antes de que cargue la imagen (evita saltos de layout / CLS). Orden de capas:
 * `media` → tratamiento (`overlay`) → `children` (badges, textos, controles).
 */
export function MediaFrame({
  ratio = "4/3",
  media,
  overlay = "none",
  className,
  children,
  ...props
}: MediaFrameProps) {
  const overlayClass = overlays[overlay];

  return (
    <div
      className={cn("relative overflow-hidden bg-surface-muted", ratios[ratio], className)}
      {...props}
    >
      {media}
      {overlayClass && <div aria-hidden className={cn("absolute inset-0", overlayClass)} />}
      {children}
    </div>
  );
}
