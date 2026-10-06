-- =============================================================================
-- Perfiles para usuarios creados antes de instalar el esquema.
-- El trigger on_auth_user_created solo cubre usuarios nuevos; esta migración
-- (idempotente) crea el perfil faltante de usuarios que ya existían.
-- =============================================================================

insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;
