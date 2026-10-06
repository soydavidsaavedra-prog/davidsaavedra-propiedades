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

## Panel de administración

`/admin` (no se indexa): ingreso con correo y contraseña de Supabase Auth y
gestión de propiedades y leads.

- **Propiedades:** crear (quedan en borrador), editar todos los datos públicos
  y los internos (dirección exacta, comisión, llaves, notas), publicar, pasar a
  borrador, archivar y eliminar (solo no publicadas). Publicar exige una foto
  de portada. Cada cambio regenera el sitio público al instante.
- **Fotos y videos:** se suben desde el navegador directo al Storage
  (`property-media/{id}/…`), sin pasar por el servidor. Fotos JPG, PNG, WebP o
  HEIC del iPhone (se convierte a JPG); las de más de 2400 px o 3 MB se reducen
  a JPG. Videos MOV o MP4: se recodifican a MP4 H.264 (lado mayor de 1920 px)
  con el códec del navegador (WebCodecs; Chrome, Edge o Safari actualizados) y
  deben quedar bajo 50 MB. Portada, orden, texto alternativo y enlaces de
  YouTube o Vimeo. Las librerías de conversión (`heic-to`, `mediabunny`) se
  cargan solo al elegir un archivo que las necesita
  (`src/features/admin/media/prepare.ts`).
- **Leads (CRM):** bandeja con vistas (abiertos, nuevos, vencidos, arrendados,
  perdidos), búsqueda y filtros; ficha con contacto directo, etapa del embudo
  (perdido exige motivo), próxima acción, timeline de notas e interacciones con
  el historial de etapas y propiedades vinculadas. Alta manual de contactos
  que llegan por WhatsApp, redes o en persona (sin duplicar un lead abierto con
  el mismo teléfono), edición de datos y eliminación con todo su historial
  cuando el titular lo pide (Ley 21.719).
- **Seguridad:** `src/proxy.ts` renueva la sesión y redirige a `/admin/ingresar`
  (filtro optimista); cada página y Server Action vuelve a verificar el rol
  `admin` en `profiles` (`src/features/admin/session.ts`), y RLS lo exige en la
  base de datos y el Storage. La app nunca usa la clave `service_role`.
- **Acceso:** solo usuarios con `profiles.role = 'admin'` (ver
  [`supabase/README.md`](supabase/README.md)). Un usuario sin ese rol no entra.

## Despliegue (Vercel)

El sitio se publica en Vercel desde la rama `main`; cada PR genera un preview.
Base de datos: ver [`supabase/README.md`](supabase/README.md).

1. **Crear un proyecto nuevo** en Vercel (Add New → Project → importar este
   repositorio), independiente de **DS Catalog**: no reutilizar ese proyecto
   ni sus variables, dominios o integraciones. Framework Next.js (detectado
   solo); Node 22 se toma de `engines` y pnpm de `packageManager`.
2. **Variables de entorno** (Project Settings → Environment Variables):

   | Variable                               | Production                     | Preview                 |
   | -------------------------------------- | ------------------------------ | ----------------------- |
   | `NEXT_PUBLIC_SITE_URL`                 | `https://davidsaavedra.cl`     | URL del preview o vacía |
   | `NEXT_PUBLIC_SUPABASE_URL`             | obligatoria                    | recomendada             |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | obligatoria                    | recomendada             |
   | `WHATSAPP_NUMBER`                      | opcional (hay uno por defecto) | opcional                |

   En producción, si falta alguna obligatoria, el build se detiene
   (`next.config.ts`). **Nunca** cargar la clave `service_role`.
   Ojo: los previews con las variables de Supabase escriben leads reales en la
   misma base; para pruebas, borrar esos leads después.

3. **Región de funciones** (Settings → Functions): la misma región que el
   proyecto de Supabase (São Paulo → `gru1`), para que cada consulta no cruce
   el continente.
4. **Dominio:** agregar `davidsaavedra.cl` (y `www` con redirección al
   principal) en Settings → Domains del proyecto nuevo y crear los registros
   DNS que indica Vercel. Si el dominio está asignado a DS Catalog, Vercel
   pide quitarlo de ese proyecto primero: hacerlo recién al lanzar, porque
   deja de responder allí.
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

- [x] RUT, correo de privacidad y WhatsApp en `src/config/site.ts`.
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
