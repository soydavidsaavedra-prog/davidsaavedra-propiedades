import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Wordmark PROVISORIO. Se reemplaza por el logotipo oficial (SVG) de la marca
 * manteniendo esta misma API.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="David Saavedra Propiedades, inicio"
      className={cn("inline-flex flex-col leading-none", className)}
    >
      <span className="font-display text-[0.9375rem] font-semibold tracking-brand">
        DAVID SAAVEDRA
      </span>
      <span className="mt-1 text-[0.625rem] font-medium tracking-brand text-ink-muted">
        PROPIEDADES
      </span>
    </Link>
  );
}
