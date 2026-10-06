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
