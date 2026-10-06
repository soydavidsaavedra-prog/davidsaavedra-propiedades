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
