import React, { useState } from 'react';
import {
  FileTextIcon,
  DownloadIcon,
  PrinterIcon,
  Share2Icon,
  CalendarIcon,
  PlusIcon } from
'lucide-react';
import { useToast } from '../components/Toast';
import { ReportGeneratorModal } from '../components/ReportGeneratorModal';
export function Reports() {
  const { showToast } = useToast();
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const recentReports = [
  {
    id: '1',
    type: 'individual',
    candidateName: 'María González Pérez',
    position: 'Gerente de Ventas',
    date: '2024-01-15',
    compatibility: 87,
    status: 'generated'
  },
  {
    id: '2',
    type: 'individual',
    candidateName: 'Diego Morales Ruiz',
    position: 'Director de Operaciones',
    date: '2024-01-12',
    compatibility: 91,
    status: 'generated'
  },
  {
    id: '3',
    type: 'consolidated',
    candidateName: 'Reporte Consolidado - Enero 2024',
    position: 'Todos los puestos',
    date: '2024-01-10',
    compatibility: null,
    status: 'generated'
  },
  {
    id: '4',
    type: 'individual',
    candidateName: 'Carlos Ramírez López',
    position: 'Supervisor de Producción',
    date: '2024-01-14',
    compatibility: 72,
    status: 'pending'
  }];

  const handleGenerateReport = () => {
    setShowGeneratorModal(true);
  };
  const handleDownload = (report: (typeof recentReports)[0]) => {
    showToast('Descargando reporte: ' + report.candidateName, 'success');
    console.log('Descargar:', report);
  };
  const handlePrint = (report: (typeof recentReports)[0]) => {
    showToast('Enviando a impresión...', 'info');
    console.log('Imprimir:', report);
  };
  const handleShare = (report: (typeof recentReports)[0]) => {
    showToast('Abriendo opciones para compartir', 'info');
    console.log('Compartir:', report);
  };
  const handleUseTemplate = (templateName: string) => {
    showToast('Usando plantilla: ' + templateName, 'success');
    console.log('Plantilla seleccionada:', templateName);
    setShowGeneratorModal(true);
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">
            Generación y gestión de reportes de evaluación
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Generar Reporte</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reportes Generados</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileTextIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Este Mes</p>
              <p className="text-3xl font-bold text-gray-900">8</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Individuales</p>
              <p className="text-3xl font-bold text-gray-900">18</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <FileTextIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Consolidados</p>
              <p className="text-3xl font-bold text-gray-900">6</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <FileTextIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Plantillas de Reporte
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <FileTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Reporte Individual
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Análisis completo de un candidato con resultados detallados
            </p>
            <button
              onClick={() => handleUseTemplate('Reporte Individual')}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-700 transition-colors">
              
              Usar Plantilla
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-3">
              <FileTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Reporte Consolidado
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Comparativa de múltiples candidatos por puesto
            </p>
            <button
              onClick={() => handleUseTemplate('Reporte Consolidado')}
              className="w-full py-2 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-medium text-green-700 transition-colors">
              
              Usar Plantilla
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
              <FileTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Reporte Ejecutivo
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Resumen de alto nivel para dirección
            </p>
            <button
              onClick={() => handleUseTemplate('Reporte Ejecutivo')}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium text-purple-700 transition-colors">
              
              Usar Plantilla
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Reportes Recientes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Candidato/Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Puesto
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentReports.map((report) =>
              <tr
                key={report.id}
                className="hover:bg-gray-50 transition-colors">
                
                  <td className="px-6 py-4">
                    <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${report.type === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    
                      {report.type === 'individual' ?
                    'Individual' :
                    'Consolidado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.candidateName}
                    </div>
                    {report.compatibility !== null &&
                  <div className="text-sm text-gray-500">
                        Compatibilidad: {report.compatibility}%
                      </div>
                  }
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.position}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {report.date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${report.status === 'generated' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    
                      {report.status === 'generated' ? 'Generado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                      onClick={() => handleDownload(report)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar">
                      
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <button
                      onClick={() => handlePrint(report)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Imprimir">
                      
                        <PrinterIcon className="w-4 h-4" />
                      </button>
                      <button
                      onClick={() => handleShare(report)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Compartir">
                      
                        <Share2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)} />
      
    </div>);

}