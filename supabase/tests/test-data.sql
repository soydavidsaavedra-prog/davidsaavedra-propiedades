-- Usuarios: administrador y un usuario sin rol de administración.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'admin@test.local', '{"full_name":"Admin"}'),
  ('22222222-2222-4222-8222-222222222222', 'otro@test.local', '{}');
update public.profiles set role = 'admin' where id = '11111111-1111-4111-8111-111111111111';

insert into public.properties (id, slug, title, property_type_id, commune_id, status, price_amount, built_area_m2, bathrooms, parking_spots)
select 'e0000000-0000-4000-8000-000000000001', 'local-publicado', 'Local publicado de prueba', t.id, c.id, 'published', 550000, 70, 1, 0
from property_types t, communes c where t.slug = 'local-comercial' and c.slug = 'la-ligua';
insert into public.properties (id, slug, title, property_type_id, commune_id, status, price_amount)
select 'e0000000-0000-4000-8000-000000000004', 'local-borrador', 'Local en borrador de prueba', t.id, c.id, 'draft', null
from property_types t, communes c where t.slug = 'local-comercial' and c.slug = 'la-ligua';

insert into public.property_media (property_id, storage_path, is_cover) values
  ('e0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001/portada.jpg', true),
  ('e0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000004/borrador.jpg', true);
insert into public.property_internal (property_id, street_address, internal_notes)
  values ('e0000000-0000-4000-8000-000000000001', 'Calle Secreta 123', 'Comisión 50%');
insert into public.owners (id, full_name, phone) values ('aaaaaaaa-0000-4000-8000-000000000001', 'Propietario Prueba', '+56911111111');
insert into public.property_owners (property_id, owner_id, is_primary) values ('e0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', true);
