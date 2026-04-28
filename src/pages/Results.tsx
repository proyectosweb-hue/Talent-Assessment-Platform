import React, { useEffect, useState } from 'react';
import {
  BarChart3Icon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  FilterIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { ScoreMeter } from '../components/ScoreMeter';
import {
  getCompatibilityLevel,
  getCompatibilityLabel,
  getCompatibilityColor } from
'../utils/scoring';
export function Results() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  useEffect(() => {
    loadResults();
  }, []);
  const loadResults = async () => {
    try {
      setLoading(true);
      const { data: resultsData } = await supabase.
      from('results').
      select('*').
      order('id', {
        ascending: false
      });
      const { data: candidates } = await supabase.from('candidates').select('*');
      const { data: tests } = await supabase.from('tests').select('*');
      const finalData = (resultsData || []).map((r) => {
        // Buscar candidato por user_name (que contiene el candidateId)
        const candidate = candidates?.find(
          (c) => c.id.toString() === (r.user_name || '').toString()
        );
        const test = tests?.find(
          (t) => t.id.toString() === (r.test_id || '').toString()
        );
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
  };
  const getCompatibility = (score: number) => Math.min(100, Math.round(score));
  const processed = results.map((r) => ({
    ...r,
    compatibility: getCompatibility(r.score || 0)
  }));
  const avg =
  processed.length > 0 ?
  Math.round(
    processed.reduce((sum, r) => sum + r.compatibility, 0) /
    processed.length
  ) :
  0;
  const highlyRecommended = processed.filter(
    (r) => r.compatibility >= 80
  ).length;
  const withAlerts = processed.filter((r) => r.compatibility < 65).length;
  const filtered =
  filterStatus === 'all' ?
  processed :
  processed.filter((r) => {
    const level = getCompatibilityLevel(r.compatibility);
    return level === filterStatus;
  });
  if (loading) {
    return <div className="p-6">Cargando resultados...</div>;
  }
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Resultados de Evaluaciones
        </h1>
        <p className="text-gray-500">Datos reales conectados a Supabase</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Evaluaciones"
          value={processed.length}
          icon={<BarChart3Icon />} />
        
        <StatCard
          title="Promedio"
          value={`${avg}%`}
          icon={<TrendingUpIcon />} />
        
        <StatCard
          title="Muy Recomendados"
          value={highlyRecommended}
          icon={<CheckCircle2Icon />} />
        
        <StatCard
          title="Alertas"
          value={withAlerts}
          icon={<AlertCircleIcon />} />
        
      </div>

      {/* FILTRO */}
      <div className="bg-white p-4 rounded-xl border flex items-center gap-3 shadow-sm">
        <FilterIcon className="w-5 h-5 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          
          <option value="all">Todos</option>
          <option value="highly_recommended">Muy Recomendable</option>
          <option value="recommended">Recomendable</option>
          <option value="recommended_with_reserves">Con Reservas</option>
          <option value="not_recommended">No Recomendable</option>
        </select>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Candidato</th>
              <th className="px-6 py-3 text-left">Test</th>
              <th className="px-6 py-3 text-left">Score</th>
              <th className="px-6 py-3 text-left">Compatibilidad</th>
              <th className="px-6 py-3 text-left">Resultado</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.length === 0 ?
            <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  No hay resultados
                </td>
              </tr> :

            filtered.map((r) => {
              const level = getCompatibilityLevel(r.compatibility);
              return (
                <tr key={r.id} className="hover:bg-blue-50/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {r.candidate?.name || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.candidate?.email}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {r.test?.name || 'Sin test'}
                    </td>

                    <td className="px-6 py-4 font-bold">{r.score}</td>

                    <td className="px-6 py-4 w-44">
                      <ScoreMeter score={r.compatibility} size="sm" />
                    </td>

                    <td className="px-6 py-4">
                      <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompatibilityColor(level)}`}>
                      
                        {getCompatibilityLabel(level)}
                      </span>
                    </td>
                  </tr>);

            })
            }
          </tbody>
        </table>
      </div>
    </div>);

}
function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white rounded-xl border p-5 flex justify-between items-center shadow-sm hover:shadow-md transition">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>);

}