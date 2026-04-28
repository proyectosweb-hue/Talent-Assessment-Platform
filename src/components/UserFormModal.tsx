import React, { useEffect, useState } from 'react';
import { XIcon, UserIcon, MailIcon, SaveIcon } from 'lucide-react';
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {name: string;email: string;role: string;}) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}
export function UserFormModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Evaluador'
  });
  const [saving, setSaving] = useState(false);
  const isEditing = !!initialData;
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Evaluador'
      });
    }
  }, [initialData, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      setFormData({
        name: '',
        email: '',
        role: 'Evaluador'
      });
    } finally {
      setSaving(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Editar Usuario' : 'Agregar Usuario'}
              </h2>
              <p className="text-sm text-blue-100">
                {isEditing ?
                'Modificar datos del usuario' :
                'Crear nuevo usuario del sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              placeholder="Ej: Ana Martínez" />
            
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value
                })
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                placeholder="usuario@empresa.com" />
              
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value
              })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900">
              
              <option value="Administrador">Administrador</option>
              <option value="Evaluador">Evaluador</option>
              <option value="Consultor">Consultor</option>
              <option value="Visualizador">Visualizador</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700 text-sm disabled:opacity-50">
              
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm shadow-md disabled:opacity-70">
              
              {saving ?
              <>
                  <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24">
                  
                    <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4" />
                  
                    <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z" />
                  
                  </svg>
                  <span>Guardando...</span>
                </> :

              <>
                  <SaveIcon className="w-4 h-4" />
                  <span>{isEditing ? 'Actualizar' : 'Crear Usuario'}</span>
                </>
              }
            </button>
          </div>
        </form>
      </div>
    </div>);

}