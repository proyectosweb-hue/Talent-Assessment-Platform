import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  BriefcaseIcon,
  UsersIcon,
  SettingsIcon,
  TrendingUpIcon,
  EditIcon,
  TrashIcon,
  Loader2 } from
'lucide-react';
import { supabase } from '../supabase';
import { Position, PositionLevel } from '../types';
import { useToast } from '../components/Toast';
import { PositionFormModal } from '../components/PositionFormModal';
// --- COMPONENTES AUXILIARES ---
function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          
          {icon}
        </div>
      </div>
    </div>);

}
function DataBox({ label, value }: any) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-900">{value ?? 0}</p>
    </div>);

}
// --- COMPONENTE PRINCIPAL ---
export function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();
  const positionLevelLabels: Record<PositionLevel, string> = {
    operative: 'Operativo',
    administrative: 'Administrativo',
    sales: 'Ventas',
    supervisor: 'Supervisor',
    management: 'Gerencia',
    executive: 'Ejecutivo'
  };
  // --- Cargar Datos desde Supabase ---
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.
      from('positions').
      select('*').
      order('id', {
        ascending: false
      });
      if (error) throw error;
      setPositions(data || []);
    } catch (err: any) {
      showToast('Error al cargar puestos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);
  // --- Guardar (Crear o Editar) ---
  const handleSavePosition = async (formData: any) => {
    try {
      if (editingPosition) {
        const { error } = await supabase.
        from('positions').
        update({
          name: formData.name,
          area: formData.area,
          level: formData.level,
          active_vacancies: formData.activeVacancies,
          min_score: formData.minScore
        }).
        eq('id', editingPosition.id);
        if (error) throw error;
        showToast('Puesto actualizado con éxito', 'success');
      } else {
        const { error } = await supabase.from('positions').insert([
        {
          name: formData.name,
          area: formData.area,
          level: formData.level,
          active_vacancies: formData.activeVacancies,
          min_score: formData.minScore
        }]
        );
        if (error) throw error;
        showToast('Puesto creado con éxito', 'success');
      }
      fetchPositions();
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };
  // --- Eliminar ---
  const handleDeletePosition = async (position: Position) => {
    if (
    window.confirm(`¿Estás seguro de eliminar el puesto "${position.name}"?`))
    {
      const { error } = await supabase.
      from('positions').
      delete().
      eq('id', position.id);
      if (error) {
        showToast('Error al eliminar', 'error');
      } else {
        showToast('Puesto eliminado', 'success');
        fetchPositions();
      }
    }
  };
  const totalVacancies = positions.reduce(
    (sum, p) => sum + (Number(p.activeVacancies) || 0),
    0
  );
  const avgMinScore =
  positions.length > 0 ?
  Math.round(
    positions.reduce((sum, p) => sum + (Number(p.minScore) || 0), 0) /
    positions.length
  ) :
  0;
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Puestos y Vacantes
          </h1>
          <p className="text-gray-600 mt-1">Gestión centralizada en Supabase</p>
        </div>
        <button
          onClick={() => {
            setEditingPosition(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
          
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm font-bold">Nuevo Puesto</span>
        </button>
      </div>

      {loading ?
      <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
          <p className="text-gray-500">Sincronizando puestos...</p>
        </div> :

      <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
            label="Total Puestos"
            value={positions.length}
            icon={<BriefcaseIcon className="text-blue-600" />}
            color="bg-blue-50" />
          
            <StatCard
            label="Vacantes Activas"
            value={totalVacancies}
            icon={<UsersIcon className="text-green-600" />}
            color="bg-green-50" />
          
            <StatCard
            label="Puntaje Mín. Promedio"
            value={avgMinScore}
            icon={<TrendingUpIcon className="text-orange-600" />}
            color="bg-orange-50" />
          
            <StatCard
            label="Áreas Activas"
            value={[...new Set(positions.map((p) => p.area))].length}
            icon={<SettingsIcon className="text-purple-600" />}
            color="bg-purple-50" />
          
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {positions.map((position) =>
          <div
            key={position.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {position.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {position.area}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                  onClick={() => {
                    setEditingPosition(position);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                  onClick={() => handleDeletePosition(position)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
                  {positionLevelLabels[position.level as PositionLevel] ||
              position.level}
                </span>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <DataBox label="Vacantes" value={position.activeVacancies} />
                  <DataBox label="Mínimo" value={position.minScore} />
                  <DataBox
                label="Nivel"
                value={position.level?.substring(0, 3).toUpperCase()} />
              
                </div>
              </div>
          )}
          </div>
        </>
      }

      <PositionFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingPosition}
        onSubmit={handleSavePosition} />
      
    </div>);

}