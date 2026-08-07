import React, { useEffect, useState, useRef } from 'react';
import { XIcon, FileTextIcon, UserIcon, UsersIcon, Loader2Icon, PrinterIcon } from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabase';
import { generatePDF } from '../pages/Reports';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const REPORT_TYPES = [{
  id: 'individual',
  label: 'Individual',
  desc: 'Un candidato',
  icon: UserIcon,
  color: TR.blue,
  bg: `${TR.blue}12`
}, {
  id: 'consolidated',
  label: 'Consolidado',
  desc: 'Todos los candidatos',
  icon: UsersIcon,
  color: TR.green,
  bg: `${TR.green}12`
}, {
  id: 'executive',
  label: 'Ejecutivo',
  desc: 'Resumen gerencial',
  icon: FileTextIcon,
  color: '#7c3aed',
  bg: '#f5f3ff'
}] as const;
const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900";
function getBarColor(v: number) {
  return v >= 80 ? TR.green : v >= 65 ? TR.blue : v >= 50 ? '#f59e0b' : '#ef4444';
}
function getRecLabel(c: number) {
  if (c >= 80) return {
    text: 'Altamente Recomendable',
    color: '#166534',
    bg: '#f0fdf4'
  };
  if (c >= 65) return {
    text: 'Recomendable',
    color: '#1e40af',
    bg: '#eff6ff'
  };
  if (c >= 50) return {
    text: 'Con Reservas',
    color: '#92400e',
    bg: '#fffbeb'
  };
  return {
    text: 'No Recomendable',
    color: '#991b1b',
    bg: '#fef2f2'
  };
}
export function ReportGeneratorModal({
  isOpen,
  onClose
}: ReportGeneratorModalProps) {
  const {
    showToast
  } = useToast();
  const [reportType, setReportType] = useState<'individual' | 'consolidated' | 'executive'>('individual');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedResultId, setSelectedResultId] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [options, setOptions] = useState({
    charts: true,
    detailed: true,
    recommendations: false
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Grupo Económico Torres Rodríguez');
  const questionsCache = useRef<Record<string, any[]>>({});
  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);
  const loadData = async () => {
    setLoadingData(true);
    try {
      const [cRes, rRes, tRes, sRes] = await Promise.all([supabase.from('candidates').select('*').order('name'), supabase.from('results').select('*').order('id', {
        ascending: false
      }), supabase.from('tests').select('id, name'), supabase.from('app_settings').select('logo_url, company_name').eq('id', '00000000-0000-0000-0000-000000000001').single()]);
      setCandidates(cRes.data || []);
      setResults(rRes.data || []);
      setTests(tRes.data || []);
      if (sRes.data?.logo_url) setLogoUrl(sRes.data.logo_url);
      if (sRes.data?.company_name) setCompanyName(sRes.data.company_name);
    } catch {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Resultados disponibles para el tipo Individual
  const completedResults = results.map((r) => {
    const candidate = candidates.find((c) => String(c.id) === String(r.user_name));
    const test = tests.find((t) => String(t.id) === String(r.test_id));
    return {
      ...r,
      candidate,
      test,
      compatibility: Math.min(100, Math.round(r.score || 0))
    };
  }).filter((r) => r.candidate && r.test);
  const handleGenerate = async () => {
    if (reportType === 'individual' && !selectedResultId) {
      showToast('Selecciona una evaluación', 'warning');
      return;
    }
    setGenerating(true);
    try {
      if (reportType === 'individual') {
        // ── Reporte individual: genera PDF real ──────────────
        const result = completedResults.find((r) => String(r.id) === selectedResultId);
        if (!result) {
          showToast('Evaluación no encontrada', 'error');
          return;
        }

        // Cargar preguntas y respuestas
        const testId = String(result.test_id);
        if (!questionsCache.current[testId]) {
          const {
            data: qs
          } = await supabase.from('questions').select('id, text, options').eq('test_id', testId);
          questionsCache.current[testId] = qs || [];
        }
        const questions = questionsCache.current[testId];
        const rawAnswers = result.answers ? typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers : {};
        const answersWithText = questions.filter((q: any) => rawAnswers[q.id] !== undefined).map((q: any) => {
          const rawAnswer = rawAnswers[q.id];
          const opts: any[] = Array.isArray(q.options) ? q.options : typeof q.options === 'string' ? JSON.parse(q.options) : [];
          const selectedIndex = typeof rawAnswer === 'number' || /^\d+$/.test(String(rawAnswer)) ? Number(rawAnswer) : -1;
          let candidateLabel = String(rawAnswer);
          let candidateValue = -1;
          let correctLabel = '—';
          if (selectedIndex >= 0 && opts[selectedIndex]) {
            candidateLabel = String(opts[selectedIndex]?.label ?? opts[selectedIndex]?.text ?? rawAnswer);
            candidateValue = Number(opts[selectedIndex]?.value ?? 0);
          } else {
            const match = opts.find((o: any) => String(o?.value) === String(rawAnswer));
            if (match) {
              candidateLabel = String(match.label ?? match.text ?? rawAnswer);
              candidateValue = Number(match.value ?? 0);
            }
          }
          const maxVal = Math.max(...opts.map((o: any) => Number(o?.value ?? 0)));
          const correctOpt = opts.find((o: any) => Number(o?.value ?? 0) === maxVal);
          if (correctOpt) correctLabel = String(correctOpt.label ?? correctOpt.text ?? '—');
          const isCorrect = candidateValue === maxVal && maxVal > 0;
          return {
            questionText: q.text,
            answer: candidateLabel,
            correctAnswer: correctLabel,
            isCorrect
          };
        });
        const reportRow = {
          id: String(result.id),
          candidateName: String(result.candidate?.name || 'Sin nombre'),
          candidateEmail: String(result.candidate?.email || ''),
          position: String(result.candidate?.position || '—'),
          testName: String(result.test?.name || 'Sin test'),
          testId,
          score: Number(result.score) || 0,
          compatibility: result.compatibility,
          date: result.created_at ? new Date(result.created_at).toLocaleDateString('es-MX') : '—',
          level: '',
          levelColor: '',
          rawAnswers
        };
        generatePDF(reportRow, answersWithText, logoUrl, companyName);
        showToast('Reporte PDF generado', 'success');
      } else if (reportType === 'consolidated') {
        // ── Reporte consolidado: tabla con todos ─────────────
        generateConsolidatedPDF(completedResults, dateRange, logoUrl, companyName);
        showToast('Reporte consolidado generado', 'success');
      } else {
        // ── Reporte ejecutivo: resumen estadístico ───────────
        generateExecutivePDF(completedResults, candidates, dateRange, logoUrl, companyName);
        showToast('Reporte ejecutivo generado', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast('Error al generar reporte: ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-7 py-6 flex items-center justify-between" style={{
        background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})`
      }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15">
              <FileTextIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Generar Reporte</h2>
              <p className="text-white/50 text-xs mt-0.5">Crear reporte de evaluación en PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-5 max-h-[520px] overflow-y-auto">

          {/* Tipo de reporte */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tipo de Reporte</label>
            <div className="grid grid-cols-3 gap-3">
              {REPORT_TYPES.map((rt) => {
              const Icon = rt.icon;
              const selected = reportType === rt.id;
              return <button key={rt.id} type="button" onClick={() => setReportType(rt.id)} className="p-4 rounded-2xl border-2 transition-all text-left" style={{
                borderColor: selected ? rt.color : '#e5e7eb',
                background: selected ? rt.bg : '#fafafa'
              }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{
                  background: selected ? rt.color : '#e5e7eb'
                }}>
                      <Icon className="w-4 h-4" style={{
                    color: selected ? 'white' : '#9ca3af'
                  }} />
                    </div>
                    <p className="font-bold text-sm" style={{
                  color: selected ? rt.color : '#374151'
                }}>{rt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rt.desc}</p>
                  </button>;
            })}
            </div>
          </div>

          {/* Individual: seleccionar evaluación real */}
          {reportType === 'individual' && <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Evaluación *
              </label>
              {loadingData ? <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-400">
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Cargando evaluaciones...
                </div> : completedResults.length === 0 ? <div className="px-4 py-2.5 border border-yellow-200 rounded-xl bg-yellow-50 text-sm text-yellow-700">
                  No hay evaluaciones completadas en el sistema.
                </div> : <select value={selectedResultId} onChange={(e) => setSelectedResultId(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar evaluación...</option>
                  {completedResults.map((r) => <option key={r.id} value={String(r.id)}>
                      {r.candidate?.name} — {r.test?.name} ({r.compatibility}%)
                    </option>)}
                </select>}
            </div>}

          {/* Consolidado / Ejecutivo: rango de fechas */}
          {(reportType === 'consolidated' || reportType === 'executive') && <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Rango de Fechas <span className="text-gray-300 font-normal normal-case">(opcional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Desde</p>
                  <input type="date" value={dateRange.from} onChange={(e) => setDateRange({
                ...dateRange,
                from: e.target.value
              })} className={inputClass} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hasta</p>
                  <input type="date" value={dateRange.to} onChange={(e) => setDateRange({
                ...dateRange,
                to: e.target.value
              })} className={inputClass} />
                </div>
              </div>
              {!loadingData && <p className="text-xs text-gray-400 mt-2">
                  {completedResults.length} evaluaciones disponibles
                </p>}
            </div>}

          {/* Opciones */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100" style={{
            background: `${TR.blue}06`
          }}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Opciones del Reporte</p>
            </div>
            <div className="p-4 space-y-3">
              {[{
              key: 'charts',
              label: 'Incluir gráficos de compatibilidad'
            }, {
              key: 'detailed',
              label: 'Incluir interpretación detallada'
            }, {
              key: 'recommendations',
              label: 'Incluir recomendaciones'
            }].map((opt) => <label key={opt.key} className="flex items-center gap-3 cursor-pointer group" onClick={() => setOptions((o) => ({
              ...o,
              [opt.key]: !o[opt.key as keyof typeof options]
            }))}>
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0" style={{
                borderColor: options[opt.key as keyof typeof options] ? TR.blue : '#d1d5db',
                background: options[opt.key as keyof typeof options] ? TR.blue : 'white'
              }}>
                    {options[opt.key as keyof typeof options] && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>}
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{opt.label}</span>
                </label>)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button onClick={handleGenerate} disabled={generating || loadingData} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-60" style={{
          background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`,
          boxShadow: `0 4px 12px ${TR.green}40`
        }}>
            {generating ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Generando...</> : <><PrinterIcon className="w-4 h-4" /> Generar Reporte PDF</>}
          </button>
        </div>
      </div>
    </div>;
}

// ── Helper: header HTML con logo dinámico ─────────────────────────
function buildLogoHeader(logoUrl: string | null, companyName: string) {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="${companyName}" style="height:48px;width:auto;object-fit:contain;filter:brightness(0) invert(1)" />`;
  }
  return `<span style="font-size:18px;font-weight:900;color:#fff">${companyName}</span>`;
}

// ── Reporte Consolidado ────────────────────────────────────────────
function generateConsolidatedPDF(results: any[], dateRange: {
  from: string;
  to: string;
}, logoUrl: string | null, companyName: string) {
  const filtered = results.filter((r) => {
    if (!dateRange.from && !dateRange.to) return true;
    const d = new Date(r.created_at);
    if (dateRange.from && d < new Date(dateRange.from)) return false;
    if (dateRange.to && d > new Date(dateRange.to)) return false;
    return true;
  });
  const avg = filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.compatibility, 0) / filtered.length) : 0;
  const rows = filtered.map((r) => `
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 12px;font-size:13px;color:#111827;font-weight:600">${r.candidate?.name || '—'}</td>
      <td style="padding:10px 12px;font-size:12px;color:#6b7280">${r.candidate?.position || '—'}</td>
      <td style="padding:10px 12px;font-size:12px;color:#6b7280">${r.test?.name || '—'}</td>
      <td style="padding:10px 12px;text-align:center">
        <span style="font-weight:800;font-size:14px;color:${r.compatibility >= 80 ? '#16a34a' : r.compatibility >= 65 ? '#2563eb' : r.compatibility >= 50 ? '#d97706' : '#dc2626'}">${r.compatibility}%</span>
      </td>
      <td style="padding:10px 12px;font-size:11px;color:#9ca3af;text-align:center">${r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '—'}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Reporte Consolidado</title>
  <style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{font-family:Arial,sans-serif;background:#f1f5f9;padding:24px}
  .page{background:#fff;max-width:900px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
  @media print{body{background:#fff;padding:0}.page{border-radius:0;box-shadow:none}}</style></head>
  <body><div class="page">
  <div style="background:linear-gradient(135deg,#1a2d6b,#2D4494);padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
    <div><p style="color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:.1em">Reporte Consolidado</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin-top:4px">Todas las Evaluaciones</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px">${filtered.length} evaluaciones · Promedio: ${avg}%</p></div>
    <div style="text-align:right">${buildLogoHeader(logoUrl, companyName)}
    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:6px">${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</p></div>
  </div>
  <div style="padding:24px 32px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
        <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Candidato</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Puesto</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Prueba</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Compat.</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Fecha</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Sin evaluaciones</td></tr>'}</tbody>
    </table>
  </div>
  <div style="padding:12px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between">
    <span style="font-size:11px;color:#9ca3af">${companyName}</span>
    <span style="font-size:11px;color:#9ca3af">Total: ${filtered.length} evaluaciones</span>
  </div></div></body></html>`;
  const w = window.open('', '_blank', 'width=1000,height=800');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.document.body.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
    w.print();
  }, 800);
}

// ── Reporte Ejecutivo ──────────────────────────────────────────────
function generateExecutivePDF(results: any[], candidates: any[], dateRange: {
  from: string;
  to: string;
}, logoUrl: string | null, companyName: string) {
  const filtered = results.filter((r) => {
    if (!dateRange.from && !dateRange.to) return true;
    const d = new Date(r.created_at);
    if (dateRange.from && d < new Date(dateRange.from)) return false;
    if (dateRange.to && d > new Date(dateRange.to)) return false;
    return true;
  });
  const avg = filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.compatibility, 0) / filtered.length) : 0;
  const highRec = filtered.filter((r) => r.compatibility >= 80).length;
  const rec = filtered.filter((r) => r.compatibility >= 65 && r.compatibility < 80).length;
  const notRec = filtered.filter((r) => r.compatibility < 65).length;
  const hired = candidates.filter((c) => c.status === 'hired').length;
  const completed = candidates.filter((c) => c.status === 'completed').length;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Reporte Ejecutivo</title>
  <style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{font-family:Arial,sans-serif;background:#f1f5f9;padding:24px}
  .page{background:#fff;max-width:900px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
  .kpi{display:inline-block;width:22%;margin:0 1%;background:#f9fafb;border-radius:8px;padding:16px;text-align:center;vertical-align:top}
  @media print{body{background:#fff;padding:0}.page{border-radius:0;box-shadow:none}}</style></head>
  <body><div class="page">
  <div style="background:linear-gradient(135deg,#1a2d6b,#2D4494);padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
    <div><p style="color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:.1em">Reporte Ejecutivo</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin-top:4px">Resumen Gerencial</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px">${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</p></div>
    <div style="text-align:right">${buildLogoHeader(logoUrl, companyName)}</div>
  </div>
  <div style="padding:24px 32px">
    <h2 style="font-size:14px;font-weight:700;color:#1a2d6b;margin-bottom:16px;text-transform:uppercase;letter-spacing:.05em">KPIs Generales</h2>
    <div style="margin-bottom:24px">
      <div class="kpi"><p style="font-size:32px;font-weight:900;color:#2D4494">${candidates.length}</p><p style="font-size:11px;color:#6b7280;margin-top:4px">Total Candidatos</p></div>
      <div class="kpi"><p style="font-size:32px;font-weight:900;color:#7DB928">${hired}</p><p style="font-size:11px;color:#6b7280;margin-top:4px">Contratados</p></div>
      <div class="kpi"><p style="font-size:32px;font-weight:900;color:#2D4494">${filtered.length}</p><p style="font-size:11px;color:#6b7280;margin-top:4px">Evaluaciones</p></div>
      <div class="kpi"><p style="font-size:32px;font-weight:900;color:${avg >= 70 ? '#16a34a' : '#d97706'}">${avg}%</p><p style="font-size:11px;color:#6b7280;margin-top:4px">Promedio Compat.</p></div>
    </div>
    <h2 style="font-size:14px;font-weight:700;color:#1a2d6b;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em">Distribución de Resultados</h2>
    ${[{
    label: 'Altamente Recomendables (80-100%)',
    value: highRec,
    color: '#16a34a',
    bg: '#f0fdf4'
  }, {
    label: 'Recomendables (65-79%)',
    value: rec,
    color: '#2563eb',
    bg: '#eff6ff'
  }, {
    label: 'No Recomendables (<65%)',
    value: notRec,
    color: '#dc2626',
    bg: '#fef2f2'
  }].map((item) => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:12px;background:${item.bg};border-radius:8px">
        <span style="font-size:24px;font-weight:900;color:${item.color};width:48px;text-align:center">${item.value}</span>
        <div style="flex:1"><div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden"><div style="height:100%;width:${filtered.length > 0 ? Math.round(item.value / filtered.length * 100) : 0}%;background:${item.color};border-radius:4px"></div></div></div>
        <span style="font-size:12px;color:${item.color};font-weight:600;width:40px;text-align:right">${filtered.length > 0 ? Math.round(item.value / filtered.length * 100) : 0}%</span>
        <span style="font-size:12px;color:#6b7280">${item.label}</span>
      </div>`).join('')}
  </div>
  <div style="padding:12px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
    <span style="font-size:11px;color:#9ca3af">${companyName} · Reporte generado el ${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</span>
  </div></div></body></html>`;
  const w = window.open('', '_blank', 'width=1000,height=800');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.document.body.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
    w.print();
  }, 800);
}