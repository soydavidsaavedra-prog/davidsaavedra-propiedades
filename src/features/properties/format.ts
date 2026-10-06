import { formatCLP, formatDate } from "@/lib/format";
import type { Price, PropertySummary } from "./types";

const uf = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

/** Precio para mostrar. `null` → "Precio a consultar". */
export function formatPrice(price: Price): string {
  if (price.amount === null) return "Precio a consultar";
  // Hoy todas las propiedades se publican en CLP; UF queda preparada para ventas.
  return price.currency === "UF" ? `UF ${uf.format(price.amount)}` : formatCLP(price.amount);
}

/** Texto de disponibilidad para la ficha: "Inmediata", "Desde el 1 de noviembre de 2026"… */
export function availabilityText(
  property: Pick<PropertySummary, "availability" | "availableFrom">,
  today: string,
): string {
  switch (property.availability) {
    case "available":
      return property.availableFrom && property.availableFrom > today
        ? `Desde el ${formatDate(property.availableFrom)}`
        : "Inmediata";
    case "reserved":
      return "Reservada";
    case "rented":
      return "Arrendada";
    case "sold":
      return "Vendida";
    case "unavailable":
      return "No disponible";
  }
}
