-- =============================================================================
-- Base: tipos enumerados y funciones utilitarias compartidas.
-- Los valores se guardan en inglés (estables para el código); las etiquetas en
-- español viven en la aplicación.
-- =============================================================================

-- Operación comercial. El MVP usa solo 'rent'; 'sale' queda preparado.
create type public.property_operation as enum ('rent', 'sale');

-- Estado de publicación (visibilidad en el sitio).
create type public.property_status as enum ('draft', 'published', 'archived');

-- Disponibilidad comercial (independiente de la publicación).
create type public.property_availability as enum (
  'available',
  'reserved',
  'rented',
  'sold',
  'unavailable'
);

create type public.price_currency as enum ('CLP', 'UF');

-- Precisión de la ubicación pública (la dirección exacta es interna).
create type public.location_precision as enum ('exact', 'approximate');

create type public.media_kind as enum ('image', 'video');
create type public.media_provider as enum ('storage', 'youtube', 'vimeo');

create type public.user_role as enum ('admin', 'agent');

-- Embudo comercial del CRM.
create type public.lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'visit_scheduled',
  'visited',
  'interested',
  'documentation',
  'negotiation',
  'won',
  'lost'
);

create type public.lead_type as enum ('tenant', 'buyer', 'owner');

create type public.lead_source as enum (
  'website',
  'whatsapp',
  'instagram',
  'tiktok',
  'facebook',
  'referral',
  'walk_in',
  'other'
);

create type public.move_timeframe as enum (
  'immediate',
  'within_30_days',
  'within_90_days',
  'exploring'
);

create type public.lead_property_relation as enum (
  'inquired',
  'suggested',
  'visited',
  'discarded'
);

create type public.lead_activity_type as enum (
  'note',
  'call',
  'whatsapp',
  'email',
  'meeting',
  'web_inquiry'
);

create type public.visit_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

-- Mantiene updated_at en cada UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
