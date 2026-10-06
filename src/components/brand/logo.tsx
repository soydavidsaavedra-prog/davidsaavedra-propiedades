import Image from "next/image";
import Link from "next/link";
import { brandAssets, type BrandAsset } from "@/config/brand";
import { cn } from "@/lib/cn";

type LogoVariant = "default" | "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  /**
   * `default`: sigue el modo de la sección (Día → versión oscura, Noche → oficial clara).
   * `light`: versión oficial clara, para fondos oscuros o fotografía.
   * `dark`: versión oscura, para fondos claros.
   */
  variant?: LogoVariant;
  /** Solo el monograma, sin el nombre. */
  markOnly?: boolean;
  size?: LogoSize;
  /** `stacked`: monograma sobre el nombre, centrado (presentaciones de marca). */
  layout?: "horizontal" | "stacked";
  /** Enlace de destino; `null` lo renderiza sin enlace. */
  href?: string | null;
  className?: string;
};

const LABEL = "David Saavedra Propiedades";

/** Altura del monograma por tamaño, en px. El ancho sale de la proporción del vector. */
const markHeights: Record<LogoSize, number> = { sm: 28, md: 36, lg: 104 };

const wordmark: Record<LogoSize, { name: string; tagline: string; line: string }> = {
  sm: { name: "text-[0.75rem]", tagline: "mt-1 text-[0.5rem]", line: "w-4" },
  md: { name: "text-[0.875rem]", tagline: "mt-1.5 text-[0.5625rem]", line: "w-5" },
  lg: { name: "text-2xl sm:text-3xl", tagline: "mt-3 text-xs sm:text-sm", line: "w-10 sm:w-14" },
};

function MarkImage({
  asset,
  height,
  alt,
  className,
}: {
  asset: BrandAsset;
  height: number;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={asset.src}
      alt={alt}
      width={Math.round((asset.width / asset.height) * height)}
      height={height}
      unoptimized
      className={cn("w-auto max-w-none shrink-0", className)}
      style={{ height }}
    />
  );
}

function Mark({ variant, size, alt }: { variant: LogoVariant; size: LogoSize; alt: string }) {
  const height = markHeights[size];

  if (variant === "light")
    return <MarkImage asset={brandAssets.logoLight} height={height} alt={alt} />;
  if (variant === "dark")
    return <MarkImage asset={brandAssets.logoDark} height={height} alt={alt} />;

  // Ambas versiones en el DOM; CSS muestra la que corresponde al modo de la sección.
  return (
    <>
      <MarkImage asset={brandAssets.logoDark} height={height} alt={alt} className="night:hidden" />
      <MarkImage
        asset={brandAssets.logoLight}
        height={height}
        alt={alt}
        className="hidden night:block"
      />
    </>
  );
}

/**
 * Logotipo de David Saavedra | Propiedades: monograma oficial (SVG derivado del
 * maestro .ai, sin alterar su geometría) + nombre en la tipografía de marca.
 */
export function Logo({
  variant = "default",
  markOnly = false,
  size = "md",
  layout = "horizontal",
  href = "/",
  className,
}: LogoProps) {
  const styles = wordmark[size];
  const stacked = layout === "stacked";
  const textColor =
    variant === "light" ? "text-ivory" : variant === "dark" ? "text-night" : "text-ink";
  const accentColor =
    variant === "light" ? "text-champagne" : variant === "dark" ? "text-bronze" : "text-accent";

  const content = markOnly ? (
    <Mark variant={variant} size={size} alt={href === null ? LABEL : ""} />
  ) : (
    <>
      {/* El nombre ya está como texto: el monograma es decorativo. */}
      <Mark variant={variant} size={size} alt="" />
      <span
        className={cn(
          "flex flex-col leading-none",
          stacked ? "mt-5 items-center text-center" : "items-start",
        )}
      >
        <span className={cn("font-display font-medium tracking-[0.1em]", textColor, styles.name)}>
          DAVID SAAVEDRA
        </span>
        <span
          className={cn(
            "flex items-center gap-2 font-display font-medium tracking-brand",
            accentColor,
            styles.tagline,
          )}
        >
          {stacked && <span aria-hidden className={cn("h-px bg-accent-line", styles.line)} />}
          PROPIEDADES
          {stacked && <span aria-hidden className={cn("h-px bg-accent-line", styles.line)} />}
        </span>
      </span>
    </>
  );

  const classes = cn(
    "inline-flex shrink-0",
    stacked ? "flex-col items-center" : "items-center gap-2.5",
    className,
  );

  if (href === null) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} aria-label={`${LABEL}, inicio`} className={classes}>
      {content}
    </Link>
  );
}
