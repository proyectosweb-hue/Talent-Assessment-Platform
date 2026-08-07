import { createClient } from '@supabase/supabase-js';

/**
 * Conexión a Supabase.
 *
 * Las credenciales se leen del archivo `.env` que está en la RAÍZ del proyecto
 * (Vite solo expone las variables que empiezan con `VITE_`). Para conectar otro
 * proyecto de Supabase no hay que tocar este archivo: basta con cambiar el .env.
 *
 *   1. Copia `.env.example` y renómbralo a `.env`
 *   2. Pega ahí la URL y la anon key de tu proyecto
 *      (panel de Supabase → Project Settings → API)
 *   3. Reinicia el servidor de desarrollo (`npm run dev`)
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/** `true` cuando el .env tiene ambas variables cargadas. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const MISSING_CONFIG_MESSAGE =
  'Faltan las credenciales de Supabase. Crea un archivo .env en la raíz del ' +
  'proyecto con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example) ' +
  'y reinicia el servidor de desarrollo.';

if (!isSupabaseConfigured) {
  console.error(`[Supabase] ${MISSING_CONFIG_MESSAGE}`);

  // Aviso visible en pantalla: sin esto la app arranca pero todas las consultas
  // fallan con errores de red y no queda claro por qué.
  if (typeof document !== 'undefined') {
    const showBanner = () => {
      const banner = document.createElement('div');
      banner.setAttribute('role', 'alert');
      banner.style.cssText =
        'position:fixed;inset:0 0 auto 0;z-index:99999;padding:14px 20px;' +
        'background:#b91c1c;color:#fff;font:600 14px/1.5 system-ui,sans-serif;' +
        'text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.35)';
      banner.textContent = MISSING_CONFIG_MESSAGE;
      document.body.appendChild(banner);
    };
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }
}

// Valores de reserva para que `createClient` no lance y la app siga montando:
// así el usuario ve el aviso de arriba en vez de una pantalla en blanco.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'anon-key-no-configurada'
);
