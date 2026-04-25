import React, { useState } from 'react';
import {
  BarChart3Icon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  FilterIcon } from
'lucide-react';
import { mockCandidates } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreMeter } from '../components/ScoreMeter';
import {
  getCompatibilityLevel,
  getCompatibilityLabel,
  getCompatibilityColor } from
'../utils/scoring';
export function Results() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const completedCandidates = mockCandidates.filter(
    (c) => c.status === 'completed'
  );
  const filteredResults =
  filterStatus === 'all' ?
  completedCandidates :
  completedCandidates.filter((c) => {
    if (!c.compatibility) return false;
    const level = getCompatibilityLevel(c.compatibility);
    return level === filterStatus;
  });
  const avgCompatibility =
  completedCandidates.length > 0 ?
  Math.round(
    completedCandidates.reduce(
      (sum, c) => sum + (c.compatibility || 0),
      0
    ) / completedCandidates.length
  ) :
  0;
  const highlyRecommended = completedCandidates.filter(
    (c) => c.compatibility && c.compatibility >= 80
  ).length;
  const recommended = completedCandidates.filter(
    (c) => c.compatibility && c.compatibility >= 65 && c.compatibility < 80
  ).length;
  const withReserves = completedCandidates.filter(
    (c) => c.compatibility && c.compatibility >= 50 && c.compatibility < 65
  ).length;
  const notRecommended = completedCandidates.filter(
    (c) => c.compatibility && c.compatibility < 50
  ).length;
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Resultados de Evaluaciones
        </h1>
        <p className="text-gray-600 mt-1">
          Análisis consolidado de resultados y compatibilidad
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Evaluaciones Completadas
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {completedCandidates.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Compatibilidad Promedio
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {avgCompatibility}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Muy Recomendables</p>
              <p className="text-3xl font-bold text-emerald-600">
                {highlyRecommended}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2Icon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Con Alertas</p>
              <p className="text-3xl font-bold text-orange-600">
                {withReserves + notRecommended}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertCircleIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribución de Recomendaciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-3xl font-bold text-emerald-600">
              {highlyRecommended}
            </p>
            <p className="text-sm text-emerald-700 mt-1">Muy Recomendable</p>
            <p className="text-xs text-emerald-600 mt-1">80-100%</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-3xl font-bold text-green-600">{recommended}</p>
            <p className="text-sm text-green-700 mt-1">Recomendable</p>
            <p className="text-xs text-green-600 mt-1">65-79%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-3xl font-bold text-orange-600">{withReserves}</p>
            <p className="text-sm text-orange-700 mt-1">Con Reservas</p>
            <p className="text-xs text-orange-600 mt-1">50-64%</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-3xl font-bold text-red-600">{notRecommended}</p>
            <p className="text-sm text-red-700 mt-1">No Recomendable</p>
            <p className="text-xs text-red-600 mt-1">0-49%</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <FilterIcon className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            
            <option value="all">Todos los resultados</option>
            <option value="highly_recommended">Muy Recomendable</option>
            <option value="recommended">Recomendable</option>
            <option value="recommended_with_reserves">Con Reservas</option>
            <option value="not_recommended">No Recomendable</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Candidato
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Puesto
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Compatibilidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Recomendación
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResults.map((candidate) => {
                const compatLevel = candidate.compatibility ?
                getCompatibilityLevel(candidate.compatibility) :
                null;
                return (
                  <tr
                    key={candidate.id}
                    className="hover:bg-gray-50 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                          {candidate.name.
                          split(' ').
                          map((n) => n[0]).
                          join('').
                          substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {candidate.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {candidate.position}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-40">
                        <ScoreMeter
                          score={candidate.compatibility || 0}
                          showLabel={false}
                          size="sm" />
                        
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {candidate.compatibility}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {compatLevel &&
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCompatibilityColor(compatLevel)}`}>
                        
                          {getCompatibilityLabel(compatLevel)}
                        </span>
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {candidate.evaluationDate}
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}