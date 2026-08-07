import React from 'react';
import { ArchiveIcon, ArchiveRestoreIcon, XIcon } from 'lucide-react';
const TR = {
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
interface Props {
  isOpen: boolean;
  mode: 'archive' | 'unarchive';
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export function ConfirmUserArchiveModal({
  isOpen,
  mode,
  userName,
  onConfirm,
  onCancel
}: Props) {
  if (!isOpen) return null;
  const isArchiving = mode === 'archive';
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-6 py-5 flex items-center justify-between" style={{
        background: isArchiving ? 'linear-gradient(135deg, #92400e, #b45309)' : `linear-gradient(135deg, ${TR.greenDark}, ${TR.green})`
      }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20">
              {isArchiving ? <ArchiveIcon className="w-5 h-5 text-white" /> : <ArchiveRestoreIcon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{isArchiving ? 'Archivar Usuario' : 'Restaurar Usuario'}</h2>
              <p className="text-xs text-white/60 mt-0.5">
                {isArchiving ? 'El usuario perderá acceso al sistema' : 'El usuario recuperará su acceso'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            {isArchiving ? <>¿Estás seguro de archivar al usuario <strong className="text-gray-900 font-bold">"{userName}"</strong>? No podrá acceder al sistema.</> : <>¿Deseas restaurar al usuario <strong className="text-gray-900 font-bold">"{userName}"</strong>? Volverá a tener acceso al sistema.</>}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:opacity-90" style={{
          background: isArchiving ? 'linear-gradient(135deg, #b45309, #92400e)' : `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`
        }}>
            {isArchiving ? 'Sí, archivar' : 'Sí, restaurar'}
          </button>
        </div>
      </div>
    </div>;
}