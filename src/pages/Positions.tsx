import React, { useCallback, useEffect, useState } from 'react';
import { PlusIcon, BriefcaseIcon, UsersIcon, TrendingUpIcon, EditIcon, ArchiveIcon, ArchiveRestoreIcon, Loader2Icon, LockIcon, LayersIcon, TargetIcon, Building2Icon } from 'lucide-react';
import { supabase } from '../supabase';
import { Position, PositionLevel } from '../types';
import { useToast } from '../components/Toast';
import { PositionFormModal } from '../components/PositionFormModal';
import { ConfirmArchiveModal } from '../components/ConfirmArchiveModal';
import { Pagination } from '../components/Pagination';
import { PermissionLevel } from '../App';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
const PAGE_SIZE = 6;
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
const LEVEL_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
}> = {
  operative: {
    label: 'Operativo',
    color: '#64748b',
    bg: '#f1f5f9'
  },
  administrative: {
    label: 'Administrativo',
    color: TR.blue,
    bg: `${TR.blue}12`
  },
  sales: {
    label: 'Ventas',
    color: '#f59e0b',
    bg: '#fffbeb'
  },
  supervisor: {
    label: 'Supervisor',
    color: TR.green,
    bg: `${TR.green}12`
  },
  management: {
    label: 'Gerencia',
    color: TR.navy,
    bg: `${TR.navy}12`
  },
  executive: {
    label: 'Ejecutivo',
    color: '#7c3aed',
    bg: '#f5f3ff'
  }
};
interface PositionsProps {
  permission?: PermissionLevel;
}
export function Positions({
  permission = 'full'
}: PositionsProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    mode: 'archive' | 'unarchive';
    position: Position | null;
  }>({
    open: false,
    mode: 'archive',
    position: null
  });
  const {
    showToast
  } = useToast();
  const isReadonly = permission === 'readonly';
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('positions').select('*').order('id', {
        ascending: false
      });
      if (error) throw error;
      setPositions((data || []).map(mapRow));
    } catch {
      showToast('Error al cargar puestos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);
  useEffect(() => {
    setCurrentPage(1);
  }, [showArchived]);
  const handleSavePosition = async (formData: any) => {
    if (isReadonly) {
      showToast('Sin permisos', 'error');
      return;
    }
    try {
      if (editingPosition) {
        const {
          error
        } = await supabase.from('positions').update({
          name: formData.name,
          area: formData.area,
          level: formData.level,
          active_vacancies: formData.activeVacancies,
          min_score: formData.minScore
        }).eq('id', editingPosition.id);
        if (error) throw error;
        showToast('Puesto actualizado', 'success');
      } else {
        const {
          error
        } = await supabase.from('positions').insert([{
          name: formData.name,
          area: formData.area,
          level: formData.level,
          active_vacancies: formData.activeVacancies,
          min_score: formData.minScore,
          archived: false
        }]);
        if (error) throw error;
        showToast('Puesto creado', 'success');
      }
      fetchPositions();
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };
  const openConfirm = (position: Position) => {
    if (isReadonly) {
      showToast('Sin permisos', 'error');
      return;
    }
    setConfirmModal({
      open: true,
      mode: position.archived ? 'unarchive' : 'archive',
      position
    });
  };
  const handleConfirmArchive = async () => {
    const position = confirmModal.position;
    if (!position) return;
    const newArchived = !position.archived;
    const {
      error
    } = await supabase.from('positions').update({
      archived: newArchived
    }).eq('id', position.id);
    setConfirmModal({
      open: false,
      mode: 'archive',
      position: null
    });
    if (error) {
      showToast(`Error: ${error.message}`, 'error');
    } else {
      showToast(newArchived ? 'Puesto archivado' : 'Puesto desarchivado', 'success');
      fetchPositions();
    }
  };
  const active = positions.filter((p) => !p.archived);
  const visible = positions.filter((p) => p.archived === showArchived);
  const totalVacancies = active.reduce((s, p) => s + (Number(p.activeVacancies) || 0), 0);
  const avgMinScore = active.length > 0 ? Math.round(active.reduce((s, p) => s + (Number(p.minScore) || 0), 0) / active.length) : 0;
  const uniqueAreas = [...new Set(active.map((p) => p.area))].length;
  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  return <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{
          color: TR.navy
        }}>
            Puestos y Vacantes
          </h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            {visible.length} {showArchived ? 'archivados' : 'activos'}
            {isReadonly && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                <LockIcon className="w-3 h-3" />
                Solo lectura
              </span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchived((v) => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${showArchived ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <ArchiveIcon className="w-4 h-4" />
            {showArchived ? 'Ver activos' : `Archivados (${positions.filter((p) => p.archived).length})`}
          </button>
          {!showArchived && !isReadonly && <button onClick={() => {
          setEditingPosition(null);
          setShowModal(true);
        }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90" style={{
          background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
        }}>
              <PlusIcon className="w-4 h-4" /> Nuevo Puesto
            </button>}
        </div>
      </div>

      {loading ? <div className="flex flex-col items-center justify-center h-64">
          <BriefcaseIcon className="w-10 h-10 animate-pulse mb-3" style={{
        color: TR.blue
      }} />
          <p className="text-gray-400 text-sm">Cargando puestos...</p>
        </div> : <>
          {/* Stats */}
          {!showArchived && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[{
          label: 'Total Puestos',
          value: active.length,
          icon: BriefcaseIcon,
          color: TR.blue
        }, {
          label: 'Vacantes Activas',
          value: totalVacancies,
          icon: UsersIcon,
          color: TR.green
        }, {
          label: 'Score Mín. Prom.',
          value: avgMinScore,
          icon: TargetIcon,
          color: '#f59e0b'
        }, {
          label: 'Áreas',
          value: uniqueAreas,
          icon: Building2Icon,
          color: TR.navy
        }].map((s) => <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{
            background: `${s.color}12`
          }}>
                    <s.icon className="w-5 h-5" style={{
              color: s.color
            }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      {s.label}
                    </p>
                    <p className="text-xl font-black" style={{
              color: TR.navy
            }}>
                      {s.value}
                    </p>
                  </div>
                </div>)}
            </div>}

          {/* Grid de puestos */}
          {paginated.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">
                {showArchived ? 'No hay puestos archivados.' : 'No hay puestos registrados.'}
              </p>
            </div> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((position) => {
          const levelCfg = LEVEL_CONFIG[position.level as string] || {
            label: String(position.level || ''),
            color: TR.blue,
            bg: `${TR.blue}12`
          };
          return <div key={position.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all group ${position.archived ? 'border-yellow-200 opacity-75 hover:opacity-100' : 'border-gray-100'}`}>
                    {/* Top */}
                    <div className="p-5" style={{
              borderBottom: `3px solid ${levelCfg.color}20`
            }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: levelCfg.bg
                }}>
                          <BriefcaseIcon className="w-5 h-5" style={{
                    color: levelCfg.color
                  }} />
                        </div>
                        {!isReadonly && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!position.archived && <button onClick={() => {
                    setEditingPosition(position);
                    setShowModal(true);
                  }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>}
                            <button onClick={() => openConfirm(position)} className={`p-1.5 rounded-lg transition-colors ${position.archived ? 'hover:bg-green-100 text-gray-400 hover:text-green-600' : 'hover:bg-yellow-100 text-gray-400 hover:text-yellow-600'}`}>
                              {position.archived ? <ArchiveRestoreIcon className="w-3.5 h-3.5" /> : <ArchiveIcon className="w-3.5 h-3.5" />}
                            </button>
                          </div>}
                      </div>

                      <h3 className="font-bold text-gray-900 mb-0.5">
                        {String(position.name || '')}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Building2Icon className="w-3 h-3" />
                        {String(position.area || 'Sin área')}
                      </p>

                      <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-lg text-xs font-bold" style={{
                background: levelCfg.bg,
                color: levelCfg.color
              }}>
                        <LayersIcon className="w-3 h-3" />
                        {levelCfg.label}
                      </span>
                    </div>

                    {/* Stats del puesto */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
                      {[{
                label: 'Vacantes',
                value: position.activeVacancies || 0,
                icon: UsersIcon,
                color: TR.green
              }, {
                label: 'Mín.',
                value: position.minScore || 0,
                icon: TargetIcon,
                color: '#f59e0b'
              }, {
                label: 'Nivel',
                value: String(position.level || '').substring(0, 3).toUpperCase(),
                icon: TrendingUpIcon,
                color: TR.blue
              }].map((item) => <div key={item.label} className="p-3 text-center">
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-sm font-black mt-0.5" style={{
                  color: item.color
                }}>
                            {item.value}
                          </p>
                        </div>)}
                    </div>
                  </div>;
        })}
            </div>}

          {/* Paginación */}
          <div className="bg-white rounded-xl border border-gray-100 px-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={visible.length} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} />
          </div>
        </>}

      <PositionFormModal isOpen={showModal} onClose={() => setShowModal(false)} initialData={editingPosition} onSubmit={handleSavePosition} />
      <ConfirmArchiveModal isOpen={confirmModal.open} mode={confirmModal.mode} positionName={confirmModal.position?.name ?? ''} onConfirm={handleConfirmArchive} onCancel={() => setConfirmModal({
      open: false,
      mode: 'archive',
      position: null
    })} />
    </div>;
}