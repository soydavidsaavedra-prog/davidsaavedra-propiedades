const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

/** 550000 → "$550.000" */
export function formatCLP(amount: number): string {
  return clp.format(amount);
}

/** 70 → "70 m²" · 48.5 → "48,5 m²" */
export function formatArea(m2: number): string {
  return `${decimal.format(m2)} m²`;
}

/** Singular o plural según la cantidad: pluralize(2, "baño", "baños") → "2 baños". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const longDate = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-11-01" → "1 de noviembre de 2026" (fechas sin hora, sin desfase horario). */
export function formatDate(isoDate: string): string {
  return longDate.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** Fecha de hoy en Chile, "YYYY-MM-DD". */
export function todayInChile(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}
