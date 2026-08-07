import { createClient } from '@supabase/supabase-js';

/**
 * Conexión a Supabase.
 *
 * Las credenciales viven aquí como valores por defecto y se pueden sobrescribir
 * desde el archivo `.env` de la raíz del proyecto.
 *
 * ⚠️ Ojo con la clave: la URL y la anon key tienen que ser del MISMO proyecto.
 * La versión anterior de este archivo mezclaba la URL de `ztifzpwzojigbmkhnaix`
 * con una clave emitida para `dnbvsivbzbvzwqlxczzf`, y Supabase respondía
 * "Invalid API key" a todo. Si algún día cambias de proyecto, cambia las dos
 * líneas juntas: el `ref` que va dentro de la clave debe coincidir con la URL.
 *
 * Por qué se leen de dos sitios: `import.meta.env` solo existe cuando Vite
 * compila el proyecto. En entornos que sirven el código sin ese paso llega como
 * `undefined`, y leerlo directamente rompe la app entera al arrancar.
 *
 * Estas dos credenciales son públicas por diseño: viajan dentro del JavaScript
 * que se descarga en el navegador, y lo que realmente protege los datos son las
 * políticas RLS de la base. La clave `service_role` NUNCA debe ponerse aquí.
 */
const DEFAULT_SUPABASE_URL = 'https://ztifzpwzojigbmkhnaix.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aWZ6cHd6b2ppZ2Jta2huYWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzc5NzMsImV4cCI6MjA5MjYxMzk3M30.zY6gGAsOCDXz6DPF9_5KVY11GpDctjKnd-GxOLEd31s';

/**
 * Lee las variables del `.env` sin asumir que `import.meta.env` exista.
 *
 * Los nombres se escriben completos y literales a propósito: Vite sustituye
 * `import.meta.env.VITE_ALGO` por su valor buscando ese texto exacto. Con un
 * acceso dinámico (`env[nombre]`) la sustitución no ocurre y el `.env` se
 * ignora en silencio.
 */
function readEnvVars(): {url: string;key: string;} {
  try {
    return {
      url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
      key: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
    };
  } catch {
    return { url: '', key: '' };
  }
}

const fromEnv = readEnvVars();
const supabaseUrl = fromEnv.url || DEFAULT_SUPABASE_URL;
const supabaseKey = fromEnv.key || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
