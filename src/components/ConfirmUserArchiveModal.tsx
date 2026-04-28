import React from 'react';
import { ArchiveIcon, ArchiveRestoreIcon, XIcon } from 'lucide-react';
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header con color amarillo para archivar, verde para desarchivar */}
        <div
          className={`px-6 py-4 ${isArchiving ? 'bg-yellow-50 border-b border-yellow-200' : 'bg-green-50 border-b border-green-200'}`}>
          
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl ${isArchiving ? 'bg-yellow-100' : 'bg-green-100'} flex items-center justify-center`}>
              
              {isArchiving ?
              <ArchiveIcon className="w-6 h-6 text-yellow-600" /> :

              <ArchiveRestoreIcon className="w-6 h-6 text-green-600" />
              }
            </div>
            <div className="flex-1">
              <h3
                className={`text-lg font-bold ${isArchiving ? 'text-yellow-900' : 'text-green-900'}`}>
                
                {isArchiving ? 'Archivar Usuario' : 'Restaurar Usuario'}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 leading-relaxed">
            {isArchiving ?
            <>
                ¿Estás seguro de archivar al usuario{' '}
                <strong className="text-gray-900">{userName}</strong>? No
                aparecerá en la lista activa y no podrá acceder al sistema.
              </> :

            <>
                ¿Estás seguro de restaurar al usuario{' '}
                <strong className="text-gray-900">{userName}</strong>? Volverá a
                aparecer en la lista activa y podrá acceder al sistema.
              </>
            }
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-white transition-colors">
            
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors ${isArchiving ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
            
            {isArchiving ? 'Archivar' : 'Restaurar'}
          </button>
        </div>
      </div>
    </div>);

}