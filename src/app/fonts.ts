import { Inter, Montserrat } from "next/font/google";

// Lectura, formularios y contenido funcional.
export const fontInter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display, títulos y elementos de marca.
export const fontMontserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});
