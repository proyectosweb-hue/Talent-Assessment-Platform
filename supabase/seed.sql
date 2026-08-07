-- ============================================================================
--  Talent Assessment Platform — datos iniciales
-- ----------------------------------------------------------------------------
--  Ejecutar DESPUÉS de schema.sql, en el SQL Editor de Supabase.
--  Es idempotente: si vuelves a correrlo no duplica nada.
--
--  ⚠️  Crea el usuario de acceso:
--        correo:      admin@grector.com
--        contraseña:  admin123
--      Cámbiala desde Configuración → Usuarios en cuanto entres.
-- ============================================================================

-- ── Usuario administrador ───────────────────────────────────────────────────
insert into public.system_users (name, email, role, password, active)
values ('Administrador', 'admin@grector.com', 'Administrador', 'admin123', true)
on conflict (email) do nothing;

-- ── Notificaciones ──────────────────────────────────────────────────────────
insert into public.notification_settings (label, description, enabled)
select v.label, v.description, v.enabled
from (values
  ('Evaluación completada', 'Avisar cuando un candidato termina una prueba.',            true),
  ('Nuevo candidato',       'Avisar cuando se registra un candidato nuevo.',              true),
  ('Puntaje bajo',          'Alertar si la compatibilidad queda por debajo del mínimo.',  true),
  ('Resumen semanal',       'Enviar cada lunes un resumen de la actividad.',              false)
) as v (label, description, enabled)
where not exists (
  select 1 from public.notification_settings n where n.label = v.label
);

-- ── Puestos ─────────────────────────────────────────────────────────────────
insert into public.positions (name, area, level, active_vacancies, min_score, archived)
select v.name, v.area, v.level, v.vac, v.min_score, false
from (values
  ('Auxiliar de Almacén',     'Operaciones',    'operative',      3, 60),
  ('Ejecutivo de Ventas',     'Comercial',      'sales',          5, 70),
  ('Analista Administrativo', 'Administración', 'administrative', 2, 65),
  ('Supervisor de Turno',     'Operaciones',    'supervisor',     1, 75),
  ('Gerente de Sucursal',     'Dirección',      'management',     1, 80)
) as v (name, area, level, vac, min_score)
where not exists (
  select 1 from public.positions p where p.name = v.name
);

-- ── Candidatos de ejemplo ───────────────────────────────────────────────────
insert into public.candidates
  (name, document, age, gender, education, phone, email, position, status, compatibility)
select v.name, v.document, v.age, v.gender, v.education, v.phone, v.email,
       v.position, v.status, v.compatibility
from (values
  ('María González Ruiz',  'V-18452301', 29, 'F', 'Universitaria', '+58 412-1234567',
   'maria.gonzalez@example.com', 'Ejecutivo de Ventas',     'completed',   82),
  ('Carlos Pérez Molina',  'V-16032988', 34, 'M', 'Técnico Superior', '+58 414-7654321',
   'carlos.perez@example.com',  'Supervisor de Turno',      'completed',   68),
  ('Ana Lucía Fernández',  'V-21008745', 25, 'F', 'Universitaria', '+58 424-5559876',
   'ana.fernandez@example.com', 'Analista Administrativo',  'in_progress',  0),
  ('José Ramón Silva',     'V-14778520', 41, 'M', 'Bachiller', '+58 416-3334455',
   'jose.silva@example.com',    'Auxiliar de Almacén',      'pending',      0),
  ('Daniela Moreno Castro','V-19654123', 31, 'F', 'Postgrado', '+58 412-8887766',
   'daniela.moreno@example.com','Gerente de Sucursal',      'completed',   91)
) as v (name, document, age, gender, education, phone, email, position, status, compatibility)
where not exists (
  select 1 from public.candidates c where c.document = v.document
);

-- ── Pruebas psicométricas ───────────────────────────────────────────────────
insert into public.tests (name, description, format, duration, archived)
select v.name, v.description, v.format, v.duration, false
from (values
  ('Test de Personalidad Laboral',
   'Evalúa rasgos de personalidad relevantes para el desempeño en el puesto.',
   'Escala Likert', 15),
  ('Razonamiento Lógico',
   'Mide capacidad de análisis y resolución de problemas.',
   'Opción múltiple', 20),
  ('Competencias Comerciales',
   'Orientación a resultados, negociación y trato con el cliente.',
   'Escala Likert', 12)
) as v (name, description, format, duration)
where not exists (
  select 1 from public.tests t where t.name = v.name
);

-- ── Preguntas del "Test de Personalidad Laboral" ────────────────────────────
insert into public.questions (test_id, text, type, options, factor, weight)
select t.id, v.text, 'scale', v.options::jsonb, v.factor, 1
from public.tests t
cross join (values
  ('Termino mis tareas antes de la fecha acordada.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'responsabilidad'),
  ('Mantengo la calma cuando hay presión de tiempo.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'estabilidad'),
  ('Me resulta fácil coordinarme con compañeros de otras áreas.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'trabajo_equipo'),
  ('Propongo mejoras aunque nadie me las pida.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'iniciativa'),
  ('Reviso mi trabajo para detectar errores antes de entregarlo.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'atencion_detalle')
) as v (text, options, factor)
where t.name = 'Test de Personalidad Laboral'
  and not exists (
    select 1 from public.questions q where q.test_id = t.id and q.text = v.text
  );

-- ── Preguntas de "Razonamiento Lógico" ──────────────────────────────────────
insert into public.questions (test_id, text, type, options, factor, weight)
select t.id, v.text, 'multiple', v.options::jsonb, 'razonamiento', 1
from public.tests t
cross join (values
  ('¿Qué número continúa la serie? 2, 4, 8, 16, ...',
   '[{"label":"18","value":0},{"label":"24","value":0},{"label":"32","value":5},{"label":"64","value":0}]'),
  ('Si todos los A son B, y algunos B son C, entonces:',
   '[{"label":"Todos los A son C","value":0},{"label":"Algunos A podrían ser C","value":5},{"label":"Ningún A es C","value":0},{"label":"Todos los C son A","value":0}]'),
  ('Un producto cuesta 120 y se rebaja 25%. ¿Cuál es el precio final?',
   '[{"label":"80","value":0},{"label":"90","value":5},{"label":"95","value":0},{"label":"100","value":0}]'),
  ('¿Cuál palabra no pertenece al grupo?',
   '[{"label":"Martillo","value":0},{"label":"Destornillador","value":0},{"label":"Bicicleta","value":5},{"label":"Llave inglesa","value":0}]')
) as v (text, options)
where t.name = 'Razonamiento Lógico'
  and not exists (
    select 1 from public.questions q where q.test_id = t.id and q.text = v.text
  );

-- ── Preguntas de "Competencias Comerciales" ─────────────────────────────────
insert into public.questions (test_id, text, type, options, factor, weight)
select t.id, v.text, 'scale', v.options::jsonb, v.factor, 1
from public.tests t
cross join (values
  ('Insisto con un cliente aunque me haya dicho que no la primera vez.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'persistencia'),
  ('Preparo con antelación los argumentos antes de una negociación.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'negociacion'),
  ('Escucho las objeciones del cliente antes de responder.',
   '[{"label":"Nunca","value":1},{"label":"Rara vez","value":2},{"label":"A veces","value":3},{"label":"Casi siempre","value":4},{"label":"Siempre","value":5}]',
   'escucha_activa')
) as v (text, options, factor)
where t.name = 'Competencias Comerciales'
  and not exists (
    select 1 from public.questions q where q.test_id = t.id and q.text = v.text
  );
