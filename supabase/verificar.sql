-- ============================================================================
--  Verificación del esquema — diagnóstico de solo lectura
-- ----------------------------------------------------------------------------
--  No modifica nada. Pégalo en el SQL Editor de Supabase y pulsa "Run".
--
--  Para qué sirve: `schema.sql` usa `create table if not exists`, así que si
--  una tabla YA EXISTÍA la deja intacta — aunque le falte una columna que la
--  app necesita. Esa columna faltante no da error al crear el esquema, pero
--  después rompe la pantalla que la usa. Esta consulta las encuentra.
--
--  Cómo leer el resultado:
--    estado = 'ok'         → nada que hacer
--    estado = 'NO EXISTE'  → falta la tabla: ejecuta schema.sql
--    estado = 'FALTA'      → falta una columna: mira la columna `detalle`
--    detalle menciona RLS  → la app se conecta pero lee vacío
-- ============================================================================

with esperado (tabla, columna) as (
  values
    ('system_users', 'id'), ('system_users', 'name'), ('system_users', 'email'),
    ('system_users', 'role'), ('system_users', 'password'), ('system_users', 'active'),

    ('app_settings', 'id'), ('app_settings', 'company_name'),
    ('app_settings', 'contact_email'), ('app_settings', 'timezone'),
    ('app_settings', 'primary_color'), ('app_settings', 'theme'),
    ('app_settings', 'logo_url'), ('app_settings', 'data_retention'),
    ('app_settings', 'require_consent'), ('app_settings', 'updated_at'),

    ('notification_settings', 'id'), ('notification_settings', 'label'),
    ('notification_settings', 'description'), ('notification_settings', 'enabled'),

    ('positions', 'id'), ('positions', 'name'), ('positions', 'area'),
    ('positions', 'level'), ('positions', 'active_vacancies'),
    ('positions', 'min_score'), ('positions', 'archived'),

    ('candidates', 'id'), ('candidates', 'name'), ('candidates', 'email'),
    ('candidates', 'position'), ('candidates', 'status'),
    ('candidates', 'compatibility'), ('candidates', 'age'), ('candidates', 'gender'),
    ('candidates', 'education'), ('candidates', 'document'), ('candidates', 'phone'),

    ('tests', 'id'), ('tests', 'name'), ('tests', 'description'),
    ('tests', 'format'), ('tests', 'duration'), ('tests', 'archived'),

    ('questions', 'id'), ('questions', 'test_id'), ('questions', 'text'),
    ('questions', 'type'), ('questions', 'options'), ('questions', 'factor'),
    ('questions', 'weight'),

    ('results', 'id'), ('results', 'test_id'), ('results', 'user_name'),
    ('results', 'answers'), ('results', 'score'), ('results', 'created_at')
),
tablas as (select distinct tabla from esperado)

select * from (

  -- 1) ¿Existe cada tabla? ¿Puede leerla la clave anon?
  select
    1 as orden,
    'TABLA'  as tipo,
    t.tabla  as objeto,
    case when cl.oid is null then 'NO EXISTE' else 'ok' end as estado,
    case
      when cl.oid is null then
        'Falta la tabla: ejecuta schema.sql'
      when not cl.relrowsecurity then
        'RLS desactivado (la app lee, pero la tabla queda abierta)'
      when (select count(*) from pg_policies p
            where p.schemaname = 'public' and p.tablename = t.tabla) = 0 then
        'RLS ACTIVO Y SIN POLITICAS -> la app se conecta pero lee VACIO'
      else
        (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tabla)::text || ' politica(s) RLS'
    end as detalle
  from tablas t
  left join pg_class cl
    on  cl.relname     = t.tabla
    and cl.relnamespace = 'public'::regnamespace
    and cl.relkind     = 'r'

  union all

  -- 2) Columnas que la app usa y no están en una tabla que sí existe
  select
    2,
    'COLUMNA',
    e.tabla || '.' || e.columna,
    'FALTA',
    'La app la consulta. Agregala con: alter table public.' || e.tabla ||
    ' add column ' || e.columna || ' <tipo>;'
  from esperado e
  join pg_class cl
    on  cl.relname      = e.tabla
    and cl.relnamespace = 'public'::regnamespace
    and cl.relkind      = 'r'
  left join information_schema.columns c
    on  c.table_schema = 'public'
    and c.table_name   = e.tabla
    and c.column_name  = e.columna
  where c.column_name is null

  union all

  -- 3) Bucket de Storage para el logo
  select
    3,
    'BUCKET',
    'logos',
    case when exists (select 1 from storage.buckets where id = 'logos')
         then 'ok' else 'NO EXISTE' end,
    'Lo usa Configuracion -> Apariencia para subir el logo'

  union all

  -- 4) ¿Hay al menos un usuario activo para poder entrar?
  select
    4,
    'LOGIN',
    'system_users activos',
    case when exists (select 1 from public.system_users where active)
         then 'ok' else 'FALTA' end,
    case when exists (select 1 from public.system_users where active)
         then (select count(*)::text from public.system_users where active) || ' usuario(s) pueden entrar'
         else 'Sin usuarios activos: nadie puede iniciar sesion. Ejecuta seed.sql' end

) reporte
order by orden, objeto;
