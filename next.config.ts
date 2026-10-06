import type { NextConfig } from "next";

// En el despliegue de producción de Vercel, una variable faltante detiene el
// build: así nunca se publica un sitio con URLs de localhost o sin datos.
if (process.env.VERCEL_ENV === "production") {
  const missing = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno de producción: ${missing.join(", ")}`);
  }
}

// Fotos y videos se sirven desde el Storage de Supabase (bucket público).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storagePattern = supabaseUrl
  ? (() => {
      const { protocol, hostname } = new URL(supabaseUrl);
      return {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        pathname: "/storage/v1/object/public/property-media/**",
      };
    })()
  : null;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storagePattern ? [storagePattern] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
