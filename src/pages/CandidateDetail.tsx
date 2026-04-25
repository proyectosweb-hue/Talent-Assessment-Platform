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
import {
  mockTestResults,
  mockFactorResults,
  mockAlerts } from
'../data/mockData';
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
  const chartData = mockTestResults.map((test) => ({
    name: test.testId,
    score: test.score
  }));
  const radarData = mockFactorResults.slice(0, 6).map((factor) => ({
    factor: factor.name.split('/')[0],
    score: factor.score
  }));
  const getBarColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#16a34a';
    if (score >= 40) return '#eab308';
    return '#dc2626';
  };
  const handleGenerateReport = () => {
    showToast('Generando reporte PDF para ' + candidate.name, 'success');
    console.log('Generando reporte para candidato:', candidate.id);
  };
  const handleDownloadReport = () => {
    showToast('Descargando reporte de ' + candidate.name, 'success');
    console.log('Descargando reporte:', candidate.id);
  };
  const handlePrintReport = () => {
    showToast('Enviando a impresión...', 'info');
    console.log('Imprimiendo reporte:', candidate.id);
  };
  const handleShareReport = () => {
    showToast('Abriendo opciones para compartir', 'info');
    console.log('Compartiendo reporte:', candidate.id);
  };
  const handleScheduleInterview = () => {
    showToast('Programando entrevista con ' + candidate.name, 'success');
    console.log('Programando entrevista:', candidate.id);
  };
  const handleSendEmail = () => {
    showToast('Abriendo cliente de correo...', 'info');
    console.log('Enviando email a:', candidate.email);
  };
  const handleApplyTests = () => {
    showToast('Iniciando aplicación de batería de pruebas', 'info');
    console.log('Aplicar pruebas a:', candidate.id);
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
          
          <ArrowLeftIcon className="w-5 h-5" /> Volver a Candidatos
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            
            <DownloadIcon className="w-4 h-4" /> Descargar
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm">
            
            <PlusIcon className="w-4 h-4" /> Nuevo Candidato
          </button>
        </div>
      </div>

      {/* Card principal del candidato */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {candidate.name.
                split(' ').
                map((n) => n[0]).
                join('').
                substring(0, 2)}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">{candidate.name}</h1>
                <div className="flex items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>{candidate.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{candidate.age} años</span>
                  </div>
                </div>
              </div>
            </div>

            {candidate.compatibility && compatibilityLevel &&
            <div className="bg-white rounded-xl px-6 py-4 text-center shadow-lg">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                  Compatibilidad Global
                </p>
                <p className="text-5xl font-black text-gray-900 mb-2">
                  {candidate.compatibility}%
                </p>
                <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getCompatibilityColor(compatibilityLevel)}`}>
                
                  {getCompatibilityLabel(compatibilityLevel)}
                </span>
              </div>
            }
          </div>
        </div>

        {/* Información de contacto */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MailIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <button
                  onClick={handleSendEmail}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  
                  {candidate.email}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <PhoneIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                <p className="text-sm font-semibold text-gray-900">
                  {candidate.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Evaluación</p>
                <p className="text-sm font-semibold text-gray-900">
                  {candidate.evaluationDate || 'Pendiente'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <ClipboardListIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estado</p>
                <div className="mt-1">
                  <StatusBadge status={candidate.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="px-8 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
            {
              id: 'overview',
              label: 'Resumen',
              icon: AwardIcon
            },
            {
              id: 'tests',
              label: 'Pruebas',
              icon: ClipboardListIcon
            },
            {
              id: 'factors',
              label: 'Factores',
              icon: TrendingUpIcon
            },
            {
              id: 'alerts',
              label: 'Alertas',
              icon: AlertCircleIcon
            }].
            map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>);

            })}
          </div>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'overview' && candidate.status === 'completed' &&
      <div className="space-y-6">
          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resultados por Prueba
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11
                  }} />
                
                  <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 12
                  }} />
                
                  <Tooltip />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.score)} />

                  )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Perfil de Competencias
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                  dataKey="factor"
                  tick={{
                    fontSize: 11
                  }} />
                
                  <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 10
                  }} />
                
                  <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6} />
                
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fortalezas y Áreas de Desarrollo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2Icon className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Fortalezas Principales
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUpIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Excelente capacidad de liderazgo y dirección de equipos
                  </span>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUpIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Alta orientación al servicio y satisfacción del cliente
                  </span>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUpIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Sólidos valores de integridad y responsabilidad
                  </span>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUpIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Fuerte capacidad de delegación y desarrollo de personas
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircleIcon className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Áreas de Desarrollo
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Considerar apoyo en gestión de estrés durante periodos de
                    alta demanda
                  </span>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Fortalecer habilidades de cumplimiento de procedimientos
                    detallados
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      }

      {activeTab === 'tests' && candidate.status === 'completed' &&
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Prueba
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Puntaje
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Nivel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Peso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Contribución
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockTestResults.map((test) =>
              <tr
                key={test.testId}
                className="hover:bg-gray-50 transition-colors">
                
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {test.testId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {test.testName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-xs">
                        <ScoreMeter
                      score={test.score}
                      showLabel={false}
                      size="sm" />
                    
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {test.score}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge scoreLevel={test.level} />
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {test.weight}%
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {(test.score * test.weight / 100).toFixed(1)}
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {activeTab === 'factors' && candidate.status === 'completed' &&
      <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Resultados por Factor Evaluado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockFactorResults.map((factor) =>
          <div key={factor.name} className="p-4 bg-gray-50 rounded-lg">
                <ScoreMeter score={factor.score} label={factor.name} />
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge scoreLevel={factor.level} />
                  <span className="text-2xl font-bold text-gray-900">
                    {factor.score}
                  </span>
                </div>
              </div>
          )}
          </div>
        </div>
      }

      {activeTab === 'alerts' && candidate.status === 'completed' &&
      <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Alertas y Observaciones
          </h3>
          <div className="space-y-4">
            {mockAlerts.map((alert, index) =>
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${alert.type === 'risk' ? 'bg-red-50 border-red-500' : alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
            
                <div className="flex items-start space-x-3">
                  <AlertCircleIcon
                className={`w-5 h-5 mt-0.5 ${alert.type === 'risk' ? 'text-red-600' : alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
              
                  <div>
                    <p
                  className={`font-semibold ${alert.type === 'risk' ? 'text-red-900' : alert.type === 'warning' ? 'text-yellow-900' : 'text-blue-900'}`}>
                  
                      {alert.type === 'risk' ?
                  'Alerta de Riesgo' :
                  alert.type === 'warning' ?
                  'Advertencia' :
                  'Información'}
                    </p>
                    <p
                  className={`text-sm mt-1 ${alert.type === 'risk' ? 'text-red-800' : alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
                  
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
          )}
          </div>
        </div>
      }

      {candidate.status === 'pending' &&
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Evaluación Pendiente
          </h3>
          <p className="text-gray-600 mb-6">
            Este candidato aún no ha completado la batería de pruebas
          </p>
          <button
          onClick={handleApplyTests}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          
            Aplicar Batería de Pruebas
          </button>
        </div>
      }

      {/* Acciones finales */}
      {candidate.status === 'completed' &&
      <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
              onClick={handleGenerateReport}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              
                <FileTextIcon className="w-5 h-5" />
                <span>Generar Reporte PDF</span>
              </button>
              <button
              onClick={handlePrintReport}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Imprimir">
              
                <PrinterIcon className="w-5 h-5" />
              </button>
              <button
              onClick={handleShareReport}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Compartir">
              
                <Share2Icon className="w-5 h-5" />
              </button>
            </div>
            <button
            onClick={handleScheduleInterview}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            
              Programar Entrevista
            </button>
          </div>
        </div>
      }
    </div>);

}