import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3Icon, TrendingUpIcon, AlertCircleIcon, CheckCircle2Icon, FilterIcon, SearchIcon, XCircleIcon, ShieldCheckIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { ScoreMeter } from '../components/ScoreMeter';
import { Pagination } from '../components/Pagination';
import { getCompatibilityLevel, getCompatibilityLabel, getCompatibilityColor } from '../utils/scoring';
import { PermissionLevel } from '../App';
import { useRealtimeMulti } from '../utils/useRealtime';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
const PAGE_SIZE = 10;
interface ResultsProps {
  candidateId?: string;
  permission?: PermissionLevel;
}
export function Results({
  candidateId,
  permission = 'full'
}: ResultsProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isCandidateView = Boolean(candidateId);
  useEffect(() => {
    loadResults();
  }, [candidateId]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);
  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('results').select('*').order('id', {
        ascending: false
      });
      if (candidateId) query = query.eq('user_name', candidateId);
      const {
        data: resultsData
      } = await query;
      const {
        data: candidates
      } = await supabase.from('candidates').select('*');
      const {
        data: tests
      } = await supabase.from('tests').select('*');
      const finalData = (resultsData || []).map((r) => {
        const candidate = candidates?.find((c) => c.id.toString() === (r.user_name || '').toString());
        const test = tests?.find((t) => t.id.toString() === (r.test_id || '').toString());
        return {
          ...r,
          candidate,
          test
        };
      });
      setResults(finalData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  // ── Tiempo real: actualiza cuando llega un resultado nuevo ────────
  useRealtimeMulti(['results', 'candidates'], loadResults);
  const processed = results.map((r) => ({
    ...r,
    compatibility: Math.min(100, Math.round(r.score || 0))
  }));
  const avg = processed.length > 0 ? Math.round(processed.reduce((s, r) => s + r.compatibility, 0) / processed.length) : 0;
  const highlyRecommended = processed.filter((r) => r.compatibility >= 80).length;
  const withAlerts = processed.filter((r) => r.compatibility < 65).length;
  const filtered = processed.filter((r) => filterStatus === 'all' || getCompatibilityLevel(r.compatibility) === filterStatus).filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return String(r.candidate?.name || '').toLowerCase().includes(term) || String(r.candidate?.email || '').toLowerCase().includes(term) || String(r.test?.name || '').toLowerCase().includes(term);
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const getCompatColor = (v: number) => v >= 80 ? TR.green : v >= 65 ? TR.blue : v >= 50 ? '#f59e0b' : '#ef4444';
  const getCompatBg = (v: number) => v >= 80 ? '#f0fdf4' : v >= 65 ? '#eff6ff' : v >= 50 ? '#fffbeb' : '#fef2f2';
  if (loading) return <div className="flex flex-col items-center justify-center h-64">
      <BarChart3Icon className="w-10 h-10 animate-pulse mb-3" style={{
      color: TR.blue
    }} />
      <p className="text-gray-400 text-sm">Cargando resultados...</p>
    </div>;
  return <div className="p-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{
        color: TR.navy
      }}>
          {isCandidateView ? 'Mis Resultados' : 'Resultados de Evaluaciones'}
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {isCandidateView ? 'Resultado de tus evaluaciones psicométricas' : `${processed.length} evaluaciones registradas`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{
        label: 'Evaluaciones',
        value: processed.length,
        icon: BarChart3Icon,
        color: TR.blue
      }, {
        label: 'Promedio',
        value: `${avg}%`,
        icon: TrendingUpIcon,
        color: TR.navy
      }, {
        label: 'Muy Recomendados',
        value: highlyRecommended,
        icon: CheckCircle2Icon,
        color: TR.green
      }, {
        label: 'Alertas',
        value: withAlerts,
        icon: AlertCircleIcon,
        color: '#ef4444'
      }].map((s) => <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{
          background: `${s.color}12`
        }}>
              <s.icon className="w-5 h-5" style={{
            color: s.color
          }} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-xl font-black" style={{
            color: TR.navy
          }}>{s.value}</p>
            </div>
          </div>)}
      </div>

      {/* Buscador + Filtro */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por candidato, email o prueba..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50/50 focus:bg-white transition-colors" />
          
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <XCircleIcon className="w-4 h-4" />
            </button>}
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-2 px-3 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white">
            <option value="all">Todos los niveles</option>
            <option value="highly_recommended">Muy Recomendable</option>
            <option value="recommended">Recomendable</option>
            <option value="recommended_with_reserves">Con Reservas</option>
            <option value="not_recommended">No Recomendable</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

        {/* Tabla header */}
        <div className={`grid px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 ${isCandidateView ? 'grid-cols-10' : 'grid-cols-12'}`} style={{
        background: '#fafafa'
      }}>
          {!isCandidateView && <div className="col-span-3">Candidato</div>}
          <div className={isCandidateView ? 'col-span-3' : 'col-span-3'}>Prueba</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-3">Compatibilidad</div>
          <div className="col-span-3">Resultado</div>
        </div>

        <div className="divide-y divide-gray-50">
          {paginated.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <BarChart3Icon className="w-12 h-12 mb-3" />
              <p className="font-medium text-gray-400">
                {searchTerm ? `Sin resultados para "${searchTerm}"` : isCandidateView ? 'Aún no tienes evaluaciones completadas.' : 'No hay resultados'}
              </p>
            </div> : paginated.map((r) => {
          const level = getCompatibilityLevel(r.compatibility);
          const color = getCompatColor(r.compatibility);
          const bg = getCompatBg(r.compatibility);
          return <div key={r.id} className={`grid px-6 py-4 items-center hover:bg-blue-50/20 transition-colors ${isCandidateView ? 'grid-cols-10' : 'grid-cols-12'}`}>

                {/* Candidato */}
                {!isCandidateView && <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{
                background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
              }}>
                      {String(r.candidate?.name || 'N').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{String(r.candidate?.name || 'Sin nombre')}</p>
                      <p className="text-xs text-gray-400 truncate">{String(r.candidate?.email || '')}</p>
                    </div>
                  </div>}

                {/* Prueba */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                  background: `${TR.blue}10`
                }}>
                      <ShieldCheckIcon className="w-3.5 h-3.5" style={{
                    color: TR.blue
                  }} />
                    </div>
                    <span className="text-sm text-gray-700 font-medium truncate">{String(r.test?.name || 'Sin test')}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="col-span-1">
                  <span className="text-sm font-black" style={{
                color: TR.navy
              }}>{Number(r.score) || 0}</span>
                </div>

                {/* Compatibilidad */}
                <div className="col-span-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                    width: `${r.compatibility}%`,
                    background: color
                  }} />
                    </div>
                    <span className="text-xs font-bold w-9 text-right" style={{
                  color
                }}>{r.compatibility}%</span>
                  </div>
                </div>

                {/* Resultado */}
                <div className="col-span-3">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{
                background: bg,
                color
              }}>
                    {getCompatibilityLabel(level)}
                  </span>
                </div>
              </div>;
        })}
        </div>

        <div className="border-t border-gray-100 px-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>;
}