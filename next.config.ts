import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storagePattern ? [storagePattern] : [],
  },
};

export default nextConfig;
