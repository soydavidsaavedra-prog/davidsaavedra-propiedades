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
