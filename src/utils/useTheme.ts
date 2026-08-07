export type ThemeOption = 'Claro' | 'Oscuro' | 'Automático';
const STORAGE_KEY = 'app-theme';
function setHtmlClass(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) root.classList.add('dark');else root.classList.remove('dark');
}
function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Apply a theme immediately and persist the user's choice.
 */
export function applyTheme(theme: ThemeOption) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {


    // ignore storage errors (private mode, etc.)
  }if (theme === 'Oscuro') {
    setHtmlClass(true);
  } else if (theme === 'Claro') {
    setHtmlClass(false);
  } else {
    // Automático → follow system
    setHtmlClass(systemPrefersDark());
  }
}

/**
 * Read the persisted theme (defaults to 'Automático').
 */
export function getStoredTheme(): ThemeOption {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeOption | null;
    if (v === 'Claro' || v === 'Oscuro' || v === 'Automático') return v;
  } catch {


    // ignore
  }return 'Automático';
}

/**
 * Initialize theme on app load. Should be called once at module init.
 */
export function initTheme() {
  applyTheme(getStoredTheme());
}

/**
 * Watch system color-scheme changes. When the user has selected 'Automático',
 * the html class is updated automatically. Returns an unsubscribe function.
 */
export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    if (getStoredTheme() === 'Automático') {
      setHtmlClass(e.matches);
    }
  };
  if (mq.addEventListener) {
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  } else {
    // Safari < 14
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }
}