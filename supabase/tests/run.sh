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

psql -d postgres -q -c "drop database if exists \"$PGDATABASE\"" -c "create database \"$PGDATABASE\"" || exit 1
for f in supabase/tests/supabase-stub.sql supabase/migrations/*.sql supabase/seed.sql supabase/tests/test-data.sql; do
  if ! out=$(psql -q -v ON_ERROR_STOP=1 -f "$f" 2>&1); then echo "Error aplicando $f:"; echo "$out"; exit 1; fi
done
echo "Esquema aplicado en $PGDATABASE."; echo

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
check "no ve datos internos" "0" "$(q anon '' 'select count(*) from property_internal')"
check "no ve propietarios" "0" "$(q anon '' 'select count(*) from owners')"
check "no ve relación propiedad-propietario" "0" "$(q anon '' 'select count(*) from property_owners')"
check "no ve perfiles" "0" "$(q anon '' 'select count(*) from profiles')"
check "no puede insertar leads directo" "*row-level security*" "$(q anon '' "insert into leads (full_name, phone) values ('Hack', '+56912345678')")"
check "no puede modificar propiedades" "0" "$(q anon '' "with u as (update properties set price_amount = 1 returning 1) select count(*) from u")"
check "no puede ejecutar is_admin()" "*permission denied*" "$(q anon '' 'select public.is_admin()')"

echo "== submit_lead (anónimo) =="
L1=$(q anon '' "select public.submit_lead(p_full_name => 'Camila Rojas', p_phone => '+56987654321', p_consent => true, p_property_id => 'e0000000-0000-4000-8000-000000000001', p_budget_min_clp => 400000, p_budget_max_clp => 600000, p_source => 'instagram', p_utm_source => 'instagram')")
check "crea un lead y devuelve su id" "????????-????-????-????-????????????" "$L1"
check "anónimo no puede leer el lead creado" "0" "$(q anon '' 'select count(*) from leads')"
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
check "historial no se puede editar a mano" "0" "$(q authenticated $ADMIN "with u as (update lead_status_history set to_status = 'won' returning 1) select count(*) from u")"
check "ve datos internos" "Calle Secreta 123" "$(q authenticated $ADMIN 'select street_address from property_internal')"
check "puede editar propiedades" "1" "$(q authenticated $ADMIN "with u as (update properties set price_amount = 560000 where code = 'DS-0001' returning 1) select count(*) from u")"
check "una sola portada por propiedad" "*property_media_one_cover*" "$(q authenticated $ADMIN "insert into property_media (property_id, storage_path, is_cover) values ('e0000000-0000-4000-8000-000000000001', 'x.jpg', true)")"

echo "== Storage =="
check "anónimo no sube archivos" "*row-level security*" "$(q anon '' "insert into storage.objects (bucket_id, name) values ('property-media', 'x.jpg')")"
check "admin sube archivos" "" "$(q authenticated $ADMIN "insert into storage.objects (bucket_id, name) values ('property-media', 'e0/x.jpg')")"
echo; echo "Resultado: $PASS OK, $FAIL fallos"
[[ $FAIL -eq 0 ]]
