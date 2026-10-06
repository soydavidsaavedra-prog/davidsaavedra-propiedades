import type { LeadSource, LeadType, MoveTimeframe } from "./constants";

/**
 * Datos que envía el formulario público de interés. Corresponde a los
 * parámetros de la función `public.submit_lead` (supabase/migrations).
 */
export type LeadSubmission = {
  fullName: string;
  /** Formato E.164, p. ej. +56912345678. */
  phone: string;
  consent: true;
  /** Desde el sitio: busca propiedad (`tenant`) o quiere arrendar la suya (`owner`). */
  leadType: Extract<LeadType, "tenant" | "owner">;
  propertyId?: string;
  email?: string;
  businessTypeId?: string;
  businessDescription?: string;
  budgetMinClp?: number;
  budgetMaxClp?: number;
  moveTimeframe?: MoveTimeframe;
  message?: string;
  source?: LeadSource;
  utm?: { source?: string; medium?: string; campaign?: string };
};
