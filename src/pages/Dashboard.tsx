import React from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  ClipboardCheckIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  AwardIcon } from
'lucide-react';
import { KPICard } from '../components/KPICard';
import { ScoreMeter } from '../components/ScoreMeter';
import { mockCandidates, mockPositions } from '../data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell } from
'recharts';
export function Dashboard() {
  const totalCandidates = mockCandidates.length;
  const completedEvaluations = mockCandidates.filter(
    (c) => c.status === 'completed'
  ).length;
  const activeVacancies = mockPositions.reduce(
    (sum, p) => sum + p.activeVacancies,
    0
  );
  const avgCompatibility = Math.round(
    mockCandidates.
    filter((c) => c.compatibility).
    reduce((sum, c) => sum + (c.compatibility || 0), 0) /
    mockCandidates.filter((c) => c.compatibility).length
  );
  const compatibilityDistribution = [
  {
    range: '0-49',
    count: 0,
    color: '#dc2626'
  },
  {
    range: '50-64',
    count: 1,
    color: '#ea580c'
  },
  {
    range: '65-79',
    count: 2,
    color: '#16a34a'
  },
  {
    range: '80-100',
    count: 2,
    color: '#059669'
  }];

  const testPerformance = [
  {
    test: 'ECL-24',
    score: 78
  },
  {
    test: 'IRV-20',
    score: 85
  },
  {
    test: 'AER-20',
    score: 72
  },
  {
    test: 'SCO-20',
    score: 88
  },
  {
    test: 'RLP-18',
    score: 75
  },
  {
    test: 'LSD-16',
    score: 82
  }];

  const topCandidates = mockCandidates.
  filter((c) => c.compatibility).
  sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0)).
  slice(0, 5);
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Ejecutivo
        </h1>
        <p className="text-gray-600 mt-1">
          Resumen general del sistema de evaluación
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Candidatos"
          value={totalCandidates}
          icon={UsersIcon}
          color="blue"
          trend={{
            value: 12,
            isPositive: true
          }} />
        
        <KPICard
          title="Vacantes Activas"
          value={activeVacancies}
          icon={BriefcaseIcon}
          color="green" />
        
        <KPICard
          title="Evaluaciones Completadas"
          value={completedEvaluations}
          icon={ClipboardCheckIcon}
          color="purple"
          trend={{
            value: 8,
            isPositive: true
          }} />
        
        <KPICard
          title="Compatibilidad Promedio"
          value={`${avgCompatibility}%`}
          icon={TrendingUpIcon}
          color="orange" />
        
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compatibility Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Compatibilidad
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={compatibilityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="range"
                tick={{
                  fontSize: 12
                }} />
              
              <YAxis
                tick={{
                  fontSize: 12
                }} />
              
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {compatibilityDistribution.map((entry, index) =>
                <Cell key={`cell-${index}`} fill={entry.color} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Test Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Desempeño por Prueba
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={testPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{
                  fontSize: 12
                }} />
              
              <YAxis
                dataKey="test"
                type="category"
                width={80}
                tick={{
                  fontSize: 11
                }} />
              
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Candidates */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Candidatos Recomendables
            </h3>
            <AwardIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {topCandidates.map((candidate, index) =>
            <div
              key={candidate.id}
              className="flex items-center justify-between">
              
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {candidate.position}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">
                    {candidate.compatibility}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Alertas Recientes
            </h3>
            <AlertTriangleIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Patrón de respuestas inconsistente
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Candidato: Laura Jiménez - Revisar validez
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangleIcon className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Bajo puntaje en integridad
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Requiere entrevista adicional de validación
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  3 evaluaciones pendientes
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Programar aplicación de pruebas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Meters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Competencias Promedio - Todos los Candidatos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ScoreMeter score={82} label="Liderazgo" />
          <ScoreMeter score={78} label="Integridad" />
          <ScoreMeter score={75} label="Servicio al Cliente" />
          <ScoreMeter score={71} label="Razonamiento Lógico" />
          <ScoreMeter score={68} label="Autocontrol" />
          <ScoreMeter score={85} label="Colaboración" />
        </div>
      </div>
    </div>);

}