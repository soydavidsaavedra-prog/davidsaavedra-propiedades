import { formatCLP } from "@/lib/format";
import type { Price } from "./types";

const uf = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

/** Precio para mostrar. `null` → "Precio a consultar". */
export function formatPrice(price: Price): string {
  if (price.amount === null) return "Precio a consultar";
  // Hoy todas las propiedades se publican en CLP; UF queda preparada para ventas.
  return price.currency === "UF" ? `UF ${uf.format(price.amount)}` : formatCLP(price.amount);
}
