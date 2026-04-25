import React, { useState } from 'react';
import { XIcon, PlayIcon, UserIcon } from 'lucide-react';
import { useToast } from './Toast';
import { mockCandidates } from '../data/mockData';
interface ApplyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: {
    id: string;
    name: string;
    description: string;
    items: number;
  } | null;
}
export function ApplyTestModal({ isOpen, onClose, test }: ApplyTestModalProps) {
  const { showToast } = useToast();
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const handleApply = () => {
    if (selectedCandidates.length === 0) {
      showToast('Por favor selecciona al menos un candidato', 'warning');
      return;
    }
    showToast(
      `Aplicando ${test?.name} a ${selectedCandidates.length} candidato(s)`,
      'success'
    );
    console.log('Aplicar prueba:', {
      test,
      selectedCandidates,
      sendEmail
    });
    onClose();
    setSelectedCandidates([]);
  };
  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
    prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };
  if (!isOpen || !test) return null;
  const availableCandidates = mockCandidates.filter(
    (c) => c.status === 'pending' || c.status === 'in_progress'
  );
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Aplicar Prueba
              </h2>
              <p className="text-sm text-gray-600">{test.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Test Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">{test.name}</h3>
            <p className="text-sm text-blue-800">{test.description}</p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Reactivos:</strong> {test.items} preguntas
            </p>
          </div>

          {/* Candidate Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Seleccionar Candidatos ({selectedCandidates.length} seleccionados)
            </h3>

            {availableCandidates.length === 0 ?
            <div className="text-center py-8 text-gray-500">
                <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No hay candidatos disponibles para evaluación</p>
              </div> :

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableCandidates.map((candidate) =>
              <label
                key={candidate.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                
                    <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => toggleCandidate(candidate.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {candidate.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {candidate.position} • {candidate.email}
                      </p>
                    </div>
                  </label>
              )}
              </div>
            }
          </div>

          {/* Options */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Opciones de Aplicación
            </h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              
              <span className="text-sm text-gray-700">
                Enviar invitación por email a los candidatos seleccionados
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCandidates.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
              
              <PlayIcon className="w-4 h-4" />
              <span>Aplicar Prueba</span>
            </button>
          </div>
        </div>
      </div>
    </div>);

}