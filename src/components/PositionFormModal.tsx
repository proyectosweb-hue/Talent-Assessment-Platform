import React, { useState } from 'react';
import { XIcon, BriefcaseIcon } from 'lucide-react';
import { useToast } from './Toast';
import { PositionLevel } from '../types';
interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function PositionFormModal({ isOpen, onClose }: PositionFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    level: 'operative' as PositionLevel,
    minScore: '60',
    activeVacancies: '1'
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Puesto creado exitosamente: ' + formData.name, 'success');
    console.log('Nuevo puesto:', formData);
    onClose();
    setFormData({
      name: '',
      area: '',
      level: 'operative',
      minScore: '60',
      activeVacancies: '1'
    });
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
              <BriefcaseIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nuevo Puesto</h2>
              <p className="text-sm text-gray-600">Crear puesto o vacante</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Puesto *
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Gerente de Ventas" />
            
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Área *
            </label>
            <input
              type="text"
              required
              value={formData.area}
              onChange={(e) =>
              setFormData({
                ...formData,
                area: e.target.value
              })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Comercial, Operaciones, RRHH" />
            
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel del Puesto *
            </label>
            <select
              required
              value={formData.level}
              onChange={(e) =>
              setFormData({
                ...formData,
                level: e.target.value as PositionLevel
              })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="operative">Operativo</option>
              <option value="administrative">Administrativo</option>
              <option value="sales">Ventas</option>
              <option value="supervisor">Supervisor</option>
              <option value="management">Gerencia</option>
              <option value="executive">Ejecutivo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntaje Mínimo *
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.minScore}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  minScore: e.target.value
                })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vacantes Activas *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.activeVacancies}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  activeVacancies: e.target.value
                })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
              
              Crear Puesto
            </button>
          </div>
        </form>
      </div>
    </div>);

}