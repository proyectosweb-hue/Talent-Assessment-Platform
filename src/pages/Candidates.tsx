import React, { useState } from 'react';
import {
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon } from
'lucide-react';
import { mockCandidates } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { Candidate } from '../types';
import { useToast } from '../components/Toast';
import { FilterModal } from '../components/FilterModal';
interface CandidatesProps {
  onViewCandidate: (candidate: Candidate) => void;
  onAddNewCandidate: () => void;
}
export function Candidates({
  onViewCandidate,
  onAddNewCandidate
}: CandidatesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { showToast } = useToast();
  const filtered = mockCandidates.filter((c) =>
  c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleExport = () => {
    showToast('Exportando lista de candidatos...', 'success');
    console.log('Exportar candidatos');
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidatos</h1>
          <p className="text-gray-500">Gestión de candidatos y evaluaciones</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
            
            <DownloadIcon className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={onAddNewCandidate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-sm active:scale-95">
            
            <PlusIcon className="w-4 h-4" /> Nuevo Candidato
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o puesto..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
          
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors">
          
          <FilterIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Candidato</th>
              <th className="px-6 py-4">Puesto</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Compatibilidad</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((candidate) =>
            <tr
              key={candidate.id}
              className="hover:bg-gray-50 transition-colors">
              
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {candidate.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {candidate.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {candidate.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {candidate.position}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={candidate.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${candidate.compatibility}%`
                      }} />
                    
                    </div>
                    <span className="text-sm font-bold">
                      {candidate.compatibility}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                  onClick={() => onViewCandidate(candidate)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-sm inline-flex items-center gap-1">
                  
                    <EyeIcon className="w-4 h-4" /> Ver Detalle
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)} />
      
    </div>);

}