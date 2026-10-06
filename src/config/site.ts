export const siteConfig = {
  name: "David Saavedra | Propiedades",
  shortName: "David Saavedra",
  description:
    "Arriendo de propiedades y locales comerciales en La Ligua, Región de Valparaíso. Atención personalizada, información clara y producción audiovisual profesional.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "es_CL",
  location: {
    city: "La Ligua",
    region: "Región de Valparaíso",
    country: "Chile",
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
