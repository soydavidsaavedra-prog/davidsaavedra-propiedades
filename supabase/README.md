# Base de datos (Supabase / PostgreSQL)

> **Estado:** migraciones validadas en un PostgreSQL 17 local con la batería
> de pruebas de seguridad (`supabase/tests/run.sh`, 39 pruebas). La aplicación
> ya lee y escribe en Supabase cuando están las variables de entorno. **Aún no
> se ha conectado ni migrado ningún proyecto real de Supabase.**

## Migraciones (orden de ejecución)

| Archivo                   | Contenido                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `…000100_base.sql`        | Enums y `set_updated_at()`                                                                    |
| `…000200_catalogs.sql`    | `property_types`, `communes`, `features`, `business_types`                                    |
| `…000300_profiles.sql`    | `profiles` (rol), alta automática desde `auth.users`, `is_admin()`                            |
| `…000400_properties.sql`  | `properties`, `property_internal`, `owners`, `property_owners`, media, características y usos |
| `…000500_crm.sql`         | `leads`, `lead_properties`, `lead_status_history`, `lead_activities`, `visits`                |
| `…000600_rls.sql`         | Row Level Security de todas las tablas                                                        |
| `…000700_submit_lead.sql` | `submit_lead()`: única vía de entrada de leads públicos                                       |
| `…000800_storage.sql`     | Bucket `property-media` y sus políticas                                                       |
| `…000900_grants.sql`      | Permisos explícitos de la Data API (mínimo privilegio)                                        |

`seed.sql` carga los catálogos iniciales (sin datos personales ni propiedades).

## Modelo

```
property_types ─┐                ┌─ property_media
communes ───────┼─< properties >─┼─ property_features >── features
                │       │        ├─ property_suitable_uses >── business_types
                │       │        ├─ property_internal (1:1, privado)
                │       │        └─ property_owners >── owners (privado)
                │       │
                │   lead_properties
                │       │
leads ──────────┴───────┴─< lead_status_history · lead_activities · visits
profiles (auth.users) ── rol admin/agent
```

## Decisiones

- **Crecimiento sin rehacer el modelo.** Tipos de propiedad, comunas,
  características y rubros son catálogos: viviendas, terrenos, ventas u otras
  comunas se habilitan con filas (`is_active`) o con el enum `operation`.
- **Público vs. privado.** RLS filtra filas, no columnas. Por eso los datos
  internos (dirección exacta, comisión, notas, propietarios) están en tablas
  separadas, visibles solo para administradores.
- **Precio en CLP.** Todas las propiedades actuales se publican en pesos.
  `price_currency` (CLP por defecto) deja preparada la UF para ventas futuras;
  `price_amount` `null` = a consultar. Presupuestos de leads en CLP.
- **Ubicación pública aproximada por defecto** (`location_precision`).
- **Código corto** `DS-0001` para referenciar propiedades en redes y WhatsApp.
- **Leads públicos solo vía `submit_lead()`** (security definer): valida,
  exige consentimiento, limita abuso (5 envíos por teléfono cada 10 min) y,
  si el teléfono ya tiene un lead abierto, agrega la consulta a ese lead.
  Recibe el tipo de cliente: `tenant` (busca propiedad) u `owner` (propietario
  que quiere arrendar la suya), para captar inventario desde `/contacto`.
- **Historial de estados por trigger**, no desde la aplicación.
- **Timeline unificado** (`lead_activities`): notas e interacciones; toda
  interacción (no las notas) actualiza `last_interaction_at`.
- **Visitas** con modelo listo; la interfaz llega en la fase 2.
- **Matching (fase 2):** se apoya en atributos existentes (tipo, comuna, precio,
  m², características, usos y presupuesto/rubro del lead). No requiere tablas
  nuevas en esta etapa.

## Pruebas de seguridad

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres supabase/tests/run.sh
```

Crea una base desechable (`TEST_DB`, por defecto `ds_test`), simula lo mínimo
de Supabase y verifica, por rol: el público solo ve propiedades publicadas y
catálogos; no ve leads, propietarios ni datos internos; los leads entran solo
por `submit_lead()` (consentimiento, validación, deduplicación y límite de
abuso); un usuario sin rol de administración no puede ascenderse; el historial
de estados lo escribe solo el trigger. **No usar contra la base de producción.**

## Conectar el proyecto de Supabase

1. Crear el proyecto en supabase.com (región São Paulo, la más cercana a Chile).
2. Aplicar las migraciones en orden y luego `seed.sql`: con la CLI
   (`supabase link` + `supabase db push`) o pegándolas en el SQL Editor.
3. En Authentication: desactivar el registro público; crear el usuario
   administrador y luego `update public.profiles set role = 'admin' where id = '<uuid>';`.
4. Variables de entorno de la aplicación (Project Settings → API):
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   La clave publishable es pública; **nunca** usar la `service_role` en la app.
5. Generar tipos (`supabase gen types typescript`) para reemplazar los tipos de
   fila declarados a mano en `src/features/properties/data/supabase-source.ts`.
