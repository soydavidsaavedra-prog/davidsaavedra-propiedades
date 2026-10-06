/**
 * Normaliza un teléfono a formato E.164 (+56912345678).
 * Acepta formatos chilenos habituales: "9 1234 5678", "+56 9 1234 5678",
 * "56912345678", "(+569) 1234-5678". Otros países, solo con prefijo "+".
 * Devuelve null si no es válido.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  // Celular chileno sin prefijo de país.
  if (/^9\d{8}$/.test(digits)) return `+56${digits}`;
  // Con prefijo 56 (con o sin "+").
  if (/^569\d{8}$/.test(digits)) return `+${digits}`;
  // Fijo chileno con prefijo 56 (9 dígitos tras el 56).
  if (/^56[2-8]\d{8}$/.test(digits)) return `+${digits}`;
  // Internacional explícito.
  if (trimmed.startsWith("+") && /^[1-9]\d{7,14}$/.test(digits) && !digits.startsWith("56")) {
    return `+${digits}`;
  }
  return null;
}

/** +56912345678 → "+56 9 1234 5678" (solo celulares chilenos; el resto sin cambios). */
export function formatPhone(e164: string): string {
  const match = e164.match(/^\+569(\d{4})(\d{4})$/);
  return match ? `+56 9 ${match[1]} ${match[2]}` : e164;
}
