import React, { useEffect, useState } from 'react';
import {
  ClipboardListIcon,
  PlayIcon,
  FileTextIcon,
  BarChart3Icon,
  EditIcon,
  CopyIcon,
  ArchiveIcon,
  RotateCcwIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border p-6 flex justify-between items-center hover:shadow-md transition">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>);

}
export function Tests({
  onApplyTest


}: {onApplyTest?: (testId: string, candidateId: string) => void;}) {
  const [tests, setTests] = useState<any[]>([]);
  const [archivedTests, setArchivedTests] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showArchivedSection, setShowArchivedSection] = useState(false);
  const [selectedTestForAction, setSelectedTestForAction] = useState<
    any | null>(
    null);
  const { showToast } = useToast();
  useEffect(() => {
    loadTests();
    loadArchivedTests();
  }, []);
  const loadTests = async () => {
    const { data, error } = await supabase.
    from('tests').
    select('*').
    or('archived.eq.false,archived.is.null');
    if (error) {
      console.error('Error cargando tests:', error);
    }
    setTests(data || []);
    setLoading(false);
  };

  const loadArchivedTests = async () => {
    const { data, error } = await supabase.
    from('tests').
    select('*').
    eq('archived', true);
    if (error) {
      console.error('Error cargando tests archivados:', error);
    }
    setArchivedTests(data || []);
  };

  const loadCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*');
    setCandidates(data || []);
  };
  const handleEditClick = (test: any) => {
    setSelectedTestForAction({
      ...test
    });
    setShowEditModal(true);
  };
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForAction) return;

    const { error } = await supabase.
    from('tests').
    update({
      name: selectedTestForAction.name
    }).
    eq('id', selectedTestForAction.id);

    if (error) {
      console.error('Error guardando:', error);
      showToast(`Error al guardar: ${error.message}`, 'error');
      return;
    }

    showToast('Cambios guardados', 'success');
    setShowEditModal(false);
    loadTests();
  };
  const handleArchiveClick = (test: any) => {
    setSelectedTestForAction(test);
    setShowArchiveModal(true);
  };
  const confirmArchive = async () => {
    if (!selectedTestForAction) return;

    const { error } = await supabase.
    from('tests').
    update({ archived: true }).
    eq('id', selectedTestForAction.id);

    if (error) {
      console.error('Error archivando:', error);
      showToast(`Error al archivar: ${error.message}`, 'error');
      return;
    }

    showToast('Prueba archivada correctamente', 'success');
    setShowArchiveModal(false);
    loadTests();
    loadArchivedTests();
  };

  const handleRestoreClick = async (test: any) => {
    const { error } = await supabase.
    from('tests').
    update({ archived: false }).
    eq('id', test.id);

    if (error) {
      console.error('Error restaurando:', error);
      showToast(`Error al restaurar: ${error.message}`, 'error');
      return;
    }

    showToast('Prueba restaurada correctamente', 'success');
    loadTests();
    loadArchivedTests();
  };

  const handleDuplicateTest = async (test: any) => {
    const { error } = await supabase.from('tests').insert({
      name: test.name + ' (Copia)',
      description: test.description,
      format: test.format,
      archived: false
    });

    if (error) {
      console.error('Error duplicando:', error);
      showToast(`Error al duplicar: ${error.message}`, 'error');
      return;
    }

    showToast('Duplicado correctamente', 'success');
    loadTests();
  };
  const handleApply = async (test: any) => {
    setSelectedTestForAction(test);
    await loadCandidates();
    setShowApplyModal(true);
  };
  const startTest = (candidateId: string) => {
    if (onApplyTest && selectedTestForAction) {
      onApplyTest(selectedTestForAction.id, candidateId);
    }
  };
  if (loading) return <div className="p-6">Cargando...</div>;
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Pruebas Psicométricas
        </h1>
        <p className="text-gray-500 mt-1">
          Gestiona y aplica evaluaciones laborales
        </p>
      </div>
 
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Pruebas"
          value={tests.length}
          icon={<ClipboardListIcon />}
          color="bg-blue-50" />
        
        <StatCard
          label="Aplicaciones"
          value="--"
          icon={<PlayIcon />}
          color="bg-purple-50" />
        
        <StatCard
          label="Resultados"
          value="--"
          icon={<BarChart3Icon />}
          color="bg-orange-50" />
        
        <StatCard
          label="Items"
          value="--"
          icon={<FileTextIcon />}
          color="bg-green-50" />
        
      </div>
 
      {/* PRUEBAS ACTIVAS */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pruebas Activas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tests.map((test) =>
          <div
            key={test.id}
            className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{test.name}</h3>
                  <p className="text-sm text-gray-500">{test.description}</p>
                </div>
 
                <div className="flex gap-2">
                  <button
                  onClick={() => handleEditClick(test)}
                  className="p-2 hover:bg-blue-50 rounded-lg">
                  
                    <EditIcon className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                  </button>
                  <button
                  onClick={() => handleDuplicateTest(test)}
                  className="p-2 hover:bg-green-50 rounded-lg">
                  
                    <CopyIcon className="w-4 h-4 text-gray-500 hover:text-green-600" />
                  </button>
                  <button
                  onClick={() => handleArchiveClick(test)}
                  className="p-2 hover:bg-yellow-50 rounded-lg">
                  
                    <ArchiveIcon className="w-4 h-4 text-gray-500 hover:text-yellow-600" />
                  </button>
                </div>
              </div>
 
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Formato</p>
                <p className="font-medium text-gray-800">{test.format}</p>
              </div>
 
              {/* BOTÓN APLICAR */}
              <div className="mt-5">
                <button
                onClick={() => handleApply(test)}
                className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                
                  Aplicar Prueba
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* PRUEBAS ARCHIVADAS */}
      <div className="border-t pt-6">
        <button
          onClick={() => setShowArchivedSection(!showArchivedSection)}
          className="text-lg font-bold text-gray-900 mb-4 hover:text-blue-600 transition flex items-center gap-2">
          
          <ArchiveIcon className="w-5 h-5" />
          Pruebas Archivadas ({archivedTests.length})
        </button>
 
        {showArchivedSection &&
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {archivedTests.length > 0 ?
          archivedTests.map((test) =>
          <div
            key={test.id}
            className="bg-gray-100/50 backdrop-blur rounded-2xl border border-gray-300 p-6 opacity-75 hover:opacity-100 hover:shadow-lg transition-all duration-300">
            
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-700">{test.name}</h3>
                      <p className="text-sm text-gray-500">{test.description}</p>
                    </div>
 
                    <div className="flex gap-2">
                      <button
                  onClick={() => handleDuplicateTest(test)}
                  className="p-2 hover:bg-green-50 rounded-lg">
                  
                        <CopyIcon className="w-4 h-4 text-gray-500 hover:text-green-600" />
                      </button>
                      <button
                  onClick={() => handleRestoreClick(test)}
                  className="p-2 hover:bg-blue-50 rounded-lg"
                  title="Restaurar prueba">
                  
                        <RotateCcwIcon className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </button>
                    </div>
                  </div>
 
                  <div className="pt-4 border-t border-gray-300">
                    <p className="text-xs text-gray-500">Formato</p>
                    <p className="font-medium text-gray-700">{test.format}</p>
                  </div>
 
                  <div className="mt-5 text-center">
                    <p className="text-xs text-gray-500">Archivada</p>
                  </div>
                </div>
          ) :

          <p className="text-gray-500 col-span-full text-center py-8">
                No hay pruebas archivadas
              </p>
          }
          </div>
        }
      </div>
 
      {/* MODAL APLICAR */}
      {showApplyModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-lg mb-4">
              Aplicar: {selectedTestForAction.name}
            </h2>
 
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {candidates.map((c) =>
            <button
              key={c.id}
              onClick={() => startTest(c.id)}
              className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
              
                  <div className="font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </button>
            )}
            </div>
 
            <button
            onClick={() => setShowApplyModal(false)}
            className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium transition">
            
              Cancelar
            </button>
          </div>
        </div>
      }
 
      {/* EDIT MODAL */}
      {showEditModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Editar Prueba</h3>
            <form onSubmit={handleSaveEdit}>
              <input
              className="w-full border p-2 rounded-lg mb-4"
              placeholder="Nombre de la prueba"
              value={selectedTestForAction.name}
              onChange={(e) =>
              setSelectedTestForAction({
                ...selectedTestForAction,
                name: e.target.value
              })
              } />
            
              <div className="flex gap-3">
                <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium">
                
                  Cancelar
                </button>
                <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">
                
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      }
 
      {/* ARCHIVE MODAL */}
      {showArchiveModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Archivar Prueba</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas archivar la prueba "<strong>{selectedTestForAction.name}</strong>"? 
              Podrás restaurarla desde la sección de "Pruebas Archivadas".
            </p>
            <div className="flex gap-3">
              <button
              onClick={() => setShowArchiveModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium transition">
              
                Cancelar
              </button>
              <button
              onClick={confirmArchive}
              className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition">
              
                Archivar
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}