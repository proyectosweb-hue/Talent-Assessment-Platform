# Portal de Prueba Psicométrica — Talent Assessment Platform

Aplicación de evaluación de talento (React + Vite + Tailwind) con **Supabase**
como base de datos.

---

## 1. Conectar la base de datos

El proyecto viene conectado de fábrica: `src/supabase.ts` trae las credenciales
como valores por defecto, así que la app funciona recién clonada. Para apuntarla
a **otro** proyecto de Supabase basta con rellenar el `.env` de la raíz — no hay
que tocar código.

### Dónde encontrar los datos

1. Entra a <https://supabase.com/dashboard> con la cuenta que tiene el proyecto.
2. Abre el proyecto.
3. Menú lateral → **Project Settings** → **API**.
4. Copia:

   | En el panel de Supabase | Va en el `.env` como       |
   | ----------------------- | -------------------------- |
   | **Project URL**         | `VITE_SUPABASE_URL`        |
   | **anon** / **public**   | `VITE_SUPABASE_ANON_KEY`   |

### Pegarlos en el `.env`

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Luego reinicia el servidor (`npm run dev`). Vite solo lee estas variables al
arrancar, así que **un cambio en el `.env` no surte efecto hasta reiniciar**.

> Si el `.env` está vacío o ausente, la app usa las credenciales por defecto de
> `src/supabase.ts` en vez de fallar.
>
> Esa doble vía es deliberada: `import.meta.env` solo existe cuando **Vite**
> compila el proyecto. En entornos que sirven el código sin ese paso (la vista
> previa de Magic Patterns, por ejemplo) llega como `undefined`, y leerlo
> directamente tumbaba la app entera con
> `Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')`.

> ⚠️ Solo la clave **anon** va aquí. Es pública (viaja en el JavaScript del
> navegador) y está protegida por las políticas RLS. La clave `service_role`
> **nunca** debe ponerse en este archivo.

---

## 2. Crear las tablas

Si el proyecto de Supabase está vacío, o le faltan tablas, ejecuta el SQL que
viene en la carpeta `supabase/`:

1. En el panel de Supabase → **SQL Editor** → **New query**.
2. Pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Crea las 8 tablas, los índices, el bucket `logos` y las políticas RLS.
3. *(Opcional)* Pega [`supabase/seed.sql`](supabase/seed.sql) → **Run**.
   Crea el usuario de acceso y datos de ejemplo.

Ambos archivos son **idempotentes**: se pueden ejecutar varias veces sin
duplicar ni borrar datos.

> ⚠️ `schema.sql` usa `create table if not exists`. Si una tabla **ya existía**,
> la deja intacta — aunque le falte alguna columna que la app necesita. Para
> descartar eso, ejecuta [`supabase/verificar.sql`](supabase/verificar.sql):
> es de solo lectura y reporta tablas ausentes, columnas faltantes, estado de
> RLS y si hay algún usuario que pueda iniciar sesión.

### Usuario de acceso que crea el seed

| Correo              | Contraseña |
| ------------------- | ---------- |
| `admin@grector.com` | `admin123` |

Cámbiala desde **Configuración → Usuarios** en cuanto entres.

Si no ejecutas el seed, tienes que crear al menos un usuario a mano, o el login
no dejará entrar a nadie:

```sql
insert into public.system_users (name, email, role, password, active)
values ('Administrador', 'tu@correo.com', 'Administrador', 'tu-contraseña', true);
```

---

## 3. Arrancar la app

```bash
npm install
npm run dev
```

Otros comandos:

| Comando           | Qué hace                                |
| ----------------- | --------------------------------------- |
| `npm run build`   | Compila para producción en `dist/`      |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint`    | Pasa ESLint                             |

---

## 4. Estructura de la base de datos

| Tabla                   | Para qué sirve                                              |
| ----------------------- | ----------------------------------------------------------- |
| `system_users`          | Usuarios que entran al portal (login)                       |
| `app_settings`          | Configuración general — fila única de id `0000...0001`       |
| `notification_settings` | Switches de la pestaña Notificaciones                       |
| `positions`             | Puestos y vacantes                                          |
| `candidates`            | Candidatos y su compatibilidad                               |
| `tests`                 | Pruebas psicométricas                                        |
| `questions`             | Preguntas de cada prueba (`options` es JSON)                |
| `results`               | Resultados de pruebas aplicadas                              |

Detalle de cada columna y sus valores permitidos:
[`supabase/schema.sql`](supabase/schema.sql).

Dos particularidades heredadas del diseño original, documentadas para que no
sorprendan:

- `results.user_name` guarda el **ID del candidato en texto**, no su nombre.
  Por eso no es una llave foránea.
- El bucket de Storage `logos` es público y guarda el logo que se sube desde
  Configuración → Apariencia.

---

## 5. Seguridad — leer antes de publicar en internet

Esta app **no usa Supabase Auth**. El login consulta la tabla `system_users`
directamente con la clave `anon`, y compara la contraseña en texto plano.

Para que eso funcione, las políticas RLS de `schema.sql` dejan todas las tablas
abiertas a cualquiera que tenga la clave `anon` — que es pública por diseño.

**Consecuencia concreta:** cualquier visitante del sitio puede leer todas las
tablas, incluida la columna `system_users.password`.

Es aceptable para una demo o una instalación en red interna. Antes de exponer
esto a internet hay que:

1. Migrar el login a **Supabase Auth** (`supabase.auth.signInWithPassword`).
2. Borrar la columna `password` de `system_users`.
3. Cerrar las políticas RLS para que cada rol vea solo lo que le corresponde.
