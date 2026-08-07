import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlusIcon, MailIcon, BriefcaseIcon, CheckCircle2Icon, TrendingUpIcon, DownloadIcon, ClipboardListIcon, BarChart3Icon, CalendarIcon, Loader2Icon, AlertTriangleIcon, UserCheckIcon, StarIcon } from 'lucide-react';
import { Candidate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { getCompatibilityLevel, getCompatibilityLabel, getCompatibilityColor } from '../utils/scoring';
import { useToast } from '../components/Toast';
import { supabase } from '../supabase';
import { logAudit } from '../utils/useAudit';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e',
  blueLight: '#3a55b5'
};
interface DetailProps {
  candidate: Candidate;
  onBack: () => void;
  onAddNew: () => void;
}
interface TestResult {
  id: string;
  test_id: string;
  score: number;
  compatibility: number;
  created_at: string;
  testName: string;
}
export function CandidateDetail({
  candidate,
  onBack,
  onAddNew
}: DetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'alerts'>('overview');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const {
    showToast
  } = useToast();
  useEffect(() => {
    const load = async () => {
      setLoadingResults(true);
      try {
        const {
          data: results
        } = await supabase.from('results').select('*').eq('user_name', String(candidate.id)).order('id', {
          ascending: false
        });
        const {
          data: tests
        } = await supabase.from('tests').select('id, name');
        const merged: TestResult[] = (results || []).map((r: any) => {
          const test = tests?.find((t: any) => String(t.id) === String(r.test_id));
          return {
            id: String(r.id),
            test_id: String(r.test_id),
            score: Number(r.score) || 0,
            compatibility: Math.min(100, Math.round(r.score || 0)),
            created_at: r.created_at || '',
            testName: test?.name || 'Sin nombre'
          };
        });
        setTestResults(merged);
      } catch {} finally {
        setLoadingResults(false);
      }
    };
    load();
  }, [candidate.id]);
  const handleHireCandidate = async () => {
    if (!window.confirm(`¿Confirmar contratación de ${candidate.name}?`)) return;
    try {
      const {
        error
      } = await supabase.from('candidates').update({
        status: 'hired'
      }).eq('id', candidate.id);
      if (error) throw error;

      // ── Auditoría ──────────────────────────────────────────
      await logAudit({
        action: 'HIRE',
        module: 'candidates',
        description: `Candidato "${candidate.name}" contratado para "${candidate.position || 'Sin puesto'}"`,
        entity_id: String(candidate.id),
        entity_name: candidate.name,
        metadata: {
          position: candidate.position,
          compatibility: avgCompatibility
        }
      });
      showToast('Candidato contratado exitosamente', 'success');
      setTimeout(() => onBack(), 1500);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };
  const avgCompatibility = testResults.length > 0 ? Math.round(testResults.reduce((s, r) => s + r.compatibility, 0) / testResults.length) : Number(candidate.compatibility) || 0;
  const getCompatColor = (v: number) => v >= 80 ? TR.green : v >= 65 ? TR.blue : v >= 50 ? '#f59e0b' : '#ef4444';
  const getCompatBg = (v: number) => v >= 80 ? '#f0fdf4' : v >= 65 ? '#eff6ff' : v >= 50 ? '#fffbeb' : '#fef2f2';
  const gaugeAngle = Math.PI - avgCompatibility / 100 * Math.PI;
  const gaugeX = Math.round(100 + 68 * Math.cos(gaugeAngle));
  const gaugeY = Math.round(100 - 68 * Math.sin(gaugeAngle));
  const gaugeColor = getCompatColor(avgCompatibility);
  const tabs = [{
    id: 'overview',
    label: 'Reporte General'
  }, {
    id: 'tests',
    label: `Pruebas (${testResults.length})`
  }, {
    id: 'alerts',
    label: 'Alertas'
  }];
  return <div className="p-6 space-y-5">
      {/* Header nav */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-70" style={{
        color: TR.blue
      }}>
          <ArrowLeftIcon className="w-4 h-4" /> Volver a Candidatos
        </button>
        <div className="flex gap-2">
          <button onClick={() => showToast('Descargando...', 'info')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-600 shadow-sm">
            <DownloadIcon className="w-4 h-4" /> Exportar PDF
          </button>
          <button onClick={onAddNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md" style={{
          background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
        }}>
            <PlusIcon className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden shadow-md" style={{
      background: `linear-gradient(135deg, ${TR.navy} 0%, ${TR.blue} 60%, ${TR.blueLight} 100%)`
    }}>
        <div className="px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg" style={{
            background: `${TR.green}cc`,
            border: '3px solid rgba(255,255,255,0.2)'
          }}>
              {String(candidate.name || '').substring(0, 2).toUpperCase()}
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-black mb-1">{String(candidate.name || '')}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm" style={{
              color: 'rgba(255,255,255,0.65)'
            }}>
                <span className="flex items-center gap-1.5"><BriefcaseIcon className="w-3.5 h-3.5" />{String(candidate.position || 'Sin puesto')}</span>
                <span className="flex items-center gap-1.5"><MailIcon className="w-3.5 h-3.5" />{String(candidate.email || '')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 110" width="160" height="88">
              <path d="M 16 100 A 84 84 0 0 1 52 24" stroke="#ef4444" strokeWidth="16" fill="none" />
              <path d="M 52 24 A 84 84 0 0 1 100 16" stroke="#f59e0b" strokeWidth="16" fill="none" />
              <path d="M 100 16 A 84 84 0 0 1 148 24" stroke={TR.blue} strokeWidth="16" fill="none" />
              <path d="M 148 24 A 84 84 0 0 1 184 100" stroke={TR.green} strokeWidth="16" fill="none" />
              <line x1="100" y1="100" x2={gaugeX} y2={gaugeY} stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill="white" />
            </svg>
            <p className="text-4xl font-black text-white">{avgCompatibility}%</p>
            <p className="text-xs mt-0.5" style={{
            color: 'rgba(255,255,255,0.55)'
          }}>
              {testResults.length > 1 ? `Promedio de ${testResults.length} pruebas` : 'Compatibilidad'}
            </p>
          </div>
        </div>
        <div className="px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4" style={{
        background: 'rgba(0,0,0,0.2)'
      }}>
          {[{
          label: 'Estado',
          content: <StatusBadge status={candidate.status} />
        }, {
          label: 'Pruebas',
          content: <span className="text-white font-bold">{testResults.length}</span>
        }, {
          label: 'Compatibilidad',
          content: <span className="font-bold" style={{
            color: gaugeColor
          }}>{avgCompatibility}%</span>
        }, {
          label: 'ID',
          content: <span className="text-xs font-mono text-white/40">{String(candidate.id || '').substring(0, 12)}…</span>
        }].map((item) => <div key={item.label} className="text-center md:text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{
            color: 'rgba(255,255,255,0.4)'
          }}>{item.label}</p>
              <div>{item.content}</div>
            </div>)}
        </div>
        <div className="px-8 flex gap-6" style={{
        background: 'rgba(0,0,0,0.15)'
      }}>
          {tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="py-3.5 text-sm font-bold border-b-2 transition-all" style={{
          borderColor: activeTab === tab.id ? TR.green : 'transparent',
          color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.45)'
        }}>
              {tab.label}
            </button>)}
        </div>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><TrendingUpIcon className="w-5 h-5" style={{
            color: TR.blue
          }} /> Desempeño por Prueba</h3>
            {testResults.length === 0 ? <div className="text-center py-10 text-gray-300"><ClipboardListIcon className="w-10 h-10 mx-auto mb-2" /><p className="text-gray-400">Sin pruebas</p></div> : <div className="space-y-4">
                {testResults.map((r) => {
            const color = getCompatColor(r.compatibility);
            return <div key={r.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-gray-700">{r.testName}</span>
                        <span className="text-sm font-black" style={{
                  color
                }}>{r.compatibility}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${r.compatibility}%`,
                  background: color
                }} />
                      </div>
                    </div>;
          })}
              </div>}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><StarIcon className="w-4 h-4" style={{
              color: TR.green
            }} /> Fortalezas</h3>
              <div className="space-y-2">
                <div className="flex gap-2.5 p-3 rounded-xl" style={{
              background: `${TR.green}10`
            }}>
                  <CheckCircle2Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{
                color: TR.green
              }} />
                  <p className="text-xs font-medium text-gray-700">Cumple con el <strong>{avgCompatibility}%</strong> de los requisitos.</p>
                </div>
                {testResults.length > 1 && <div className="flex gap-2.5 p-3 rounded-xl bg-purple-50">
                    <BarChart3Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600" />
                    <p className="text-xs font-medium text-gray-700"><strong>{testResults.length}</strong> evaluaciones completadas.</p>
                  </div>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Compatibilidad Global</p>
              <div className="relative w-28 h-28 mx-auto">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={gaugeColor} strokeWidth="10" strokeDasharray={`${avgCompatibility / 100 * 314} 314`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black" style={{
                color: gaugeColor
              }}>{avgCompatibility}%</span>
                </div>
              </div>
              <p className="text-xs font-semibold mt-2" style={{
            color: gaugeColor
          }}>{getCompatibilityLabel(getCompatibilityLevel(avgCompatibility))}</p>
            </div>
          </div>
        </div>}

      {/* TAB: PRUEBAS */}
      {activeTab === 'tests' && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100" style={{
        background: '#fafafa'
      }}>
            <h3 className="font-bold text-gray-900">Pruebas Realizadas</h3>
            <p className="text-xs text-gray-400">{testResults.length} evaluaciones</p>
          </div>
          {loadingResults ? <div className="flex items-center justify-center py-16"><Loader2Icon className="w-8 h-8 animate-spin" style={{
          color: TR.blue
        }} /></div> : testResults.length === 0 ? <div className="text-center py-16 text-gray-300"><ClipboardListIcon className="w-12 h-12 mx-auto mb-3" /><p className="text-gray-400">Sin evaluaciones</p></div> : <>
              <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
                <div className="col-span-4">Prueba</div><div className="col-span-2">Score</div><div className="col-span-3">Compat.</div><div className="col-span-2">Resultado</div><div className="col-span-1">Fecha</div>
              </div>
              <div className="divide-y divide-gray-50">
                {testResults.map((r) => {
            const color = getCompatColor(r.compatibility);
            const bg = getCompatBg(r.compatibility);
            return <div key={r.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-blue-50/20">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                  background: `${TR.blue}10`
                }}><ClipboardListIcon className="w-4 h-4" style={{
                    color: TR.blue
                  }} /></div>
                        <span className="font-semibold text-sm text-gray-900">{r.testName}</span>
                      </div>
                      <div className="col-span-2"><span className="text-sm font-black" style={{
                  color: TR.navy
                }}>{r.score} pts</span></div>
                      <div className="col-span-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{
                      width: `${r.compatibility}%`,
                      background: color
                    }} /></div>
                          <span className="text-xs font-bold w-9" style={{
                    color
                  }}>{r.compatibility}%</span>
                        </div>
                      </div>
                      <div className="col-span-2"><span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{
                  background: bg,
                  color
                }}>{getCompatibilityLabel(getCompatibilityLevel(r.compatibility))}</span></div>
                      <div className="col-span-1"><span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '—'}</span></div>
                    </div>;
          })}
              </div>
            </>}
        </div>}

      {/* TAB: ALERTAS */}
      {activeTab === 'alerts' && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Alertas del Candidato</h3>
          {testResults.filter((r) => r.compatibility < 65).length === 0 ? <div className="flex items-start gap-3 p-4 rounded-xl" style={{
        background: `${TR.green}10`,
        border: `1px solid ${TR.green}20`
      }}>
              <CheckCircle2Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{
          color: TR.green
        }} />
              <p className="text-sm font-medium" style={{
          color: TR.greenDark
        }}>Sin alertas. Resultados dentro del rango aceptable.</p>
            </div> : <div className="space-y-3">
              {testResults.filter((r) => r.compatibility < 65).map((r) => <div key={r.id} className="flex items-start gap-3 p-4 rounded-xl border border-red-100 bg-red-50/50">
                  <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-red-900">{r.testName}</p>
                    <p className="text-xs text-red-600 mt-0.5">{r.compatibility}% — por debajo del umbral (65%).</p>
                  </div>
                </div>)}
            </div>}
        </div>}

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button onClick={() => showToast('Próximamente', 'info')} className="px-6 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700">Agendar Entrevista</button>
        <button onClick={handleHireCandidate} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:opacity-90 flex items-center gap-2" style={{
        background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`,
        boxShadow: `0 4px 14px ${TR.green}40`
      }}>
          <UserCheckIcon className="w-4 h-4" /> Contratar Candidato
        </button>
      </div>
    </div>;
}