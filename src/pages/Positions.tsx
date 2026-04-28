import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon, BriefcaseIcon, UsersIcon, SettingsIcon,
  TrendingUpIcon, EditIcon, ArchiveIcon, ArchiveRestoreIcon, Loader2Icon } from
'lucide-react';
import { supabase } from '../supabase';
import { Position, PositionLevel } from '../types';
import { useToast } from '../components/Toast';
import { PositionFormModal } from '../components/PositionFormModal';
import { ConfirmArchiveModal } from '../components/ConfirmArchiveModal';

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>);

}

function DataBox({ label, value }: any) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value ?? 0}</p>
    </div>);

}

function mapRow(row: any): Position {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    level: row.level,
    activeVacancies: row.active_vacancies,
    minScore: row.min_score,
    archived: row.archived ?? false
  };
}

export function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Estado del modal de confirmar archivo
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    mode: 'archive' | 'unarchive';
    position: Position | null;
  }>({ open: false, mode: 'archive', position: null });

  const { showToast } = useToast();

  const positionLevelLabels: Record<PositionLevel, string> = {
    operative: 'Operativo',
    administrative: 'Administrativo',
    sales: 'Ventas',
    supervisor: 'Supervisor',
    management: 'Gerencia',
    executive: 'Ejecutivo'
  };

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.
      from('positions').
      select('*').
      order('id', { ascending: false });
      if (error) throw error;
      setPositions((data || []).map(mapRow));
    } catch (err: any) {
      showToast('Error al cargar puestos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {fetchPositions();}, [fetchPositions]);

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
        const { error } = await supabase.from('positions').insert([{
          name: formData.name,
          area: formData.area,
          level: formData.level,
          active_vacancies: formData.activeVacancies,
          min_score: formData.minScore,
          archived: false
        }]);
        if (error) throw error;
        showToast('Puesto creado con éxito', 'success');
      }
      fetchPositions();
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Abre el modal de confirmación
  const openConfirm = (position: Position) => {
    setConfirmModal({
      open: true,
      mode: position.archived ? 'unarchive' : 'archive',
      position
    });
  };

  // Ejecuta el archivar/desarchivar después de confirmar
  const handleConfirmArchive = async () => {
    const position = confirmModal.position;
    if (!position) return;

    const newArchived = !position.archived;
    const { error } = await supabase.
    from('positions').
    update({ archived: newArchived }).
    eq('id', position.id);

    setConfirmModal({ open: false, mode: 'archive', position: null });

    if (error) {
      // Mensaje de error más descriptivo para depurar
      showToast(`Error al ${newArchived ? 'archivar' : 'desarchivar'}: ${error.message}`, 'error');
    } else {
      showToast(newArchived ? 'Puesto archivado' : 'Puesto desarchivado', 'success');
      fetchPositions();
    }
  };

  const visible = positions.filter((p) => p.archived === showArchived);
  const active = positions.filter((p) => !p.archived);
  const totalVacancies = active.reduce((sum, p) => sum + (Number(p.activeVacancies) || 0), 0);
  const avgMinScore = active.length > 0 ?
  Math.round(active.reduce((sum, p) => sum + (Number(p.minScore) || 0), 0) / active.length) :
  0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puestos y Vacantes</h1>
          <p className="text-gray-600 mt-1">Gestión centralizada en Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${
            showArchived ?
            'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' :
            'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`
            }>
            
            <ArchiveIcon className="w-4 h-4" />
            <span>{showArchived ? 'Ver activos' : `Archivados (${positions.filter((p) => p.archived).length})`}</span>
          </button>
          {!showArchived &&
          <button
            onClick={() => {setEditingPosition(null);setShowModal(true);}}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
            
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-bold">Nuevo Puesto</span>
            </button>
          }
        </div>
      </div>

      {loading ?
      <div className="flex flex-col items-center justify-center h-64">
          <Loader2Icon className="w-10 h-10 animate-spin text-blue-600 mb-2" />
          <p className="text-gray-500">Sincronizando puestos...</p>
        </div> :

      <>
          {!showArchived &&
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Total Puestos" value={active.length} icon={<BriefcaseIcon className="w-6 h-6 text-blue-600" />} color="bg-blue-50" />
              <StatCard label="Vacantes Activas" value={totalVacancies} icon={<UsersIcon className="w-6 h-6 text-green-600" />} color="bg-green-50" />
              <StatCard label="Puntaje Mín. Promedio" value={avgMinScore} icon={<TrendingUpIcon className="w-6 h-6 text-orange-600" />} color="bg-orange-50" />
              <StatCard label="Áreas Activas" value={[...new Set(active.map((p) => p.area))].length} icon={<SettingsIcon className="w-6 h-6 text-purple-600" />} color="bg-purple-50" />
            </div>
        }

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visible.length === 0 ?
          <div className="col-span-2 text-center py-20 text-gray-400 italic">
                {showArchived ? 'No hay puestos archivados.' : 'No hay puestos registrados. Crea uno nuevo.'}
              </div> :

          visible.map((position) =>
          <div
            key={position.id}
            className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${
            position.archived ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'}`
            }>
            
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{position.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{position.area}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!position.archived &&
                <button
                  onClick={() => {setEditingPosition(position);setShowModal(true);}}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar">
                  
                          <EditIcon className="w-4 h-4" />
                        </button>
                }
                      <button
                  onClick={() => openConfirm(position)}
                  className={`p-2 rounded-lg transition-colors ${
                  position.archived ?
                  'text-gray-400 hover:text-green-600 hover:bg-green-50' :
                  'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`
                  }
                  title={position.archived ? 'Desarchivar' : 'Archivar'}>
                  
                        {position.archived ?
                  <ArchiveRestoreIcon className="w-4 h-4" /> :
                  <ArchiveIcon className="w-4 h-4" />
                  }
                      </button>
                    </div>
                  </div>

                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
                    {positionLevelLabels[position.level as PositionLevel] || position.level}
                  </span>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <DataBox label="Vacantes" value={position.activeVacancies} />
                    <DataBox label="Mínimo" value={position.minScore} />
                    <DataBox label="Nivel" value={position.level?.substring(0, 3).toUpperCase()} />
                  </div>
                </div>
          )
          }
          </div>
        </>
      }

      <PositionFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingPosition}
        onSubmit={handleSavePosition} />
      

      {/* Modal de confirmación archivar/desarchivar */}
      <ConfirmArchiveModal
        isOpen={confirmModal.open}
        mode={confirmModal.mode}
        positionName={confirmModal.position?.name ?? ''}
        onConfirm={handleConfirmArchive}
        onCancel={() => setConfirmModal({ open: false, mode: 'archive', position: null })} />
      
    </div>);

}