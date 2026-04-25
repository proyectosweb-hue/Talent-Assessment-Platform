import React, { useState } from 'react';
import {
  SettingsIcon,
  UserIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  PaletteIcon,
  PlusIcon,
  TrashIcon } from
'lucide-react';
import { useToast } from '../components/Toast';
import { UserFormModal } from '../components/UserFormModal';
export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [showUserModal, setShowUserModal] = useState(false);
  const { showToast } = useToast();
  const handleSaveChanges = () => {
    showToast('Configuración guardada correctamente', 'success');
    console.log('Guardar cambios:', activeTab);
  };
  const handleCancel = () => {
    showToast('Cambios cancelados', 'info');
    console.log('Cancelar cambios');
  };
  const handleAddUser = () => {
    setShowUserModal(true);
  };
  const handleConfigure2FA = () => {
    showToast('Configurando autenticación de dos factores', 'info');
    console.log('Configurar 2FA');
  };
  const handleExportCSV = () => {
    showToast('Exportando datos en formato CSV', 'success');
    console.log('Exportar CSV');
  };
  const handleExportJSON = () => {
    showToast('Exportando datos en formato JSON', 'success');
    console.log('Exportar JSON');
  };
  const handleCreateBackup = () => {
    showToast('Creando respaldo de la base de datos', 'success');
    console.log('Crear respaldo');
  };
  const handleManageDelete = () => {
    showToast('Abriendo panel de gestión de eliminación de datos', 'warning');
    console.log('Gestionar eliminación');
  };
  const handleChangeLogo = () => {
    showToast('Abriendo selector de archivo para cambiar logo', 'info');
    console.log('Cambiar logo');
  };
  const handleDeleteUser = (userName: string) => {
    showToast('Usuario eliminado: ' + userName, 'success');
    console.log('Eliminar usuario:', userName);
  };
  const tabs = [
  {
    id: 'general',
    label: 'General',
    icon: SettingsIcon
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: UserIcon
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    icon: BellIcon
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: ShieldIcon
  },
  {
    id: 'data',
    label: 'Datos',
    icon: DatabaseIcon
  },
  {
    id: 'appearance',
    label: 'Apariencia',
    icon: PaletteIcon
  }];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Administración del sistema y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>);

            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {activeTab === 'general' &&
            <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Configuración General
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Empresa
                      </label>
                      <input
                      type="text"
                      defaultValue="Mi Empresa S.A."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de Contacto
                      </label>
                      <input
                      type="email"
                      defaultValue="contacto@miempresa.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona Horaria
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>América/México (GMT-6)</option>
                        <option>América/Bogotá (GMT-5)</option>
                        <option>América/Argentina (GMT-3)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            }

            {activeTab === 'users' &&
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Usuarios del Sistema
                  </h2>
                  <button
                  onClick={handleAddUser}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                  
                    <PlusIcon className="w-4 h-4" />
                    <span>Agregar Usuario</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                {
                  name: 'Administrador RRHH',
                  email: 'admin@empresa.com',
                  role: 'Administrador'
                },
                {
                  name: 'Ana Martínez',
                  email: 'ana.martinez@empresa.com',
                  role: 'Evaluador'
                },
                {
                  name: 'Carlos López',
                  email: 'carlos.lopez@empresa.com',
                  role: 'Consultor'
                }].
                map((user, idx) =>
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.
                      split(' ').
                      map((n) => n[0]).
                      join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {user.role}
                        </span>
                        <button
                      onClick={() => handleDeleteUser(user.name)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                )}
                </div>
              </div>
            }

            {activeTab === 'notifications' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preferencias de Notificaciones
                </h2>
                <div className="space-y-4">
                  {[
                {
                  label: 'Evaluación completada',
                  description:
                  'Notificar cuando un candidato complete la evaluación'
                },
                {
                  label: 'Nuevos candidatos',
                  description:
                  'Notificar cuando se registre un nuevo candidato'
                },
                {
                  label: 'Alertas de riesgo',
                  description:
                  'Notificar cuando se detecten patrones de riesgo'
                },
                {
                  label: 'Reportes generados',
                  description:
                  'Notificar cuando se genere un nuevo reporte'
                }].
                map((item, idx) =>
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                      onChange={(e) => {
                        showToast(
                          e.target.checked ?
                          'Notificación activada' :
                          'Notificación desactivada',
                          'success'
                        );
                        console.log(
                          'Toggle notificación:',
                          item.label,
                          e.target.checked
                        );
                      }} />
                    
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                )}
                </div>
              </div>
            }

            {activeTab === 'security' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Seguridad y Privacidad
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Consentimiento Informado
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Todos los candidatos deben aceptar el consentimiento
                      informado antes de iniciar la evaluación.
                    </p>
                    <label className="flex items-center space-x-2">
                      <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                    
                      <span className="text-sm text-blue-900">
                        Requerir consentimiento obligatorio
                      </span>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Retención de Datos
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Configurar el tiempo de retención de datos personales y
                      resultados de evaluación.
                    </p>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>6 meses</option>
                      <option>1 año</option>
                      <option>2 años</option>
                      <option>Indefinido</option>
                    </select>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Autenticación de Dos Factores
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Agregar una capa adicional de seguridad a las cuentas de
                      usuario.
                    </p>
                    <button
                    onClick={handleConfigure2FA}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    
                      Configurar 2FA
                    </button>
                  </div>
                </div>
              </div>
            }

            {activeTab === 'data' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gestión de Datos
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Exportar Datos
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Exportar todos los datos del sistema en formato CSV o
                      JSON.
                    </p>
                    <div className="flex space-x-3">
                      <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      
                        Exportar CSV
                      </button>
                      <button
                      onClick={handleExportJSON}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      
                        Exportar JSON
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Respaldo de Datos
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Crear un respaldo completo de la base de datos.
                    </p>
                    <button
                    onClick={handleCreateBackup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    
                      Crear Respaldo
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">
                      Eliminar Datos
                    </h3>
                    <p className="text-sm text-red-800 mb-3">
                      Eliminar permanentemente datos antiguos o candidatos
                      rechazados.
                    </p>
                    <button
                    onClick={handleManageDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                    
                      Gestionar Eliminación
                    </button>
                  </div>
                </div>
              </div>
            }

            {activeTab === 'appearance' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personalización de Apariencia
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo de la Empresa
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          LOGO
                        </span>
                      </div>
                      <button
                      onClick={handleChangeLogo}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      
                        Cambiar Logo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Principal
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                      type="color"
                      defaultValue="#2563eb"
                      className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                      onChange={(e) => {
                        showToast('Color actualizado', 'success');
                        console.log('Color cambiado:', e.target.value);
                      }} />
                    
                      <span className="text-sm text-gray-600">#2563eb</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema
                    </label>
                    <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      showToast(
                        'Tema cambiado a: ' + e.target.value,
                        'success'
                      );
                      console.log('Tema cambiado:', e.target.value);
                    }}>
                    
                      <option>Claro</option>
                      <option>Oscuro</option>
                      <option>Automático</option>
                    </select>
                  </div>
                </div>
              </div>
            }

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)} />
      
    </div>);

}