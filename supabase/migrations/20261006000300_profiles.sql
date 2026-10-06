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
