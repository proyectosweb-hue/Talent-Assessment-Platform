-- ============================================================================
--  Talent Assessment Platform — monitoreo de pruebas en vivo
-- ----------------------------------------------------------------------------
--  Crea la tabla `test_progress`, que guarda el avance de una prueba MIENTRAS
--  el candidato la está contestando. Hasta ahora ese avance vivía solo en el
--  localStorage del navegador del candidato, así que nadie más podía verlo.
--
--  Cómo usarlo:
--    1. Ejecuta antes `schema.sql` y `schema-v2.sql`.
--    2. SQL Editor de Supabase → New query → pega TODO esto → Run.
--
--  Es idempotente: se puede ejecutar varias veces sin romper ni borrar nada.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
--  test_progress — una fila por (prueba, candidato) en curso
--
--  `answers` guarda el mismo objeto que maneja la pantalla del examen:
--      { "<id_pregunta>": <indice_opcion_elegida>, ... }
--
--  Los tipos de `test_id` y `candidate_id` se copian de los que ya tengan
--  `tests.id` y `candidates.id` en esta base, para no asumir bigint ni uuid.
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare
  tests_id_type      text;
  candidates_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into tests_id_type
    from pg_attribute a
   where a.attrelid = 'public.tests'::regclass and a.attname = 'id';

  select format_type(a.atttypid, a.atttypmod) into candidates_id_type
    from pg_attribute a
   where a.attrelid = 'public.candidates'::regclass and a.attname = 'id';

  if tests_id_type is null or candidates_id_type is null then
    raise exception 'Faltan las tablas base. Ejecuta primero schema.sql.';
  end if;

  execute format(
    'create table if not exists public.test_progress (
       id              bigint      generated always as identity primary key,
       test_id         %s          not null references public.tests (id)      on delete cascade,
       candidate_id    %s          not null references public.candidates (id) on delete cascade,
       answers         jsonb       not null default ''{}''::jsonb,
       current_question integer    not null default 0,
       total_questions  integer    not null default 0,
       time_left        integer    not null default 0,
       -- in_progress | finished | abandoned
       status          text        not null default ''in_progress'',
       started_at      timestamptz not null default now(),
       updated_at      timestamptz not null default now(),
       constraint test_progress_unico unique (test_id, candidate_id)
     )', tests_id_type, candidates_id_type);
end $$;

create index if not exists test_progress_status_idx
  on public.test_progress (status, updated_at desc);

-- ────────────────────────────────────────────────────────────────────────────
--  Realtime: sin esto la pantalla de monitoreo no recibe los cambios y habría
--  que recargar a mano. Añade la tabla a la publicación que usa Supabase.
-- ────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'test_progress'
  ) then
    alter publication supabase_realtime add table public.test_progress;
  end if;
exception
  when undefined_object then
    raise notice 'No existe la publicación supabase_realtime; se omite.';
end $$;

-- `updated_at` se manda desde la app, pero un trigger evita que una escritura
-- que lo olvide deje la fila con fecha vieja y la haga parecer inactiva.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists test_progress_touch on public.test_progress;
create trigger test_progress_touch
  before update on public.test_progress
  for each row execute function public.tocar_updated_at();

-- ============================================================================
--  Row Level Security — mismo criterio que el resto del esquema.
--  ⚠️  Ver la advertencia del README: la app entra con la anon key, que es
--      pública, así que estas políticas dejan la tabla abierta.
-- ============================================================================
alter table public.test_progress enable row level security;
drop policy if exists "acceso_anon_app" on public.test_progress;
create policy "acceso_anon_app" on public.test_progress
  for all to anon, authenticated
  using (true) with check (true);
