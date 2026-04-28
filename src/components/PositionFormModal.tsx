import React, { useEffect, useState } from 'react';
import { XIcon, BriefcaseIcon, SaveIcon } from 'lucide-react';
import { PositionLevel, Position } from '../types';
interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Position | null;
  onSubmit: (formData: {
    name: string;
    area: string;
    level: PositionLevel;
    minScore: number;
    activeVacancies: number;
  }) => Promise<void>;
}
const LEVEL_OPTIONS: {
  value: PositionLevel;
  label: string;
}[] = [
{
  value: 'operative',
  label: 'Operativo'
},
{
  value: 'administrative',
  label: 'Administrativo'
},
{
  value: 'sales',
  label: 'Ventas'
},
{
  value: 'supervisor',
  label: 'Supervisor'
},
{
  value: 'management',
  label: 'Gerencia'
},
{
  value: 'executive',
  label: 'Ejecutivo'
}];

const AREA_SUGGESTIONS = [
'Comercial',
'Operaciones',
'Recursos Humanos',
'Tecnología',
'Finanzas',
'Marketing',
'Logística',
'Atención al Cliente',
'Administración',
'Legal'];

export function PositionFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit
}: PositionFormModalProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    level: 'operative' as PositionLevel,
    minScore: '60',
    activeVacancies: '1'
  });
  const [loading, setLoading] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        area: initialData.area,
        level: initialData.level,
        minScore: String(initialData.minScore),
        activeVacancies: String(initialData.activeVacancies)
      });
    } else {
      setFormData({
        name: '',
        area: '',
        level: 'operative',
        minScore: '60',
        activeVacancies: '1'
      });
    }
  }, [initialData, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        area: formData.area.trim(),
        level: formData.level,
        minScore: Number(formData.minScore),
        activeVacancies: Number(formData.activeVacancies)
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredSuggestions = AREA_SUGGESTIONS.filter(
    (s) =>
    s.toLowerCase().includes(formData.area.toLowerCase()) &&
    formData.area.length > 0
  );
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Editar Puesto' : 'Nuevo Puesto'}
              </h2>
              <p className="text-blue-200 text-sm">
                {isEditing ?
                'Modificar datos del puesto' :
                'Guardar en Supabase'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre del Puesto <span className="text-red-500">*</span>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              placeholder="Ej: Gerente de Ventas" />
            
          </div>

          {/* Área con sugerencias */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Área <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.area}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  area: e.target.value
                });
                setShowAreaSuggestions(true);
              }}
              onFocus={() => setShowAreaSuggestions(true)}
              onBlur={() =>
              setTimeout(() => setShowAreaSuggestions(false), 150)
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              placeholder="Ej: Comercial, Operaciones, RRHH" />
            
            {showAreaSuggestions && filteredSuggestions.length > 0 &&
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {filteredSuggestions.map((s) =>
              <li
                key={s}
                onMouseDown={() => {
                  setFormData({
                    ...formData,
                    area: s
                  });
                  setShowAreaSuggestions(false);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors">
                
                    {s}
                  </li>
              )}
              </ul>
            }
          </div>

          {/* Nivel */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nivel del Puesto <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVEL_OPTIONS.map((opt) =>
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                setFormData({
                  ...formData,
                  level: opt.value
                })
                }
                className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${formData.level === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'}`}>
                
                  {opt.label}
                </button>
              )}
            </div>
          </div>

          {/* Puntaje y Vacantes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Puntaje Mínimo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 pr-12" />
                
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  /100
                </span>
              </div>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(Number(formData.minScore), 100)}%`
                  }} />
                
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Vacantes Activas <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900" />
              
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700 text-sm disabled:opacity-50">
              
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm shadow-md disabled:opacity-70">
              
              {loading ?
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
                  <span>{isEditing ? 'Actualizar' : 'Crear Puesto'}</span>
                </>
              }
            </button>
          </div>
        </form>
      </div>
    </div>);

}