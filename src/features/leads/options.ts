import type { MoveTimeframe } from "./constants";
import { moveTimeframeLabels, MOVE_TIMEFRAMES } from "./constants";

/** Rangos de presupuesto mensual (CLP) que ofrece el formulario. */
export const BUDGET_RANGES = [
  { value: "hasta-400", label: "Hasta $400.000", min: undefined, max: 400000 },
  { value: "400-600", label: "$400.000 – $600.000", min: 400000, max: 600000 },
  { value: "600-800", label: "$600.000 – $800.000", min: 600000, max: 800000 },
  { value: "mas-800", label: "Más de $800.000", min: 800000, max: undefined },
] as const;

export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const timeframeOptions: { value: MoveTimeframe; label: string }[] = MOVE_TIMEFRAMES.map(
  (value) => ({ value, label: moveTimeframeLabels[value] }),
);
