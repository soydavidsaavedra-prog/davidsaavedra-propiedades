export type BrandAsset = {
  /** Ruta pública, p. ej. "/brand/logo-horizontal-claro.svg". */
  src: string;
  width: number;
  height: number;
};

type BrandAssets = {
  /** Lockup horizontal (header, footer). Una versión por modo. */
  logo: {
    /** Versión oscura, para fondos claros (modo Día). */
    onLight: BrandAsset | null;
    /** Versión clara, para fondos oscuros (modo Noche). */
    onDark: BrandAsset | null;
  };
  /** Símbolo independiente (favicon, avatar, perfil). */
  symbol: BrandAsset | null;
};

/**
 * Archivos oficiales de marca. Mientras sean `null`, `<Logo />` muestra el
 * nombre en tipografía de marca. Para incorporar el logo vectorial: copiar los
 * SVG a `public/brand/` y completar estas rutas; los componentes no cambian.
 */
export const brandAssets: BrandAssets = {
  logo: { onLight: null, onDark: null },
  symbol: null,
};
