import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// Solo el despliegue de producción se indexa; previews y desarrollo no.
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/sistema" },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
