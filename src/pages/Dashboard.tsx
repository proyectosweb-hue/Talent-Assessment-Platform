import React, { useEffect, useState, useCallback } from 'react';
import { UsersIcon, BriefcaseIcon, ClipboardCheckIcon, TrendingUpIcon, AlertTriangleIcon, AwardIcon, Loader2Icon, CheckCircle2Icon, ArrowUpIcon, ArrowDownIcon, ActivityIcon, ShieldCheckIcon } from 'lucide-react';
import { ScoreMeter } from '../components/ScoreMeter';
import { supabase } from '../supabase';
import { useRealtimeMulti } from '../utils/useRealtime';

// Paleta Torres Rodríguez
const TR = {
  blue: '#2D4494',
  blueLight: '#3a55b5',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
interface DashboardData {
  totalCandidates: number;
  activeVacancies: number;
  completedEvaluations: number;
  avgCompatibility: number;
  compatibilityDistribution: {
    range: string;
    count: number;
    color: string;
    pct: number;
  }[];
  testPerformance: {
    test: string;
    score: number;
  }[];
  topCandidates: {
    id: string;
    name: string;
    position: string;
    compatibility: number;
  }[];
  lowScoreCandidates: {
    id: string;
    name: string;
    score: number;
    testName: string;
  }[];
  pendingCandidates: number;
  hiredCandidates: number;
}

// ── KPI Card ──────────────────────────────────────────────────────
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  accent = false,
  sub










}: {title: string;value: string | number;icon: React.ElementType;trend?: {value: number;positive: boolean;};accent?: boolean;sub?: string;}) {
  return <div className="relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between" style={{
    background: accent ? `linear-gradient(135deg, ${TR.blue} 0%, ${TR.blueLight} 100%)` : '#ffffff',
    border: accent ? 'none' : '1px solid #e5e7eb',
    boxShadow: accent ? `0 8px 32px ${TR.blue}33` : '0 1px 4px rgba(0,0,0,0.06)'
  }}>

      {/* Background decoration */}
      {accent && <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10" style={{
      background: TR.green
    }} />}

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium mb-1" style={{
          color: accent ? 'rgba(255,255,255,0.7)' : '#6b7280'
        }}>{title}</p>
          <p className="text-4xl font-black tracking-tight" style={{
          color: accent ? '#fff' : TR.navy
        }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{
          color: accent ? 'rgba(255,255,255,0.5)' : '#9ca3af'
        }}>{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
        background: accent ? 'rgba(255,255,255,0.15)' : `${TR.blue}12`
      }}>
          <Icon className="w-6 h-6" style={{
          color: accent ? '#fff' : TR.blue
        }} />
        </div>
      </div>

      {trend && <div className="flex items-center gap-1 mt-3 relative z-10">
          {trend.positive ? <ArrowUpIcon className="w-3.5 h-3.5" style={{
        color: accent ? TR.green : TR.green
      }} /> : <ArrowDownIcon className="w-3.5 h-3.5 text-red-400" />}
          <span className="text-xs font-semibold" style={{
        color: accent ? trend.positive ? '#9dd93a' : '#fca5a5' : trend.positive ? TR.green : '#f87171'
      }}>
            {trend.value}% vs mes anterior
          </span>
        </div>}
    </div>;
}

// ── Barra horizontal ──────────────────────────────────────────────
function HBar({
  label,
  value,
  max,
  color,
  showPct = false






}: {label: string;value: number;max: number;color: string;showPct?: boolean;}) {
  const pct = max > 0 ? value / max * 100 : 0;
  return <div className="flex items-center gap-3">
      {/* w-32 + truncate: con w-14 los nombres de prueba se partian en dos
         lineas y aun asi quedaban cortados. El title deja ver el nombre
         completo al pasar el cursor. */}
      <span className="text-xs text-gray-500 w-32 text-right shrink-0 font-medium truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{
        width: `${Math.max(pct, 4)}%`,
        background: color
      }}>
          {value > 0 && <span className="text-[10px] font-bold text-white">{value}</span>}
        </div>
      </div>
    </div>;
}

// ── Score pill ────────────────────────────────────────────────────
function ScorePill({
  score


}: {score: number;}) {
  const color = score >= 80 ? TR.green : score >= 65 ? TR.blue : score >= 50 ? '#f59e0b' : '#ef4444';
  const bg = score >= 80 ? '#f0fdf4' : score >= 65 ? '#eff6ff' : score >= 50 ? '#fffbeb' : '#fef2f2';
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
    background: bg,
    color
  }}>
      {score}%
    </span>;
}
export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [candidatesRes, positionsRes, resultsRes, testsRes] = await Promise.all([supabase.from('candidates').select('*'), supabase.from('positions').select('*').or('archived.eq.false,archived.is.null'), supabase.from('results').select('*').order('id', {
        ascending: false
      }), supabase.from('tests').select('id, name').or('archived.eq.false,archived.is.null')]);
      const candidates = candidatesRes.data || [];
      const positions = positionsRes.data || [];
      const results = resultsRes.data || [];
      const tests = testsRes.data || [];
      const totalCandidates = candidates.length;
      const completedEvaluations = results.length;
      const pendingCandidates = candidates.filter((c) => c.status === 'pending').length;
      const hiredCandidates = candidates.filter((c) => c.status === 'hired').length;
      const activeVacancies = positions.reduce((s: number, p: any) => s + (Number(p.active_vacancies) || 0), 0);
      const scoresWithValue = results.filter((r) => r.score > 0);
      const avgCompatibility = scoresWithValue.length > 0 ? Math.round(scoresWithValue.reduce((s: number, r: any) => s + Math.min(100, r.score || 0), 0) / scoresWithValue.length) : 0;
      const compat = results.map((r) => Math.min(100, Math.round(r.score || 0)));
      const total = Math.max(compat.length, 1);
      const compatibilityDistribution = [{
        range: '80-100',
        count: compat.filter((c) => c >= 80).length,
        color: TR.green,
        pct: Math.round(compat.filter((c) => c >= 80).length / total * 100)
      }, {
        range: '65-79',
        count: compat.filter((c) => c >= 65 && c < 80).length,
        color: TR.blue,
        pct: Math.round(compat.filter((c) => c >= 65 && c < 80).length / total * 100)
      }, {
        range: '50-64',
        count: compat.filter((c) => c >= 50 && c < 65).length,
        color: '#f59e0b',
        pct: Math.round(compat.filter((c) => c >= 50 && c < 65).length / total * 100)
      }, {
        range: '0-49',
        count: compat.filter((c) => c < 50).length,
        color: '#ef4444',
        pct: Math.round(compat.filter((c) => c < 50).length / total * 100)
      }];
      const testScoreMap: Record<string, {
        total: number;
        count: number;
        name: string;
      }> = {};
      results.forEach((r: any) => {
        const test = tests.find((t: any) => String(t.id) === String(r.test_id));
        if (!test) return;
        const key = String(r.test_id);
        if (!testScoreMap[key]) testScoreMap[key] = {
          total: 0,
          count: 0,
          name: test.name
        };
        testScoreMap[key].total += Math.min(100, r.score || 0);
        testScoreMap[key].count += 1;
      });
      // El nombre va completo: HBar lo recorta con CSS si no cabe y muestra
      // el nombre entero en el tooltip. Recortarlo aqui a 14 caracteres
      // dejaba etiquetas como "Personalidad L…" incluso cuando habia sitio.
      const testPerformance = Object.values(testScoreMap).map((t) => ({
        test: t.name,
        score: Math.round(t.total / t.count)
      })).slice(0, 6);
      const topCandidates = [...candidates].filter((c) => c.compatibility > 0).sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0)).slice(0, 5).map((c) => ({
        id: String(c.id),
        name: String(c.name || ''),
        position: String(c.position || 'Sin puesto'),
        compatibility: Number(c.compatibility) || 0
      }));
      const lowScoreCandidates = results.filter((r: any) => Math.min(100, r.score || 0) < 65).slice(0, 3).map((r: any) => {
        const candidate = candidates.find((c) => String(c.id) === String(r.user_name));
        const test = tests.find((t: any) => String(t.id) === String(r.test_id));
        return {
          id: String(r.id),
          name: String(candidate?.name || 'Candidato'),
          score: Math.min(100, Math.round(r.score || 0)),
          testName: String(test?.name || 'Sin prueba')
        };
      });
      setData({
        totalCandidates,
        activeVacancies,
        completedEvaluations,
        avgCompatibility,
        compatibilityDistribution,
        testPerformance,
        topCandidates,
        lowScoreCandidates,
        pendingCandidates,
        hiredCandidates
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Tiempo real: refrescar dashboard cuando cambia cualquier tabla clave ──
  useRealtimeMulti(['candidates', 'results', 'positions', 'tests'], loadDashboard);
  if (loading) return <div className="flex flex-col items-center justify-center h-64">
      <Loader2Icon className="w-10 h-10 animate-spin mb-3" style={{
      color: TR.blue
    }} />
      <p className="text-gray-400 text-sm font-medium">Cargando dashboard...</p>
    </div>;
  if (!data) return null;
  const maxDist = Math.max(...data.compatibilityDistribution.map((d) => d.count), 1);
  return <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{
          color: TR.navy
        }}>Dashboard Ejecutivo</h1>
          <p className="text-gray-400 text-sm mt-0.5">Resumen general del sistema de evaluación</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{
        background: `${TR.green}15`,
        color: TR.greenDark,
        border: `1px solid ${TR.green}30`
      }}>
          <ActivityIcon className="w-4 h-4" />
          Datos en tiempo real
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Candidatos" value={data.totalCandidates} icon={UsersIcon} accent sub={`${data.pendingCandidates} pendientes · ${data.hiredCandidates} contratados`} trend={{
        value: 12,
        positive: true
      }} />
        
        <KPICard title="Vacantes Activas" value={data.activeVacancies} icon={BriefcaseIcon} />
        <KPICard title="Evaluaciones Completadas" value={data.completedEvaluations} icon={ClipboardCheckIcon} trend={{
        value: 8,
        positive: true
      }} />
        <KPICard title="Compatibilidad Promedio" value={`${data.avgCompatibility}%`} icon={TrendingUpIcon} />
      </div>

      {/* Fila 2: gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Distribución */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Distribución de Compatibilidad</h3>
              <p className="text-xs text-gray-400 mt-0.5">{data.completedEvaluations} evaluaciones totales</p>
            </div>
            {/* Mini donut visual */}
            <div className="flex gap-1">
              {data.compatibilityDistribution.map((d) => <div key={d.range} className="w-2 rounded-full" style={{
              height: `${Math.max(d.pct * 0.4, 4)}px`,
              background: d.color,
              alignSelf: 'flex-end'
            }} />)}
            </div>
          </div>
          {data.compatibilityDistribution.every((d) => d.count === 0) ? <p className="text-center text-gray-300 py-8 text-sm">Sin evaluaciones registradas</p> : <div className="space-y-3">
              {data.compatibilityDistribution.map((item) => <div key={item.range}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">{item.range}%</span>
                    <span className="text-xs font-bold" style={{
                color: item.color
              }}>{item.count} · {item.pct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                width: `${Math.max(item.count / maxDist * 100, item.count > 0 ? 4 : 0)}%`,
                background: item.color
              }} />
                  </div>
                </div>)}
            </div>}
        </div>

        {/* Desempeño por prueba */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Desempeño por Prueba</h3>
              <p className="text-xs text-gray-400 mt-0.5">Promedio de score por evaluación</p>
            </div>
          </div>
          {data.testPerformance.length === 0 ? <p className="text-center text-gray-300 py-8 text-sm">Sin pruebas realizadas</p> : <div className="space-y-3.5">
              {data.testPerformance.map((item) => <HBar key={item.test} label={item.test} value={item.score} max={100} color={item.score >= 80 ? TR.green : item.score >= 65 ? TR.blue : '#f59e0b'} />)}
            </div>}
        </div>
      </div>

      {/* Fila 3: top candidatos + alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top candidatos */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Top Candidatos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Mejores compatibilidades registradas</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: `${TR.green}15`
          }}>
              <AwardIcon className="w-4 h-4" style={{
              color: TR.green
            }} />
            </div>
          </div>
          {data.topCandidates.length === 0 ? <p className="text-center text-gray-300 py-8 text-sm">Sin candidatos con compatibilidad</p> : <div className="space-y-3">
              {data.topCandidates.map((candidate, index) => <div key={candidate.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{
              background: index === 0 ? TR.green : index === 1 ? TR.blue : '#94a3b8'
            }}>
                    {index + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{
              background: `linear-gradient(135deg, ${TR.blue}, ${TR.blueLight})`
            }}>
                    {candidate.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{candidate.name}</p>
                    <p className="text-xs text-gray-400 truncate">{candidate.position}</p>
                  </div>
                  <ScorePill score={candidate.compatibility} />
                </div>)}
            </div>}
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Alertas Recientes</h3>
              <p className="text-xs text-gray-400 mt-0.5">Candidatos que requieren atención</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-50">
              <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="space-y-3">
            {data.lowScoreCandidates.map((c) => <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-red-100 bg-red-50/50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 flex-shrink-0 mt-0.5">
                  <AlertTriangleIcon className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-900">{c.name}</p>
                  <p className="text-xs text-red-600 mt-0.5">{c.testName} · <strong>{c.score}%</strong> de compatibilidad</p>
                </div>
              </div>)}

            {data.pendingCandidates > 0 && <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{
              background: `${TR.blue}15`
            }}>
                  <ClipboardCheckIcon className="w-4 h-4" style={{
                color: TR.blue
              }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{
                color: TR.navy
              }}>{data.pendingCandidates} evaluaciones pendientes</p>
                  <p className="text-xs text-blue-500 mt-0.5">Programar aplicación de pruebas</p>
                </div>
              </div>}

            {data.lowScoreCandidates.length === 0 && data.pendingCandidates === 0 && <div className="flex items-start gap-3 p-3 rounded-xl border border-green-100 bg-green-50/50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 flex-shrink-0">
                  <CheckCircle2Icon className="w-4 h-4" style={{
                color: TR.green
              }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{
                color: TR.greenDark
              }}>Sin alertas activas</p>
                  <p className="text-xs text-green-500 mt-0.5">Todos los candidatos dentro del rango aceptable</p>
                </div>
              </div>}
          </div>
        </div>
      </div>

      {/* Fila 4: niveles de compatibilidad */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900">Distribución por Nivel de Compatibilidad</h3>
            <p className="text-xs text-gray-400 mt-0.5">Porcentaje de evaluaciones en cada categoría</p>
          </div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
          background: `${TR.blue}12`
        }}>
            <ShieldCheckIcon className="w-4 h-4" style={{
            color: TR.blue
          }} />
          </div>
        </div>
        {data.compatibilityDistribution.every((d) => d.count === 0) ? <p className="text-center text-gray-300 py-4 text-sm">Sin datos de evaluaciones</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.compatibilityDistribution.map((d) => {
          const total = Math.max(data.completedEvaluations, 1);
          const pct = Math.round(d.count / total * 100);
          return <div key={d.range} className="relative overflow-hidden rounded-xl p-4" style={{
            border: `1px solid ${d.color}22`,
            background: `${d.color}08`
          }}>
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{
              background: d.color
            }} />
                  <p className="text-2xl font-black" style={{
              color: d.color
            }}>{pct}%</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">{d.range}%</p>
                  <p className="text-xs text-gray-400">{d.count} candidatos</p>
                </div>;
        })}
          </div>}
      </div>

    </div>;
}