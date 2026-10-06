import { cn } from "@/lib/cn";

/**
 * Textura de líneas estructurales a 45° (lenguaje del banner y del monograma).
 * Decorativa: usar sobre secciones Noche, detrás del contenido.
 */
export function DiagonalLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      preserveAspectRatio="xMaxYMid slice"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-accent-line",
        className,
      )}
    >
      <g stroke="currentColor" strokeWidth={0.75} fill="none">
        <line x1="210" y1="400" x2="400" y2="210" opacity={0.35} />
        <line x1="260" y1="400" x2="400" y2="260" opacity={0.2} />
        <line x1="120" y1="400" x2="400" y2="120" opacity={0.12} />
      </g>
    </svg>
  );
}
