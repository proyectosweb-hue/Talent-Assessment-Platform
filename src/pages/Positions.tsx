import React, { useState } from 'react';
import {
  PlusIcon,
  BriefcaseIcon,
  UsersIcon,
  SettingsIcon,
  TrendingUpIcon,
  EditIcon,
  TrashIcon } from
'lucide-react';
import { mockPositions, positionWeights } from '../data/mockData';
import { Position, PositionLevel } from '../types';
import { useToast } from '../components/Toast';
import { PositionFormModal } from '../components/PositionFormModal';

export function Positions() {
  // 1. Convertimos la data estática en estado para poder manipularla
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
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

  // --- Lógica de Acciones ---

  const handleCreatePosition = () => {
    setEditingPosition(null); // Reset para que el modal venga vacío
    setShowModal(true);
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position); // Pasamos el objeto al estado de edición
    setShowModal(true);
  };

  const handleDeletePosition = (position: Position) => {
    if (window.confirm(`¿Estás seguro de eliminar el puesto "${position.name}"?`)) {
      setPositions((prev) => prev.filter((p) => p.id !== position.id));
      showToast('Puesto eliminado con éxito', 'success');
    }
  };

  const handleSavePosition = (data: Partial<Position>) => {
    if (editingPosition) {
      // Lógica para actualizar
      setPositions((prev) => prev.map((p) => p.id === editingPosition.id ? { ...p, ...data } : p));
      showToast('Puesto actualizado', 'success');
    } else {
      // Lógica para crear (Simulación de ID)
      const newPosition = { ...data, id: Math.random().toString() } as Position;
      setPositions((prev) => [...prev, newPosition]);
      showToast('Puesto creado con éxito', 'success');
    }
    setShowModal(false);
  };

  // --- Cálculos de Stats ---
  const totalVacancies = positions.reduce((sum, p) => sum + p.activeVacancies, 0);
  const avgMinScore = positions.length > 0 ?
  Math.round(positions.reduce((sum, p) => sum + p.minScore, 0) / positions.length) :
  0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puestos y Vacantes</h1>
          <p className="text-gray-600 mt-1">Gestión de puestos y configuración de pesos</p>
        </div>
        <button
          onClick={handleCreatePosition}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Nuevo Puesto</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Puestos" value={positions.length} icon={<BriefcaseIcon className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Vacantes Activas" value={totalVacancies} icon={<UsersIcon className="text-green-600" />} color="bg-green-50" />
        <StatCard label="Puntaje Mín. Promedio" value={avgMinScore} icon={<TrendingUpIcon className="text-orange-600" />} color="bg-orange-50" />
        <StatCard label="Configuraciones" value={6} icon={<SettingsIcon className="text-purple-600" />} color="bg-purple-50" />
      </div>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {positions.map((position) =>
        <div key={position.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{position.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{position.area}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                onClick={() => handleEditPosition(position)}
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

            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
              {positionLevelLabels[position.level]}
            </span>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <DataBox label="Vacantes" value={position.activeVacancies} />
              <DataBox label="Mínimo" value={position.minScore} />
              <DataBox label="Nivel" value={position.level.substring(0, 3).toUpperCase()} />
            </div>

            <button
            onClick={() => setSelectedPosition(position)}
            className="mt-4 w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            
              Ver Configuración de Pesos
            </button>
          </div>
        )}
      </div>

      {/* Modal de Configuración de Pesos (Visualización) */}
      {selectedPosition &&
      <WeightModal
        position={selectedPosition}
        labels={positionLevelLabels}
        onClose={() => setSelectedPosition(null)} />

      }

      {/* Modal de Formulario (Crear/Editar) */}
      <PositionFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPosition(null);
        }}
        initialData={editingPosition} // Puesto a editar
        onSubmit={handleSavePosition} // Función que guarda los cambios
      />
    </div>);

}

// --- Componentes Auxiliares para Limpieza del Código ---

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>);

}

function DataBox({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>);

}

function WeightModal({ position, labels, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Configuración: {position.name}</h2>
        <p className="text-sm text-gray-600 mb-6">Nivel: {labels[position.level]}</p>
        <div className="space-y-3 mb-6">
          {Object.entries(positionWeights[position.level as PositionLevel] || {}).map(([testId, weight]) =>
          <div key={testId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{testId}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${weight}%` }} />
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">{weight}%</span>
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cerrar</button>
      </div>
    </div>);

}