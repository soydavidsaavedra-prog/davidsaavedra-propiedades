import { cn } from "@/lib/cn";

export type MediaRatio = "16/9" | "4/3" | "3/2" | "4/5" | "1/1";

const ratios: Record<MediaRatio, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "3/2": "aspect-3/2",
  "4/5": "aspect-4/5",
  "1/1": "aspect-square",
};

type MediaFrameProps = React.ComponentProps<"div"> & {
  ratio?: MediaRatio;
};

/**
 * Contenedor de proporción fija para fotografía y video. Reserva el espacio
 * antes de que cargue la imagen (evita saltos de layout / CLS). Pensado para
 * envolver `next/image` con `fill`.
 */
export function MediaFrame({ ratio = "4/3", className, children, ...props }: MediaFrameProps) {
  return (
    <div
      className={cn("relative overflow-hidden bg-surface-muted", ratios[ratio], className)}
      {...props}
    >
      {children}
    </div>
  );
}
