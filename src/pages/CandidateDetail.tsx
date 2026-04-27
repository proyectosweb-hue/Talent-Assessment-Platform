import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  PlusIcon,
  FileTextIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  UserIcon,
  AwardIcon,
  ClipboardListIcon,
  DownloadIcon,
  PrinterIcon,
  Share2Icon } from
'lucide-react';
import { Candidate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreMeter } from '../components/ScoreMeter';
// Eliminamos mockData y usamos datos locales o calculados si no hay en DB
import {
  getCompatibilityLevel,
  getCompatibilityLabel,
  getCompatibilityColor } from
'../utils/scoring';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar } from
'recharts';
import { useToast } from '../components/Toast';
interface DetailProps {
  candidate: Candidate;
  onBack: () => void;
  onAddNew: () => void;
}
export function CandidateDetail({ candidate, onBack, onAddNew }: DetailProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tests' | 'factors' | 'alerts'>(
    'overview');
  const { showToast } = useToast();
  const compatibilityLevel = candidate.compatibility ?
  getCompatibilityLevel(candidate.compatibility) :
  null;
  // Datos temporales para los gráficos mientras no tengas tablas de "resultados" en Supabase
  const chartData = [
  {
    name: 'Psicometría',
    score: candidate.compatibility || 0
  },
  {
    name: 'Habilidades',
    score: candidate.compatibility || 0
  },
  {
    name: 'Técnica',
    score: 75
  } // Ejemplo
  ];
  const getBarColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#16a34a';
    if (score >= 40) return '#eab308';
    return '#dc2626';
  };
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-bold">
          
          <ArrowLeftIcon className="w-5 h-5" /> Volver
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Descargando...', 'success')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">
            
            <DownloadIcon className="w-4 h-4" /> Exportar PDF
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">
            
            <PlusIcon className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* Card principal del candidato */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-white/20">
                {candidate.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-1">{candidate.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>{candidate.position || 'Puesto no definido'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailIcon className="w-4 h-4" />
                    <span>{candidate.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 text-center border border-white/10">
              <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">
                Compatibilidad
              </p>
              <p className="text-5xl font-black text-white">
                {candidate.compatibility}%
              </p>
            </div>
          </div>
        </div>

        {/* Información rápida */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center md:text-left">
            <p className="text-[10px] uppercase font-bold text-gray-400">
              Estado del Proceso
            </p>
            <div className="mt-1 flex justify-center md:justify-start">
              <StatusBadge status={candidate.status} />
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] uppercase font-bold text-gray-400">
              Puntaje Global
            </p>
            <p className="text-sm font-bold text-gray-900">
              {candidate.compatibility || 0} pts
            </p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] uppercase font-bold text-gray-400">
              ID Candidato
            </p>
            <p className="text-[10px] font-mono text-gray-500 truncate">
              {candidate.id}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b border-gray-200 flex gap-8">
          {['overview', 'alerts'].map((tab) =>
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            
              {tab === 'overview' ? 'REPORTE GENERAL' : 'ALERTAS'}
            </button>
          )}
        </div>
      </div>

      {/* Contenido Dinámico */}
      {activeTab === 'overview' &&
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-blue-600" />
              Análisis de Desempeño
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0" />
                
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                  cursor={{
                    fill: '#f8fafc'
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />
                
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.score)} />

                  )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Fortalezas Sugeridas
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <CheckCircle2Icon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Cumple con el {candidate.compatibility}% de los requisitos del
                  puesto.
                </p>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg text-blue-700">
                <TrendingUpIcon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Puntaje psicométrico consistente.
                </p>
              </div>
            </div>
          </div>
        </div>
      }

      {/* Footer de acciones */}
      <div className="flex justify-end gap-4">
        <button className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
          Agendar Entrevista
        </button>
        <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-blue-200 shadow-lg transition-all">
          Contratar Candidato
        </button>
      </div>
    </div>);

}