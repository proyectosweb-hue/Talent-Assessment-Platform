import React from 'react';
import { ArchiveIcon, ArchiveRestoreIcon, XIcon } from 'lucide-react';
interface ConfirmArchiveModalProps {
  isOpen: boolean;
  mode: 'archive' | 'unarchive';
  positionName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export function ConfirmArchiveModal({
  isOpen,
  mode,
  positionName,
  onConfirm,
  onCancel
}: ConfirmArchiveModalProps) {
  if (!isOpen) return null;
  const isArchive = mode === 'archive';
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onCancel}>
      
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        
        <div
          className={`px-6 py-5 flex items-center justify-between ${isArchive ? 'bg-yellow-50 border-b border-yellow-100' : 'bg-green-50 border-b border-green-100'}`}>
          
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isArchive ? 'bg-yellow-100' : 'bg-green-100'}`}>
              
              {isArchive ?
              <ArchiveIcon className="w-5 h-5 text-yellow-600" /> :

              <ArchiveRestoreIcon className="w-5 h-5 text-green-600" />
              }
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {isArchive ? 'Archivar Puesto' : 'Desarchivar Puesto'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600">
            {isArchive ?
            <>
                ¿Estás seguro de archivar el puesto{' '}
                <strong className="text-gray-900">{positionName}</strong>? No
                aparecerá en la lista activa.
              </> :

            <>
                ¿Deseas restaurar el puesto{' '}
                <strong className="text-gray-900">{positionName}</strong> a la
                lista activa?
              </>
            }
          </p>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 text-sm">
            
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md ${isArchive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
            
            {isArchive ? 'Archivar' : 'Desarchivar'}
          </button>
        </div>
      </div>
    </div>);

}