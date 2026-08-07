import React, { useEffect, useState } from 'react';
import { XIcon, UserIcon, MailIcon, SaveIcon, EyeIcon, EyeOffIcon, KeyIcon, Loader2Icon } from 'lucide-react';
import { supabase } from '../supabase';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}
const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 text-gray-900";
export function UserFormModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<{
    id: string;
    name: string;
  }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const isEditing = !!initialData;
  useEffect(() => {
    if (!isOpen) return;
    setLoadingRoles(true);
    supabase.from('roles').select('id, name').order('name').then(({
      data
    }) => {
      const list = data || [];
      setRoles(list);
      if (!isEditing && list.length > 0) setFormData((f) => ({
        ...f,
        role: list[0].name
      }));
    }).finally(() => setLoadingRoles(false));
  }, [isOpen]);
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: roles[0]?.name || '',
        password: ''
      });
    }
    setShowPassword(false);
  }, [initialData, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !formData.password.trim()) {
      alert('La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password || undefined
      });
      setFormData({
        name: '',
        email: '',
        role: roles[0]?.name || '',
        password: ''
      });
    } finally {
      setSaving(false);
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-7 py-6 flex items-center justify-between" style={{
        background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})`
      }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{isEditing ? 'Editar Usuario' : 'Agregar Usuario'}</h2>
              <p className="text-white/50 text-xs mt-0.5">{isEditing ? 'Modificar datos del usuario' : 'Crear nuevo usuario del sistema'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-7 py-5 space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nombre Completo *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({
              ...formData,
              name: e.target.value
            })} className={inputClass} placeholder="Ej: Ana Martínez" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email *</label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input type="email" required value={formData.email} onChange={(e) => setFormData({
                ...formData,
                email: e.target.value
              })} className={`${inputClass} pl-10`} placeholder="usuario@empresa.com" />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Rol *</label>
              {loadingRoles ? <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50 flex items-center gap-2">
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Cargando roles...
                </div> : roles.length === 0 ? <div className="w-full px-4 py-2.5 border border-yellow-200 rounded-xl text-sm text-yellow-700 bg-yellow-50">
                  Sin roles. Ve a Configuración → Roles para crear uno.
                </div> : <select required value={formData.role} onChange={(e) => setFormData({
              ...formData,
              role: e.target.value
            })} className={inputClass}>
                  {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Contraseña {!isEditing && '*'}
                {isEditing && <span className="text-gray-300 font-normal normal-case ml-1">(dejar en blanco para no cambiar)</span>}
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({
                ...formData,
                password: e.target.value
              })} required={!isEditing} className={`${inputClass} pl-10 pr-12`} placeholder={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
            <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving || roles.length === 0} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-60 transition-all hover:opacity-90" style={{
            background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`,
            boxShadow: `0 4px 12px ${TR.green}40`
          }}>
              {saving ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Guardando...</> : <><SaveIcon className="w-4 h-4" /> {isEditing ? 'Actualizar' : 'Crear Usuario'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>;
}