# David Saavedra | Propiedades

Plataforma inmobiliaria de [davidsaavedra.cl](https://davidsaavedra.cl). Next.js (App Router),
TypeScript estricto y Tailwind CSS v4.

## Desarrollo

Requisitos: Node 22 y pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- Sitio: http://localhost:3000
- Sistema visual (solo desarrollo): http://localhost:3000/sistema

## Verificación

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## Estructura

```
src/
  app/                 rutas (App Router); (public) agrupa el sitio público
  components/ui/       primitivos de interfaz sin lógica de negocio
  components/layout/   header, navegación inferior móvil, footer
  components/brand/    logotipo
  config/site.ts       datos de la marca y navegación
  lib/                 utilidades
```

Los tokens visuales (color, tipografía, radios, sombras) están en `src/app/globals.css`.
