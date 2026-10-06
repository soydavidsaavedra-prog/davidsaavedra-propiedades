import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontInter, fontMontserrat } from "./fonts";
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
  themeColor: "#f7f5f1",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${fontInter.variable} ${fontMontserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
