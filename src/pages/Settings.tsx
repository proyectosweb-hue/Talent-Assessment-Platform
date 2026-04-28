import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  SettingsIcon,
  UserIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  PaletteIcon,
  PlusIcon,
  EditIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  Loader2Icon,
  DownloadIcon,
  UploadIcon,
  ImageIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { UserFormModal } from '../components/UserFormModal';
import { ConfirmUserArchiveModal } from '../components/ConfirmUserArchiveModal';

// ─── tipos locales ───────────────────────────────────────────────
interface AppSettings {
  company_name: string;
  contact_email: string;
  timezone: string;
  primary_color: string;
  theme: string;
  logo_url: string | null;
  data_retention: string;
  require_consent: boolean;
}

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
const LOGO_BUCKET = 'logos'; // nombre del bucket en Supabase Storage

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showArchivedUsers, setShowArchivedUsers] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    mode: 'archive' | 'unarchive';
    user: SystemUser | null;
  }>({ open: false, mode: 'archive', user: null });

  const { showToast } = useToast();

  // ─── estados de datos ──────────────────────────────────────────
  const [appSettings, setAppSettings] = useState<AppSettings>({
    company_name: '',
    contact_email: '',
    timezone: 'America/Mexico_City',
    primary_color: '#2563eb',
    theme: 'Claro',
    logo_url: null,
    data_retention: '1 año',
    require_consent: true
  });
  const [notifications, setNotifications] = useState<NotifSetting[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<SystemUser[]>([]);

  // ─── carga inicial ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, notifsRes, usersRes, archivedRes] = await Promise.all([
      supabase.from('app_settings').select('*').eq('id', SETTINGS_ID).single(),
      supabase.from('notification_settings').select('*').order('label'),
      supabase.from('system_users').select('*').eq('active', true).order('name'),
      supabase.from('system_users').select('*').eq('active', false).order('name')]
      );
      if (settingsRes.data) setAppSettings(settingsRes.data);
      if (notifsRes.data) setNotifications(notifsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (archivedRes.data) setArchivedUsers(archivedRes.data);
    } catch {
      showToast('Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {fetchAll();}, [fetchAll]);

  // ─── guardar cambios ───────────────────────────────────────────
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      if (activeTab === 'general' || activeTab === 'security' || activeTab === 'appearance') {
        const { error } = await supabase.
        from('app_settings').
        update({ ...appSettings, updated_at: new Date().toISOString() }).
        eq('id', SETTINGS_ID);
        if (error) throw error;
      }
      showToast('Configuración guardada correctamente', 'success');
      await fetchAll(); // ← recarga para reflejar cambios
    } catch (err: any) {
      showToast(err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── subir logo ────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (máx 2MB)
    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten imágenes', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen debe pesar menos de 2MB', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${ext}`;

      // Subir archivo al bucket
      const { error: uploadError } = await supabase.storage.
      from(LOGO_BUCKET).
      upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage.
      from(LOGO_BUCKET).
      getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Guardar URL en app_settings
      const { error: updateError } = await supabase.
      from('app_settings').
      update({ logo_url: publicUrl, updated_at: new Date().toISOString() }).
      eq('id', SETTINGS_ID);

      if (updateError) throw updateError;

      setAppSettings((s) => ({ ...s, logo_url: publicUrl }));
      showToast('Logo actualizado correctamente', 'success');
    } catch (err: any) {
      showToast('Error al subir logo: ' + (err.message || 'intenta de nuevo'), 'error');
    } finally {
      setUploadingLogo(false);
      // Limpiar input para permitir re-subir el mismo archivo
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // ─── toggle notificación ───────────────────────────────────────
  const handleToggleNotif = async (notif: NotifSetting) => {
    const newVal = !notif.enabled;
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, enabled: newVal } : n));
    const { error } = await supabase.
    from('notification_settings').
    update({ enabled: newVal }).
    eq('id', notif.id);
    if (error) {
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, enabled: notif.enabled } : n));
      showToast('Error al actualizar notificación', 'error');
    } else {
      showToast(newVal ? 'Notificación activada' : 'Notificación desactivada', 'success');
      await fetchAll(); // ← recarga para reflejar cambios
    }
  };

  // ─── agregar/editar usuario ────────────────────────────────────
  const handleAddUser = async (data: {name: string;email: string;role: string;password?: string;}) => {
    if (editingUser) {
      const updateData: any = { name: data.name, email: data.email, role: data.role };
      if (data.password) updateData.password = data.password;
      const { error } = await supabase.
      from('system_users').
      update(updateData).
      eq('id', editingUser.id);
      if (error) {
        showToast('Error al actualizar usuario: ' + error.message, 'error');
      } else {
        showToast('Usuario actualizado correctamente', 'success');
        setShowUserModal(false);
        setEditingUser(null);
        await fetchAll();
      }
    } else {
      const { error } = await supabase.
      from('system_users').
      insert([{ name: data.name, email: data.email, role: data.role, password: data.password, active: true }]).
      select().
      single();
      if (error) {
        showToast('Error al agregar usuario: ' + error.message, 'error');
      } else {
        showToast('Usuario agregado correctamente', 'success');
        setShowUserModal(false);
        await fetchAll();
      }
    }
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  // ─── archivar/restaurar usuario ────────────────────────────────
  const openConfirmModal = (user: SystemUser) => {
    setConfirmModal({ open: true, mode: user.active ? 'archive' : 'unarchive', user });
  };

  const handleConfirmArchive = async () => {
    const user = confirmModal.user;
    if (!user) return;
    const newActive = !user.active;
    const { error } = await supabase.
    from('system_users').
    update({ active: newActive }).
    eq('id', user.id);
    setConfirmModal({ open: false, mode: 'archive', user: null });
    if (error) {
      showToast(`Error al ${newActive ? 'restaurar' : 'archivar'}: ${error.message}`, 'error');
    } else {
      showToast(newActive ? 'Usuario restaurado' : 'Usuario archivado', 'success');
      await fetchAll();
    }
  };

  // ─── exportar datos ────────────────────────────────────────────
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.from('system_users').select('*');
      if (error) throw error;
      let content: string;
      let filename: string;
      let type: string;
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = 'usuarios.json';
        type = 'application/json';
      } else {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map((row) => Object.values(row).join(',')).join('\n');
        content = `${headers}\n${rows}`;
        filename = 'usuarios.csv';
        type = 'text/csv';
      }
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Datos exportados en formato ${format.toUpperCase()}`, 'success');
    } catch {
      showToast('Error al exportar', 'error');
    }
  };

  // ─── backup ────────────────────────────────────────────────────
  const handleCreateBackup = async () => {
    try {
      const [s, n, u] = await Promise.all([
      supabase.from('app_settings').select('*'),
      supabase.from('notification_settings').select('*'),
      supabase.from('system_users').select('*')]
      );
      const backup = {
        exported_at: new Date().toISOString(),
        app_settings: s.data,
        notification_settings: n.data,
        system_users: u.data
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Respaldo creado y descargado', 'success');
    } catch {
      showToast('Error al crear respaldo', 'error');
    }
  };

  const tabs = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'users', label: 'Usuarios', icon: UserIcon },
  { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
  { id: 'security', label: 'Seguridad', icon: ShieldIcon },
  { id: 'data', label: 'Datos', icon: DatabaseIcon },
  { id: 'appearance', label: 'Apariencia', icon: PaletteIcon }];


  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2Icon className="w-10 h-10 animate-spin text-blue-600 mb-2" />
      <p className="text-gray-500">Cargando configuración...</p>
    </div>);


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Administración del sistema y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`
                  }>
                  
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>);

            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6">

            {/* ── GENERAL ── */}
            {activeTab === 'general' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Configuración General</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa</label>
                    <input
                    type="text"
                    value={appSettings.company_name}
                    onChange={(e) => setAppSettings((s) => ({ ...s, company_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
                    <input
                    type="email"
                    value={appSettings.contact_email}
                    onChange={(e) => setAppSettings((s) => ({ ...s, contact_email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                    <select
                    value={appSettings.timezone}
                    onChange={(e) => setAppSettings((s) => ({ ...s, timezone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    
                      <option value="America/Mexico_City">América/México (GMT-6)</option>
                      <option value="America/Bogota">América/Bogotá (GMT-5)</option>
                      <option value="America/Argentina/Buenos_Aires">América/Argentina (GMT-3)</option>
                      <option value="America/Santo_Domingo">América/Santo Domingo (GMT-4)</option>
                    </select>
                  </div>
                </div>
              </div>
            }

            {/* ── USUARIOS ── */}
            {activeTab === 'users' &&
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h2>
                  <div className="flex items-center gap-3">
                    <button
                    onClick={() => setShowArchivedUsers(!showArchivedUsers)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${
                    showArchivedUsers ?
                    'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' :
                    'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`
                    }>
                    
                      <ArchiveIcon className="w-4 h-4" />
                      <span>{showArchivedUsers ? 'Ver activos' : `Archivados (${archivedUsers.length})`}</span>
                    </button>
                    {!showArchivedUsers &&
                  <button
                    onClick={() => {setEditingUser(null);setShowUserModal(true);}}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                    
                        <PlusIcon className="w-4 h-4" />
                        <span>Agregar Usuario</span>
                      </button>
                  }
                  </div>
                </div>
                <div className="space-y-3">
                  {(showArchivedUsers ? archivedUsers : users).length === 0 &&
                <p className="text-center text-gray-400 italic py-10">
                      {showArchivedUsers ? 'No hay usuarios archivados.' : 'No hay usuarios registrados.'}
                    </p>
                }
                  {(showArchivedUsers ? archivedUsers : users).map((user) =>
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  showArchivedUsers ? 'bg-yellow-50/50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'}`
                  }>
                  
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${showArchivedUsers ? 'bg-gray-400' : 'bg-blue-600'}`}>
                          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${showArchivedUsers ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role}
                        </span>
                        {!showArchivedUsers &&
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar">
                      
                            <EditIcon className="w-4 h-4" />
                          </button>
                    }
                        <button
                      onClick={() => openConfirmModal(user)}
                      className={`p-2 rounded-lg transition-colors ${
                      showArchivedUsers ?
                      'text-gray-400 hover:text-green-600 hover:bg-green-50' :
                      'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`
                      }
                      title={showArchivedUsers ? 'Restaurar' : 'Archivar'}>
                      
                          {showArchivedUsers ? <ArchiveRestoreIcon className="w-4 h-4" /> : <ArchiveIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                )}
                </div>
              </div>
            }

            {/* ── NOTIFICACIONES ── */}
            {activeTab === 'notifications' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Preferencias de Notificaciones</h2>
                <div className="space-y-4">
                  {notifications.map((notif) =>
                <div key={notif.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{notif.label}</p>
                        <p className="text-sm text-gray-500">{notif.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                      type="checkbox"
                      checked={notif.enabled}
                      onChange={() => handleToggleNotif(notif)}
                      className="sr-only peer" />
                    
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                )}
                </div>
              </div>
            }

            {/* ── SEGURIDAD ── */}
            {activeTab === 'security' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Seguridad y Privacidad</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Consentimiento Informado</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Todos los candidatos deben aceptar el consentimiento informado antes de iniciar la evaluación.
                    </p>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                      type="checkbox"
                      checked={appSettings.require_consent}
                      onChange={(e) => setAppSettings((s) => ({ ...s, require_consent: e.target.checked }))}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                    
                      <span className="text-sm text-blue-900">Requerir consentimiento obligatorio</span>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Retención de Datos</h3>
                    <p className="text-sm text-gray-600 mb-3">Configura el tiempo de retención de datos personales y resultados de evaluación.</p>
                    <select
                    value={appSettings.data_retention}
                    onChange={(e) => setAppSettings((s) => ({ ...s, data_retention: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    
                      <option>6 meses</option>
                      <option>1 año</option>
                      <option>2 años</option>
                      <option>Indefinido</option>
                    </select>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Autenticación de Dos Factores</h3>
                    <p className="text-sm text-gray-600 mb-3">Agregar una capa adicional de seguridad a las cuentas de usuario.</p>
                    <button
                    onClick={() => showToast('Función disponible próximamente', 'info')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    
                      Configurar 2FA
                    </button>
                  </div>
                </div>
              </div>
            }

            {/* ── DATOS ── */}
            {activeTab === 'data' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Datos</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Exportar Datos</h3>
                    <p className="text-sm text-gray-600 mb-3">Exportar todos los datos del sistema en formato CSV o JSON.</p>
                    <div className="flex space-x-3">
                      <button
                      onClick={() => handleExport('csv')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      
                        <DownloadIcon className="w-4 h-4" /> Exportar CSV
                      </button>
                      <button
                      onClick={() => handleExport('json')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      
                        <DownloadIcon className="w-4 h-4" /> Exportar JSON
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Respaldo de Datos</h3>
                    <p className="text-sm text-gray-600 mb-3">Crear un respaldo completo de la base de datos y descargarlo.</p>
                    <button
                    onClick={handleCreateBackup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    
                      Crear Respaldo
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Eliminar Datos</h3>
                    <p className="text-sm text-red-800 mb-3">Eliminar permanentemente datos antiguos o candidatos rechazados.</p>
                    <button
                    onClick={() => showToast('Función de eliminación masiva no habilitada por seguridad', 'warning')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                    
                      Gestionar Eliminación
                    </button>
                  </div>
                </div>
              </div>
            }

            {/* ── APARIENCIA ── */}
            {activeTab === 'appearance' &&
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Personalización de Apariencia</h2>
                <div className="space-y-4">

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                        {appSettings.logo_url ?
                      <img
                        src={appSettings.logo_url}
                        alt="Logo empresa"
                        className="w-full h-full object-contain" /> :


                      <ImageIcon className="w-8 h-8 text-gray-300" />
                      }
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60">
                        
                          {uploadingLogo ?
                        <Loader2Icon className="w-4 h-4 animate-spin" /> :
                        <UploadIcon className="w-4 h-4" />
                        }
                          {uploadingLogo ? 'Subiendo...' : 'Cambiar Logo'}
                        </button>
                        <p className="text-xs text-gray-400">PNG, JPG, SVG · Máx 2MB</p>
                      </div>
                      {/* Input oculto */}
                      <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden" />
                    
                    </div>
                  </div>

                  {/* Color principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Principal</label>
                    <div className="flex items-center space-x-3">
                      <input
                      type="color"
                      value={appSettings.primary_color}
                      onChange={(e) => setAppSettings((s) => ({ ...s, primary_color: e.target.value }))}
                      className="w-12 h-12 rounded border border-gray-300 cursor-pointer" />
                    
                      <span className="text-sm text-gray-600">{appSettings.primary_color}</span>
                    </div>
                  </div>

                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                    <select
                    value={appSettings.theme}
                    onChange={(e) => setAppSettings((s) => ({ ...s, theme: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    
                      <option>Claro</option>
                      <option>Oscuro</option>
                      <option>Automático</option>
                    </select>
                  </div>
                </div>
              </div>
            }

            {/* Footer botones */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {fetchAll();showToast('Cambios descartados', 'info');}}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-60">
                
                {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={showUserModal}
        onClose={() => {setShowUserModal(false);setEditingUser(null);}}
        onSave={handleAddUser}
        initialData={editingUser} />
      

      <ConfirmUserArchiveModal
        isOpen={confirmModal.open}
        mode={confirmModal.mode}
        userName={confirmModal.user?.name ?? ''}
        onConfirm={handleConfirmArchive}
        onCancel={() => setConfirmModal({ open: false, mode: 'archive', user: null })} />
      
    </div>);

}