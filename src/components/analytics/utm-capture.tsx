"use client";

import { useEffect } from "react";

export const UTM_STORAGE_KEY = "ds_utm";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/**
 * Guarda el origen de la visita (UTM de Instagram, TikTok…) durante la sesión,
 * para asociarlo al lead aunque el formulario se envíe desde otra página.
 * Se conserva el primer origen de la sesión.
 */
export function UtmCapture() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;
      const params = new URLSearchParams(window.location.search);
      const utm: UtmParams = {};
      for (const key of UTM_KEYS) {
        const value = params.get(key);
        if (value) utm[key] = value.slice(0, 100);
      }
      if (Object.keys(utm).length > 0) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
      }
    } catch {
      // Almacenamiento no disponible (modo privado): se omite.
    }
  }, []);

  return null;
}

export function readStoredUtm(): UtmParams {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}
