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
