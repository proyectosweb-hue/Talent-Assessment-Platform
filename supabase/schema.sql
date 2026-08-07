-- ============================================================================
--  Talent Assessment Platform — esquema completo
-- ----------------------------------------------------------------------------
--  Cómo usarlo:
--    1. Abre tu proyecto en https://supabase.com/dashboard
--    2. Menú lateral → SQL Editor → New query
--    3. Pega TODO este archivo y pulsa "Run"
--
--  Es idempotente: se puede ejecutar varias veces sin romper nada ni borrar
--  datos existentes.
-- ============================================================================

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────────────────────
--  system_users — usuarios que entran al portal (src/login.tsx)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.system_users (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null unique,
  role       text        not null default 'Reclutador',
  password   text        not null,
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
--  app_settings — configuración general (src/pages/Settings.tsx)
--  La app lee y escribe SIEMPRE la fila con el id fijo de abajo (SETTINGS_ID).
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  id              uuid        primary key default gen_random_uuid(),
  company_name    text        not null default '',
  contact_email   text        not null default '',
  timezone        text        not null default 'America/Mexico_City',
  primary_color   text        not null default '#2563eb',
  theme           text        not null default 'Claro',
  logo_url        text,
  data_retention  text        not null default '1 año',
  require_consent boolean     not null default true,
  updated_at      timestamptz not null default now()
);

insert into public.app_settings (id, company_name, contact_email)
values (
  '00000000-0000-0000-0000-000000000001',
  'Grupo Económico Torres Rodríguez',
  'contacto@grector.com'
)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────────────
--  notification_settings — switches de la pestaña "Notificaciones"
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_settings (
  id          uuid    primary key default gen_random_uuid(),
  label       text    not null,
  description text    not null default '',
  enabled     boolean not null default true
);

-- ────────────────────────────────────────────────────────────────────────────
--  positions — puestos / vacantes (src/pages/Positions.tsx)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.positions (
  id               bigint      generated always as identity primary key,
  name             text        not null,
  area             text        not null default '',
  -- operative | administrative | sales | supervisor | management | executive
  level            text        not null default 'operative',
  active_vacancies integer     not null default 0,
  min_score        integer     not null default 0,
  archived         boolean     not null default false,
  created_at       timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
--  candidates — candidatos evaluados (src/pages/Candidates.tsx)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.candidates (
  id              bigint      generated always as identity primary key,
  name            text        not null,
  document        text,
  age             integer,
  gender          text,                     -- M | F | Other
  education       text,
  phone           text,
  email           text,
  position        text,
  -- pending | in_progress | completed | rejected | hired
  status          text        not null default 'pending',
  compatibility   integer     not null default 0,
  photo           text,
  evaluation_date date,
  archived        boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
--  tests — pruebas psicométricas (src/pages/Tests.tsx)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.tests (
  id          bigint      generated always as identity primary key,
  name        text        not null,
  description text        not null default '',
  format      text        not null default 'Opción múltiple',
  duration    integer     not null default 10,   -- minutos
  archived    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
--  questions — preguntas de cada prueba (src/pages/TestApplication.tsx)
--  `options` es un arreglo JSON: [{"label":"Nunca","value":1}, ...]
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.questions (
  id      bigint  generated always as identity primary key,
  test_id bigint  not null references public.tests (id) on delete cascade,
  text    text    not null,
  type    text    not null default 'scale',
  options jsonb   not null default '[]'::jsonb,
  factor  text    not null default 'general',
  weight  numeric not null default 1
);

create index if not exists questions_test_id_idx on public.questions (test_id);

-- ────────────────────────────────────────────────────────────────────────────
--  results — resultados de pruebas aplicadas
--  Ojo: `user_name` guarda el ID del candidato en texto (así lo escribe
--  src/pages/TestApplication.tsx), por eso no es una llave foránea.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.results (
  id         bigint      generated always as identity primary key,
  test_id    bigint      references public.tests (id) on delete set null,
  user_name  text,
  answers    jsonb,
  score      numeric     not null default 0,
  hard_areas jsonb,
  soft_areas jsonb,
  alerts     jsonb,
  created_at timestamptz not null default now()
);

create index if not exists results_test_id_idx   on public.results (test_id);
create index if not exists results_user_name_idx on public.results (user_name);

-- ────────────────────────────────────────────────────────────────────────────
--  Storage: bucket público "logos" (subida de logo en Configuración)
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_lectura_publica"   on storage.objects;
drop policy if exists "logos_escritura_publica" on storage.objects;

create policy "logos_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "logos_escritura_publica"
  on storage.objects for all
  to anon, authenticated
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');

-- ============================================================================
--  Row Level Security
-- ----------------------------------------------------------------------------
--  ⚠️  IMPORTANTE — LEER ANTES DE PUBLICAR
--
--  Esta app no usa Supabase Auth: el login de src/login.tsx consulta la tabla
--  `system_users` directamente con la anon key. Para que eso funcione, las
--  políticas de abajo dejan la base abierta a cualquiera que tenga la anon key
--  (que va dentro del JavaScript del navegador, o sea: es pública).
--
--  Consecuencia concreta: cualquier visitante puede leer TODAS las tablas,
--  incluida la columna `system_users.password`.
--
--  Es aceptable para una demo o una instalación en red interna. Antes de
--  exponer esto a internet hay que migrar el login a Supabase Auth y cerrar
--  estas políticas.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'system_users', 'app_settings', 'notification_settings',
    'positions', 'candidates', 'tests', 'questions', 'results'
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
