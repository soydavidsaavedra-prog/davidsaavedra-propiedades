import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontBody, fontHeading } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${fontBody.variable} ${fontHeading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
