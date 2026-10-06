# Base de datos (Supabase / PostgreSQL)

> **Estado:** migraciones escritas y validadas sintácticamente (parser oficial de
> PostgreSQL). **No se han ejecutado** contra ninguna base de datos. La conexión
> a Supabase queda pendiente de aprobación.

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
- **Precio en CLP o UF.** `price_amount` + `price_currency`; `null` = a consultar.
  Presupuestos de leads en CLP.
- **Ubicación pública aproximada por defecto** (`location_precision`).
- **Código corto** `DS-0001` para referenciar propiedades en redes y WhatsApp.
- **Leads públicos solo vía `submit_lead()`** (security definer): valida,
  exige consentimiento, limita abuso (5 envíos por teléfono cada 10 min) y,
  si el teléfono ya tiene un lead abierto, agrega la consulta a ese lead.
- **Historial de estados por trigger**, no desde la aplicación.
- **Timeline unificado** (`lead_activities`): notas e interacciones; toda
  interacción (no las notas) actualiza `last_interaction_at`.
- **Visitas** con modelo listo; la interfaz llega en la fase 2.
- **Matching (fase 2):** se apoya en atributos existentes (tipo, comuna, precio,
  m², características, usos y presupuesto/rubro del lead). No requiere tablas
  nuevas en esta etapa.

## Pendiente al conectar Supabase

1. Crear el proyecto y aplicar migraciones (`supabase db push`) + `seed.sql`.
2. Desactivar el registro público en Auth y crear el usuario administrador
   (`update profiles set role = 'admin' where id = …`).
3. Generar tipos: `supabase gen types typescript` → `src/types/database.ts`.
4. Reemplazar la implementación de `src/features/properties/queries.ts`
   (hoy sobre fixtures) por consultas a Supabase.
5. Probar RLS: el rol `anon` no debe leer leads, propietarios ni datos internos.
