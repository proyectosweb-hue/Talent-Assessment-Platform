import React, { useState } from 'react';
import {
  ClipboardListIcon,
  PlayIcon,
  FileTextIcon,
  BarChart3Icon,
  EditIcon,
  CopyIcon,
  TrashIcon,
  XIcon // Icono para cerrar modales
} from 'lucide-react';
import { testCatalog as initialCatalog } from '../data/mockData';
import { useToast } from '../components/Toast';
import { TestPreviewModal } from '../components/TestPreviewModal';
import { ApplyTestModal } from '../components/ApplyTestModal';

export function Tests() {
  const [tests, setTests] = useState(initialCatalog);
  const [selectedTest, setSelectedTest] = useState<typeof initialCatalog[0] | null>(null);

  // Estados para control de modales profesionales
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedTestForAction, setSelectedTestForAction] = useState<typeof initialCatalog[0] | null>(null);
  const { showToast } = useToast();

  // --- Manejadores Profesionales ---

  const handleEditClick = (test: typeof initialCatalog[0]) => {
    setSelectedTestForAction({ ...test }); // Clonamos para edición limpia
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestForAction) {
      setTests((prev) => prev.map((t) => t.id === selectedTestForAction.id ? selectedTestForAction : t));
      setShowEditModal(false);
      showToast('Cambios guardados con éxito', 'success');
    }
  };

  const handleDeleteClick = (test: typeof initialCatalog[0]) => {
    setSelectedTestForAction(test);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedTestForAction) {
      setTests((prev) => prev.filter((t) => t.id !== selectedTestForAction.id));
      setShowDeleteModal(false);
      showToast('Prueba eliminada del catálogo', 'success');
    }
  };

  const handleDuplicateTest = (test: typeof initialCatalog[0]) => {
    const duplicated = {
      ...test,
      id: `${test.id}-COPY-${Math.floor(Math.random() * 1000)}`,
      name: `${test.name} (Copia)`
    };
    setTests((prev) => [...prev, duplicated]);
    showToast('Prueba duplicada con éxito', 'success');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Pruebas Psicométricas</h1>
        <p className="text-gray-600 mt-1">Batería de {tests.length} pruebas laborales para evaluación de competencias</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Pruebas" value={tests.length} icon={<ClipboardListIcon className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Total Reactivos" value={tests.reduce((sum, t) => sum + t.items, 0)} icon={<FileTextIcon className="text-green-600" />} color="bg-green-50" />
        <StatCard label="Aplicaciones" value="156" icon={<PlayIcon className="text-purple-600" />} color="bg-purple-50" />
        <StatCard label="Promedio Score" value="76" icon={<BarChart3Icon className="text-orange-600" />} color="bg-orange-50" />
      </div>

      {/* Grid de Pruebas con Estilo Original */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.map((test) =>
        <div key={test.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">{test.id}</span>
                  <span className="text-xs text-gray-500">{test.items} reactivos</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{test.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{test.description}</p>
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={() => handleEditClick(test)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><EditIcon className="w-4 h-4" /></button>
                <button onClick={() => handleDuplicateTest(test)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><CopyIcon className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteClick(test)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Formato:</p>
              <p className="text-sm font-medium text-gray-900">{test.format}</p>
            </div>

            <div className="flex space-x-2 mt-6">
              <button onClick={() => {setSelectedTestForAction(test);setShowPreviewModal(true);}} className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center justify-center space-x-2">
                <PlayIcon className="w-4 h-4" />
                <span>Vista Previa</span>
              </button>
              <button onClick={() => setSelectedTest(test)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                Ver Detalle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DE EDICIÓN PROFESIONAL --- */}
      {showEditModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Prueba</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Prueba</label>
                <input
                type="text"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={selectedTestForAction.name}
                onChange={(e) => setSelectedTestForAction({ ...selectedTestForAction, name: e.target.value })} />
              
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      }

      {/* --- MODAL DE ELIMINACIÓN PROFESIONAL --- */}
      {showDeleteModal && selectedTestForAction &&
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Confirmar eliminación?</h2>
            <p className="text-gray-600 mb-6 text-sm">Esta acción no se puede deshacer. Se eliminará la prueba <strong>{selectedTestForAction.name}</strong> definitivamente.</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      }

      {/* Modal de Detalle (Resto del código original) */}
      {selectedTest &&
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedTest(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">{selectedTest.id}</span>
                  <span className="text-sm text-gray-500">{selectedTest.items} reactivos</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTest.name}</h2>
                <p className="text-gray-600 mt-2">{selectedTest.description}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Formato de Aplicación</h3>
                <p className="text-sm text-gray-700">{selectedTest.format}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Factores Evaluados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTest.factors.map((factor, idx) =>
                <div key={idx} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-sm text-gray-700">{factor}</span>
                    </div>
                )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-8">
              <button onClick={() => setSelectedTest(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">Cerrar</button>
              <button onClick={() => {setSelectedTestForAction(selectedTest);setShowApplyModal(true);setSelectedTest(null);}} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2">
                <PlayIcon className="w-4 h-4" />
                <span>Aplicar Prueba</span>
              </button>
            </div>
          </div>
        </div>
      }

      <TestPreviewModal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} test={selectedTestForAction} />
      <ApplyTestModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} test={selectedTestForAction} />
    </div>);

}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>);

}