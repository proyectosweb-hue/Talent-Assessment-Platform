import React, { useCallback, useEffect, useState } from 'react';
import {
  SearchIcon, PlusIcon, DownloadIcon, EyeIcon, FilterIcon,
  Loader2Icon, AlertCircleIcon, LockIcon, UsersIcon, CheckCircle2Icon,
  ClockIcon, BriefcaseIcon, XCircleIcon, EditIcon, ArchiveIcon,
  ArchiveRestoreIcon, SaveIcon, XIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { StatusBadge } from '../components/StatusBadge';
import { Candidate } from '../types';
import { useToast } from '../components/Toast';
import { FilterModal } from '../components/FilterModal';
import { Pagination } from '../components/Pagination';
import { PermissionLevel } from '../App';
import { useRealtime } from '../utils/useRealtime';
import { logAudit } from '../utils/useAudit';

const TR = { blue: '#2D4494', navy: '#1a2d6b', green: '#7DB928', greenDark: '#5e8c1e' };
const PAGE_SIZE = 10;

interface CandidatesProps {
  onViewCandidate: (candidate: Candidate) => void;
  onAddNewCandidate: () => void;
  permission?: PermissionLevel;
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {label: string;value: number | string;icon: React.ElementType;color: string;}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-black" style={{ color: TR.navy }}>{value}</p>
      </div>
    </div>);

}

// ── Modal editar candidato ────────────────────────────────────────
interface EditModalProps {
  candidate: Candidate;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = [
{ value: 'pending', label: 'Pendiente' },
{ value: 'completed', label: 'Completado' },
{ value: 'hired', label: 'Contratado' }];


function EditCandidateModal({ candidate, onClose, onSaved }: EditModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [positions, setPositions] = useState<{id: string;name: string;}[]>([]);
  const [loadingPos, setLoadingPos] = useState(false);
  const [form, setForm] = useState({
    name: String(candidate.name || ''),
    email: String(candidate.email || ''),
    position: String(candidate.position || ''),
    status: String(candidate.status || 'pending')
  });

  // Cargar puestos reales al montar
  useEffect(() => {
    setLoadingPos(true);
    supabase.
    from('positions').
    select('id, name').
    or('archived.eq.false,archived.is.null').
    order('name').
    then(({ data }) => setPositions(data || [])).
    finally(() => setLoadingPos(false));
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Nombre y email son obligatorios', 'warning');return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('candidates').update({
        name: form.name.trim(),
        email: form.email.trim(),
        position: form.position,
        status: form.status
      }).eq('id', candidate.id);

      if (error) throw error;

      await logAudit({
        action: 'UPDATE',
        module: 'candidates',
        description: `Candidato "${form.name}" actualizado`,
        entity_id: String(candidate.id),
        entity_name: form.name,
        metadata: { position: form.position, status: form.status }
      });

      showToast('Candidato actualizado', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {setSaving(false);}
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition-all";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-7 py-6 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})` }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15">
              <EditIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Editar Candidato</h2>
              <p className="text-white/50 text-xs mt-0.5">Modificar datos del candidato</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-7 py-5 space-y-4">

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nombre Completo *</label>
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="Nombre completo" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email *</label>
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Puesto</label>
            <select value={form.position} onChange={(e) => set('position', e.target.value)}
            className={inputClass} disabled={loadingPos}>
              <option value="">{loadingPos ? 'Cargando puestos...' : 'Sin puesto asignado'}</option>
              {positions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              {!loadingPos && positions.length === 0 &&
              <option disabled>No hay puestos activos</option>
              }
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Estado</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) =>
              <button key={opt.value} type="button"
              onClick={() => set('status', opt.value)}
              className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
              style={{
                borderColor: form.status === opt.value ? TR.blue : '#e5e7eb',
                background: form.status === opt.value ? `${TR.blue}12` : '#fafafa',
                color: form.status === opt.value ? TR.blue : '#9ca3af'
              }}>
                  {opt.label}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`, boxShadow: `0 4px 12px ${TR.green}40` }}>
              {saving ?
              <><Loader2Icon className="w-4 h-4 animate-spin" /> Guardando...</> :
              <><SaveIcon className="w-4 h-4" /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>);

}

// ── Modal confirmar archivo/desarchivar ───────────────────────────
interface ArchiveModalProps {
  candidate: Candidate;
  mode: 'archive' | 'unarchive';
  onConfirm: () => void;
  onCancel: () => void;
}

function ArchiveCandidateModal({ candidate, mode, onConfirm, onCancel }: ArchiveModalProps) {
  const isArchiving = mode === 'archive';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative px-6 py-5 flex items-center justify-between"
        style={{ background: isArchiving ? 'linear-gradient(135deg, #b45309, #92400e)' : `linear-gradient(135deg, ${TR.greenDark}, ${TR.green})` }}>
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
              {isArchiving ? <ArchiveIcon className="w-5 h-5 text-white" /> : <ArchiveRestoreIcon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="font-black text-white text-base">{isArchiving ? 'Archivar Candidato' : 'Restaurar Candidato'}</h2>
              <p className="text-white/50 text-xs mt-0.5">{isArchiving ? 'Dejará de aparecer en la lista' : 'Volverá a la lista activa'}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            {isArchiving ?
            <>¿Estás seguro de archivar a <strong className="text-gray-900">"{String(candidate.name)}"</strong>? No aparecerá en la lista activa.</> :
            <>¿Deseas restaurar a <strong className="text-gray-900">"{String(candidate.name)}"</strong> a la lista activa?</>}
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:opacity-90"
          style={{ background: isArchiving ? 'linear-gradient(135deg, #b45309, #92400e)' : `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})` }}>
            {isArchiving ? 'Sí, archivar' : 'Sí, restaurar'}
          </button>
        </div>
      </div>
    </div>);

}

// ── Componente principal ──────────────────────────────────────────
export function Candidates({ onViewCandidate, onAddNewCandidate, permission = 'full' }: CandidatesProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{candidate: Candidate;mode: 'archive' | 'unarchive';} | null>(null);
  const { showToast } = useToast();
  const isReadonly = permission === 'readonly';

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);setError(null);
      const { data, error: err } = await supabase.
      from('candidates').select('*').order('id', { ascending: false });
      if (err) throw err;
      setCandidates(data || []);
    } catch (err: any) {
      setError(err.message);
      showToast('Error al conectar con la base de datos', 'error');
    } finally {setLoading(false);}
  }, [showToast]);

  useEffect(() => {fetchCandidates();}, [fetchCandidates]);
  useEffect(() => {setCurrentPage(1);}, [searchTerm, showArchived]);

  // ── Tiempo real ──────────────────────────────────────────────────
  useRealtime({ table: 'candidates', onChange: fetchCandidates });

  // ── Separar activos / archivados ──────────────────────────────────
  const active = candidates.filter((c) => !c.archived);
  const archived = candidates.filter((c) => c.archived);
  const pool = showArchived ? archived : active;

  const filtered = pool.filter((c) =>
  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  c.position && c.position.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = {
    total: active.length,
    pending: active.filter((c) => c.status === 'pending').length,
    completed: active.filter((c) => c.status === 'completed').length,
    hired: active.filter((c) => c.status === 'hired').length
  };

  const getCompatColor = (v: number) =>
  v >= 80 ? TR.green : v >= 65 ? TR.blue : v >= 50 ? '#f59e0b' : '#ef4444';

  // ── Archivar / desarchivar ────────────────────────────────────────
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    const { candidate, mode } = archiveTarget;
    const isArchiving = mode === 'archive';
    try {
      const { error } = await supabase.
      from('candidates').
      update({ archived: isArchiving }).
      eq('id', candidate.id);
      if (error) throw error;

      await logAudit({
        action: isArchiving ? 'ARCHIVE' : 'UNARCHIVE',
        module: 'candidates',
        description: `Candidato "${candidate.name}" ${isArchiving ? 'archivado' : 'restaurado'}`,
        entity_id: String(candidate.id),
        entity_name: String(candidate.name)
      });

      showToast(isArchiving ? 'Candidato archivado' : 'Candidato restaurado', 'success');
      fetchCandidates();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {setArchiveTarget(null);}
  };

  // ── Exportar CSV ──────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Nombre', 'Email', 'Puesto', 'Estado', 'Compatibilidad'];
    const rows = filtered.map((c) => [c.name, c.email, c.position || '', c.status, `${c.compatibility || 0}%`]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;a.download = `candidatos_${new Date().toISOString().slice(0, 10)}.csv`;a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado', 'success');
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: TR.navy }}>Candidatos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {filtered.length} {showArchived ? 'archivados' : 'registros'}
            {searchTerm ? ` para "${searchTerm}"` : ''}
            {isReadonly &&
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                <LockIcon className="w-3 h-3" />Solo lectura
              </span>
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-600 shadow-sm transition-colors">
            <DownloadIcon className="w-4 h-4" /> Exportar
          </button>
          {!isReadonly &&
          <button onClick={onAddNewCandidate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
              <PlusIcon className="w-4 h-4" /> Nuevo Candidato
            </button>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Activos" value={stats.total} icon={UsersIcon} color={TR.blue} />
        <StatCard label="Pendientes" value={stats.pending} icon={ClockIcon} color="#f59e0b" />
        <StatCard label="Completados" value={stats.completed} icon={CheckCircle2Icon} color={TR.green} />
        <StatCard label="Contratados" value={stats.hired} icon={BriefcaseIcon} color={TR.navy} />
      </div>

      {/* Buscador + filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, correo o puesto..."
          className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50/50 focus:bg-white transition-colors"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm &&
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <XCircleIcon className="w-4 h-4" />
            </button>
          }
        </div>

        {/* Toggle archivados */}
        <button onClick={() => setShowArchived(!showArchived)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${showArchived ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <ArchiveIcon className="w-4 h-4" />
          {showArchived ? `Activos (${active.length})` : `Archivados (${archived.length})`}
        </button>

        <button onClick={() => setShowFilterModal(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <FilterIcon className="w-4 h-4" /> Filtros
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ?
        <div className="flex flex-col items-center justify-center h-64">
            <Loader2Icon className="w-10 h-10 animate-spin mb-3" style={{ color: TR.blue }} />
            <p className="text-gray-400 text-sm">Cargando candidatos...</p>
          </div> :
        error ?
        <div className="flex flex-col items-center justify-center h-64 text-red-400 p-6 text-center">
            <AlertCircleIcon className="w-12 h-12 mb-3" />
            <p className="font-bold text-red-600">Error de conexión</p>
            <p className="text-sm mt-1 opacity-80">{error}</p>
            <button onClick={fetchCandidates} className="mt-4 text-sm font-bold underline" style={{ color: TR.blue }}>Reintentar</button>
          </div> :

        <>
            {/* Header tabla */}
            <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100"
          style={{ background: showArchived ? '#fffbeb' : '#fafafa' }}>
              <div className="col-span-4">Candidato</div>
              <div className="col-span-3">Puesto</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Compatibilidad</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Filas */}
            <div className="divide-y divide-gray-50">
              {paginated.length === 0 ?
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                  <UsersIcon className="w-12 h-12 mb-3" />
                  <p className="font-medium text-gray-400">
                    {showArchived ? 'Sin candidatos archivados' : 'No se encontraron candidatos'}
                  </p>
                </div> :
            paginated.map((candidate) => {
              const compat = Number(candidate.compatibility) || 0;
              const color = getCompatColor(compat);
              return (
                <div key={candidate.id}
                className={`grid grid-cols-12 px-6 py-4 items-center transition-colors group cursor-default ${showArchived ? 'hover:bg-yellow-50/30 bg-yellow-50/10' : 'hover:bg-blue-50/30'}`}>

                    {/* Candidato */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: showArchived ? '#94a3b8' : `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                        {String(candidate.name || '').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${showArchived ? 'text-gray-400' : 'text-gray-900'}`}>{String(candidate.name || '')}</p>
                        <p className="text-xs text-gray-400">{String(candidate.email || '')}</p>
                      </div>
                    </div>

                    {/* Puesto */}
                    <div className="col-span-3">
                      <span className="text-sm text-gray-600 font-medium">{String(candidate.position || 'Sin puesto')}</span>
                    </div>

                    {/* Estado */}
                    <div className="col-span-2">
                      <StatusBadge status={candidate.status} />
                    </div>

                    {/* Compatibilidad */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${compat}%`, background: color }} />
                      </div>
                      <span className="text-xs font-bold w-9 text-right" style={{ color }}>{compat}%</span>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1 flex justify-end items-center gap-1">
                      {/* Ver — solo candidatos activos */}
                      {!showArchived &&
                    <button onClick={() => onViewCandidate(candidate)}
                    title="Ver perfil"
                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-blue-100"
                    style={{ color: TR.blue }}>
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                    }

                      {/* Editar — solo con permiso y activos */}
                      {!isReadonly && !showArchived &&
                    <button onClick={() => setEditingCandidate(candidate)}
                    title="Editar candidato"
                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-green-100"
                    style={{ color: TR.green }}>
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                    }

                      {/* Archivar / Restaurar */}
                      {!isReadonly &&
                    <button
                      onClick={() => setArchiveTarget({
                        candidate,
                        mode: showArchived ? 'unarchive' : 'archive'
                      })}
                      title={showArchived ? 'Restaurar candidato' : 'Archivar candidato'}
                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${showArchived ? 'hover:bg-green-100' : 'hover:bg-yellow-100'}`}
                      style={{ color: showArchived ? TR.green : '#b45309' }}>
                          {showArchived ?
                      <ArchiveRestoreIcon className="w-3.5 h-3.5" /> :
                      <ArchiveIcon className="w-3.5 h-3.5" />}
                        </button>
                    }
                    </div>
                  </div>);

            })}
            </div>

            {/* Paginación */}
            <div className="border-t border-gray-100 px-6">
              <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setCurrentPage} />
            
            </div>
          </>
        }
      </div>

      {/* Modales */}
      {editingCandidate &&
      <EditCandidateModal
        candidate={editingCandidate}
        onClose={() => setEditingCandidate(null)}
        onSaved={fetchCandidates} />

      }

      {archiveTarget &&
      <ArchiveCandidateModal
        candidate={archiveTarget.candidate}
        mode={archiveTarget.mode}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)} />

      }

      <FilterModal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} />
    </div>);

}