import React, { useState } from 'react';
import {
  XIcon,
  UserIcon,
  BriefcaseIcon,
  MailIcon,
  PhoneIcon } from
'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabase';
interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
export function CandidateFormModal({
  isOpen,
  onClose,
  onSuccess
}: CandidateFormModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'M',
    education: '',
    position: '',
    document: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Solo insertamos los campos que existen en la tabla de Supabase
      const candidateData = {
        name: formData.name,
        email: formData.email,
        position: formData.position,
        status: 'pending',
        compatibility: 0
      };
      const { data, error } = await supabase.
      from('candidates').
      insert([candidateData]).
      select();
      if (error) throw error;
      showToast(`Candidato creado exitosamente: ${formData.name}`, 'success');
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: 'M',
        education: '',
        position: '',
        document: ''
      });
      // Call onSuccess to trigger refresh
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error al crear candidato:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Nuevo Candidato
              </h2>
              <p className="text-sm text-gray-600">
                Registrar candidato para evaluación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
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
                  placeholder="Ej: María González Pérez" />
                
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento de Identidad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.document}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    document: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="RFC o ID" />
                
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad *
                </label>
                <input
                  type="number"
                  required
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 30" />
                
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escolaridad *
                </label>
                <select
                  required
                  value={formData.education}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    education: e.target.value
                  })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  
                  <option value="">Seleccionar...</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Preparatoria">Preparatoria</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value
                    })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com" />
                  
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value
                    })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+52 55 1234 5678" />
                  
                </div>
              </div>
            </div>
          </div>

          {/* Información del Puesto */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Puesto Aplicado
            </h3>
            <div className="relative">
              <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                value={formData.position}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  position: e.target.value
                })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                <option value="">Seleccionar puesto...</option>
                <option value="Gerente de Ventas">Gerente de Ventas</option>
                <option value="Supervisor de Producción">
                  Supervisor de Producción
                </option>
                <option value="Ejecutivo de Ventas">Ejecutivo de Ventas</option>
                <option value="Asistente Administrativo">
                  Asistente Administrativo
                </option>
                <option value="Director de Operaciones">
                  Director de Operaciones
                </option>
                <option value="Coordinador de RRHH">Coordinador de RRHH</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
              
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              
              {isSubmitting ? 'Guardando...' : 'Crear Candidato'}
            </button>
          </div>
        </form>
      </div>
    </div>);

}