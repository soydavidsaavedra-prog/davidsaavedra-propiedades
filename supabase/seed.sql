-- =============================================================================
-- Datos iniciales de catálogos (idempotente). Sin datos personales ni propiedades.
-- =============================================================================

insert into public.property_types (slug, name, name_plural, category, is_active, sort_order) values
  ('local-comercial', 'Local comercial', 'Locales comerciales', 'commercial', true, 10),
  ('oficina', 'Oficina', 'Oficinas', 'commercial', false, 20),
  ('bodega', 'Bodega', 'Bodegas', 'commercial', false, 30),
  ('casa', 'Casa', 'Casas', 'residential', false, 40),
  ('departamento', 'Departamento', 'Departamentos', 'residential', false, 50),
  ('terreno', 'Terreno', 'Terrenos', 'land', false, 60),
  ('parcela', 'Parcela', 'Parcelas', 'land', false, 70)
on conflict (slug) do nothing;

-- Provincia de Petorca. Solo La Ligua activa en el MVP.
insert into public.communes (slug, name, region, is_active, sort_order) values
  ('la-ligua', 'La Ligua', 'Región de Valparaíso', true, 10),
  ('cabildo', 'Cabildo', 'Región de Valparaíso', false, 20),
  ('papudo', 'Papudo', 'Región de Valparaíso', false, 30),
  ('zapallar', 'Zapallar', 'Región de Valparaíso', false, 40),
  ('petorca', 'Petorca', 'Región de Valparaíso', false, 50)
on conflict (slug) do nothing;

insert into public.features (key, label, category, is_filterable, sort_order) values
  ('storefront', 'Vitrina a la calle', 'commercial', true, 10),
  ('street_access', 'Acceso directo desde la calle', 'access', true, 20),
  ('corner', 'Ubicación en esquina', 'commercial', false, 30),
  ('roller_shutter', 'Cortina metálica', 'security', false, 40),
  ('storage_room', 'Bodega interior', 'spaces', false, 50),
  ('kitchenette', 'Kitchenette', 'spaces', false, 60),
  ('three_phase_power', 'Electricidad trifásica', 'services', false, 70),
  ('alarm', 'Alarma', 'security', false, 80),
  ('universal_access', 'Acceso universal', 'access', false, 90)
on conflict (key) do nothing;

insert into public.business_types (slug, name, sort_order) values
  ('barberia', 'Barbería', 10),
  ('peluqueria-estetica', 'Peluquería y estética', 20),
  ('cafeteria', 'Cafetería', 30),
  ('restaurante', 'Restaurante', 40),
  ('minimarket', 'Minimarket', 50),
  ('tienda-ropa', 'Tienda de ropa', 60),
  ('oficina-profesional', 'Oficina profesional', 70),
  ('consulta-salud', 'Consulta de salud', 80),
  ('gimnasio', 'Gimnasio o estudio', 90),
  ('ferreteria', 'Ferretería', 100),
  ('otro', 'Otro', 999)
on conflict (slug) do nothing;
