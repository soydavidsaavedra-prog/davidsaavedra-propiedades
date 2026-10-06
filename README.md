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

## Despliegue (Vercel)

El sitio se publica en Vercel desde la rama `main`; cada PR genera un preview.
Base de datos: ver [`supabase/README.md`](supabase/README.md).

1. **Importar el repositorio** en Vercel (framework Next.js, detectado solo).
   Node 22 se toma de `engines` y pnpm de `packageManager`.
2. **Variables de entorno** (Project Settings → Environment Variables):

   | Variable                               | Production                 | Preview                 |
   | -------------------------------------- | -------------------------- | ----------------------- |
   | `NEXT_PUBLIC_SITE_URL`                 | `https://davidsaavedra.cl` | URL del preview o vacía |
   | `NEXT_PUBLIC_SUPABASE_URL`             | obligatoria                | recomendada             |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | obligatoria                | recomendada             |
   | `WHATSAPP_NUMBER`                      | recomendada                | opcional                |

   En producción, si falta alguna obligatoria, el build se detiene
   (`next.config.ts`). **Nunca** cargar la clave `service_role`.
   Ojo: los previews con las variables de Supabase escriben leads reales en la
   misma base; para pruebas, borrar esos leads después.

3. **Región de funciones** (Settings → Functions): la misma región que el
   proyecto de Supabase (São Paulo → `gru1`), para que cada consulta no cruce
   el continente.
4. **Dominio:** agregar `davidsaavedra.cl` (y `www` con redirección al
   principal) en Settings → Domains y crear los registros DNS que indica Vercel.
5. **Desplegar** y revisar en producción: `/`, `/propiedades`, una ficha,
   `/contacto` (enviar un lead de prueba), `/robots.txt` y `/sitemap.xml`.

### Comportamiento por entorno

- `robots.txt` permite indexar solo en producción (`VERCEL_ENV=production`);
  previews y desarrollo responden `Disallow: /`.
- `sitemap.xml` incluye inicio, listado, tipos activos, fichas publicadas,
  contacto y privacidad; se regenera cada 5 minutos.
- `/sistema` responde 404 en producción salvo `SHOW_DESIGN_SYSTEM=true`.
- Cabeceras de seguridad básicas en todas las rutas (`next.config.ts`).

### Antes de lanzar

- [ ] Completar `siteConfig.legal.taxId` (RUT) y `privacyEmail` en
      `src/config/site.ts` (la política de privacidad los muestra si existen).
- [ ] Configurar `WHATSAPP_NUMBER`.
- [ ] Borrar los leads de prueba en Supabase.
- [ ] Publicar al menos una propiedad (o confirmar que se lanza con los estados
      vacíos).
- [ ] Integrar `feat/supabase` en `main` (rama de producción).

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
