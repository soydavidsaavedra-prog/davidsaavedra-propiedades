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
