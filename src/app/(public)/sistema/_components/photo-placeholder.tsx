import { cn } from "@/lib/cn";

const tones = {
  // Atardecer cálido: dirección fotográfica de la marca.
  dusk: "bg-[radial-gradient(120%_80%_at_80%_20%,#e9b77a_0%,#9c6a43_28%,#3b2a20_62%,#121110_100%)]",
  // Interior iluminado.
  interior:
    "bg-[radial-gradient(90%_70%_at_30%_30%,#f1d6ae_0%,#b98d62_35%,#4a3a2c_75%,#1d1a17_100%)]",
  // Fachada diurna.
  day: "bg-[linear-gradient(160deg,#dcd6cb_0%,#bfb5a5_45%,#8b8170_100%)]",
} as const;

export type PhotoTone = keyof typeof tones;

/** Sustituto de fotografía para la demostración. En producción: `next/image`. */
export function PhotoPlaceholder({
  tone = "day",
  label,
  className,
}: {
  tone?: PhotoTone;
  label?: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("absolute inset-0", tones[tone], className)}>
      {label && (
        <span className="absolute top-3 right-3 rounded-sm bg-night/60 px-2 py-1 text-[0.625rem] font-medium tracking-wider text-ivory uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
