#!/usr/bin/env bash
# Pruebas de seguridad (RLS) y funciones del esquema, contra un PostgreSQL local.
#
# Crea una base desechable, simula lo mínimo de Supabase (roles anon y
# authenticated, auth.uid(), storage), aplica migraciones + seed + datos de
# prueba y verifica qué puede ver y hacer cada rol.
#
# Uso:  PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run.sh
# Requiere PostgreSQL 15+ y psql. NUNCA apuntar a la base de producción:
# borra y recrea la base indicada en TEST_DB (por defecto ds_test).
set -uo pipefail
cd "$(dirname "$0")/../.."
export PGDATABASE="${TEST_DB:-ds_test}"
export PGOPTIONS="-c client_min_messages=warning"

psql -d postgres -q -c "drop database if exists \"$PGDATABASE\"" -c "create database \"$PGDATABASE\"" || exit 1
# EXPOSE_NEW_TABLES=0 simula la opción "Automatically expose new tables"
# desactivada en Supabase (sin permisos por defecto en tablas nuevas).
STUB_EXTRA=""
if [[ "${EXPOSE_NEW_TABLES:-1}" == "0" ]]; then
  STUB_EXTRA="alter default privileges in schema public revoke all on tables from anon, authenticated, service_role; alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;"
fi
psql -q -v ON_ERROR_STOP=1 -f supabase/tests/supabase-stub.sql -c "$STUB_EXTRA select 1" >/dev/null || exit 1
for f in supabase/migrations/*.sql supabase/seed.sql supabase/tests/test-data.sql; do
  if ! out=$(psql -q -v ON_ERROR_STOP=1 -f "$f" 2>&1); then echo "Error aplicando $f:"; echo "$out"; exit 1; fi
done
echo "Esquema aplicado en $PGDATABASE (exponer tablas nuevas: ${EXPOSE_NEW_TABLES:-1})."; echo

ADMIN=11111111-1111-4111-8111-111111111111; OTRO=22222222-2222-4222-8222-222222222222
PASS=0; FAIL=0
# q ROL SUB SQL → ejecuta como ese rol/usuario y devuelve la salida (o el error).
q() {
  local role=$1 sub=$2 sql=$3
  psql -Atq -v ON_ERROR_STOP=1 2>&1 <<SQL | grep -v '^SET$' | sed 's/^psql:[^:]*:[0-9]*: //'
begin;
select set_config('request.jwt.claims', '{"role":"$role","sub":"$sub"}', true) \gset
set local role $role;
$sql;
commit;
SQL
}
check() { # nombre esperado obtenido
  if [[ "$3" == $2 ]]; then PASS=$((PASS+1)); echo "OK   $1"; else FAIL=$((FAIL+1)); echo "FAIL $1"; echo "     esperado: $2"; echo "     obtenido: $3"; fi
}

echo "== Visitante anónimo =="
check "ve solo propiedades publicadas" "DS-0001" "$(q anon '' "select string_agg(code, ',') from properties")"
check "ve catálogos (7 tipos, también los Próximamente)" "7" "$(q anon '' 'select count(*) from property_types')"
check "ve solo media de publicadas" "1" "$(q anon '' 'select count(*) from property_media')"
check "no ve datos internos" "*permission denied*" "$(q anon '' 'select count(*) from property_internal')"
check "no ve propietarios" "*permission denied*" "$(q anon '' 'select count(*) from owners')"
check "no ve relación propiedad-propietario" "*permission denied*" "$(q anon '' 'select count(*) from property_owners')"
check "no ve perfiles" "*permission denied*" "$(q anon '' 'select count(*) from profiles')"
check "no puede insertar leads directo" "*permission denied*" "$(q anon '' "insert into leads (full_name, phone) values ('Hack', '+56912345678')")"
check "no puede modificar propiedades" "*permission denied*" "$(q anon '' "with u as (update properties set price_amount = 1 returning 1) select count(*) from u")"
check "no puede ejecutar is_admin()" "*permission denied*" "$(q anon '' 'select public.is_admin()')"

echo "== submit_lead (anónimo) =="
L1=$(q anon '' "select public.submit_lead(p_full_name => 'Camila Rojas', p_phone => '+56987654321', p_consent => true, p_property_id => 'e0000000-0000-4000-8000-000000000001', p_budget_min_clp => 400000, p_budget_max_clp => 600000, p_source => 'instagram', p_utm_source => 'instagram')")
check "crea un lead y devuelve su id" "????????-????-????-????-????????????" "$L1"
check "anónimo no puede leer el lead creado" "*permission denied*" "$(q anon '' 'select count(*) from leads')"
check "exige consentimiento" "*consent_required*" "$(q anon '' "select public.submit_lead(p_full_name => 'Sin Consentimiento', p_phone => '+56911112222', p_consent => false)")"
check "rechaza teléfono inválido" "*invalid_phone*" "$(q anon '' "select public.submit_lead(p_full_name => 'Ana', p_phone => '12345', p_consent => true)")"
check "rechaza propiedad en borrador" "*invalid_property*" "$(q anon '' "select public.submit_lead(p_full_name => 'Ana', p_phone => '+56911112222', p_consent => true, p_property_id => 'e0000000-0000-4000-8000-000000000004')")"
check "rechaza tipo de cliente no público" "*invalid_lead_type*" "$(q anon '' "select public.submit_lead(p_full_name => 'Ana', p_phone => '+56911112222', p_consent => true, p_lead_type => 'buyer')")"
L2=$(q anon '' "select public.submit_lead(p_full_name => 'Camila Rojas', p_phone => '+56987654321', p_consent => true, p_message => 'Segunda consulta')")
check "mismo teléfono con lead abierto: reutiliza el lead" "$L1" "$L2"
L3=$(q anon '' "select public.submit_lead(p_full_name => 'Jorge Díaz', p_phone => '+56955554444', p_consent => true, p_lead_type => 'owner', p_message => 'Tengo un local')")
check "propietario crea lead propio" "????????-????-????-????-????????????" "$L3"
for i in 1 2 3; do q anon '' "select public.submit_lead(p_full_name => 'Camila Rojas', p_phone => '+56987654321', p_consent => true)" >/dev/null; done
check "límite de abuso (5 envíos/10 min)" "*rate_limited*" "$(q anon '' "select public.submit_lead(p_full_name => 'Camila Rojas', p_phone => '+56987654321', p_consent => true)")"

echo "== Usuario autenticado sin rol de administración =="
check "ve solo publicadas" "DS-0001" "$(q authenticated $OTRO "select string_agg(code, ',') from properties")"
check "no ve leads" "0" "$(q authenticated $OTRO 'select count(*) from leads')"
check "no ve datos internos" "0" "$(q authenticated $OTRO 'select count(*) from property_internal')"
check "ve solo su propio perfil" "$OTRO" "$(q authenticated $OTRO "select string_agg(id::text, ',') from profiles")"
check "no puede ascenderse a admin" "0" "$(q authenticated $OTRO "with u as (update profiles set role = 'admin' where id = '$OTRO' returning 1) select count(*) from u")"

echo "== Administrador =="
check "ve todas las propiedades (incluido borrador)" "DS-0001,DS-0002" "$(q authenticated $ADMIN "select string_agg(code, ',' order by code) from properties")"
check "ve leads (2: Camila y Jorge)" "2" "$(q authenticated $ADMIN 'select count(*) from leads')"
check "lead de propietario con tipo owner" "owner" "$(q authenticated $ADMIN "select lead_type from leads where phone = '+56955554444'")"
check "lead con origen y presupuesto" "instagram|400000|600000" "$(q authenticated $ADMIN "select source||'|'||budget_min_clp||'|'||budget_max_clp from leads where id = '$L1'")"
check "propiedad asociada al lead" "inquired" "$(q authenticated $ADMIN "select relation from lead_properties where lead_id = '$L1'")"
check "timeline: 5 consultas web de Camila" "5" "$(q authenticated $ADMIN "select count(*) from lead_activities where lead_id = '$L1' and type = 'web_inquiry'")"
check "última interacción registrada" "t" "$(q authenticated $ADMIN "select last_interaction_at is not null from leads where id = '$L1'")"
check "historial inicial: nuevo" "|new" "$(q authenticated $ADMIN "select coalesce(from_status::text,'')||'|'||to_status from lead_status_history where lead_id = '$L1'")"
q authenticated $ADMIN "update leads set status = 'contacted' where id = '$L1'" >/dev/null
check "cambio de estado queda en historial con autor" "new|contacted|$ADMIN" "$(q authenticated $ADMIN "select from_status||'|'||to_status||'|'||changed_by from lead_status_history where lead_id = '$L1' and from_status is not null")"
check "historial no se puede editar a mano" "*permission denied*" "$(q authenticated $ADMIN "with u as (update lead_status_history set to_status = 'won' returning 1) select count(*) from u")"
check "ve datos internos" "Calle Secreta 123" "$(q authenticated $ADMIN 'select street_address from property_internal')"
check "puede editar propiedades" "1" "$(q authenticated $ADMIN "with u as (update properties set price_amount = 560000 where code = 'DS-0001' returning 1) select count(*) from u")"
check "una sola portada por propiedad" "*property_media_one_cover*" "$(q authenticated $ADMIN "insert into property_media (property_id, storage_path, is_cover) values ('e0000000-0000-4000-8000-000000000001', 'x.jpg', true)")"

echo "== Storage =="
check "anónimo no sube archivos" "*row-level security*" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-media', 'x.jpg')")"
check "admin sube archivos" "" "$(q authenticated $ADMIN "insert into storage.objects (bucket_id, name) values ('property-media', 'e0/x.jpg')")"
echo "== Revisión de leads y preferencias de búsqueda =="
check "lead del formulario queda por revisar" "t" "$(q authenticated $ADMIN "select reviewed_at is null from leads where id = '$L3'")"
TYPE_ID=$(q authenticated $ADMIN "select id from property_types where slug = 'local-comercial'")
COMMUNE_ID=$(q authenticated $ADMIN "select id from communes where slug = 'la-ligua'")
L4=$(q anon '' "select public.submit_lead(p_full_name => 'Rosa Pinto', p_phone => '+56933332222', p_consent => true, p_desired_property_type_id => '$TYPE_ID', p_desired_commune_id => '$COMMUNE_ID', p_desired_min_area_m2 => 60)")
check "guarda tipo, comuna y superficie buscados" "true|true|60.00" "$(q authenticated $ADMIN "select (desired_property_type_id = '$TYPE_ID')::text||'|'||(desired_commune_id = '$COMMUNE_ID')::text||'|'||desired_min_area_m2 from leads where id = '$L4'")"
check "rechaza superficie fuera de rango" "*invalid_area*" "$(q anon '' "select public.submit_lead(p_full_name => 'Rosa Pinto', p_phone => '+56933332222', p_consent => true, p_desired_min_area_m2 => 0)")"
check "admin marca el lead como revisado" "1" "$(q authenticated $ADMIN "with u as (update leads set reviewed_at = now() where id = '$L4' returning 1) select count(*) from u")"

echo "== Solicitudes de propietarios (anónimo) =="
FEATURE_ID=$(q authenticated $ADMIN "select id from features order by sort_order limit 1")
P1=$(q anon '' "select public.submit_property_request(p_full_name => 'Luis Vera', p_phone => '+56944443333', p_consent => true, p_property_type_id => '$TYPE_ID', p_commune_id => '$COMMUNE_ID', p_street_address => 'Ortiz de Rozas 456', p_price_amount => 500000, p_built_area_m2 => 80, p_message => 'Disponible desde marzo', p_feature_ids => array['$FEATURE_ID']::uuid[])")
check "crea la solicitud y devuelve el id de la propiedad" "????????-????-????-????-????????????" "$P1"
check "exige consentimiento" "*consent_required*" "$(q anon '' "select public.submit_property_request(p_full_name => 'Luis Vera', p_phone => '+56944443333', p_consent => false, p_property_type_id => '$TYPE_ID', p_commune_id => '$COMMUNE_ID')")"
check "rechaza catálogo inexistente" "*invalid_catalog*" "$(q anon '' "select public.submit_property_request(p_full_name => 'Luis Vera', p_phone => '+56944443333', p_consent => true, p_property_type_id => '00000000-0000-4000-8000-000000000000', p_commune_id => '$COMMUNE_ID')")"
check "el público no ve la solicitud (borrador)" "DS-0001" "$(q anon '' "select string_agg(code, ',') from properties")"
check "queda en borrador, por revisar y con título" "draft|owner_form|true|Local comercial en La Ligua" "$(q authenticated $ADMIN "select status||'|'||origin||'|'||(reviewed_at is null)::text||'|'||title from properties where id = '$P1'")"
check "slug a partir del código" "solicitud-ds-*" "$(q authenticated $ADMIN "select slug from properties where id = '$P1'")"
check "dirección y comentarios en datos internos" "Ortiz de Rozas 456|Disponible desde marzo" "$(q authenticated $ADMIN "select street_address||'|'||internal_notes from property_internal where property_id = '$P1'")"
check "propietario principal con consentimiento" "Luis Vera|true|true" "$(q authenticated $ADMIN "select o.full_name||'|'||po.is_primary::text||'|'||(o.consent_at is not null)::text from property_owners po join owners o on o.id = po.owner_id where po.property_id = '$P1'")"
check "característica guardada" "1" "$(q authenticated $ADMIN "select count(*) from property_features where property_id = '$P1'")"
P2=$(q anon '' "select public.submit_property_request(p_full_name => 'Luis Vera', p_phone => '+56944443333', p_consent => true, p_property_type_id => '$TYPE_ID', p_commune_id => '$COMMUNE_ID')")
check "mismo teléfono reutiliza al propietario" "1" "$(q authenticated $ADMIN "select count(*) from owners where phone = '+56944443333'")"
q anon '' "select public.submit_property_request(p_full_name => 'Luis Vera', p_phone => '+56944443333', p_consent => true, p_property_type_id => '$TYPE_ID', p_commune_id => '$COMMUNE_ID')" >/dev/null
check "límite de abuso (3 solicitudes/hora)" "*rate_limited*" "$(q anon '' "select public.submit_property_request(p_full_name => 'Luis Vera', p_phone => '+56944443333', p_consent => true, p_property_type_id => '$TYPE_ID', p_commune_id => '$COMMUNE_ID')")"

echo "== Storage de solicitudes =="
F1="$P1/11111111-1111-4111-8111-111111111111.jpg"
check "anónimo sube foto a su solicitud" "" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-submissions', '$F1')")"
check "anónimo no lee las fotos" "0" "$(q anon '' "select count(*) from storage.objects where bucket_id = 'property-submissions'")"
check "no sube a una propiedad que no es solicitud" "*row-level security*" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-submissions', 'e0000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111.jpg')")"
check "no sube con nombre libre" "*row-level security*" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-submissions', '$P1/hack.svg')")"
q authenticated $ADMIN "update properties set reviewed_at = now() where id = '$P2'" >/dev/null
check "no sube a una solicitud ya revisada" "*row-level security*" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-submissions', '$P2/22222222-2222-4222-8222-222222222222.jpg')")"
check "no sube al bucket público" "*row-level security*" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-media', '$F1')")"
check "admin ve las fotos de la solicitud" "1" "$(q authenticated $ADMIN "select count(*) from storage.objects where bucket_id = 'property-submissions'")"
echo; echo "Resultado: $PASS OK, $FAIL fallos"
[[ $FAIL -eq 0 ]]
