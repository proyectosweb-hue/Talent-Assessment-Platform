import React, { useState } from 'react';
import { XIcon, FilterIcon } from 'lucide-react';
import { useToast } from './Toast';
interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    status: 'all',
    position: 'all',
    compatibilityMin: '0',
    compatibilityMax: '100',
    dateFrom: '',
    dateTo: ''
  });
  const handleApply = () => {
    showToast('Filtros aplicados correctamente', 'success');
    console.log('Filtros aplicados:', filters);
    onClose();
  };
  const handleReset = () => {
    setFilters({
      status: 'all',
      position: 'all',
      compatibilityMin: '0',
      compatibilityMax: '100',
      dateFrom: '',
      dateTo: ''
    });
    showToast('Filtros restablecidos', 'info');
  };
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FilterIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Filtros Avanzados
              </h2>
              <p className="text-sm text-gray-600">
                Refinar búsqueda de candidatos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value
              })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Proceso</option>
              <option value="completed">Completado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puesto
            </label>
            <select
              value={filters.position}
              onChange={(e) =>
              setFilters({
                ...filters,
                position: e.target.value
              })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="all">Todos</option>
              <option value="Gerente de Ventas">Gerente de Ventas</option>
              <option value="Supervisor de Producción">
                Supervisor de Producción
              </option>
              <option value="Ejecutivo de Ventas">Ejecutivo de Ventas</option>
              <option value="Asistente Administrativo">
                Asistente Administrativo
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Compatibilidad
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.compatibilityMin}
                  onChange={(e) =>
                  setFilters({
                    ...filters,
                    compatibilityMin: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo" />
                
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.compatibilityMax}
                  onChange={(e) =>
                  setFilters({
                    ...filters,
                    compatibilityMax: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Máximo" />
                
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Fechas
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateFrom: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                
              </div>
              <div>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateTo: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
              
              Restablecer
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);

}