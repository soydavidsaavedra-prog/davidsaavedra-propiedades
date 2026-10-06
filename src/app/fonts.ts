import { Inter, Inter_Tight } from "next/font/google";

// PROVISORIO: se reemplazan por las tipografías de la identidad de marca.
export const fontBody = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const fontHeading = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});
