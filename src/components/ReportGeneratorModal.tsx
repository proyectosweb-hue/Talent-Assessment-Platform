import React, { useState } from 'react';
import { XIcon, FileTextIcon, UserIcon, UsersIcon } from 'lucide-react';
import { useToast } from './Toast';
import { mockCandidates } from '../data/mockData';
interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function ReportGeneratorModal({
  isOpen,
  onClose
}: ReportGeneratorModalProps) {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<
    'individual' | 'consolidated' | 'executive'>(
    'individual');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const handleGenerate = () => {
    if (reportType === 'individual' && !selectedCandidate) {
      showToast('Por favor selecciona un candidato', 'warning');
      return;
    }
    showToast('Generando reporte PDF...', 'success');
    console.log('Generar reporte:', {
      reportType,
      selectedCandidate,
      dateRange
    });
    setTimeout(() => {
      showToast('Reporte generado exitosamente', 'success');
      onClose();
    }, 1500);
  };
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Generar Reporte
              </h2>
              <p className="text-sm text-gray-600">
                Crear reporte de evaluación en PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tipo de Reporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Reporte
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setReportType('individual')}
                className={`p-4 border-2 rounded-lg transition-all ${reportType === 'individual' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                
                <UserIcon
                  className={`w-6 h-6 mx-auto mb-2 ${reportType === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
                
                <p
                  className={`text-sm font-semibold ${reportType === 'individual' ? 'text-blue-900' : 'text-gray-700'}`}>
                  
                  Individual
                </p>
              </button>

              <button
                onClick={() => setReportType('consolidated')}
                className={`p-4 border-2 rounded-lg transition-all ${reportType === 'consolidated' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                
                <UsersIcon
                  className={`w-6 h-6 mx-auto mb-2 ${reportType === 'consolidated' ? 'text-green-600' : 'text-gray-400'}`} />
                
                <p
                  className={`text-sm font-semibold ${reportType === 'consolidated' ? 'text-green-900' : 'text-gray-700'}`}>
                  
                  Consolidado
                </p>
              </button>

              <button
                onClick={() => setReportType('executive')}
                className={`p-4 border-2 rounded-lg transition-all ${reportType === 'executive' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                
                <FileTextIcon
                  className={`w-6 h-6 mx-auto mb-2 ${reportType === 'executive' ? 'text-purple-600' : 'text-gray-400'}`} />
                
                <p
                  className={`text-sm font-semibold ${reportType === 'executive' ? 'text-purple-900' : 'text-gray-700'}`}>
                  
                  Ejecutivo
                </p>
              </button>
            </div>
          </div>

          {/* Selección de Candidato (solo para individual) */}
          {reportType === 'individual' &&
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Candidato *
              </label>
              <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
                <option value="">Seleccionar candidato...</option>
                {mockCandidates.
              filter((c) => c.status === 'completed').
              map((candidate) =>
              <option key={candidate.id} value={candidate.id}>
                      {candidate.name} - {candidate.position} (
                      {candidate.compatibility}%)
                    </option>
              )}
              </select>
            </div>
          }

          {/* Rango de Fechas (para consolidado y ejecutivo) */}
          {(reportType === 'consolidated' || reportType === 'executive') &&
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Fechas
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    from: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                
                </div>
                <div>
                  <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    to: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                
                </div>
              </div>
            </div>
          }

          {/* Opciones adicionales */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Opciones de Reporte
            </h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-gray-700">Incluir gráficos</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-gray-700">
                  Incluir interpretación detallada
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                
                <span className="text-sm text-gray-700">
                  Incluir recomendaciones
                </span>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
              
              Generar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>);

}