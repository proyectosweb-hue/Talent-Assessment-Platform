import React from 'react';
import { TrashIcon, XIcon, AlertTriangleIcon } from 'lucide-react';
interface ConfirmDeleteRoleModalProps {
  isOpen: boolean;
  roleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export function ConfirmDeleteRoleModal({
  isOpen,
  roleName,
  onConfirm,
  onCancel
}: ConfirmDeleteRoleModalProps) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header rojo */}
        <div className="relative px-6 py-5 flex items-center justify-between" style={{
        background: 'linear-gradient(135deg, #991b1b, #dc2626)'
      }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20">
              <TrashIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Eliminar Rol</h2>
              <p className="text-xs text-white/60 mt-0.5">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            ¿Estás seguro de eliminar el rol <strong className="text-gray-900 font-bold">"{roleName}"</strong>?
          </p>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              Los usuarios con este rol asignado podrían perder sus permisos de acceso al sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:opacity-90" style={{
          background: 'linear-gradient(135deg, #dc2626, #991b1b)'
        }}>
            <TrashIcon className="w-4 h-4" /> Eliminar Rol
          </button>
        </div>
      </div>
    </div>;
}