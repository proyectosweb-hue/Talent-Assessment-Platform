import React, { useCallback, useEffect, useState } from 'react';
import {
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  Loader2,
  AlertCircle } from
'lucide-react';
import { supabase } from '../supabase';
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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { showToast } = useToast();
  // Función de carga envuelta en useCallback para poder reutilizarla
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Intentamos traer los datos.
      // Si created_at falla, ordenamos por id o nombre por defecto.
      let query = supabase.from('candidates').select('*');
      const { data, error: supabaseError } = await query.order('id', {
        ascending: false
      });
      if (supabaseError) throw supabaseError;
      setCandidates(data || []);
    } catch (err: any) {
      console.error('Error:', err.message);
      setError(err.message);
      showToast('Error al conectar con la base de datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);
  const filtered = candidates.filter(
    (c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.position &&
    c.position.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Candidatos
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Gestión de talento en tiempo real (Supabase)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => showToast('Generando reporte CSV...', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 shadow-sm">
            
            <DownloadIcon className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={onAddNewCandidate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md active:scale-95">
            
            <PlusIcon className="w-4 h-4" /> Nuevo Candidato
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o cargo..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
          
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors font-semibold shadow-sm">
          
          <FilterIcon className="w-4 h-4" />
          <span>Filtros</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[400px]">
        {loading ?
        <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
            <p className="text-gray-500 font-medium">
              Sincronizando con Supabase...
            </p>
          </div> :
        error ?
        <div className="flex flex-col items-center justify-center h-[400px] text-red-500 p-6 text-center">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-bold">Error de conexión</h3>
            <p className="text-sm opacity-80">{error}</p>
            <button
            onClick={() => fetchCandidates()}
            className="mt-4 text-sm underline font-bold text-blue-600">
            
              Reintentar
            </button>
          </div> :

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Candidato</th>
                  <th className="px-6 py-4">Puesto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Compatibilidad</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ?
              <tr>
                    <td
                  colSpan={5}
                  className="px-6 py-20 text-center text-gray-400 italic">
                  
                      No se encontraron registros en la base de datos.
                    </td>
                  </tr> :

              filtered.map((candidate) =>
              <tr
                key={candidate.id}
                className="hover:bg-blue-50/40 transition-colors">
                
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-sm font-bold text-xs uppercase">
                            {candidate.name.substring(0, 2)}
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
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {candidate.position || 'Sin puesto'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                        className={`h-full transition-all duration-1000 ${(candidate.compatibility || 0) > 70 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{
                          width: `${candidate.compatibility || 0}%`
                        }} />
                      
                          </div>
                          <span className="text-sm font-bold text-gray-700">
                            {candidate.compatibility || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                    onClick={() => onViewCandidate(candidate)}
                    className="text-blue-600 hover:text-blue-800 font-bold text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                    
                          <EyeIcon className="w-4 h-4" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
              )
              }
              </tbody>
            </table>
          </div>
        }
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)} />
      
    </div>);

}