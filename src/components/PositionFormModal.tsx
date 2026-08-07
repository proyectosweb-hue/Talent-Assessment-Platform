import React, { useEffect, useState } from 'react';
import { XIcon, BriefcaseIcon, SaveIcon, Loader2Icon } from 'lucide-react';
import { PositionLevel, Position } from '../types';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
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
  color: string;
  bg: string;
}[] = [{
  value: 'operative',
  label: 'Operativo',
  color: '#64748b',
  bg: '#f1f5f9'
}, {
  value: 'administrative',
  label: 'Administrativo',
  color: TR.blue,
  bg: `${TR.blue}12`
}, {
  value: 'sales',
  label: 'Ventas',
  color: '#d97706',
  bg: '#fffbeb'
}, {
  value: 'supervisor',
  label: 'Supervisor',
  color: TR.green,
  bg: `${TR.green}12`
}, {
  value: 'management',
  label: 'Gerencia',
  color: TR.navy,
  bg: `${TR.navy}12`
}, {
  value: 'executive',
  label: 'Ejecutivo',
  color: '#7c3aed',
  bg: '#f5f3ff'
}];
const AREA_SUGGESTIONS = ['Comercial', 'Operaciones', 'Recursos Humanos', 'Tecnología', 'Finanzas', 'Marketing', 'Logística', 'Atención al Cliente', 'Administración', 'Legal'];
const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 text-gray-900";
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
  const filteredSuggestions = AREA_SUGGESTIONS.filter((s) => s.toLowerCase().includes(formData.area.toLowerCase()) && formData.area.length > 0);
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-7 py-6 flex items-center justify-between" style={{
        background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})`
      }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="absolute right-20 bottom-0 w-16 h-16 rounded-full opacity-5 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15">
              <BriefcaseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{isEditing ? 'Editar Puesto' : 'Nuevo Puesto'}</h2>
              <p className="text-white/50 text-xs mt-0.5">{isEditing ? 'Modificar datos del puesto' : 'Registrar nueva posición'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-7 py-5 space-y-4 max-h-[460px] overflow-y-auto">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nombre del Puesto *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({
              ...formData,
              name: e.target.value
            })} className={inputClass} placeholder="Ej: Gerente de Ventas" />
            </div>

            {/* Área con sugerencias */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Área *</label>
              <input type="text" required value={formData.area} onChange={(e) => {
              setFormData({
                ...formData,
                area: e.target.value
              });
              setShowAreaSuggestions(true);
            }} onFocus={() => setShowAreaSuggestions(true)} onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 150)} className={inputClass} placeholder="Ej: Comercial, Operaciones, RRHH" />
              {showAreaSuggestions && filteredSuggestions.length > 0 && <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {filteredSuggestions.map((s) => <li key={s} onMouseDown={() => {
                setFormData({
                  ...formData,
                  area: s
                });
                setShowAreaSuggestions(false);
              }} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors">
                      {s}
                    </li>)}
                </ul>}
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Nivel del Puesto *</label>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_OPTIONS.map((opt) => <button key={opt.value} type="button" onClick={() => setFormData({
                ...formData,
                level: opt.value
              })} className="px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all" style={{
                borderColor: formData.level === opt.value ? opt.color : '#e5e7eb',
                background: formData.level === opt.value ? opt.bg : '#f9fafb',
                color: formData.level === opt.value ? opt.color : '#9ca3af'
              }}>
                    {opt.label}
                  </button>)}
              </div>
            </div>

            {/* Puntaje + Vacantes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Puntaje Mínimo *</label>
                <div className="relative">
                  <input type="number" required min="0" max="100" value={formData.minScore} onChange={(e) => setFormData({
                  ...formData,
                  minScore: e.target.value
                })} className={`${inputClass} pr-12`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">/100</span>
                </div>
                {/* Mini barra */}
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{
                  width: `${Math.min(Number(formData.minScore), 100)}%`,
                  background: `linear-gradient(90deg, ${TR.blue}, ${TR.green})`
                }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Vacantes Activas *</label>
                <input type="number" required min="1" value={formData.activeVacancies} onChange={(e) => setFormData({
                ...formData,
                activeVacancies: e.target.value
              })} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-70 transition-all hover:opacity-90" style={{
            background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`,
            boxShadow: `0 4px 12px ${TR.green}40`
          }}>
              {loading ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Guardando...</> : <><SaveIcon className="w-4 h-4" /> {isEditing ? 'Actualizar' : 'Crear Puesto'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>;
}