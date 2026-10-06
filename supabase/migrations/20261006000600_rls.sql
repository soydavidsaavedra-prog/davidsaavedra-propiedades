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
