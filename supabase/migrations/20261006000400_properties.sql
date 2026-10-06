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
