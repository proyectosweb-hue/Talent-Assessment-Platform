import React, { useCallback, useEffect, useState, useRef } from 'react';
import { FileTextIcon, DownloadIcon, PrinterIcon, PlusIcon, Loader2Icon, TrendingUpIcon, CalendarIcon, BarChart2Icon, EyeIcon, LockIcon, SearchIcon, XCircleIcon, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { ReportGeneratorModal } from '../components/ReportGeneratorModal';
import { Pagination } from '../components/Pagination';
import { getCompatibilityLevel, getCompatibilityLabel, getCompatibilityColor } from '../utils/scoring';
import { PermissionLevel } from '../App';
import { useRealtimeMulti } from '../utils/useRealtime';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e',
  blueLight: '#3a55b5'
};
const PAGE_SIZE = 10;
interface AnswerRow {
  questionText: string;
  answer: string; // respuesta que dio el candidato
  correctAnswer: string; // respuesta correcta
  isCorrect: boolean; // si acertó o no
}
interface ReportRow {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  testName: string;
  testId: string;
  score: number;
  compatibility: number;
  date: string;
  level: string;
  levelColor: string;
  rawAnswers?: Record<string, string>;
}
function getBarColor(v: number) {
  return v >= 80 ? TR.green : v >= 65 ? TR.blue : v >= 50 ? '#f59e0b' : '#ef4444';
}
function getRecLabel(c: number) {
  if (c >= 80) return {
    text: 'Altamente Recomendable',
    color: TR.greenDark,
    bg: '#f0fdf4'
  };
  if (c >= 65) return {
    text: 'Recomendable',
    color: TR.blue,
    bg: '#eff6ff'
  };
  if (c >= 50) return {
    text: 'Con Reserva',
    color: '#92400e',
    bg: '#fffbeb'
  };
  return {
    text: 'No Recomendable',
    color: '#991b1b',
    bg: '#fef2f2'
  };
}
export function generatePDF(report: ReportRow, answersWithText: AnswerRow[], logoUrl?: string | null, companyName?: string) {
  const _company = companyName || 'TalentAssess';
  const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="${_company}" style="height:44px;width:auto;object-fit:contain;filter:brightness(0) invert(1)" />` : `<span style="font-size:18px;font-weight:900;color:#fff">${_company}</span>`;
  const rec = getRecLabel(report.compatibility);
  const angle = Math.PI - report.compatibility / 100 * Math.PI;
  const nx = Math.round(100 + 68 * Math.cos(angle));
  const ny = Math.round(100 - 68 * Math.sin(angle));
  const recText = report.compatibility >= 80 ? `${report.candidateName} presenta un perfil altamente compatible con el puesto.` : report.compatibility >= 65 ? `${report.candidateName} muestra buena compatibilidad con el perfil requerido.` : report.compatibility >= 50 ? `Perfil con nivel regular de ajuste a las normas establecidas.` : `Los resultados indican que el perfil no es compatible con el puesto en este momento.`;
  const correct = answersWithText.filter((a) => a.isCorrect).length;
  const incorrect = answersWithText.filter((a) => !a.isCorrect).length;
  const total = answersWithText.length;
  const questionsHTML = answersWithText.length > 0 ? `<div style="display:flex;gap:10px;margin-bottom:14px">
        <div style="flex:1;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;text-align:center">
          <p style="font-size:22px;font-weight:900;color:#16a34a">${correct}</p>
          <p style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.05em">Correctas</p>
        </div>
        <div style="flex:1;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;text-align:center">
          <p style="font-size:22px;font-weight:900;color:#dc2626">${incorrect}</p>
          <p style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.05em">Incorrectas</p>
        </div>
        <div style="flex:1;padding:10px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;text-align:center">
          <p style="font-size:22px;font-weight:900;color:#475569">${total}</p>
          <p style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Total</p>
        </div>
      </div>
      ${answersWithText.map((a, i) => `
        <div style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1px solid ${a.isCorrect ? '#bbf7d0' : '#fecaca'}">
          <div style="padding:8px 12px;background:${a.isCorrect ? '#f0fdf4' : '#fef2f2'};display:flex;align-items:flex-start;gap:10px">
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-top:1px">
              <span style="font-size:11px;font-weight:700;color:#94a3b8;min-width:20px">${i + 1}.</span>
              <span style="font-size:13px;font-weight:900;color:${a.isCorrect ? '#16a34a' : '#dc2626'}">${a.isCorrect ? '✓' : '✗'}</span>
            </div>
            <div style="flex:1">
              <p style="font-size:11px;color:#374151;font-weight:600;line-height:1.4;margin-bottom:5px">${a.questionText}</p>
              <p style="font-size:11px;margin-bottom:${a.isCorrect ? '0' : '4px'}">
                <span style="color:#6b7280;font-weight:600">Respondió: </span>
                <span style="font-weight:700;color:${a.isCorrect ? '#16a34a' : '#dc2626'}">${a.answer}</span>
              </p>
              ${!a.isCorrect ? `<p style="font-size:11px"><span style="color:#6b7280;font-weight:600">Correcta: </span><span style="font-weight:700;color:#16a34a">${a.correctAnswer}</span></p>` : ''}
            </div>
          </div>
        </div>`).join('')}` : `<p style="font-size:12px;color:#9ca3af;font-style:italic;padding:12px">Sin respuestas registradas.</p>`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Reporte – ${report.candidateName}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{font-family:Helvetica Neue,Arial,sans-serif;background:#e5e7eb;padding:24px}.page{background:#fff;max-width:820px;margin:0 auto 28px;border:1px solid #d1d5db;border-radius:8px;overflow:hidden}.body{padding:24px 32px}@media print{body{background:#fff;padding:0}.page{border:none;margin:0;border-radius:0}}</style>
  </head><body><div class="page">
  <div style="background:linear-gradient(135deg,${TR.navy},${TR.blue});padding:20px 32px;display:flex;justify-content:space-between;align-items:center">
    <div><p style="color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:.1em">Reporte Psicométrico</p><p style="color:#fff;font-size:20px;font-weight:800;margin-top:2px">${report.candidateName}</p><p style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px">${report.position || '—'} · ${report.date}</p></div>
    <div style="text-align:right">${logoHtml}<br/><p style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.02em;margin-top:4px">${report.compatibility}%</p></div>
  </div>
  <div class="body">
    <h2 style="font-size:16px;font-weight:700;color:${TR.navy};margin-bottom:16px">${report.testName}</h2>
    <div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:20px">
      <div style="flex:1">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:6px">Compatibilidad General</p>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="flex:1;height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden"><div style="height:100%;width:${report.compatibility}%;background:${getBarColor(report.compatibility)};border-radius:5px"></div></div>
          <span style="font-size:18px;font-weight:800;color:${getBarColor(report.compatibility)}">${report.compatibility}%</span>
        </div>
        <p style="font-size:11px;color:#6b7280;margin-top:6px">Score raw: <strong>${report.score} pts</strong></p>
        <div style="margin-top:10px;padding:8px 12px;background:${rec.bg};border-radius:8px;display:inline-block"><span style="font-size:12px;font-weight:700;color:${rec.color}">${rec.text}</span></div>
      </div>
      <div style="width:180px;flex-shrink:0;text-align:center">
        <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" width="180" height="99">
          <path d="M 16 100 A 84 84 0 0 1 52 24" stroke="#ef4444" stroke-width="18" fill="none"/>
          <path d="M 52 24 A 84 84 0 0 1 100 16" stroke="#f59e0b" stroke-width="18" fill="none"/>
          <path d="M 100 16 A 84 84 0 0 1 148 24" stroke="${TR.blue}" stroke-width="18" fill="none"/>
          <path d="M 148 24 A 84 84 0 0 1 184 100" stroke="${TR.green}" stroke-width="18" fill="none"/>
          <line x1="100" y1="100" x2="${nx}" y2="${ny}" stroke="${TR.navy}" stroke-width="3" stroke-linecap="round"/>
          <circle cx="100" cy="100" r="5" fill="${TR.navy}"/>
        </svg>
        <p style="font-size:11px;color:#6b7280;line-height:1.5;margin-top:6px;text-align:left">${recText}</p>
      </div>
    </div>
    <div style="height:1px;background:#e5e7eb;margin-bottom:16px"></div>
    <p style="font-size:13px;font-weight:700;color:${TR.navy};margin-bottom:10px">Detalle de Respuestas — Correctas e Incorrectas:</p>
    ${questionsHTML}
  </div>
  <div style="padding:10px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between">
    <span style="font-size:11px;color:#9ca3af">${_company}</span>
    <span style="font-size:11px;color:#9ca3af">${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</span>
  </div>
  </div></body></html>`;

  // ── Descarga directa — no abre diálogo de impresión ──────────────
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = `Reporte_${report.candidateName.replace(/\s+/g, '_')}_${report.testName.replace(/\s+/g, '_')}.html`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // Retornar html para reutilizar en impresión
  return html;
}
interface ReportsProps {
  permission?: PermissionLevel;
}
export function Reports({
  permission = 'full'
}: ReportsProps) {
  const {
    showToast
  } = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Grupo Económico Torres Rodríguez');
  const questionsCache = useRef<Record<string, {
    id: string;
    text: string;
    options: any;
  }[]>>({});
  const isReadonly = permission === 'readonly';
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: results,
        error
      } = await supabase.from('results').select('*').order('id', {
        ascending: false
      });
      if (error) throw error;
      const {
        data: candidates
      } = await supabase.from('candidates').select('*');
      const {
        data: tests
      } = await supabase.from('tests').select('*');
      const {
        data: settings
      } = await supabase.from('app_settings').select('logo_url, company_name').eq('id', '00000000-0000-0000-0000-000000000001').single();
      if (settings?.logo_url) setLogoUrl(settings.logo_url);
      if (settings?.company_name) setCompanyName(settings.company_name);
      const rows: ReportRow[] = (results || []).map((r: any) => {
        const candidate = candidates?.find((c: any) => String(c.id) === String(r.user_name));
        const test = tests?.find((t: any) => String(t.id) === String(r.test_id));
        const compat = Math.min(100, Math.round(r.score || 0));
        const lvl = getCompatibilityLevel(compat);
        const rawAnswers = r.answers ? typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers : {};
        return {
          id: String(r.id),
          candidateName: String(candidate?.name || r.user_name || 'Sin nombre'),
          candidateEmail: String(candidate?.email || '—'),
          position: String(candidate?.position || '—'),
          testName: String(test?.name || 'Sin test'),
          testId: String(r.test_id || ''),
          score: Number(r.score) || 0,
          compatibility: compat,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '—',
          level: String(getCompatibilityLabel(lvl)),
          levelColor: String(getCompatibilityColor(lvl)),
          rawAnswers
        };
      });
      setReports(rows);
    } catch (err: any) {
      showToast('Error al cargar reportes: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Tiempo real: la tabla se actualiza al recibir resultados nuevos ──
  useRealtimeMulti(['results', 'candidates'], fetchReports);
  const resolveAnswers = async (report: ReportRow): Promise<AnswerRow[]> => {
    if (!report.testId || !report.rawAnswers || Object.keys(report.rawAnswers).length === 0) return [];
    if (!questionsCache.current[report.testId]) {
      const {
        data: qs
      } = await supabase.from('questions').select('id, text, options').eq('test_id', report.testId);
      questionsCache.current[report.testId] = qs || [];
    }
    const questions = questionsCache.current[report.testId];
    return questions.filter((q) => report.rawAnswers![q.id] !== undefined).map((q) => {
      const rawAnswer = report.rawAnswers![q.id];
      const opts: any[] = Array.isArray(q.options) ? q.options : typeof q.options === 'string' ? JSON.parse(q.options) : [];

      // La respuesta puede estar guardada como índice (número) o como value legacy
      const selectedIndex = typeof rawAnswer === 'number' || /^\d+$/.test(String(rawAnswer)) ? Number(rawAnswer) : -1;
      let candidateLabel = String(rawAnswer);
      let candidateValue = -1;
      let correctLabel = '—';
      if (selectedIndex >= 0 && opts[selectedIndex]) {
        // Guardado como índice (nuevo sistema)
        candidateLabel = String(opts[selectedIndex]?.label ?? opts[selectedIndex]?.text ?? rawAnswer);
        candidateValue = Number(opts[selectedIndex]?.value ?? 0);
      } else {
        // Legacy: rawAnswer es el value directo
        const match = opts.find((o: any) => String(o?.value) === String(rawAnswer));
        if (match) {
          candidateLabel = String(match.label ?? match.text ?? rawAnswer);
          candidateValue = Number(match.value ?? 0);
        }
      }

      // Respuesta correcta = opción con el value más alto (1 en nuestro sistema)
      const maxVal = Math.max(...opts.map((o: any) => Number(o?.value ?? 0)));
      const correctOpt = opts.find((o: any) => Number(o?.value ?? 0) === maxVal);
      if (correctOpt) correctLabel = String(correctOpt.label ?? correctOpt.text ?? '—');
      const isCorrect = candidateValue === maxVal && maxVal > 0;
      return {
        questionText: String(q.text || ''),
        answer: candidateLabel,
        correctAnswer: correctLabel,
        isCorrect
      };
    });
  };
  const handleDownload = async (r: ReportRow) => {
    showToast('Descargando reporte…', 'info');
    generatePDF(r, await resolveAnswers(r), logoUrl, companyName);
  };
  const handlePrint = async (r: ReportRow) => {
    showToast('Preparando impresión…', 'info');
    const html = generatePDF(r, await resolveAnswers(r), logoUrl, companyName);
    if (!html) return;
    const w = window.open('', '_blank', 'width=960,height=800');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 800);
  };
  const filtered = reports.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return r.candidateName.toLowerCase().includes(term) || r.testName.toLowerCase().includes(term) || r.position.toLowerCase().includes(term);
  });
  const avg = reports.length ? Math.round(reports.reduce((s, r) => s + r.compatibility, 0) / reports.length) : 0;
  const highlyRec = reports.filter((r) => r.compatibility >= 80).length;
  const thisMonth = reports.filter((r) => {
    const now = new Date();
    const d = new Date(r.date.split('/').reverse().join('-'));
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  return <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{
          color: TR.navy
        }}>Reportes</h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            {reports.length} evaluaciones
            {isReadonly && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold"><LockIcon className="w-3 h-3" />Solo lectura</span>}
          </p>
        </div>
        {!isReadonly && <button onClick={() => setShowGeneratorModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:opacity-90" style={{
        background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
      }}>
            <PlusIcon className="w-4 h-4" /> Generar Reporte
          </button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{
        label: 'Total Reportes',
        value: reports.length,
        icon: FileTextIcon,
        color: TR.blue
      }, {
        label: 'Este Mes',
        value: thisMonth,
        icon: CalendarIcon,
        color: TR.navy
      }, {
        label: 'Promedio Compat.',
        value: `${avg}%`,
        icon: BarChart2Icon,
        color: '#f59e0b'
      }, {
        label: 'Muy Recomendados',
        value: highlyRec,
        icon: TrendingUpIcon,
        color: TR.green
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

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header tabla con buscador */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{
        background: '#fafafa'
      }}>
          <div>
            <h3 className="font-bold text-gray-900">Historial de Evaluaciones</h3>
            <p className="text-xs text-gray-400">{filtered.length}{searchTerm ? ` de ${reports.length}` : ''} registros</p>
          </div>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar candidato o prueba..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:ring-1" style={{
            '--tw-ring-color': TR.blue
          } as any} />
            
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <XCircleIcon className="w-4 h-4" />
              </button>}
          </div>
        </div>

        {loading ? <div className="flex flex-col items-center justify-center h-48">
            <Loader2Icon className="w-8 h-8 animate-spin mb-2" style={{
          color: TR.blue
        }} />
            <p className="text-gray-400 text-sm">Cargando…</p>
          </div> : reports.length === 0 ? <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <FileTextIcon className="w-10 h-10 mb-2" />
            <p className="text-gray-400 font-medium">No hay evaluaciones registradas</p>
          </div> : <>
            {/* Col headers */}
            <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
              <div className="col-span-3">Candidato</div>
              <div className="col-span-3">Prueba</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-2">Compat.</div>
              <div className="col-span-2">Resultado</div>
              <div className="col-span-1 text-right">Fecha</div>
            </div>

            <div className="divide-y divide-gray-50">
              {paginated.length === 0 ? <div className="text-center py-10 text-gray-400">Sin resultados para "{searchTerm}"</div> : paginated.map((r) => {
            const color = getBarColor(r.compatibility);
            const rec = getRecLabel(r.compatibility);
            return <div key={r.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors group">

                    {/* Candidato */}
                    <div className="col-span-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{
                  background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
                }}>
                        {String(r.candidateName).substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{r.candidateName}</p>
                        <p className="text-xs text-gray-400 truncate">{r.position}</p>
                      </div>
                    </div>

                    {/* Prueba */}
                    <div className="col-span-3">
                      <span className="text-sm text-gray-600 font-medium truncate block">{r.testName}</span>
                    </div>

                    {/* Score */}
                    <div className="col-span-1">
                      <span className="text-sm font-black" style={{
                  color: TR.navy
                }}>{r.score}</span>
                    </div>

                    {/* Compatibilidad */}
                    <div className="col-span-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                      width: `${r.compatibility}%`,
                      background: color
                    }} />
                        </div>
                        <span className="text-xs font-bold" style={{
                    color
                  }}>{r.compatibility}%</span>
                      </div>
                    </div>

                    {/* Resultado */}
                    <div className="col-span-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{
                  background: rec.bg,
                  color: rec.color
                }}>
                        {r.level}
                      </span>
                    </div>

                    {/* Fecha + acciones */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <span className="text-xs text-gray-300 group-hover:hidden">{r.date}</span>
                      <div className="hidden group-hover:flex gap-1">
                        <button onClick={() => setPreviewReport(r)} className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors" style={{
                    color: TR.blue
                  }}>
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDownload(r)} className="p-1.5 rounded-lg hover:bg-green-100 transition-colors" style={{
                    color: TR.green
                  }}>
                          <DownloadIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handlePrint(r)} className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-500 transition-colors">
                          <PrinterIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>;
          })}
            </div>

            <div className="border-t border-gray-100 px-6">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} />
            </div>
          </>}
      </div>

      {/* Modal preview */}
      {previewReport && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setPreviewReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5" style={{
          background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})`
        }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{
            color: 'rgba(255,255,255,0.5)'
          }}>Vista Previa</p>
              <h2 className="text-white text-xl font-bold">{previewReport.candidateName}</h2>
              <p className="text-sm mt-0.5" style={{
            color: 'rgba(255,255,255,0.6)'
          }}>{previewReport.testName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-gray-400 text-sm">Compatibilidad</span>
                <span className="text-5xl font-black" style={{
              color: getBarColor(previewReport.compatibility)
            }}>{previewReport.compatibility}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
              width: `${previewReport.compatibility}%`,
              background: getBarColor(previewReport.compatibility)
            }} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[['Puesto', previewReport.position], ['Score', `${previewReport.score} pts`], ['Fecha', previewReport.date], ['Resultado', previewReport.level]].map(([label, value]) => <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                  </div>)}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setPreviewReport(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50">Cerrar</button>
                <button onClick={() => {
              setPreviewReport(null);
              handleDownload(previewReport);
            }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md" style={{
              background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
            }}>
                  <DownloadIcon className="w-4 h-4" /> Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>}

      <ReportGeneratorModal isOpen={showGeneratorModal} onClose={() => {
      setShowGeneratorModal(false);
      fetchReports();
    }} />
    </div>;
}