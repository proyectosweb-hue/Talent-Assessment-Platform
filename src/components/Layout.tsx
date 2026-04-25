import React, { useState } from 'react';
import {
  LayoutDashboardIcon,
  UsersIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  BarChart3Icon,
  FileTextIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  LogOutIcon } from
'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}
export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    id: 'candidates',
    label: 'Candidatos',
    icon: UsersIcon
  },
  {
    id: 'positions',
    label: 'Puestos',
    icon: BriefcaseIcon
  },
  {
    id: 'tests',
    label: 'Pruebas',
    icon: ClipboardListIcon
  },
  {
    id: 'results',
    label: 'Resultados',
    icon: BarChart3Icon
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: FileTextIcon
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: SettingsIcon
  }];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 px-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <ClipboardListIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">EVAL-PRO</h1>
              <p className="text-xs text-gray-500">Sistema de Evaluación</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>);

          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <LogOutIcon className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen &&
      <div className="fixed inset-0 z-50 lg:hidden">
          <div
          className="absolute inset-0 bg-gray-900/50"
          onClick={() => setSidebarOpen(false)} />
        
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white">
            <div className="flex items-center justify-between h-16 border-b border-gray-200 px-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <ClipboardListIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">EVAL-PRO</h1>
                  <p className="text-xs text-gray-500">Sistema de Evaluación</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <nav className="px-3 py-4 space-y-1">
              {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>);

            })}
            </nav>
          </aside>
        </div>
      }

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            
            <MenuIcon className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-500">Bienvenido</p>
              <p className="text-sm font-semibold text-gray-900">
                Administrador RRHH
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
              AR
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>);

}