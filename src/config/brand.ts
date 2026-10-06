export type BrandAsset = {
  /** Ruta pública del archivo. */
  src: string;
  /** Dimensiones intrínsecas (viewBox); solo se usan para la proporción. */
  width: number;
  height: number;
};

/**
 * Assets digitales de marca, derivados del maestro `design/brand/LOGO DS PROPIEDADES.ai`
 * sin modificar la geometría (ver `design/brand/README.md`).
 */
export const brandAssets = {
  /** Monograma oficial: letras marfil + dorado. Para fondos oscuros (modo Noche). */
  logoLight: { src: "/brand/logo.svg", width: 355.87, height: 264.1 },
  /** Mismo vector con las letras en tinta. Para fondos claros (modo Día). */
  logoDark: { src: "/brand/logo-dark.svg", width: 355.87, height: 264.1 },
  /** Monograma oficial sobre fondo night, cuadrado. Favicon y avatar. */
  symbol: { src: "/brand/symbol.svg", width: 512, height: 512 },
} satisfies Record<string, BrandAsset>;
