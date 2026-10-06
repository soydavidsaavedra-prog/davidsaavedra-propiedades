-- =============================================================================
-- Permisos explícitos de la Data API (mínimo privilegio).
--
-- No dependemos de "Automatically expose new tables" de Supabase: se revoca
-- todo y se concede solo lo necesario. RLS sigue decidiendo qué filas ve cada
-- rol; estos permisos deciden qué operaciones existen.
-- =============================================================================

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Público: solo lectura de catálogos y propiedades (RLS filtra las publicadas).
grant select on
  public.property_types,
  public.communes,
  public.features,
  public.business_types,
  public.properties,
  public.property_media,
  public.property_features,
  public.property_suitable_uses
to anon;

-- Usuarios autenticados: operaciones de gestión; RLS las limita a administradores
-- (y a leer el propio perfil).
grant select, insert, update, delete on
  public.property_types,
  public.communes,
  public.features,
  public.business_types,
  public.profiles,
  public.properties,
  public.property_internal,
  public.owners,
  public.property_owners,
  public.property_media,
  public.property_features,
  public.property_suitable_uses,
  public.leads,
  public.lead_properties,
  public.lead_activities,
  public.visits
to authenticated;

-- El historial de estados solo se lee; lo escribe el trigger log_lead_status().
grant select on public.lead_status_history to authenticated;

-- Crear propiedades usa la secuencia del código DS-0001.
grant usage, select on sequence public.property_code_seq to authenticated;
