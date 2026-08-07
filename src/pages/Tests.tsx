import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardListIcon, PlayIcon, FileTextIcon, EditIcon, CopyIcon,
  ArchiveIcon, RotateCcwIcon, LockIcon, SearchIcon, XCircleIcon,
  ClockIcon, CheckCircle2Icon, LayersIcon, PlusIcon, XIcon, SaveIcon,
  Loader2Icon, ChevronDownIcon, ChevronUpIcon, Trash2Icon } from
'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { PermissionLevel } from '../App';
import { useRealtime } from '../utils/useRealtime';
import { logAudit } from '../utils/useAudit';

const TR = { blue: '#2D4494', navy: '#1a2d6b', green: '#7DB928', greenDark: '#5e8c1e' };

interface TestsProps {
  onApplyTest?: (testId: string, candidateId: string) => void;
  permission?: PermissionLevel;
}

// ── Helpers de ID ─────────────────────────────────────────────────
const toStrId = (id: any): string => String(id ?? '').trim();
const isValidId = (id: any): boolean => {
  const s = toStrId(id);
  return s.length > 0 && s !== 'undefined' && s !== 'null' && s !== 'NaN' && s !== '0';
};

// ── Modal: Crear / Editar Grupo ───────────────────────────────────
function GroupFormModal({ group, allTests, allCandidates, onClose, onSaved





}: {group: any | null;allTests: any[];allCandidates: any[];onClose: () => void;onSaved: () => void;}) {
  const { showToast } = useToast();
  const [name, setName] = useState(group?.name || '');
  const [description, setDesc] = useState(group?.description || '');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');

  useEffect(() => {
    if (!group) return;
    setLoadingRelations(true);
    Promise.all([
    supabase.from('test_group_tests').select('test_id').eq('group_id', group.id),
    supabase.from('test_group_candidates').select('candidate_id').eq('group_id', group.id)]
    ).then(([tRes, cRes]) => {
      setSelectedTests((tRes.data || []).map((r: any) => toStrId(r.test_id)).filter(isValidId));
      setSelectedCandidates((cRes.data || []).map((r: any) => toStrId(r.candidate_id)).filter(isValidId));
    }).finally(() => setLoadingRelations(false));
  }, [group]);

  const toggleTest = (id: any) => {const s = toStrId(id);if (!isValidId(s)) return;setSelectedTests((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);};
  const toggleCandidate = (id: any) => {const s = toStrId(id);setSelectedCandidates((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);};

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {showToast('El nombre es obligatorio', 'warning');return;}
    const validTestIds = selectedTests.filter(isValidId);
    if (validTestIds.length === 0) {showToast('Selecciona al menos una prueba', 'warning');return;}
    setSaving(true);
    try {
      let groupId: string;
      if (group) {
        const { error } = await supabase.from('test_groups').update({ name: name.trim(), description: description.trim() }).eq('id', group.id);
        if (error) throw error;
        groupId = toStrId(group.id);
        await Promise.all([
        supabase.from('test_group_tests').delete().eq('group_id', groupId),
        supabase.from('test_group_candidates').delete().eq('group_id', groupId)]
        );
      } else {
        const { data, error } = await supabase.from('test_groups').insert({ name: name.trim(), description: description.trim() }).select('id').single();
        if (error) throw error;
        if (!data?.id) throw new Error('No se obtuvo el ID del grupo');
        groupId = data.id;
      }
      if (!groupId) throw new Error('groupId inválido');

      const { error: testsError } = await supabase.from('test_group_tests').insert(validTestIds.map((id) => ({ group_id: groupId, test_id: id })));
      if (testsError) throw testsError;

      if (selectedCandidates.length > 0) {
        const { error: candidatesError } = await supabase.from('test_group_candidates').insert(selectedCandidates.filter(isValidId).map((candidate_id) => ({ group_id: groupId, candidate_id })));
        if (candidatesError) throw candidatesError;
      }

      await logAudit({ action: group ? 'UPDATE' : 'CREATE', module: 'tests', description: `Grupo "${name}" ${group ? 'actualizado' : 'creado'} con ${validTestIds.length} pruebas y ${selectedCandidates.length} candidatos`, entity_name: name });
      showToast(group ? 'Grupo actualizado' : 'Grupo creado', 'success');
      onSaved();onClose();
    } catch (err: any) {
      console.error(err);showToast('Error: ' + err.message, 'error');
    } finally {setSaving(false);}
  };

  const filteredCandidates = allCandidates.filter((c) =>
  !candidateSearch.trim() ||
  (c.name || '').toLowerCase().includes(candidateSearch.toLowerCase()) ||
  (c.email || '').toLowerCase().includes(candidateSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header con degradado TR */}
        <div className="relative px-7 py-6 flex items-center justify-between flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})` }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15">
              <LayersIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{group ? 'Editar Grupo' : 'Nuevo Grupo de Pruebas'}</h2>
              <p className="text-white/50 text-xs mt-0.5">Asigna pruebas y candidatos con acceso</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-5 space-y-5 overflow-y-auto flex-1">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nombre del Grupo *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition-all"
              placeholder="Ej: Contabilidad, Ventas..." />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Descripción</label>
              <input type="text" value={description} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900 transition-all"
              placeholder="Descripción opcional..." />
            </div>

            {/* Pruebas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Pruebas incluidas <span className="text-gray-300 font-normal normal-case">({selectedTests.length} seleccionadas)</span>
              </label>
              {loadingRelations ?
              <div className="flex items-center gap-2 text-gray-400 text-sm py-3"><Loader2Icon className="w-4 h-4 animate-spin" /> Cargando...</div> :
              allTests.length === 0 ?
              <p className="text-sm text-gray-400 py-2">No hay pruebas disponibles</p> :

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {allTests.map((t) => {
                  const selected = selectedTests.includes(toStrId(t.id));
                  return (
                    <div key={t.id} onClick={() => toggleTest(t.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
                    style={{ borderColor: selected ? TR.blue : '#e5e7eb', background: selected ? `${TR.blue}08` : '#fafafa' }}>
                        {/* Checkbox visual */}
                        <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: selected ? TR.blue : '#d1d5db', background: selected ? TR.blue : 'white' }}>
                          {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                          {t.format && <p className="text-xs text-gray-400">{t.format}{t.duration ? ` · ${t.duration} min` : ''}</p>}
                        </div>
                      </div>);

                })}
                </div>
              }
            </div>

            {/* Candidatos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Candidatos con acceso <span className="text-gray-300 font-normal normal-case">({selectedCandidates.length} seleccionados)</span>
              </label>
              <div className="relative mb-2">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Buscar candidato..."
                value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white" />
              </div>
              {loadingRelations ?
              <div className="flex items-center gap-2 text-gray-400 text-sm py-3"><Loader2Icon className="w-4 h-4 animate-spin" /> Cargando...</div> :
              filteredCandidates.length === 0 ?
              <p className="text-sm text-gray-400 py-2">{candidateSearch ? `Sin resultados para "${candidateSearch}"` : 'No hay candidatos'}</p> :

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCandidates.map((c) => {
                  const selected = selectedCandidates.includes(toStrId(c.id));
                  return (
                    <div key={c.id} onClick={() => toggleCandidate(c.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
                    style={{ borderColor: selected ? TR.green : '#e5e7eb', background: selected ? `${TR.green}08` : '#fafafa' }}>
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background: selected ? `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})` : `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                          {String(c.name || '').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                        {/* Checkbox visual */}
                        <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: selected ? TR.green : '#d1d5db', background: selected ? TR.green : 'white' }}>
                          {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                      </div>);

                })}
                </div>
              }
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-shrink-0">
            <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || loadingRelations}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`, boxShadow: `0 4px 12px ${TR.green}40` }}>
              {saving ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Guardando...</> : <><SaveIcon className="w-4 h-4" /> {group ? 'Guardar Cambios' : 'Crear Grupo'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>);

}

// ── Componente principal ──────────────────────────────────────────
export function Tests({ onApplyTest, permission = 'full' }: TestsProps) {
  const [tests, setTests] = useState<any[]>([]);
  const [archivedTests, setArchivedTests] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [groupDetails, setGroupDetails] = useState<Record<string, {tests: string[];candidates: string[];}>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tests' | 'groups'>('tests');
  const [showArchivedSection, setShowArchivedSection] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [selectedTestForAction, setSelectedTestForAction] = useState<any | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const { showToast } = useToast();
  const isReadonly = permission === 'readonly';

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [testsRes, archivedRes, groupsRes, candidatesRes] = await Promise.all([
      supabase.from('tests').select('*').or('archived.eq.false,archived.is.null'),
      supabase.from('tests').select('*').eq('archived', true),
      supabase.from('test_groups').select('*').order('name'),
      supabase.from('candidates').select('id, name, email, position').or('archived.eq.false,archived.is.null').order('name')]
      );
      setTests(testsRes.data || []);
      setArchivedTests(archivedRes.data || []);
      setGroups(groupsRes.data || []);
      setAllCandidates(candidatesRes.data || []);

      const gids = (groupsRes.data || []).map((g: any) => g.id);
      if (gids.length > 0) {
        const [gtRes, gcRes] = await Promise.all([
        supabase.from('test_group_tests').select('group_id, test_id').in('group_id', gids),
        supabase.from('test_group_candidates').select('group_id, candidate_id').in('group_id', gids)]
        );
        const details: Record<string, {tests: string[];candidates: string[];}> = {};
        gids.forEach((gid: any) => {
          const strGid = toStrId(gid);
          details[strGid] = {
            tests: (gtRes.data || []).filter((r: any) => toStrId(r.group_id) === strGid).map((r: any) => toStrId(r.test_id)).filter(isValidId),
            candidates: (gcRes.data || []).filter((r: any) => toStrId(r.group_id) === strGid).map((r: any) => toStrId(r.candidate_id)).filter(isValidId)
          };
        });
        setGroupDetails(details);
      }
    } catch (err) {console.error(err);} finally
    {setLoading(false);}
  }, []);

  useEffect(() => {loadAll();}, [loadAll]);

  useRealtime({ table: 'tests', onChange: loadAll });
  useRealtime({ table: 'test_groups', onChange: loadAll });
  useRealtime({ table: 'test_group_tests', onChange: loadAll });
  useRealtime({ table: 'test_group_candidates', onChange: loadAll });

  const loadCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').or('archived.eq.false,archived.is.null');
    setCandidates(data || []);
  };

  const handleEditClick = (test: any) => {if (isReadonly) {showToast('Sin permisos', 'error');return;};setSelectedTestForAction({ ...test });setShowEditModal(true);};
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();if (!selectedTestForAction) return;
    const { error } = await supabase.from('tests').update({ name: selectedTestForAction.name }).eq('id', selectedTestForAction.id);
    if (error) {showToast(`Error: ${error.message}`, 'error');return;}
    await logAudit({ action: 'UPDATE', module: 'tests', description: `Prueba "${selectedTestForAction.name}" editada`, entity_name: selectedTestForAction.name });
    showToast('Guardado', 'success');setShowEditModal(false);loadAll();
  };
  const handleArchiveClick = (test: any) => {if (isReadonly) {showToast('Sin permisos', 'error');return;};setSelectedTestForAction(test);setShowArchiveModal(true);};
  const confirmArchive = async () => {
    if (!selectedTestForAction) return;
    const { error } = await supabase.from('tests').update({ archived: true }).eq('id', selectedTestForAction.id);
    if (error) {showToast(`Error: ${error.message}`, 'error');return;}
    await logAudit({ action: 'ARCHIVE', module: 'tests', description: `Prueba "${selectedTestForAction.name}" archivada`, entity_name: selectedTestForAction.name });
    showToast('Prueba archivada', 'success');setShowArchiveModal(false);loadAll();
  };
  const handleRestoreClick = async (test: any) => {
    if (isReadonly) {showToast('Sin permisos', 'error');return;}
    const { error } = await supabase.from('tests').update({ archived: false }).eq('id', test.id);
    if (error) {showToast(`Error: ${error.message}`, 'error');return;}
    await logAudit({ action: 'UNARCHIVE', module: 'tests', description: `Prueba "${test.name}" restaurada`, entity_name: test.name });
    showToast('Prueba restaurada', 'success');loadAll();
  };
  const handleDuplicateTest = async (test: any) => {
    if (isReadonly) {showToast('Sin permisos', 'error');return;}
    const { error } = await supabase.from('tests').insert({ name: test.name + ' (Copia)', description: test.description, format: test.format, archived: false });
    if (error) {showToast(`Error: ${error.message}`, 'error');return;}
    await logAudit({ action: 'CREATE', module: 'tests', description: `Prueba "${test.name + ' (Copia)'}" duplicada`, entity_name: test.name + ' (Copia)' });
    showToast('Duplicado', 'success');loadAll();
  };
  const handleApply = async (test: any) => {setSelectedTestForAction(test);await loadCandidates();setCandidateSearch('');setShowApplyModal(true);};
  const startTest = (candidateId: string) => {if (onApplyTest && selectedTestForAction) onApplyTest(selectedTestForAction.id, candidateId);};
  const handleDeleteGroup = async (group: any) => {
    if (!window.confirm(`¿Eliminar el grupo "${group.name}"?`)) return;
    const { error } = await supabase.from('test_groups').delete().eq('id', group.id);
    if (error) {showToast('Error: ' + error.message, 'error');return;}
    await logAudit({ action: 'DELETE', module: 'tests', description: `Grupo "${group.name}" eliminado`, entity_name: group.name });
    showToast('Grupo eliminado', 'success');loadAll();
  };

  const filteredTests = tests.filter((t) => String(t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCandidates = candidates.filter((c) => String(c.name || '').toLowerCase().includes(candidateSearch.toLowerCase()) || String(c.email || '').toLowerCase().includes(candidateSearch.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <ClipboardListIcon className="w-10 h-10 animate-pulse mb-3" style={{ color: TR.blue }} />
      <p className="text-gray-400 text-sm">Cargando pruebas...</p>
    </div>);


  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: TR.navy }}>Pruebas Psicométricas</h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            Gestiona evaluaciones y grupos por candidato
            {isReadonly && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold"><LockIcon className="w-3 h-3" />Solo lectura</span>}
          </p>
        </div>
        {!isReadonly && activeTab === 'groups' &&
        <button onClick={() => {setEditingGroup(null);setShowGroupModal(true);}}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
            <PlusIcon className="w-4 h-4" /> Nuevo Grupo
          </button>
        }
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
        { label: 'Total Pruebas', value: tests.length, icon: ClipboardListIcon, color: TR.blue },
        { label: 'Activas', value: tests.length, icon: CheckCircle2Icon, color: TR.green },
        { label: 'Archivadas', value: archivedTests.length, icon: ArchiveIcon, color: '#94a3b8' },
        { label: 'Grupos', value: groups.length, icon: LayersIcon, color: TR.navy }].
        map((s) =>
        <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-xl font-black" style={{ color: TR.navy }}>{s.value}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
        { id: 'tests', label: 'Pruebas', icon: ClipboardListIcon },
        { id: 'groups', label: 'Grupos por Candidato', icon: LayersIcon }] as
        const).map((tab) =>
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
        style={{
          background: activeTab === tab.id ? 'white' : 'transparent',
          color: activeTab === tab.id ? TR.blue : '#6b7280',
          boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
        }}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        )}
      </div>

      {/* ═══ TAB: PRUEBAS ═══ */}
      {activeTab === 'tests' &&
      <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar prueba por nombre o descripción..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50/50 focus:bg-white" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><XCircleIcon className="w-4 h-4" /></button>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">
                Pruebas Activas
                {searchTerm && <span className="ml-2 text-sm font-normal text-gray-400">({filteredTests.length} de {tests.length})</span>}
              </h2>
            </div>
            {filteredTests.length === 0 ?
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <ClipboardListIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400">{searchTerm ? `Sin resultados para "${searchTerm}"` : 'No hay pruebas activas'}</p>
              </div> :

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTests.map((test) =>
            <div key={test.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="p-5" style={{ borderBottom: `3px solid ${TR.blue}15` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${TR.blue}12` }}>
                          <ClipboardListIcon className="w-5 h-5" style={{ color: TR.blue }} />
                        </div>
                        {!isReadonly &&
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(test)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"><EditIcon className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDuplicateTest(test)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"><CopyIcon className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleArchiveClick(test)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-yellow-600 transition-colors"><ArchiveIcon className="w-3.5 h-3.5" /></button>
                          </div>
                  }
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{String(test.name || '')}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{String(test.description || 'Sin descripción')}</p>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-1.5"><FileTextIcon className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500 font-medium">{String(test.format || 'Estándar')}</span></div>
                      {test.duration && <div className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500">{test.duration} min</span></div>}
                    </div>
                    <div className="px-5 pb-5 pt-3">
                      <button onClick={() => handleApply(test)}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`, boxShadow: `0 4px 14px ${TR.green}40` }}>
                        <PlayIcon className="w-4 h-4" /> Aplicar Prueba
                      </button>
                    </div>
                  </div>
            )}
              </div>
          }
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button onClick={() => setShowArchivedSection(!showArchivedSection)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800">
              <ArchiveIcon className="w-4 h-4" /> Pruebas Archivadas ({archivedTests.length})
              {showArchivedSection ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
            {showArchivedSection && archivedTests.length > 0 &&
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {archivedTests.map((test) =>
            <div key={test.id} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden opacity-70 hover:opacity-100 transition-all">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200"><ClipboardListIcon className="w-5 h-5 text-gray-500" /></div>
                        {!isReadonly &&
                  <div className="flex gap-1">
                            <button onClick={() => handleDuplicateTest(test)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"><CopyIcon className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleRestoreClick(test)} className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600"><RotateCcwIcon className="w-3.5 h-3.5" /></button>
                          </div>
                  }
                      </div>
                      <h3 className="font-bold text-gray-700 mb-1">{String(test.name || '')}</h3>
                      <p className="text-xs text-gray-400">{String(test.description || '')}</p>
                    </div>
                    <div className="px-5 py-2 bg-gray-100/50 text-center"><span className="text-xs text-gray-400 font-medium">Archivada</span></div>
                  </div>
            )}
              </div>
          }
          </div>
        </>
      }

      {/* ═══ TAB: GRUPOS ═══ */}
      {activeTab === 'groups' &&
      <div className="space-y-4">
          {groups.length === 0 ?
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <LayersIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 font-medium">Sin grupos creados</p>
              <p className="text-sm text-gray-300 mt-1">Crea un grupo para asignar pruebas a candidatos específicos</p>
              {!isReadonly &&
          <button onClick={() => {setEditingGroup(null);setShowGroupModal(true);}}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md mx-auto"
          style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                  <PlusIcon className="w-4 h-4" /> Crear primer grupo
                </button>
          }
            </div> :
        groups.map((group) => {
          const detail = groupDetails[toStrId(group.id)] || { tests: [], candidates: [] };
          const groupTests = tests.filter((t) => detail.tests.includes(toStrId(t.id)));
          const groupCands = allCandidates.filter((c) => detail.candidates.includes(toStrId(c.id)));
          return (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100"
              style={{ background: `linear-gradient(135deg, ${TR.navy}06, ${TR.blue}06)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${TR.blue}12` }}>
                      <LayersIcon className="w-5 h-5" style={{ color: TR.blue }} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{group.name}</p>
                      {group.description && <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>}
                    </div>
                  </div>
                  {!isReadonly &&
                <div className="flex gap-2">
                      <button onClick={() => {setEditingGroup(group);setShowGroupModal(true);}}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: `${TR.blue}10`, color: TR.blue }}>
                        <EditIcon className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => handleDeleteGroup(group)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100">
                        <Trash2Icon className="w-3 h-3" /> Eliminar
                      </button>
                    </div>
                }
                </div>
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Pruebas ({groupTests.length})</p>
                    {groupTests.length === 0 ? <p className="text-xs text-gray-300 italic">Sin pruebas asignadas</p> :
                  <div className="space-y-1.5">
                        {groupTests.map((t) =>
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${TR.blue}06` }}>
                            <ClipboardListIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TR.blue }} />
                            <span className="text-xs font-semibold text-gray-700 truncate">{t.name}</span>
                          </div>
                    )}
                      </div>
                  }
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Candidatos ({groupCands.length})</p>
                    {groupCands.length === 0 ? <p className="text-xs text-gray-300 italic">Sin candidatos asignados</p> :
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {groupCands.map((c) =>
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${TR.green}08` }}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})` }}>
                              {String(c.name || '').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">{c.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
                            </div>
                          </div>
                    )}
                      </div>
                  }
                  </div>
                </div>
              </div>);

        })}
        </div>
      }

      {/* Modal aplicar */}
      {showApplyModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${TR.blue}08, ${TR.green}08)` }}>
              <h2 className="font-bold text-lg" style={{ color: TR.navy }}>Aplicar Prueba</h2>
              <p className="text-sm text-gray-500 mt-0.5">{selectedTestForAction.name}</p>
            </div>
            <div className="p-5">
              <div className="relative mb-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar candidato..." value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white" />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCandidates.length === 0 ?
              <p className="text-center text-gray-400 py-6 text-sm">No se encontraron candidatos</p> :
              filteredCandidates.map((c) =>
              <button key={c.id} onClick={() => startTest(c.id)}
              className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                        {String(c.name || '').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800 group-hover:text-blue-700">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </button>
              )}
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setShowApplyModal(false)} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      }

      {/* Modal editar prueba */}
      {showEditModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100"><h3 className="font-bold text-gray-900">Editar Prueba</h3></div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              value={selectedTestForAction.name}
              onChange={(e) => setSelectedTestForAction({ ...selectedTestForAction, name: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm text-gray-600">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: TR.blue }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      }

      {/* Modal archivar prueba */}
      {showArchiveModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-yellow-100 bg-yellow-50">
              <h3 className="font-bold text-yellow-900">Archivar Prueba</h3>
              <p className="text-sm text-yellow-700 mt-1">¿Archivar "<strong>{selectedTestForAction.name}</strong>"?</p>
            </div>
            <div className="p-5 flex gap-3">
              <button onClick={() => setShowArchiveModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm text-gray-600">Cancelar</button>
              <button onClick={confirmArchive} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm bg-yellow-500 hover:bg-yellow-600">Archivar</button>
            </div>
          </div>
        </div>
      }

      {/* Modal grupo */}
      {showGroupModal &&
      <GroupFormModal
        group={editingGroup}
        allTests={tests}
        allCandidates={allCandidates}
        onClose={() => setShowGroupModal(false)}
        onSaved={loadAll} />

      }
    </div>);

}