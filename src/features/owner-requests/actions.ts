"use server";

import { getSupabaseConfig } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { parsePropertyRequest, type PropertyRequestErrors } from "./validation";

export type PropertyRequestResult =
  | { ok: true; propertyId: string; firstName: string; whatsappUrl: string | null }
  | { ok: false; message: string; fieldErrors: PropertyRequestErrors };

/**
 * Registra la solicitud de un propietario con `submit_property_request`
 * (rol anónimo; la función valida y limita el abuso). Devuelve el id de la
 * propiedad creada en borrador: las fotos se suben después desde el
 * navegador a su carpeta del bucket privado `property-submissions`.
 */
export async function submitPropertyRequestAction(
  formData: FormData,
): Promise<PropertyRequestResult> {
  // Trampa para bots.
  if (formData.get("sitio_web")) {
    return { ok: false, message: "No se pudo enviar.", fieldErrors: {} };
  }

  const parsed = parsePropertyRequest(formData);
  if (!parsed.ok) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: parsed.fieldErrors };
  }
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false, message: "El formulario no está disponible por ahora.", fieldErrors: {} };
  }

  const data = parsed.data;
  const { data: propertyId, error } = await createPublicClient(config).rpc(
    "submit_property_request",
    {
      p_full_name: data.fullName,
      p_phone: data.phone,
      p_consent: true,
      p_property_type_id: data.propertyTypeId,
      p_commune_id: data.communeId,
      p_email: data.email,
      p_operation: data.operation,
      p_street_address: data.streetAddress,
      p_sector: data.sector,
      p_price_amount: data.priceAmount,
      p_built_area_m2: data.builtAreaM2,
      p_land_area_m2: data.landAreaM2,
      p_bathrooms: data.bathrooms,
      p_parking_spots: data.parkingSpots,
      p_bedrooms: data.bedrooms,
      p_available_from: data.availableFrom,
      p_description: data.description,
      p_message: data.message,
      p_feature_ids: data.featureIds,
    },
  );

  if (error) {
    if (error.message.includes("rate_limited")) {
      return {
        ok: false,
        message: "Ya recibimos varias solicitudes desde este número. Inténtalo más tarde.",
        fieldErrors: {},
      };
    }
    console.error("[solicitud] submit_property_request falló:", error.code, error.message);
    return {
      ok: false,
      message: "No pudimos registrar tu solicitud. Inténtalo de nuevo.",
      fieldErrors: {},
    };
  }

  const firstName = data.fullName.split(" ")[0] ?? data.fullName;
  return {
    ok: true,
    propertyId: String(propertyId),
    firstName,
    whatsappUrl: siteConfig.whatsappNumber
      ? whatsappUrl(
          siteConfig.whatsappNumber,
          `Hola David, soy ${firstName}. Te envié los datos de mi propiedad desde tu sitio.`,
        )
      : null,
  };
}
