import Image from "next/image";
import Link from "next/link";
import { brandAssets, type BrandAsset } from "@/config/brand";
import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  /** `center` agrega las líneas laterales de "PROPIEDADES", como en el logotipo. */
  align?: "start" | "center";
  /** Enlace de destino; `null` lo renderiza sin enlace. */
  href?: string | null;
  className?: string;
};

const heights: Record<LogoSize, number> = { sm: 32, md: 40, lg: 96 };

const wordmark: Record<LogoSize, { name: string; tagline: string; line: string }> = {
  sm: { name: "text-[0.8125rem]", tagline: "mt-1 text-[0.5rem]", line: "w-4" },
  md: { name: "text-[0.9375rem]", tagline: "mt-1.5 text-[0.5625rem]", line: "w-5" },
  lg: { name: "text-3xl sm:text-4xl", tagline: "mt-3 text-xs sm:text-sm", line: "w-10 sm:w-14" },
};

function AssetImage({
  asset,
  size,
  className,
}: {
  asset: BrandAsset;
  size: LogoSize;
  className?: string;
}) {
  const height = heights[size];
  return (
    <Image
      src={asset.src}
      alt=""
      width={Math.round((asset.width / asset.height) * height)}
      height={height}
      unoptimized
      priority
      className={className}
    />
  );
}

/**
 * Logotipo de David Saavedra | Propiedades.
 *
 * Si hay archivos en `config/brand.ts` muestra el SVG oficial (versión según el
 * modo Día/Noche). Si no, muestra el nombre en la tipografía de marca. El resto
 * de la interfaz solo usa `<Logo />`, así que reemplazar el logo no toca
 * componentes.
 */
export function Logo({ size = "md", align = "start", href = "/", className }: LogoProps) {
  const { onLight, onDark } = brandAssets.logo;
  const styles = wordmark[size];

  const content =
    onLight && onDark ? (
      <>
        <AssetImage asset={onLight} size={size} className="night:hidden" />
        <AssetImage asset={onDark} size={size} className="hidden night:block" />
      </>
    ) : (
      <span
        className={cn(
          "flex flex-col leading-none",
          align === "center" ? "items-center text-center" : "items-start",
        )}
      >
        <span className={cn("font-display font-medium tracking-[0.1em] text-ink", styles.name)}>
          DAVID SAAVEDRA
        </span>
        <span
          className={cn(
            "flex items-center gap-2 font-display font-medium tracking-brand text-accent",
            styles.tagline,
          )}
        >
          {align === "center" && (
            <span aria-hidden className={cn("h-px bg-accent-line", styles.line)} />
          )}
          PROPIEDADES
          {align === "center" && (
            <span aria-hidden className={cn("h-px bg-accent-line", styles.line)} />
          )}
        </span>
      </span>
    );

  const classes = cn("inline-flex shrink-0", className);
  const label = "David Saavedra Propiedades";

  if (href === null) {
    return (
      <span role="img" aria-label={label} className={classes}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={`${label}, inicio`} className={classes}>
      {content}
    </Link>
  );
}
