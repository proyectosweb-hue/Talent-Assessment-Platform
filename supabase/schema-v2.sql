-- ============================================================================
--  Talent Assessment Platform — tablas de la versión 2
-- ----------------------------------------------------------------------------
--  Añade las 5 tablas que necesitan las pantallas nuevas (Roles y permisos,
--  Grupos de pruebas, Auditoría) y que no existían en el esquema anterior:
--
--      roles                    → Configuración → Roles y permisos
--      test_groups              → Pruebas → Grupos
--      test_group_tests         → qué pruebas lleva cada grupo
--      test_group_candidates    → a qué candidatos se asignó cada grupo
--      audit_logs               → pantalla de Auditoría
--
--  Cómo usarlo:
--    1. Ejecuta ANTES `schema.sql` (crea las 8 tablas base). Si ya lo hiciste,
--       salta este paso.
--    2. Abre el SQL Editor de Supabase → New query.
--    3. Pega TODO este archivo y pulsa "Run".
--
--  Es idempotente: se puede ejecutar varias veces sin romper ni borrar nada.
--
--  Nota sobre las llaves foráneas: las columnas que apuntan a `tests` y
--  `candidates` NO asumen un tipo de dato. Se lee el tipo real de esas tablas
--  en tu base y se crean las columnas para que coincidan. Así el script
--  funciona tanto si tus ids son bigint como si son uuid.
-- ============================================================================

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────────────────────
--  roles — roles del sistema y sus permisos por módulo
--  `permissions` guarda un arreglo JSON como:
--    [{"module":"candidates","level":"full"}, {"module":"reports","level":"read"}]
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.roles (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  description text        not null default '',
  permissions jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- Roles mínimos para que la pantalla de usuarios tenga algo que ofrecer.
insert into public.roles (name, description)
select v.name, v.description
from (values
  ('Administrador', 'Acceso completo a todos los módulos.'),
  ('Reclutador',    'Gestiona candidatos, pruebas y reportes.'),
  ('Consulta',      'Solo lectura.')
) as v (name, description)
where not exists (select 1 from public.roles r where r.name = v.name);

-- ────────────────────────────────────────────────────────────────────────────
--  test_groups — baterías de pruebas que se aplican juntas
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.test_groups (
  id          bigint      generated always as identity primary key,
  name        text        not null,
  description text        not null default '',
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
--  Tablas puente. El tipo de `test_id` y `candidate_id` se copia del que ya
--  tengan `tests.id` y `candidates.id` en esta base.
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare
  tests_id_type      text;
  candidates_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into tests_id_type
    from pg_attribute a
   where a.attrelid = 'public.tests'::regclass
     and a.attname  = 'id';

  select format_type(a.atttypid, a.atttypmod)
    into candidates_id_type
    from pg_attribute a
   where a.attrelid = 'public.candidates'::regclass
     and a.attname  = 'id';

  if tests_id_type is null or candidates_id_type is null then
    raise exception 'Faltan las tablas base. Ejecuta primero schema.sql.';
  end if;

  execute format(
    'create table if not exists public.test_group_tests (
       group_id bigint not null references public.test_groups (id) on delete cascade,
       test_id  %s     not null references public.tests (id)       on delete cascade,
       primary key (group_id, test_id)
     )', tests_id_type);

  execute format(
    'create table if not exists public.test_group_candidates (
       group_id     bigint not null references public.test_groups (id) on delete cascade,
       candidate_id %s     not null references public.candidates (id)  on delete cascade,
       primary key (group_id, candidate_id)
     )', candidates_id_type);
end $$;

create index if not exists test_group_tests_group_idx
  on public.test_group_tests (group_id);
create index if not exists test_group_candidates_group_idx
  on public.test_group_candidates (group_id);

-- ────────────────────────────────────────────────────────────────────────────
--  audit_logs — bitácora de acciones (src/utils/useAudit.ts)
--  La pantalla de Auditoría ordena por created_at y trae las 500 más recientes.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          bigint      generated always as identity primary key,
  user_name   text,
  user_email  text,
  user_role   text,
  action      text        not null,
  module      text        not null,
  description text        not null default '',
  entity_id   text,
  entity_name text,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

-- ============================================================================
--  Row Level Security
-- ----------------------------------------------------------------------------
--  Mismo criterio que schema.sql: la app entra con la clave `anon` y sin
--  Supabase Auth, así que las políticas tienen que ser permisivas para que
--  las pantallas puedan leer y escribir.
--
--  ⚠️  Vale la advertencia del README: con esto la base queda abierta a
--      cualquiera que tenga la anon key, que es pública. Aceptable para uso
--      interno; antes de exponerlo a internet hay que migrar a Supabase Auth.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'roles', 'test_groups', 'test_group_tests',
    'test_group_candidates', 'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "acceso_anon_app" on public.%I', t);
    execute format(
      'create policy "acceso_anon_app" on public.%I
         for all to anon, authenticated
         using (true) with check (true)', t);
  end loop;
end $$;
