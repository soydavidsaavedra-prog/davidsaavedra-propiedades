-- =============================================================================
-- ARCHIVO GENERADO por scripts/build-supabase-setup.mjs. No editar a mano.
-- Instalación inicial completa: migraciones (en orden) + catálogos (seed).
-- Ejecutar UNA sola vez en un proyecto de Supabase vacío (SQL Editor → Run).
-- =============================================================================

-- >>> supabase/migrations/20261006000100_base.sql
-- =============================================================================
-- Base: tipos enumerados y funciones utilitarias compartidas.
-- Los valores se guardan en inglés (estables para el código); las etiquetas en
-- español viven en la aplicación.
-- =============================================================================

-- Operación comercial. El MVP usa solo 'rent'; 'sale' queda preparado.
create type public.property_operation as enum ('rent', 'sale');

-- Estado de publicación (visibilidad en el sitio).
create type public.property_status as enum ('draft', 'published', 'archived');

-- Disponibilidad comercial (independiente de la publicación).
create type public.property_availability as enum (
  'available',
  'reserved',
  'rented',
  'sold',
  'unavailable'
);

create type public.price_currency as enum ('CLP', 'UF');

-- Precisión de la ubicación pública (la dirección exacta es interna).
create type public.location_precision as enum ('exact', 'approximate');

create type public.media_kind as enum ('image', 'video');
create type public.media_provider as enum ('storage', 'youtube', 'vimeo');

create type public.user_role as enum ('admin', 'agent');

-- Embudo comercial del CRM.
create type public.lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'visit_scheduled',
  'visited',
  'interested',
  'documentation',
  'negotiation',
  'won',
  'lost'
);

create type public.lead_type as enum ('tenant', 'buyer', 'owner');

create type public.lead_source as enum (
  'website',
  'whatsapp',
  'instagram',
  'tiktok',
  'facebook',
  'referral',
  'walk_in',
  'other'
);

create type public.move_timeframe as enum (
  'immediate',
  'within_30_days',
  'within_90_days',
  'exploring'
);

create type public.lead_property_relation as enum (
  'inquired',
  'suggested',
  'visited',
  'discarded'
);

create type public.lead_activity_type as enum (
  'note',
  'call',
  'whatsapp',
  'email',
  'meeting',
  'web_inquiry'
);

create type public.visit_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

-- Mantiene updated_at en cada UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- >>> supabase/migrations/20261006000200_catalogs.sql
-- =============================================================================
-- Catálogos: permiten crecer (viviendas, terrenos, otras comunas, nuevos usos)
-- agregando filas, sin cambiar el modelo.
-- =============================================================================

create table public.property_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  name_plural text not null,
  -- Agrupación amplia: comercial, residencial o terreno.
  category text not null check (category in ('commercial', 'residential', 'land')),
  -- Inactivo = "Próximamente" en el sitio.
  is_active boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  region text not null,
  is_active boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Características descriptivas (vitrina, baño, cortina metálica…).
-- Los atributos numéricos filtrables (m², baños, estacionamientos) son columnas
-- de properties, no características.
create table public.features (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  label text not null,
  category text not null check (
    category in ('access', 'services', 'spaces', 'commercial', 'security', 'other')
  ),
  is_filterable boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rubros de negocio: formulario de interés, usos posibles y (fase 2) matching.
create table public.business_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger property_types_updated_at before update on public.property_types
  for each row execute function public.set_updated_at();
create trigger communes_updated_at before update on public.communes
  for each row execute function public.set_updated_at();
create trigger features_updated_at before update on public.features
  for each row execute function public.set_updated_at();
create trigger business_types_updated_at before update on public.business_types
  for each row execute function public.set_updated_at();

-- >>> supabase/migrations/20261006000300_profiles.sql
-- =============================================================================
-- Usuarios internos. La identidad vive en auth.users (Supabase Auth); aquí solo
-- el perfil y el rol. El registro público estará desactivado: los usuarios se
-- crean manualmente.
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al crear un usuario en Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ¿El usuario actual es administrador? Base de todas las políticas privadas.
-- SECURITY DEFINER evita recursión al consultar profiles desde sus políticas.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- >>> supabase/migrations/20261006000400_properties.sql
-- =============================================================================
-- Propiedades, propietarios y media.
--
-- RLS filtra filas, no columnas: todo lo que esté en `properties` puede verlo
-- el público cuando la propiedad está publicada. Por eso los datos internos
-- (dirección exacta, comisión, notas, propietarios) viven en tablas separadas
-- con acceso solo para administradores.
-- =============================================================================

-- Código corto para referenciar la propiedad en redes y WhatsApp: DS-0001.
create sequence public.property_code_seq;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    default ('DS-' || lpad(nextval('public.property_code_seq')::text, 4, '0')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  title text not null check (char_length(title) between 5 and 120),
  summary text check (char_length(summary) <= 280),
  description text,

  property_type_id uuid not null references public.property_types (id) on delete restrict,
  operation public.property_operation not null default 'rent',
  status public.property_status not null default 'draft',
  availability public.property_availability not null default 'available',
  available_from date,

  -- Precio: null = "precio a consultar". UF o CLP según la propiedad.
  price_amount numeric(14, 2) check (price_amount >= 0),
  price_currency public.price_currency not null default 'CLP',
  common_expenses_clp numeric(12, 0) check (common_expenses_clp >= 0),
  guarantee_months numeric(3, 1) check (guarantee_months >= 0),
  min_lease_months smallint check (min_lease_months > 0),

  -- Atributos filtrables.
  built_area_m2 numeric(10, 2) check (built_area_m2 > 0),
  land_area_m2 numeric(10, 2) check (land_area_m2 > 0),
  bathrooms smallint check (bathrooms >= 0),
  parking_spots smallint check (parking_spots >= 0),
  bedrooms smallint check (bedrooms >= 0), -- viviendas (fase 3)

  -- Ubicación pública.
  commune_id uuid not null references public.communes (id) on delete restrict,
  sector text check (char_length(sector) <= 80),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  location_precision public.location_precision not null default 'approximate',

  is_featured boolean not null default false,
  featured_rank smallint,

  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),

  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_coordinates_pair check ((latitude is null) = (longitude is null)),
  constraint properties_published_has_date check (status <> 'published' or published_at is not null)
);

alter sequence public.property_code_seq owned by public.properties.code;

create index properties_listing_idx
  on public.properties (status, operation, property_type_id, commune_id);
create index properties_price_idx on public.properties (price_currency, price_amount);
create index properties_featured_idx
  on public.properties (featured_rank) where is_featured and status = 'published';

create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

-- Registra la primera fecha de publicación.
create function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger properties_published_at before insert or update of status on public.properties
  for each row execute function public.set_published_at();

-- Datos internos 1:1 (nunca públicos).
create table public.property_internal (
  property_id uuid primary key references public.properties (id) on delete cascade,
  street_address text,
  unit text,
  commission_terms text,
  keys_location text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger property_internal_updated_at before update on public.property_internal
  for each row execute function public.set_updated_at();

-- Propietarios (sin portal todavía; solo gestión interna).
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  commercial_terms text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger owners_updated_at before update on public.owners
  for each row execute function public.set_updated_at();

-- N:M: una propiedad puede tener varios propietarios (copropiedad, herencias).
create table public.property_owners (
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_id uuid not null references public.owners (id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (property_id, owner_id)
);

create unique index property_owners_one_primary
  on public.property_owners (property_id) where is_primary;
create index property_owners_owner_idx on public.property_owners (owner_id);

-- Fotos y videos. Video: archivo propio (storage) o YouTube/Vimeo.
create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  kind public.media_kind not null default 'image',
  provider public.media_provider not null default 'storage',
  storage_path text,
  external_url text,
  poster_path text,
  alt_text text check (char_length(alt_text) <= 200),
  width integer check (width > 0),
  height integer check (height > 0),
  duration_seconds integer check (duration_seconds > 0),
  sort_order smallint not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),

  constraint property_media_source check (
    (provider = 'storage' and storage_path is not null)
    or (provider <> 'storage' and external_url is not null)
  ),
  constraint property_media_cover_is_image check (not is_cover or kind = 'image')
);

create unique index property_media_one_cover on public.property_media (property_id) where is_cover;
create index property_media_order_idx on public.property_media (property_id, sort_order);

-- Características de la propiedad.
create table public.property_features (
  property_id uuid not null references public.properties (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete restrict,
  primary key (property_id, feature_id)
);

create index property_features_feature_idx on public.property_features (feature_id);

-- Usos comerciales respaldados (solo los cargados explícitamente se muestran).
create table public.property_suitable_uses (
  property_id uuid not null references public.properties (id) on delete cascade,
  business_type_id uuid not null references public.business_types (id) on delete restrict,
  primary key (property_id, business_type_id)
);

create index property_suitable_uses_business_idx
  on public.property_suitable_uses (business_type_id);

-- >>> supabase/migrations/20261006000500_crm.sql
-- =============================================================================
-- CRM: leads, historial de estados, actividades y visitas.
-- =============================================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'), -- E.164: +56912345678
  email text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  lead_type public.lead_type not null default 'tenant',

  business_type_id uuid references public.business_types (id) on delete set null,
  business_description text check (char_length(business_description) <= 200),
  budget_min_clp numeric(12, 0) check (budget_min_clp >= 0),
  budget_max_clp numeric(12, 0) check (budget_max_clp >= 0),
  move_timeframe public.move_timeframe,
  message text check (char_length(message) <= 2000),

  status public.lead_status not null default 'new',
  lost_reason text,

  -- Origen: para saber qué canal genera arriendos, no solo interacciones.
  source public.lead_source not null default 'website',
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),

  -- Consentimiento para tratar los datos (Ley 21.719).
  consent_at timestamptz,

  last_interaction_at timestamptz,
  next_action text check (char_length(next_action) <= 200),
  next_action_at timestamptz,
  assigned_to uuid references public.profiles (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leads_budget_range check (
    budget_min_clp is null or budget_max_clp is null or budget_min_clp <= budget_max_clp
  )
);

create index leads_status_idx on public.leads (status, created_at desc);
create index leads_next_action_idx on public.leads (next_action_at) where next_action_at is not null;
create index leads_phone_idx on public.leads (phone);

create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- Propiedades asociadas a un lead (consultadas, sugeridas, visitadas…).
create table public.lead_properties (
  lead_id uuid not null references public.leads (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  relation public.lead_property_relation not null default 'inquired',
  created_at timestamptz not null default now(),
  primary key (lead_id, property_id)
);

create index lead_properties_property_idx on public.lead_properties (property_id);

-- Historial de estados: lo escribe un trigger, no la aplicación.
create table public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_status public.lead_status,
  to_status public.lead_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_status_history_lead_idx on public.lead_status_history (lead_id, created_at);

create function public.log_lead_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.lead_status_history (lead_id, from_status, to_status, changed_by)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status end,
      new.status,
      (select auth.uid())
    );
  end if;
  return new;
end;
$$;

create trigger leads_status_history after insert or update of status on public.leads
  for each row execute function public.log_lead_status();

-- Timeline del lead: notas e interacciones.
create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  type public.lead_activity_type not null,
  body text check (char_length(body) <= 4000),
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_activities_lead_idx on public.lead_activities (lead_id, occurred_at desc);

-- Una interacción (todo menos una nota interna) actualiza la última interacción.
create function public.touch_lead_interaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type <> 'note' then
    update public.leads
    set last_interaction_at = greatest(coalesce(last_interaction_at, new.occurred_at), new.occurred_at)
    where id = new.lead_id;
  end if;
  return new;
end;
$$;

create trigger lead_activities_touch after insert on public.lead_activities
  for each row execute function public.touch_lead_interaction();

-- Visitas (UI en fase 2; el modelo queda listo).
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes smallint not null default 30 check (duration_minutes between 5 and 240),
  status public.visit_status not null default 'pending',
  notes text check (char_length(notes) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visits_schedule_idx on public.visits (scheduled_at);
create index visits_lead_idx on public.visits (lead_id);
create index visits_property_idx on public.visits (property_id);

create trigger visits_updated_at before update on public.visits
  for each row execute function public.set_updated_at();

revoke execute on function public.log_lead_status() from public, anon, authenticated;
revoke execute on function public.touch_lead_interaction() from public, anon, authenticated;

-- >>> supabase/migrations/20261006000600_rls.sql
-- =============================================================================
-- Row Level Security.
--
-- Regla general:
--   - Público (anon y usuarios autenticados): solo lectura de catálogos activos
--     y de propiedades publicadas con su media, características y usos.
--   - Administradores: acceso completo.
--   - Datos privados (propietarios, datos internos, CRM): solo administradores.
--   - Los leads públicos NO se insertan directo: entran por public.submit_lead().
--
-- Las políticas permisivas se combinan con OR. El público nunca evalúa
-- is_admin(); se usa `(select …)` para que Postgres lo evalúe una vez por consulta.
-- =============================================================================

alter table public.property_types enable row level security;
alter table public.communes enable row level security;
alter table public.features enable row level security;
alter table public.business_types enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_internal enable row level security;
alter table public.owners enable row level security;
alter table public.property_owners enable row level security;
alter table public.property_media enable row level security;
alter table public.property_features enable row level security;
alter table public.property_suitable_uses enable row level security;
alter table public.leads enable row level security;
alter table public.lead_properties enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.lead_activities enable row level security;
alter table public.visits enable row level security;

-- Catálogos ------------------------------------------------------------------
-- Tipos y comunas inactivos también son públicos: el sitio los muestra como
-- "Próximamente".
create policy "Catálogo público" on public.property_types
  for select to anon, authenticated using (true);
create policy "Catálogo público" on public.communes
  for select to anon, authenticated using (true);
create policy "Catálogo público" on public.features
  for select to anon, authenticated using (true);
create policy "Catálogo público activo" on public.business_types
  for select to anon, authenticated using (is_active);

create policy "Administración" on public.property_types
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.communes
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.features
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.business_types
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Perfiles -------------------------------------------------------------------
create policy "Perfil propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Administración" on public.profiles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Propiedades públicas -------------------------------------------------------
create policy "Propiedades publicadas" on public.properties
  for select to anon, authenticated using (status = 'published');
create policy "Administración" on public.properties
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Media de propiedades publicadas" on public.property_media
  for select to anon, authenticated using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'published'
    )
  );
create policy "Administración" on public.property_media
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Características de propiedades publicadas" on public.property_features
  for select to anon, authenticated using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'published'
    )
  );
create policy "Administración" on public.property_features
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Usos de propiedades publicadas" on public.property_suitable_uses
  for select to anon, authenticated using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'published'
    )
  );
create policy "Administración" on public.property_suitable_uses
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Datos privados: solo administradores ---------------------------------------
create policy "Administración" on public.property_internal
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.owners
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.property_owners
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.leads
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.lead_properties
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.lead_activities
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Administración" on public.visits
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- El historial es de solo lectura: lo escribe el trigger log_lead_status().
create policy "Lectura de administración" on public.lead_status_history
  for select to authenticated using ((select public.is_admin()));

-- >>> supabase/migrations/20261006000700_submit_lead.sql
-- =============================================================================
-- Recepción de leads desde el sitio público.
--
-- El visitante no tiene permisos sobre `leads`. Esta función valida los datos,
-- limita el abuso y escribe de forma atómica:
--   - Si el teléfono ya tiene un lead abierto, agrega la consulta a ese lead
--     (evita duplicados en el CRM).
--   - Si no, crea un lead nuevo en estado 'new' (el trigger registra el historial).
-- Devuelve el id del lead.
-- =============================================================================

create function public.submit_lead(
  p_full_name text,
  p_phone text,
  p_consent boolean,
  p_lead_type public.lead_type default 'tenant',
  p_property_id uuid default null,
  p_email text default null,
  p_business_type_id uuid default null,
  p_business_description text default null,
  p_budget_min_clp numeric default null,
  p_budget_max_clp numeric default null,
  p_move_timeframe public.move_timeframe default null,
  p_message text default null,
  p_source public.lead_source default 'website',
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p_full_name);
  v_phone text := btrim(p_phone);
  v_lead_id uuid;
  v_recent integer;
begin
  -- Validaciones (la aplicación también valida; esta es la barrera final).
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if p_lead_type is not null and p_lead_type not in ('tenant', 'owner') then
    raise exception 'invalid_lead_type' using errcode = '22023';
  end if;
  if p_property_id is not null and not exists (
    select 1 from public.properties where id = p_property_id and status = 'published'
  ) then
    raise exception 'invalid_property' using errcode = '22023';
  end if;

  -- Límite de abuso: máximo 5 envíos por teléfono cada 10 minutos.
  select count(*) into v_recent
  from public.lead_activities a
  join public.leads l on l.id = a.lead_id
  where l.phone = v_phone
    and a.type = 'web_inquiry'
    and a.created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- ¿Lead abierto con el mismo teléfono?
  select id into v_lead_id
  from public.leads
  where phone = v_phone and status not in ('won', 'lost')
  order by created_at desc
  limit 1;

  if v_lead_id is null then
    insert into public.leads (
      full_name, phone, email, lead_type, business_type_id, business_description,
      budget_min_clp, budget_max_clp, move_timeframe, message, source,
      utm_source, utm_medium, utm_campaign, consent_at
    )
    values (
      v_name, v_phone, nullif(btrim(p_email), ''), coalesce(p_lead_type, 'tenant'), p_business_type_id,
      nullif(btrim(p_business_description), ''), p_budget_min_clp, p_budget_max_clp,
      p_move_timeframe, nullif(btrim(p_message), ''), p_source,
      p_utm_source, p_utm_medium, p_utm_campaign, now()
    )
    returning id into v_lead_id;
  else
    update public.leads
    set consent_at = now()
    where id = v_lead_id;
  end if;

  if p_property_id is not null then
    insert into public.lead_properties (lead_id, property_id, relation)
    values (v_lead_id, p_property_id, 'inquired')
    on conflict (lead_id, property_id) do nothing;
  end if;

  -- Cada envío queda en el timeline (y actualiza last_interaction_at).
  insert into public.lead_activities (lead_id, type, body)
  values (v_lead_id, 'web_inquiry', nullif(btrim(p_message), ''));

  return v_lead_id;
end;
$$;

revoke execute on function public.submit_lead from public;
grant execute on function public.submit_lead to anon, authenticated;

-- >>> supabase/migrations/20261006000800_storage.sql
-- =============================================================================
-- Storage: bucket público para fotos y videos de propiedades.
-- Lectura pública (URL directa); escritura solo para administradores.
-- Las rutas usan el id de la propiedad: {property_id}/{archivo}.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  true,
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

create policy "Administración de media de propiedades" on storage.objects
  for all to authenticated
  using (bucket_id = 'property-media' and (select public.is_admin()))
  with check (bucket_id = 'property-media' and (select public.is_admin()));

-- >>> supabase/migrations/20261006000900_grants.sql
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

-- >>> supabase/migrations/20261006001000_profiles_backfill.sql
-- =============================================================================
-- Perfiles para usuarios creados antes de instalar el esquema.
-- El trigger on_auth_user_created solo cubre usuarios nuevos; esta migración
-- (idempotente) crea el perfil faltante de usuarios que ya existían.
-- =============================================================================

insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;

-- >>> supabase/migrations/20261007000100_owner_requests_and_lead_review.sql
-- =============================================================================
-- Formularios para compartir por enlace:
--   1. Solicitudes de propietarios: el propietario envía los datos (y fotos,
--      opcionales) de su propiedad; queda como borrador por revisar.
--   2. Revisión de leads: los leads que llegan por formularios quedan
--      "por revisar" hasta que el administrador decide mantenerlos o
--      descartarlos. Se agregan las preferencias de búsqueda del cliente.
-- =============================================================================

-- Propiedades ----------------------------------------------------------------

alter table public.properties
  add column origin text not null default 'admin' check (origin in ('admin', 'owner_form')),
  add column reviewed_at timestamptz;

create index properties_owner_requests_idx on public.properties (created_at desc)
  where origin = 'owner_form' and reviewed_at is null;

alter table public.owners add column consent_at timestamptz;

-- Leads ----------------------------------------------------------------------

alter table public.leads
  add column reviewed_at timestamptz,
  add column desired_property_type_id uuid references public.property_types (id) on delete set null,
  add column desired_commune_id uuid references public.communes (id) on delete set null,
  add column desired_min_area_m2 numeric(10, 2) check (desired_min_area_m2 > 0);

create index leads_pending_review_idx on public.leads (created_at desc) where reviewed_at is null;

-- Los leads que ya existen se consideran revisados.
update public.leads set reviewed_at = now() where reviewed_at is null;

-- submit_lead: agrega las preferencias de búsqueda ---------------------------
-- Misma lógica que …000700_submit_lead.sql; las preferencias nuevas son
-- opcionales y, en un lead abierto existente, actualizan las anteriores.

drop function public.submit_lead(
  text, text, boolean, public.lead_type, uuid, text, uuid, text, numeric, numeric,
  public.move_timeframe, text, public.lead_source, text, text, text
);

create function public.submit_lead(
  p_full_name text,
  p_phone text,
  p_consent boolean,
  p_lead_type public.lead_type default 'tenant',
  p_property_id uuid default null,
  p_email text default null,
  p_business_type_id uuid default null,
  p_business_description text default null,
  p_budget_min_clp numeric default null,
  p_budget_max_clp numeric default null,
  p_move_timeframe public.move_timeframe default null,
  p_message text default null,
  p_source public.lead_source default 'website',
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_desired_property_type_id uuid default null,
  p_desired_commune_id uuid default null,
  p_desired_min_area_m2 numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p_full_name);
  v_phone text := btrim(p_phone);
  v_lead_id uuid;
  v_recent integer;
begin
  -- Validaciones (la aplicación también valida; esta es la barrera final).
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if p_lead_type is not null and p_lead_type not in ('tenant', 'owner') then
    raise exception 'invalid_lead_type' using errcode = '22023';
  end if;
  if p_property_id is not null and not exists (
    select 1 from public.properties where id = p_property_id and status = 'published'
  ) then
    raise exception 'invalid_property' using errcode = '22023';
  end if;
  if p_desired_min_area_m2 is not null and p_desired_min_area_m2 not between 1 and 100000 then
    raise exception 'invalid_area' using errcode = '22023';
  end if;

  -- Límite de abuso: máximo 5 envíos por teléfono cada 10 minutos.
  select count(*) into v_recent
  from public.lead_activities a
  join public.leads l on l.id = a.lead_id
  where l.phone = v_phone
    and a.type = 'web_inquiry'
    and a.created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- ¿Lead abierto con el mismo teléfono?
  select id into v_lead_id
  from public.leads
  where phone = v_phone and status not in ('won', 'lost')
  order by created_at desc
  limit 1;

  if v_lead_id is null then
    insert into public.leads (
      full_name, phone, email, lead_type, business_type_id, business_description,
      budget_min_clp, budget_max_clp, move_timeframe, message, source,
      utm_source, utm_medium, utm_campaign, consent_at,
      desired_property_type_id, desired_commune_id, desired_min_area_m2
    )
    values (
      v_name, v_phone, nullif(btrim(p_email), ''), coalesce(p_lead_type, 'tenant'), p_business_type_id,
      nullif(btrim(p_business_description), ''), p_budget_min_clp, p_budget_max_clp,
      p_move_timeframe, nullif(btrim(p_message), ''), p_source,
      p_utm_source, p_utm_medium, p_utm_campaign, now(),
      p_desired_property_type_id, p_desired_commune_id, p_desired_min_area_m2
    )
    returning id into v_lead_id;
  else
    update public.leads
    set consent_at = now(),
        desired_property_type_id = coalesce(p_desired_property_type_id, desired_property_type_id),
        desired_commune_id = coalesce(p_desired_commune_id, desired_commune_id),
        desired_min_area_m2 = coalesce(p_desired_min_area_m2, desired_min_area_m2),
        business_type_id = coalesce(p_business_type_id, business_type_id),
        budget_min_clp = coalesce(p_budget_min_clp, budget_min_clp),
        budget_max_clp = coalesce(p_budget_max_clp, budget_max_clp),
        move_timeframe = coalesce(p_move_timeframe, move_timeframe)
    where id = v_lead_id;
  end if;

  if p_property_id is not null then
    insert into public.lead_properties (lead_id, property_id, relation)
    values (v_lead_id, p_property_id, 'inquired')
    on conflict (lead_id, property_id) do nothing;
  end if;

  -- Cada envío queda en el timeline (y actualiza last_interaction_at).
  insert into public.lead_activities (lead_id, type, body)
  values (v_lead_id, 'web_inquiry', nullif(btrim(p_message), ''));

  return v_lead_id;
end;
$$;

revoke execute on function public.submit_lead from public;
grant execute on function public.submit_lead to anon, authenticated;

-- submit_property_request: solicitud de un propietario ------------------------
-- Crea (o reutiliza por teléfono) el propietario y una propiedad en borrador
-- con origen 'owner_form', sus datos internos y características. Devuelve el
-- id de la propiedad, que es la carpeta donde el formulario sube las fotos.

create function public.submit_property_request(
  p_full_name text,
  p_phone text,
  p_consent boolean,
  p_property_type_id uuid,
  p_commune_id uuid,
  p_email text default null,
  p_operation public.property_operation default 'rent',
  p_street_address text default null,
  p_sector text default null,
  p_price_amount numeric default null,
  p_built_area_m2 numeric default null,
  p_land_area_m2 numeric default null,
  p_bathrooms smallint default null,
  p_parking_spots smallint default null,
  p_bedrooms smallint default null,
  p_available_from date default null,
  p_description text default null,
  p_message text default null,
  p_feature_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p_full_name);
  v_phone text := btrim(p_phone);
  v_email text := nullif(btrim(p_email), '');
  v_owner_id uuid;
  v_property_id uuid;
  v_type_name text;
  v_commune_name text;
  v_recent integer;
begin
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  select name into v_type_name from public.property_types where id = p_property_type_id;
  select name into v_commune_name from public.communes where id = p_commune_id;
  if v_type_name is null or v_commune_name is null then
    raise exception 'invalid_catalog' using errcode = '22023';
  end if;
  if char_length(coalesce(p_street_address, '')) > 200
    or char_length(coalesce(p_sector, '')) > 80
    or char_length(coalesce(p_description, '')) > 5000
    or char_length(coalesce(p_message, '')) > 2000
    or coalesce(array_length(p_feature_ids, 1), 0) > 50 then
    raise exception 'too_long' using errcode = '22023';
  end if;

  -- Límite de abuso: máximo 3 solicitudes por teléfono cada hora.
  select count(*) into v_recent
  from public.properties p
  join public.property_owners po on po.property_id = p.id
  join public.owners o on o.id = po.owner_id
  where o.phone = v_phone
    and p.origin = 'owner_form'
    and p.created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- Propietario: se reutiliza si ya existe con el mismo teléfono.
  select id into v_owner_id
  from public.owners
  where phone = v_phone
  order by created_at desc
  limit 1;

  if v_owner_id is null then
    insert into public.owners (full_name, phone, email, consent_at)
    values (v_name, v_phone, v_email, now())
    returning id into v_owner_id;
  else
    update public.owners
    set email = coalesce(v_email, email), consent_at = now()
    where id = v_owner_id;
  end if;

  -- Propiedad en borrador. El slug definitivo usa el código (DS-0001).
  insert into public.properties (
    slug, title, description, property_type_id, operation, status, origin,
    price_amount, built_area_m2, land_area_m2, bathrooms, parking_spots, bedrooms,
    available_from, commune_id, sector
  )
  values (
    'solicitud-' || replace(gen_random_uuid()::text, '-', ''),
    left(v_type_name || ' en ' || v_commune_name, 120),
    nullif(btrim(p_description), ''),
    p_property_type_id, coalesce(p_operation, 'rent'), 'draft', 'owner_form',
    p_price_amount, p_built_area_m2, p_land_area_m2, p_bathrooms, p_parking_spots, p_bedrooms,
    p_available_from, p_commune_id, nullif(btrim(p_sector), '')
  )
  returning id into v_property_id;

  update public.properties
  set slug = 'solicitud-' || lower(code)
  where id = v_property_id;

  insert into public.property_internal (property_id, street_address, internal_notes)
  values (
    v_property_id,
    nullif(btrim(p_street_address), ''),
    nullif(btrim(p_message), '')
  );

  insert into public.property_owners (property_id, owner_id, is_primary)
  values (v_property_id, v_owner_id, true);

  insert into public.property_features (property_id, feature_id)
  select v_property_id, f.id
  from public.features f
  where f.id = any (coalesce(p_feature_ids, '{}'))
  on conflict do nothing;

  return v_property_id;
end;
$$;

revoke execute on function public.submit_property_request from public;
grant execute on function public.submit_property_request to anon, authenticated;

-- Storage: fotos de las solicitudes ------------------------------------------
-- Bucket PRIVADO: lo que sube un visitante no es público hasta que el
-- administrador lo copia a `property-media`. El visitante solo puede subir
-- (no leer, listar ni borrar) a la carpeta de una solicitud recién creada,
-- con un máximo de 15 fotos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-submissions',
  'property-submissions',
  false,
  15728640, -- 15 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create function public.can_upload_property_submission(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    and exists (
      select 1 from public.properties p
      where p.id::text = split_part(p_name, '/', 1)
        and p.origin = 'owner_form'
        and p.reviewed_at is null
        and p.created_at > now() - interval '2 hours'
    )
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'property-submissions'
        and o.name like split_part(p_name, '/', 1) || '/%'
    ) < 15;
$$;

revoke execute on function public.can_upload_property_submission from public;
grant execute on function public.can_upload_property_submission to anon, authenticated;

create policy "Fotos de solicitudes de propietarios" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'property-submissions'
    and public.can_upload_property_submission(name)
  );

create policy "Administración de solicitudes de propietarios" on storage.objects
  for all to authenticated
  using (bucket_id = 'property-submissions' and (select public.is_admin()))
  with check (bucket_id = 'property-submissions' and (select public.is_admin()));

-- >>> supabase/seed.sql
-- =============================================================================
-- Datos iniciales de catálogos (idempotente). Sin datos personales ni propiedades.
-- =============================================================================

insert into public.property_types (slug, name, name_plural, category, is_active, sort_order) values
  ('local-comercial', 'Local comercial', 'Locales comerciales', 'commercial', true, 10),
  ('oficina', 'Oficina', 'Oficinas', 'commercial', false, 20),
  ('bodega', 'Bodega', 'Bodegas', 'commercial', false, 30),
  ('casa', 'Casa', 'Casas', 'residential', false, 40),
  ('departamento', 'Departamento', 'Departamentos', 'residential', false, 50),
  ('terreno', 'Terreno', 'Terrenos', 'land', false, 60),
  ('parcela', 'Parcela', 'Parcelas', 'land', false, 70)
on conflict (slug) do nothing;

-- Provincia de Petorca. Solo La Ligua activa en el MVP.
insert into public.communes (slug, name, region, is_active, sort_order) values
  ('la-ligua', 'La Ligua', 'Región de Valparaíso', true, 10),
  ('cabildo', 'Cabildo', 'Región de Valparaíso', false, 20),
  ('papudo', 'Papudo', 'Región de Valparaíso', false, 30),
  ('zapallar', 'Zapallar', 'Región de Valparaíso', false, 40),
  ('petorca', 'Petorca', 'Región de Valparaíso', false, 50)
on conflict (slug) do nothing;

insert into public.features (key, label, category, is_filterable, sort_order) values
  ('storefront', 'Vitrina a la calle', 'commercial', true, 10),
  ('street_access', 'Acceso directo desde la calle', 'access', true, 20),
  ('corner', 'Ubicación en esquina', 'commercial', false, 30),
  ('roller_shutter', 'Cortina metálica', 'security', false, 40),
  ('storage_room', 'Bodega interior', 'spaces', false, 50),
  ('kitchenette', 'Kitchenette', 'spaces', false, 60),
  ('three_phase_power', 'Electricidad trifásica', 'services', false, 70),
  ('alarm', 'Alarma', 'security', false, 80),
  ('universal_access', 'Acceso universal', 'access', false, 90)
on conflict (key) do nothing;

insert into public.business_types (slug, name, sort_order) values
  ('barberia', 'Barbería', 10),
  ('peluqueria-estetica', 'Peluquería y estética', 20),
  ('cafeteria', 'Cafetería', 30),
  ('restaurante', 'Restaurante', 40),
  ('minimarket', 'Minimarket', 50),
  ('tienda-ropa', 'Tienda de ropa', 60),
  ('oficina-profesional', 'Oficina profesional', 70),
  ('consulta-salud', 'Consulta de salud', 80),
  ('gimnasio', 'Gimnasio o estudio', 90),
  ('ferreteria', 'Ferretería', 100),
  ('otro', 'Otro', 999)
on conflict (slug) do nothing;
