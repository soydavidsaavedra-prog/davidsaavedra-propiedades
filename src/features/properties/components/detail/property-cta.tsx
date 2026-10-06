import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { formatCLP } from "@/lib/format";
import { availabilityText, formatPrice } from "../../format";
import type { PropertyDetail } from "../../types";

type CtaProps = { property: PropertyDetail; today: string };

/** ¿Se puede gestionar una visita? (no para arrendadas, vendidas o no disponibles) */
export function acceptsInquiries(property: PropertyDetail): boolean {
  return property.availability === "available" || property.availability === "reserved";
}

function PriceLine({ property, large }: { property: PropertyDetail; large?: boolean }) {
  const monthly = property.price.amount !== null && property.operation === "rent";
  return (
    <p
      className={
        large
          ? "font-display text-3xl font-semibold tabular-nums"
          : "font-display text-lg leading-tight font-semibold tabular-nums"
      }
    >
      {formatPrice(property.price)}
      {monthly && <span className="font-sans text-sm font-normal text-ink-muted"> / mes</span>}
    </p>
  );
}

/** Tarjeta lateral fija (desktop). */
export function PropertyCtaCard({ property, today }: CtaProps) {
  const open = acceptsInquiries(property);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex flex-col gap-1">
        <PriceLine property={property} large />
        {property.commonExpensesClp !== null && (
          <p className="text-sm text-ink-muted">
            + {formatCLP(property.commonExpensesClp)} de gastos comunes
          </p>
        )}
      </div>
      <p className="text-sm text-ink-soft">
        Disponibilidad:{" "}
        <span className="font-medium text-ink">{availabilityText(property, today)}</span>
      </p>
      {open ? (
        <>
          <Link href="#visitar" className={buttonStyles({ size: "lg", fullWidth: true })}>
            Quiero visitar esta propiedad
          </Link>
          <p className="text-center text-sm text-ink-muted">
            Te respondo personalmente. Código {property.code}
          </p>
        </>
      ) : (
        <Link
          href="/propiedades"
          className={buttonStyles({ size: "lg", variant: "secondary", fullWidth: true })}
        >
          Ver propiedades disponibles <ArrowRight />
        </Link>
      )}
    </div>
  );
}

/** Barra fija inferior (móvil); reemplaza la navegación inferior en la ficha. */
export function PropertyCtaBar({ property }: { property: PropertyDetail }) {
  const open = acceptsInquiries(property);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-safe backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <PriceLine property={property} />
          <p className="truncate text-xs text-ink-muted">{property.code}</p>
        </div>
        {open ? (
          <Link href="#visitar" className={buttonStyles()}>
            Quiero visitarla
          </Link>
        ) : (
          <Link href="/propiedades" className={buttonStyles({ variant: "secondary" })}>
            Ver disponibles
          </Link>
        )}
      </div>
    </div>
  );
}
