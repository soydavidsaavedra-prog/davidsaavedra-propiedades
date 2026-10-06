const dateTime = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Santiago",
});

const shortDate = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  timeZone: "America/Santiago",
});

/** "6 oct, 14:30" en hora de Chile. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** "6 oct" en hora de Chile. */
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso));
}

/** La próxima acción ya debió hacerse. */
export function isOverdue(nextActionAt: string | null, now: number): boolean {
  return nextActionAt !== null && Date.parse(nextActionAt) < now;
}
