import React, { useEffect, useState } from 'react';
import { LayoutDashboardIcon, UsersIcon, BriefcaseIcon, ClipboardListIcon, BarChart3Icon, FileTextIcon, SettingsIcon, MenuIcon, XIcon, LogOutIcon, ChevronRightIcon, ShieldCheckIcon, RadioIcon } from 'lucide-react';
import { supabase } from '../supabase';
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
const TR = {
  navy: '#1a2d6b',
  blue: '#2D4494',
  blueLight: '#3a55b5',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  permissionsMap?: Record<string, string>;
}
function useAppSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('EVAL-PRO');
  useEffect(() => {
    supabase.from('app_settings').select('logo_url, company_name').eq('id', SETTINGS_ID).single().then(({
      data
    }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
      if (data?.company_name) setCompanyName(data.company_name);
    });
  }, []);
  return {
    logoUrl,
    companyName
  };
}
export function Layout({
  children,
  currentPage,
  onNavigate,
  onLogout,
  permissionsMap = {}
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Administrador');
  const [userRole, setUserRole] = useState('RRHH');
  const [userInitials, setUserInitials] = useState('AR');
  const {
    logoUrl,
    companyName
  } = useAppSettings();
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(String(userData.name || 'Administrador'));
        setUserRole(String(userData.role || 'RRHH'));
        const initials = String(userData.name || 'AR').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        setUserInitials(initials);
      } catch {}
    }
  }, []);
  const allMenuItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  }, {
    id: 'candidates',
    label: 'Candidatos',
    icon: UsersIcon
  }, {
    id: 'positions',
    label: 'Puestos',
    icon: BriefcaseIcon
  }, {
    id: 'tests',
    label: 'Pruebas',
    icon: ClipboardListIcon
  }, {
    id: 'monitor',
    label: 'Monitoreo en Vivo',
    icon: RadioIcon
  }, {
    id: 'results',
    label: 'Resultados',
    icon: BarChart3Icon
  }, {
    id: 'reports',
    label: 'Reportes',
    icon: FileTextIcon
  }, {
    id: 'audit',
    label: 'Auditoría',
    icon: ShieldCheckIcon
  }, {
    id: 'settings',
    label: 'Configuración',
    icon: SettingsIcon
  }];

  // Si no hay mapa de permisos (admin puro) → mostrar todo
  // Si hay mapa → ocultar módulos con level 'none'
  const noRestrictions = Object.keys(permissionsMap).length === 0;
  const menuItems = allMenuItems.filter((item) => {
    if (noRestrictions) return true;
    const level = permissionsMap[item.id];
    // Si el módulo no está en el mapa → mostrar (compatibilidad con roles sin ese permiso)
    if (level === undefined) return true;
    return level !== 'none';
  });
  const SidebarContent = ({
    mobile = false


  }: {mobile?: boolean;}) => <div className="flex flex-col h-full" style={{
    background: `linear-gradient(180deg, ${TR.navy} 0%, ${TR.blue} 100%)`
  }}>
 
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex flex-col items-center gap-3">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain rounded-xl" style={{
          filter: 'brightness(0) invert(1)'
        }} /> : <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
          background: TR.green
        }}>
              <ClipboardListIcon className="w-6 h-6 text-white" />
            </div>}
          <div className="text-center">
            <p className="text-white font-bold text-sm leading-tight">{companyName}</p>
            <p className="text-white/50 text-xs mt-0.5">Sistema de Evaluación</p>
          </div>
        </div>
      </div>
 
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Separador antes de Auditoría */}
        {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return <React.Fragment key={item.id}>
              {/* Línea separadora antes de Configuración */}
              {item.id === 'settings' && <div className="my-2 border-t border-white/10" />}
              <button onClick={() => {
            onNavigate(item.id);
            if (mobile) setSidebarOpen(false);
          }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all" style={{
            background: isActive ? TR.green : 'transparent',
            color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)'
          }} onMouseEnter={(e) => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          }} onMouseLeave={(e) => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}>
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.label}
                </span>
                {isActive && <ChevronRightIcon className="w-3.5 h-3.5 opacity-70" />}
              </button>
            </React.Fragment>;
      })}
      </nav>
 
      {/* User + logout */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
          background: TR.green,
          color: '#fff'
        }}>
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-white/40 text-xs truncate">{userRole}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all" style={{
        color: 'rgba(255,255,255,0.55)'
      }} onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
        (e.currentTarget as HTMLElement).style.color = '#fca5a5';
      }} onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
      }}>
          <LogOutIcon className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>;
  return <div className="flex h-screen bg-gray-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 flex-shrink-0 shadow-xl">
        <SidebarContent />
      </aside>
 
      {sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent mobile />
          </aside>
        </div>}
 
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <MenuIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-gray-400">Sistema</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold" style={{
            color: TR.blue
          }}>
              {menuItems.find((m) => m.id === currentPage)?.label || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{
            background: '#f0fdf4',
            color: TR.greenDark
          }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
              background: TR.green
            }} />
              Sistema activo
            </div>
            <div className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-default">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{userName}</p>
                <p className="text-[10px] text-gray-400">{userRole}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{
              background: `linear-gradient(135deg, ${TR.blue}, ${TR.green})`
            }}>
                {userInitials}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>;
}