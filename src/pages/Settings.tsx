import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  SettingsIcon, UserIcon, BellIcon, ShieldIcon, DatabaseIcon,
  PaletteIcon, PlusIcon, EditIcon, ArchiveIcon, ArchiveRestoreIcon,
  Loader2Icon, DownloadIcon, UploadIcon, ImageIcon, KeyIcon,
  TrashIcon, CheckIcon, XIcon, LockIcon, SaveIcon, RefreshCwIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { UserFormModal } from '../components/UserFormModal';
import { ConfirmUserArchiveModal } from '../components/ConfirmUserArchiveModal';
import { ConfirmDeleteRoleModal } from '../components/ConfirmDeleteRoleModal';
import { Pagination } from '../components/Pagination';
import { PermissionLevel, PermissionsMap } from '../App';
import { applyTheme, ThemeOption } from '../utils/useTheme';
import { logAudit } from '../utils/useAudit';
import { useRealtime } from '../utils/useRealtime';

const TR = { blue: '#2D4494', navy: '#1a2d6b', green: '#7DB928', greenDark: '#5e8c1e' };

interface AppSettings {
  company_name: string;contact_email: string;timezone: string;
  primary_color: string;theme: string;logo_url: string | null;
  data_retention: string;require_consent: boolean;
}
interface NotifSetting {id: string;label: string;description: string;enabled: boolean;}
interface SystemUser {id: string;name: string;email: string;role: string;active: boolean;}
type RolePermLevel = 'full' | 'readonly' | 'none';
interface ModulePermission {module: string;label: string;level: RolePermLevel;}
interface Role {id: string;name: string;description: string;permissions: ModulePermission[];}

const MAIN_MODULES = [
{ module: 'dashboard', label: 'Dashboard' },
{ module: 'candidates', label: 'Candidatos' },
{ module: 'positions', label: 'Puestos' },
{ module: 'tests', label: 'Pruebas' },
{ module: 'results', label: 'Resultados' },
{ module: 'reports', label: 'Reportes' },
{ module: 'settings', label: 'Configuración' },
{ module: 'audit', label: 'Auditoría' }];

const SETTINGS_SUBMODULES = [
{ module: 'settings_general', label: 'Config. General' },
{ module: 'settings_users', label: 'Config. Usuarios' },
{ module: 'settings_roles', label: 'Config. Roles' },
{ module: 'settings_notifications', label: 'Config. Notificaciones' },
{ module: 'settings_security', label: 'Config. Seguridad' },
{ module: 'settings_data', label: 'Config. Datos' },
{ module: 'settings_appearance', label: 'Config. Apariencia' }];

const ALL_MODULES = [...MAIN_MODULES, ...SETTINGS_SUBMODULES];
const DEFAULT_PERMISSIONS = (): ModulePermission[] => ALL_MODULES.map((m) => ({ ...m, level: 'none' }));
const PERMISSION_OPTIONS: {value: RolePermLevel;label: string;color: string;bg: string;}[] = [
{ value: 'full', label: 'Editar', color: TR.greenDark, bg: `${TR.green}15` },
{ value: 'readonly', label: 'Solo lectura', color: '#92400e', bg: '#fffbeb' },
{ value: 'none', label: 'Sin acceso', color: '#991b1b', bg: '#fef2f2' }];

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
const LOGO_BUCKET = 'logos';
const USERS_PAGE_SIZE = 8;
const ALL_TABS = [
{ id: 'general', label: 'General', icon: SettingsIcon, submodule: 'settings_general' },
{ id: 'users', label: 'Usuarios', icon: UserIcon, submodule: 'settings_users' },
{ id: 'roles', label: 'Roles', icon: KeyIcon, submodule: 'settings_roles' },
{ id: 'notifications', label: 'Notificaciones', icon: BellIcon, submodule: 'settings_notifications' },
{ id: 'security', label: 'Seguridad', icon: ShieldIcon, submodule: 'settings_security' },
{ id: 'data', label: 'Datos', icon: DatabaseIcon, submodule: 'settings_data' },
{ id: 'appearance', label: 'Apariencia', icon: PaletteIcon, submodule: 'settings_appearance' }];


interface SettingsProps {permissionsMap?: PermissionsMap;}

export function Settings({ permissionsMap = {} }: SettingsProps) {
  const noRestrictions = Object.keys(permissionsMap).length === 0;
  const visibleTabs = ALL_TABS.filter((tab) => {
    if (noRestrictions) return true;
    const level = permissionsMap[tab.submodule];
    if (level === undefined) return permissionsMap['settings'] !== 'none';
    return level !== 'none';
  });
  const getTabPermission = (tabId: string): PermissionLevel => {
    if (noRestrictions) return 'full';
    const tab = ALL_TABS.find((t) => t.id === tabId);
    if (!tab) return 'none';
    const level = permissionsMap[tab.submodule];
    if (level !== undefined) return level;
    return permissionsMap['settings'] ?? 'full';
  };

  const [activeTab, setActiveTab] = useState(() => visibleTabs[0]?.id || 'general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showArchivedUsers, setShowArchivedUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRole, setNewRole] = useState<{name: string;description: string;permissions: ModulePermission[];}>({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleModal, setDeleteRoleModal] = useState<{open: boolean;role: Role | null;}>({ open: false, role: null });
  const [confirmModal, setConfirmModal] = useState<{open: boolean;mode: 'archive' | 'unarchive';user: SystemUser | null;}>({ open: false, mode: 'archive', user: null });
  const { showToast } = useToast();
  const [appSettings, setAppSettings] = useState<AppSettings>({ company_name: '', contact_email: '', timezone: 'America/Mexico_City', primary_color: '#2563eb', theme: 'Claro', logo_url: null, data_retention: '1 año', require_consent: true });
  const [notifications, setNotifications] = useState<NotifSetting[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<SystemUser[]>([]);

  useEffect(() => {setUsersPage(1);}, [showArchivedUsers]);
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find((t) => t.id === activeTab)) setActiveTab(visibleTabs[0].id);
  }, [visibleTabs.map((t) => t.id).join(',')]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, nRes, uRes, aRes] = await Promise.all([
      supabase.from('app_settings').select('*').eq('id', SETTINGS_ID).single(),
      supabase.from('notification_settings').select('*').order('label'),
      supabase.from('system_users').select('*').eq('active', true).order('name'),
      supabase.from('system_users').select('*').eq('active', false).order('name')]
      );
      if (sRes.data) {
        setAppSettings(sRes.data);
        // Aplicar tema guardado en Supabase
        if (sRes.data.theme) applyTheme(sRes.data.theme as ThemeOption);
      }
      if (nRes.data) setNotifications(nRes.data);
      if (uRes.data) setUsers(uRes.data);
      if (aRes.data) setArchivedUsers(aRes.data);
    } catch {showToast('Error al cargar configuración', 'error');} finally
    {setLoading(false);}
  }, [showToast]);

  useEffect(() => {fetchAll();}, [fetchAll]);

  // ── Tiempo real: actualiza la tabla de usuarios automáticamente ──
  useRealtime({ table: 'system_users', onChange: fetchAll });

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const { data, error } = await supabase.from('roles').select('*').order('name');
      if (error) throw error;
      setRoles((data || []).map((r: any) => ({ ...r, permissions: r.permissions ?? DEFAULT_PERMISSIONS() })));
    } catch {showToast('Error al cargar roles', 'error');} finally
    {setLoadingRoles(false);}
  }, [showToast]);

  useEffect(() => {if (activeTab === 'roles') fetchRoles();}, [activeTab, fetchRoles]);

  // ── Guardar configuración ──────────────────────────────────────
  const handleSaveChanges = async () => {
    if (getTabPermission(activeTab) === 'readonly') {showToast('Sin permisos', 'error');return;}
    setSaving(true);
    try {
      if (['general', 'security', 'appearance'].includes(activeTab)) {
        const { error } = await supabase.from('app_settings').update({ ...appSettings, updated_at: new Date().toISOString() }).eq('id', SETTINGS_ID);
        if (error) throw error;
        await logAudit({ action: 'UPDATE', module: 'settings', description: `Configuración de "${ALL_TABS.find((t) => t.id === activeTab)?.label}" actualizada` });
      }
      showToast('Configuración guardada', 'success');await fetchAll();
    } catch (err: any) {showToast(err.message || 'Error al guardar', 'error');} finally
    {setSaving(false);}
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (getTabPermission('appearance') === 'readonly') {showToast('Sin permisos', 'error');return;}
    const file = e.target.files?.[0];if (!file) return;
    if (!file.type.startsWith('image/')) {showToast('Solo imágenes', 'error');return;}
    if (file.size > 2 * 1024 * 1024) {showToast('Máximo 2MB', 'error');return;}
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('app_settings').update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() }).eq('id', SETTINGS_ID);
      if (updateError) throw updateError;
      setAppSettings((s) => ({ ...s, logo_url: urlData.publicUrl }));
      await logAudit({ action: 'UPDATE', module: 'settings', description: 'Logo de la empresa actualizado' });
      showToast('Logo actualizado', 'success');
    } catch (err: any) {showToast('Error: ' + err.message, 'error');} finally
    {setUploadingLogo(false);if (logoInputRef.current) logoInputRef.current.value = '';}
  };

  const handleToggleNotif = async (notif: NotifSetting) => {
    if (getTabPermission('notifications') === 'readonly') {showToast('Sin permisos', 'error');return;}
    const newVal = !notif.enabled;
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, enabled: newVal } : n));
    const { error } = await supabase.from('notification_settings').update({ enabled: newVal }).eq('id', notif.id);
    if (error) {setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, enabled: notif.enabled } : n));showToast('Error', 'error');} else
    {
      await logAudit({ action: 'UPDATE', module: 'settings', description: `Notificación "${notif.label}" ${newVal ? 'activada' : 'desactivada'}`, entity_name: notif.label });
      showToast(newVal ? 'Activada' : 'Desactivada', 'success');await fetchAll();
    }
  };

  // ── Usuarios ───────────────────────────────────────────────────
  const handleAddUser = async (data: {name: string;email: string;role: string;password?: string;}) => {
    if (getTabPermission('users') === 'readonly') {showToast('Sin permisos', 'error');return;}
    if (editingUser) {
      const updateData: any = { name: data.name, email: data.email, role: data.role };
      if (data.password) updateData.password = data.password;
      const { error } = await supabase.from('system_users').update(updateData).eq('id', editingUser.id);
      if (error) {showToast('Error: ' + error.message, 'error');} else
      {
        await logAudit({ action: 'UPDATE', module: 'users', description: `Usuario "${data.name}" actualizado (rol: ${data.role})`, entity_name: data.name });
        showToast('Usuario actualizado', 'success');setShowUserModal(false);setEditingUser(null);await fetchAll();
      }
    } else {
      const { error } = await supabase.from('system_users').insert([{ name: data.name, email: data.email, role: data.role, password: data.password, active: true }]).select().single();
      if (error) {showToast('Error: ' + error.message, 'error');} else
      {
        await logAudit({ action: 'CREATE', module: 'users', description: `Usuario "${data.name}" creado con rol "${data.role}"`, entity_name: data.name, metadata: { email: data.email, role: data.role } });
        showToast('Usuario agregado', 'success');setShowUserModal(false);await fetchAll();
      }
    }
  };

  const handleEditUser = (user: SystemUser) => {if (getTabPermission('users') === 'readonly') {showToast('Sin permisos', 'error');return;};setEditingUser(user);setShowUserModal(true);};
  const openConfirmModal = (user: SystemUser) => {if (getTabPermission('users') === 'readonly') {showToast('Sin permisos', 'error');return;};setConfirmModal({ open: true, mode: user.active ? 'archive' : 'unarchive', user });};

  const handleConfirmArchive = async () => {
    const user = confirmModal.user;if (!user) return;
    const newActive = !user.active;
    const { error } = await supabase.from('system_users').update({ active: newActive }).eq('id', user.id);
    setConfirmModal({ open: false, mode: 'archive', user: null });
    if (error) {showToast('Error: ' + error.message, 'error');} else
    {
      await logAudit({ action: newActive ? 'UNARCHIVE' : 'ARCHIVE', module: 'users', description: `Usuario "${user.name}" ${newActive ? 'restaurado' : 'archivado'}`, entity_name: user.name });
      showToast(newActive ? 'Restaurado' : 'Archivado', 'success');await fetchAll();
    }
  };

  // ── Roles ──────────────────────────────────────────────────────
  const handleCreateRole = async () => {
    if (getTabPermission('roles') === 'readonly') {showToast('Sin permisos', 'error');return;}
    if (!newRole.name.trim()) {showToast('Nombre requerido', 'error');return;}
    setSavingRole(true);
    try {
      const { error } = await supabase.from('roles').insert([{ name: newRole.name.trim(), description: newRole.description.trim(), permissions: newRole.permissions }]);
      if (error) throw error;
      await logAudit({ action: 'CREATE', module: 'roles', description: `Rol "${newRole.name}" creado`, entity_name: newRole.name });
      showToast('Rol creado', 'success');setShowNewRoleForm(false);setNewRole({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() });await fetchRoles();
    } catch (err: any) {showToast('Error: ' + err.message, 'error');} finally
    {setSavingRole(false);}
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    if (getTabPermission('roles') === 'readonly') {showToast('Sin permisos', 'error');return;}
    setSavingRole(true);
    try {
      const { error } = await supabase.from('roles').update({ name: editingRole.name.trim(), description: editingRole.description.trim(), permissions: editingRole.permissions }).eq('id', editingRole.id);
      if (error) throw error;
      await logAudit({ action: 'UPDATE', module: 'roles', description: `Rol "${editingRole.name}" actualizado`, entity_name: editingRole.name });
      showToast('Rol actualizado', 'success');setEditingRole(null);await fetchRoles();
    } catch (err: any) {showToast('Error: ' + err.message, 'error');} finally
    {setSavingRole(false);}
  };

  const handleDeleteRole = (role: Role) => {if (getTabPermission('roles') === 'readonly') {showToast('Sin permisos', 'error');return;};setDeleteRoleModal({ open: true, role });};
  const handleConfirmDeleteRole = async () => {
    const role = deleteRoleModal.role;if (!role) return;
    try {
      const { error } = await supabase.from('roles').delete().eq('id', role.id);
      if (error) throw error;
      await logAudit({ action: 'DELETE', module: 'roles', description: `Rol "${role.name}" eliminado`, entity_name: role.name });
      showToast('Rol eliminado', 'success');await fetchRoles();
    } catch (err: any) {showToast('Error: ' + err.message, 'error');} finally
    {setDeleteRoleModal({ open: false, role: null });}
  };

  const updateNewRolePermission = (module: string, level: RolePermLevel) => setNewRole((r) => ({ ...r, permissions: r.permissions.map((p) => p.module === module ? { ...p, level } : p) }));
  const updateEditingRolePermission = (module: string, level: RolePermLevel) => {if (!editingRole) return;setEditingRole((r) => r ? { ...r, permissions: r.permissions.map((p) => p.module === module ? { ...p, level } : p) } : r);};

  // ── Exportar / Backup ──────────────────────────────────────────
  const handleExport = async (format: 'csv' | 'json') => {
    if (getTabPermission('data') === 'readonly') {showToast('Sin permisos', 'error');return;}
    try {
      const { data, error } = await supabase.from('system_users').select('*');if (error) throw error;
      const content = format === 'json' ? JSON.stringify(data, null, 2) : `${Object.keys(data[0] || {}).join(',')}\n${data.map((row) => Object.values(row).join(',')).join('\n')}`;
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');a.href = url;a.download = format === 'json' ? 'usuarios.json' : 'usuarios.csv';a.click();URL.revokeObjectURL(url);
      await logAudit({ action: 'EXPORT', module: 'settings', description: `Datos exportados en formato ${format.toUpperCase()}`, metadata: { format, records: data.length } });
      showToast(`Exportado en ${format.toUpperCase()}`, 'success');
    } catch {showToast('Error al exportar', 'error');}
  };

  const handleCreateBackup = async () => {
    if (getTabPermission('data') === 'readonly') {showToast('Sin permisos', 'error');return;}
    try {
      const [s, n, u] = await Promise.all([supabase.from('app_settings').select('*'), supabase.from('notification_settings').select('*'), supabase.from('system_users').select('*')]);
      const backup = { exported_at: new Date().toISOString(), app_settings: s.data, notification_settings: n.data, system_users: u.data };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      const a = document.createElement('a');a.href = url;a.download = filename;a.click();URL.revokeObjectURL(url);
      await logAudit({ action: 'BACKUP', module: 'settings', description: `Respaldo del sistema creado: ${filename}` });
      showToast('Respaldo creado', 'success');
    } catch {showToast('Error', 'error');}
  };

  // ── Tabla de permisos ──────────────────────────────────────────
  const PermissionsTable = ({ permissions, onChange }: {permissions: ModulePermission[];onChange: (module: string, level: RolePermLevel) => void;}) => {
    const mainPerms = permissions.filter((p) => MAIN_MODULES.find((m) => m.module === p.module));
    const subPerms = permissions.filter((p) => SETTINGS_SUBMODULES.find((m) => m.module === p.module));
    const Row = ({ perm }: {perm: ModulePermission;}) =>
    <tr className="hover:bg-gray-50">
        <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{perm.label}</td>
        {PERMISSION_OPTIONS.map((opt) =>
      <td key={opt.value} className="px-4 py-2.5 text-center">
            <button onClick={() => onChange(perm.module, opt.value)} className="w-7 h-7 rounded-full border-2 flex items-center justify-center mx-auto transition-all"
        style={{ background: perm.level === opt.value ? opt.value === 'full' ? TR.green : opt.value === 'readonly' ? '#f59e0b' : '#ef4444' : '#fff', borderColor: perm.level === opt.value ? opt.value === 'full' ? TR.green : opt.value === 'readonly' ? '#f59e0b' : '#ef4444' : '#d1d5db' }}>
              {perm.level === opt.value && <CheckIcon className="w-3.5 h-3.5 text-white" />}
            </button>
          </td>
      )}
      </tr>;

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: `linear-gradient(135deg, ${TR.navy}08, ${TR.blue}08)` }}>
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Módulo</th>
              {PERMISSION_OPTIONS.map((opt) => <th key={opt.value} className="text-center px-4 py-3 font-semibold text-gray-600"><span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: opt.bg, color: opt.color }}>{opt.label}</span></th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr style={{ background: `${TR.blue}06` }}><td colSpan={4} className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Módulos Principales</td></tr>
            {mainPerms.map((perm) => <Row key={perm.module} perm={perm} />)}
            <tr style={{ background: `${TR.blue}06` }}><td colSpan={4} className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Submódulos de Configuración</td></tr>
            {subPerms.map((perm) => <Row key={perm.module} perm={perm} />)}
          </tbody>
        </table>
      </div>);

  };

  if (loading) return <div className="flex flex-col items-center justify-center h-64"><Loader2Icon className="w-10 h-10 animate-spin mb-2" style={{ color: TR.blue }} /><p className="text-gray-400 text-sm">Cargando...</p></div>;
  if (visibleTabs.length === 0) return <div className="p-10 text-center text-gray-400"><LockIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p className="font-medium">Sin acceso a Configuración</p></div>;

  const isReadonly = getTabPermission(activeTab) === 'readonly';
  const usersToShow = showArchivedUsers ? archivedUsers : users;
  const usersTotalPages = Math.ceil(usersToShow.length / USERS_PAGE_SIZE);
  const usersPaginated = usersToShow.slice((usersPage - 1) * USERS_PAGE_SIZE, usersPage * USERS_PAGE_SIZE);
  const inputClass = `w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${isReadonly ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white'}`;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-black tracking-tight" style={{ color: TR.navy }}>Configuración</h1><p className="text-gray-400 text-sm mt-0.5">Administración del sistema y preferencias</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${TR.navy}08, ${TR.blue}08)` }}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Secciones</p>
            </div>
            <div className="p-2">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;const perm = getTabPermission(tab.id);const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5"
                  style={{ background: isActive ? `linear-gradient(135deg, ${TR.blue}15, ${TR.navy}10)` : 'transparent', color: isActive ? TR.blue : '#6b7280', borderLeft: isActive ? `3px solid ${TR.blue}` : '3px solid transparent' }}>
                    <span className="flex items-center gap-2.5"><Icon className="w-4 h-4" />{tab.label}</span>
                    {perm === 'readonly' && <LockIcon className="w-3 h-3 text-yellow-400" />}
                  </button>);

              })}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${TR.navy}06, ${TR.blue}06)` }}>
              <div>
                <h2 className="font-bold text-gray-900">{ALL_TABS.find((t) => t.id === activeTab)?.label}</h2>
                {isReadonly && <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 mt-0.5"><LockIcon className="w-3 h-3" /> Solo lectura</span>}
              </div>
            </div>

            <div className="p-6">
              {/* GENERAL */}
              {activeTab === 'general' &&
              <div className="space-y-5">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la Empresa</label><input type="text" value={appSettings.company_name} onChange={(e) => !isReadonly && setAppSettings((s) => ({ ...s, company_name: e.target.value }))} readOnly={isReadonly} className={inputClass} placeholder="Ej: Grupo Económico Torres Rodríguez" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email de Contacto</label><input type="email" value={appSettings.contact_email} onChange={(e) => !isReadonly && setAppSettings((s) => ({ ...s, contact_email: e.target.value }))} readOnly={isReadonly} className={inputClass} placeholder="contacto@empresa.com" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Zona Horaria</label>
                    <select value={appSettings.timezone} onChange={(e) => !isReadonly && setAppSettings((s) => ({ ...s, timezone: e.target.value }))} disabled={isReadonly} className={inputClass}>
                      <option value="America/Mexico_City">América/México (GMT-6)</option>
                      <option value="America/Bogota">América/Bogotá (GMT-5)</option>
                      <option value="America/Argentina/Buenos_Aires">América/Argentina (GMT-3)</option>
                      <option value="America/Santo_Domingo">América/Santo Domingo (GMT-4)</option>
                    </select>
                  </div>
                </div>
              }

              {/* USUARIOS */}
              {activeTab === 'users' &&
              <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold text-gray-900">Usuarios del Sistema</h3><p className="text-xs text-gray-400">{usersToShow.length} {showArchivedUsers ? 'archivados' : 'activos'}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowArchivedUsers(!showArchivedUsers)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${showArchivedUsers ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        <ArchiveIcon className="w-3.5 h-3.5" />{showArchivedUsers ? 'Ver activos' : `Archivados (${archivedUsers.length})`}
                      </button>
                      {!showArchivedUsers && !isReadonly &&
                    <button onClick={() => {setEditingUser(null);setShowUserModal(true);}} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                          <PlusIcon className="w-3.5 h-3.5" /> Agregar
                        </button>
                    }
                    </div>
                  </div>
                  <div className="space-y-2">
                    {usersToShow.length === 0 && <div className="text-center py-10 text-gray-300"><UserIcon className="w-10 h-10 mx-auto mb-2" /><p className="text-gray-400 text-sm">{showArchivedUsers ? 'Sin archivados' : 'Sin usuarios'}</p></div>}
                    {usersPaginated.map((user) =>
                  <div key={user.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-colors ${showArchivedUsers ? 'bg-yellow-50/50 border border-yellow-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: showArchivedUsers ? '#94a3b8' : `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                          <div><p className="font-semibold text-sm text-gray-900">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: showArchivedUsers ? '#f1f5f9' : `${TR.blue}12`, color: showArchivedUsers ? '#94a3b8' : TR.blue }}>{user.role}</span>
                          {!isReadonly && !showArchivedUsers && <button onClick={() => handleEditUser(user)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{ color: TR.blue }}><EditIcon className="w-3.5 h-3.5" /></button>}
                          {!isReadonly && <button onClick={() => openConfirmModal(user)} className={`p-1.5 rounded-lg transition-colors ${showArchivedUsers ? 'hover:bg-green-100 text-gray-400 hover:text-green-600' : 'hover:bg-yellow-100 text-gray-400 hover:text-yellow-600'}`}>{showArchivedUsers ? <ArchiveRestoreIcon className="w-3.5 h-3.5" /> : <ArchiveIcon className="w-3.5 h-3.5" />}</button>}
                        </div>
                      </div>
                  )}
                  </div>
                  <div className="border-t border-gray-100 pt-2"><Pagination currentPage={usersPage} totalPages={usersTotalPages} totalItems={usersToShow.length} itemsPerPage={USERS_PAGE_SIZE} onPageChange={setUsersPage} /></div>
                </div>
              }

              {/* ROLES */}
              {activeTab === 'roles' &&
              <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold text-gray-900">Roles y Permisos</h3><p className="text-xs text-gray-400">Define qué puede hacer cada rol</p></div>
                    {!showNewRoleForm && !editingRole && !isReadonly && <button onClick={() => setShowNewRoleForm(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}><PlusIcon className="w-3.5 h-3.5" /> Nuevo Rol</button>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-semibold">Leyenda:</span>
                    {PERMISSION_OPTIONS.map((opt) => <span key={opt.value} className="px-2.5 py-1 rounded-lg font-bold" style={{ background: opt.bg, color: opt.color }}>{opt.label}</span>)}
                  </div>
                  {showNewRoleForm && !isReadonly &&
                <div className="rounded-2xl p-5 space-y-4" style={{ border: `2px solid ${TR.blue}30`, background: `${TR.blue}04` }}>
                      <h4 className="font-bold text-gray-900">Nuevo Rol</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label><input type="text" placeholder="Ej: Evaluador..." value={newRole.name} onChange={(e) => setNewRole((r) => ({ ...r, name: e.target.value }))} className={inputClass} /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label><input type="text" placeholder="Opcional..." value={newRole.description} onChange={(e) => setNewRole((r) => ({ ...r, description: e.target.value }))} className={inputClass} /></div>
                      </div>
                      <PermissionsTable permissions={newRole.permissions} onChange={updateNewRolePermission} />
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => {setShowNewRoleForm(false);setNewRole({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() });}} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancelar</button>
                        <button onClick={handleCreateRole} disabled={savingRole} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>{savingRole && <Loader2Icon className="w-3.5 h-3.5 animate-spin" />} Crear Rol</button>
                      </div>
                    </div>
                }
                  {editingRole && !isReadonly &&
                <div className="rounded-2xl p-5 space-y-4" style={{ border: '2px solid #f59e0b40', background: '#fffbeb60' }}>
                      <h4 className="font-bold text-gray-900">Editando: <span style={{ color: TR.blue }}>{editingRole.name}</span></h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label><input type="text" value={editingRole.name} onChange={(e) => setEditingRole((r) => r ? { ...r, name: e.target.value } : r)} className={inputClass} /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label><input type="text" value={editingRole.description} onChange={(e) => setEditingRole((r) => r ? { ...r, description: e.target.value } : r)} className={inputClass} /></div>
                      </div>
                      <PermissionsTable permissions={editingRole.permissions} onChange={updateEditingRolePermission} />
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingRole(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancelar</button>
                        <button onClick={handleUpdateRole} disabled={savingRole} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>{savingRole && <Loader2Icon className="w-3.5 h-3.5 animate-spin" />} Guardar</button>
                      </div>
                    </div>
                }
                  {loadingRoles ? <div className="flex justify-center py-10"><Loader2Icon className="w-7 h-7 animate-spin" style={{ color: TR.blue }} /></div> :
                roles.length === 0 && !showNewRoleForm ? <div className="text-center py-12 text-gray-300"><KeyIcon className="w-10 h-10 mx-auto mb-2" /><p className="text-gray-400 text-sm">Sin roles</p></div> :

                <div className="space-y-3">
                        {roles.map((role) =>
                  <div key={role.id} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${TR.navy}06, ${TR.blue}06)` }}>
                              <div><p className="font-bold text-sm text-gray-900">{role.name}</p>{role.description && <p className="text-xs text-gray-400">{role.description}</p>}</div>
                              {!isReadonly &&
                      <div className="flex gap-2">
                                  <button onClick={() => {setEditingRole(role);setShowNewRoleForm(false);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: `${TR.blue}10`, color: TR.blue }}><EditIcon className="w-3 h-3" /> Editar</button>
                                  <button onClick={() => handleDeleteRole(role)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"><TrashIcon className="w-3 h-3" /> Eliminar</button>
                                </div>
                      }
                            </div>
                            <div className="px-5 py-3 flex flex-wrap gap-1.5">
                              {role.permissions.map((perm) => {const opt = PERMISSION_OPTIONS.find((o) => o.value === perm.level)!;return <span key={perm.module} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium" style={{ background: opt.bg, color: opt.color }}>{perm.level === 'full' && <CheckIcon className="w-2.5 h-2.5" />}{perm.level === 'none' && <XIcon className="w-2.5 h-2.5" />}{perm.label}</span>;})}
                            </div>
                          </div>
                  )}
                      </div>
                }
                </div>
              }

              {/* NOTIFICACIONES */}
              {activeTab === 'notifications' &&
              <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-4">Preferencias de Notificaciones</h3>
                  {notifications.map((notif) =>
                <div key={notif.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div><p className="font-semibold text-sm text-gray-900">{notif.label}</p><p className="text-xs text-gray-400 mt-0.5">{notif.description}</p></div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notif.enabled} onChange={() => handleToggleNotif(notif)} disabled={isReadonly} className="sr-only peer" />
                        <div className={`w-11 h-6 rounded-full peer transition-all peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${isReadonly ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ background: notif.enabled ? TR.green : '#d1d5db' }} />
                      </label>
                    </div>
                )}
                </div>
              }

              {/* SEGURIDAD */}
              {activeTab === 'security' &&
              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Seguridad y Privacidad</h3>
                  <div className="p-4 rounded-xl border" style={{ background: `${TR.blue}06`, borderColor: `${TR.blue}20` }}>
                    <h4 className="font-semibold text-sm mb-1" style={{ color: TR.navy }}>Consentimiento Informado</h4>
                    <p className="text-xs text-gray-500 mb-3">Los candidatos deben aceptar el consentimiento antes de iniciar.</p>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={appSettings.require_consent} onChange={(e) => !isReadonly && setAppSettings((s) => ({ ...s, require_consent: e.target.checked }))} disabled={isReadonly} className="w-4 h-4 rounded" style={{ accentColor: TR.blue }} /><span className="text-sm font-medium text-gray-700">Requerir consentimiento obligatorio</span></label>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Retención de Datos</h4>
                    <p className="text-xs text-gray-400 mb-3">Tiempo de retención de datos personales.</p>
                    <select value={appSettings.data_retention} onChange={(e) => !isReadonly && setAppSettings((s) => ({ ...s, data_retention: e.target.value }))} disabled={isReadonly} className={inputClass}>
                      <option>6 meses</option><option>1 año</option><option>2 años</option><option>Indefinido</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">2FA</h4>
                    <p className="text-xs text-gray-400 mb-3">Capa adicional de seguridad.</p>
                    <button onClick={() => showToast('Próximamente', 'info')} disabled={isReadonly} className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>Configurar 2FA</button>
                  </div>
                </div>
              }

              {/* DATOS */}
              {activeTab === 'data' &&
              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Gestión de Datos</h3>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Exportar Datos</h4>
                    <p className="text-xs text-gray-400 mb-3">Exportar todos los datos del sistema.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleExport('csv')} disabled={isReadonly} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"><DownloadIcon className="w-4 h-4" /> CSV</button>
                      <button onClick={() => handleExport('json')} disabled={isReadonly} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"><DownloadIcon className="w-4 h-4" /> JSON</button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Respaldo</h4>
                    <p className="text-xs text-gray-400 mb-3">Crear un respaldo completo.</p>
                    <button onClick={handleCreateBackup} disabled={isReadonly} className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>Crear Respaldo</button>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <h4 className="font-semibold text-sm text-red-900 mb-1">Eliminar Datos</h4>
                    <p className="text-xs text-red-600 mb-3">Eliminar permanentemente datos antiguos.</p>
                    <button onClick={() => showToast('No habilitado por seguridad', 'warning')} disabled={isReadonly} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60">Gestionar</button>
                  </div>
                </div>
              }

              {/* APARIENCIA */}
              {activeTab === 'appearance' &&
              <div className="space-y-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Personalización</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Logo de la Empresa</label>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-white shadow-sm">
                        {appSettings.logo_url ? <img src={appSettings.logo_url} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                      </div>
                      <div className="flex flex-col gap-2">
                        {!isReadonly && <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>{uploadingLogo ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}{uploadingLogo ? 'Subiendo...' : 'Cambiar Logo'}</button>}
                        <p className="text-xs text-gray-400">PNG, JPG, SVG · Máx 2MB</p>
                      </div>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color Principal</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 w-fit">
                      <input type="color" value={appSettings.primary_color} onChange={(e) => !isReadonly && setAppSettings((s) => ({ ...s, primary_color: e.target.value }))} disabled={isReadonly} className={`w-12 h-12 rounded-xl border-0 cursor-pointer ${isReadonly ? 'opacity-60' : ''}`} />
                      <div><p className="text-sm font-bold text-gray-800">{appSettings.primary_color}</p><p className="text-xs text-gray-400">Color del sistema</p></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tema</label>
                    <div className="flex gap-3">
                      {['Claro', 'Oscuro', 'Automático'].map((theme) =>
                    <button key={theme} onClick={() => {
                      if (isReadonly) return;
                      setAppSettings((s) => ({ ...s, theme }));
                      applyTheme(theme as ThemeOption);
                    }} disabled={isReadonly}
                    className="flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all"
                    style={{ borderColor: appSettings.theme === theme ? TR.blue : '#e5e7eb', background: appSettings.theme === theme ? `${TR.blue}10` : '#f9fafb', color: appSettings.theme === theme ? TR.blue : '#6b7280' }}>
                          {theme}
                        </button>
                    )}
                    </div>
                  </div>
                </div>
              }

              {activeTab !== 'roles' && !isReadonly &&
              <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => {fetchAll();showToast('Cambios descartados', 'info');}} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50"><RefreshCwIcon className="w-4 h-4" /> Cancelar</button>
                  <button onClick={handleSaveChanges} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`, boxShadow: `0 4px 12px ${TR.green}40` }}>
                    {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />} Guardar Cambios
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <UserFormModal isOpen={showUserModal} onClose={() => {setShowUserModal(false);setEditingUser(null);}} onSave={handleAddUser} initialData={editingUser} />
      <ConfirmUserArchiveModal isOpen={confirmModal.open} mode={confirmModal.mode} userName={confirmModal.user?.name ?? ''} onConfirm={handleConfirmArchive} onCancel={() => setConfirmModal({ open: false, mode: 'archive', user: null })} />
      <ConfirmDeleteRoleModal isOpen={deleteRoleModal.open} roleName={deleteRoleModal.role?.name ?? ''} onConfirm={handleConfirmDeleteRole} onCancel={() => setDeleteRoleModal({ open: false, role: null })} />
    </div>);

}