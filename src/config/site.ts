export const siteConfig = {
  name: "David Saavedra | Propiedades",
  shortName: "David Saavedra",
  description:
    "Arriendo de propiedades y locales comerciales en La Ligua, Región de Valparaíso. Atención personalizada, información clara y producción audiovisual profesional.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** WhatsApp de contacto (solo dígitos, con código de país). `WHATSAPP_NUMBER` lo reemplaza. */
  whatsappNumber: (process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") || "56920589553") as
    string | null,
  locale: "es_CL",
  location: {
    city: "La Ligua",
    region: "Región de Valparaíso",
    country: "Chile",
  },
  /** Datos del responsable del tratamiento de datos personales (política de privacidad). */
  legal: {
    controller: "David Saavedra",
    /** RUT del responsable. */
    taxId: "29.460.872-9" as string | null,
    /** Correo para solicitudes sobre datos personales. */
    privacyEmail: "davidsaavedrapropiedades@gmail.com" as string | null,
    /** Fecha de la última actualización de la política (YYYY-MM-DD). */
    privacyUpdatedAt: "2026-10-06",
  },
  social: {
    instagram: "https://www.instagram.com/davidsaavedra.cl",
    tiktok: "https://www.tiktok.com/@davidsaavedra.cl",
    handle: "@davidsaavedra.cl",
  },
} as const;

export type NavItem = {
  href: string;
  label: string;
};

export const publicNav: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/contacto", label: "Contacto" },
];
