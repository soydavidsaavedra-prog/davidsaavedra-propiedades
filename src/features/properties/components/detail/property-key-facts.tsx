import { formatArea, formatCLP } from "@/lib/format";
import { availabilityText } from "../../format";
import type { PropertyDetail } from "../../types";

/** Ficha técnica: solo los datos informados. */
export function PropertyKeyFacts({ property, today }: { property: PropertyDetail; today: string }) {
  const facts: [string, string][] = [];
  if (property.builtAreaM2 !== null) facts.push(["Superficie", formatArea(property.builtAreaM2)]);
  if (property.landAreaM2 !== null) facts.push(["Terreno", formatArea(property.landAreaM2)]);
  if (property.bathrooms !== null) facts.push(["Baños", String(property.bathrooms)]);
  if (property.parkingSpots !== null) {
    facts.push([
      "Estacionamientos",
      property.parkingSpots > 0 ? String(property.parkingSpots) : "No",
    ]);
  }
  facts.push(["Disponibilidad", availabilityText(property, today)]);
  if (property.commonExpensesClp !== null) {
    facts.push(["Gastos comunes", formatCLP(property.commonExpensesClp)]);
  }
  if (property.guaranteeMonths !== null) {
    facts.push([
      "Garantía",
      `${property.guaranteeMonths} ${property.guaranteeMonths === 1 ? "mes" : "meses"}`,
    ]);
  }
  if (property.minLeaseMonths !== null) {
    facts.push(["Contrato mínimo", `${property.minLeaseMonths} meses`]);
  }

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-3">
      {facts.map(([term, value]) => (
        <div
          key={term}
          className="-mr-px -mb-px flex flex-col gap-0.5 border-r border-b border-line p-4"
        >
          <dt className="text-xs text-ink-muted">{term}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
