import React, { useCallback, useEffect, useState } from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  ClipboardCheckIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  AwardIcon,
  Loader2Icon } from
'lucide-react';
import { ScoreMeter } from '../components/ScoreMeter';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
function InlineKPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue'




}: {title: string;value: string | number;icon: React.ElementType;trend?: {value: number;isPositive: boolean;};color?: 'blue' | 'green' | 'orange' | 'purple';}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend &&
          <p
            className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>

              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs mes
              anterior
            </p>
          }
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>

          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>);

}
function SimpleBar({
  label,
  value,
  max,
  color




}: {label: string;value: number;max: number;color: string;}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-16 text-right shrink-0">
        {label}
      </span>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${max > 0 ? value / max * 100 : 0}%`,
            backgroundColor: color
          }} />

      </div>
      <span className="text-sm font-bold text-gray-700 w-8">{value}</span>
    </div>);

}

// ─── tipos de la vista ────────────────────────────────────────────────────
interface DistributionBucket {range: string;count: number;color: string;}
interface TestPerformance {test: string;score: number;}
interface TopCandidate {id: string;name: string;position: string;compatibility: number;}
interface DashboardAlert {tone: 'yellow' | 'orange' | 'blue';title: string;detail: string;}
interface Competency {label: string;score: number;}

const EMPTY_DASHBOARD = {
  totalCandidates: 0,
  activeVacancies: 0,
  completedEvaluations: 0,
  avgCompatibility: 0,
  distribution: [] as DistributionBucket[],
  testPerformance: [] as TestPerformance[],
  topCandidates: [] as TopCandidate[],
  alerts: [] as DashboardAlert[],
  competencies: [] as Competency[]
};

const ALERT_STYLES: Record<DashboardAlert['tone'], {box: string;icon: string;title: string;detail: string;}> = {
  yellow: {
    box: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    detail: 'text-yellow-700'
  },
  orange: {
    box: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-900',
    detail: 'text-orange-700'
  },
  blue: {
    box: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    detail: 'text-blue-700'
  }
};

/** `options` puede llegar como jsonb ya parseado o como texto. */
function parseJson(value: any, fallback: any) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** "atencion_detalle" → "Atención detalle" (sin acentos, pero legible). */
function prettifyFactor(factor: string) {
  const clean = factor.replace(/[_-]+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function Dashboard() {
  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [candidatesRes, positionsRes, testsRes, resultsRes, questionsRes] =
      await Promise.all([
      supabase.from('candidates').select('*'),
      supabase.from('positions').select('*'),
      supabase.from('tests').select('id, name'),
      supabase.from('results').select('*'),
      supabase.from('questions').select('id, test_id, factor, weight, options')]
      );

      const firstError =
      candidatesRes.error ||
      positionsRes.error ||
      testsRes.error ||
      resultsRes.error ||
      questionsRes.error;
      if (firstError) throw firstError;

      const allCandidates = candidatesRes.data || [];
      const positions = positionsRes.data || [];
      const tests = testsRes.data || [];
      const results = resultsRes.data || [];
      const questions = questionsRes.data || [];

      const candidates = allCandidates.filter((c: any) => !c.archived);

      // ── KPIs ──────────────────────────────────────────────────────────
      const activeVacancies = positions.
      filter((p: any) => !p.archived).
      reduce((sum: number, p: any) => sum + (Number(p.active_vacancies) || 0), 0);

      const scored = candidates.filter(
        (c: any) => Number(c.compatibility) > 0
      );
      const avgCompatibility = scored.length > 0 ?
      Math.round(
        scored.reduce((sum: number, c: any) => sum + Number(c.compatibility), 0) /
        scored.length
      ) :
      0;

      // ── Distribución de compatibilidad ────────────────────────────────
      const buckets: DistributionBucket[] = [
      { range: '0-49', count: 0, color: '#dc2626' },
      { range: '50-64', count: 0, color: '#ea580c' },
      { range: '65-79', count: 0, color: '#16a34a' },
      { range: '80-100', count: 0, color: '#059669' }];

      scored.forEach((c: any) => {
        const value = Number(c.compatibility);
        const index = value < 50 ? 0 : value < 65 ? 1 : value < 80 ? 2 : 3;
        buckets[index].count += 1;
      });

      // ── Desempeño promedio por prueba ─────────────────────────────────
      const testNames = new Map(tests.map((t: any) => [String(t.id), t.name]));
      const perTest = new Map<string, {sum: number;count: number;}>();
      results.forEach((r: any) => {
        const key = String(r.test_id ?? '');
        if (!key) return;
        const acc = perTest.get(key) || { sum: 0, count: 0 };
        acc.sum += Number(r.score) || 0;
        acc.count += 1;
        perTest.set(key, acc);
      });
      const testPerformance: TestPerformance[] = Array.from(perTest.entries()).
      map(([testId, acc]) => ({
        test: (testNames.get(testId) as string) || `Prueba ${testId}`,
        score: Math.round(acc.sum / acc.count)
      })).
      sort((a, b) => b.score - a.score).
      slice(0, 6);

      // ── Top candidatos ────────────────────────────────────────────────
      const topCandidates: TopCandidate[] = [...scored].
      sort((a: any, b: any) => Number(b.compatibility) - Number(a.compatibility)).
      slice(0, 5).
      map((c: any) => ({
        id: String(c.id),
        name: c.name,
        position: c.position || 'Sin puesto asignado',
        compatibility: Number(c.compatibility)
      }));

      // ── Alertas derivadas de los datos reales ─────────────────────────
      const alerts: DashboardAlert[] = [];

      const minScoreByPosition = new Map(
        positions.map((p: any) => [p.name, Number(p.min_score) || 0])
      );
      const belowMinimum = scored.filter((c: any) => {
        const min = minScoreByPosition.get(c.position);
        return typeof min === 'number' && min > 0 && Number(c.compatibility) < min;
      });
      if (belowMinimum.length > 0) {
        alerts.push({
          tone: 'orange',
          title: `${belowMinimum.length} ${belowMinimum.length === 1 ? 'candidato' : 'candidatos'} por debajo del mínimo del puesto`,
          detail: belowMinimum.
          slice(0, 3).
          map((c: any) => `${c.name} (${c.compatibility}%)`).
          join(' · ')
        });
      }

      const pending = candidates.filter((c: any) => c.status === 'pending');
      if (pending.length > 0) {
        alerts.push({
          tone: 'blue',
          title: `${pending.length} ${pending.length === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'}`,
          detail: 'Programar aplicación de pruebas.'
        });
      }

      const inProgress = candidates.filter((c: any) => c.status === 'in_progress');
      if (inProgress.length > 0) {
        alerts.push({
          tone: 'yellow',
          title: `${inProgress.length} ${inProgress.length === 1 ? 'evaluación sin terminar' : 'evaluaciones sin terminar'}`,
          detail: 'Candidatos que empezaron una prueba y no la completaron.'
        });
      }

      // ── Competencias promedio por factor ──────────────────────────────
      const questionsById = new Map(
        questions.map((q: any) => [String(q.id), q])
      );
      const perFactor = new Map<string, {raw: number;max: number;}>();

      results.forEach((r: any) => {
        const answers = parseJson(r.answers, {});
        if (!answers || typeof answers !== 'object') return;

        Object.entries(answers).forEach(([questionId, rawValue]) => {
          const question: any = questionsById.get(String(questionId));
          if (!question) return;

          const options = parseJson(question.options, []);
          const maxValue =
          Array.isArray(options) && options.length > 0 ?
          Math.max(...options.map((o: any) => Number(o?.value) || 0)) :
          5;
          if (maxValue <= 0) return;

          const weight = Number(question.weight) || 1;
          const factor = question.factor || 'general';
          const acc = perFactor.get(factor) || { raw: 0, max: 0 };
          acc.raw += (Number(rawValue) || 0) * weight;
          acc.max += maxValue * weight;
          perFactor.set(factor, acc);
        });
      });

      const competencies: Competency[] = Array.from(perFactor.entries()).
      filter(([, acc]) => acc.max > 0).
      map(([factor, acc]) => ({
        label: prettifyFactor(factor),
        score: Math.round(acc.raw / acc.max * 100)
      })).
      sort((a, b) => b.score - a.score).
      slice(0, 9);

      setData({
        totalCandidates: candidates.length,
        activeVacancies,
        completedEvaluations: results.length,
        avgCompatibility,
        distribution: buckets,
        testPerformance,
        topCandidates,
        alerts,
        competencies
      });
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      showToast(
        'Error al cargar el dashboard: ' + (err?.message || 'revisa la conexión'),
        'error'
      );
      setData(EMPTY_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {loadDashboard();}, [loadDashboard]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2Icon className="w-10 h-10 animate-spin text-blue-600 mb-2" />
      <p className="text-gray-500">Cargando dashboard...</p>
    </div>);


  const maxCount = Math.max(...data.distribution.map((d) => d.count), 1);

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
        <InlineKPICard
          title="Total Candidatos"
          value={data.totalCandidates}
          icon={UsersIcon}
          color="blue" />

        <InlineKPICard
          title="Vacantes Activas"
          value={data.activeVacancies}
          icon={BriefcaseIcon}
          color="green" />

        <InlineKPICard
          title="Evaluaciones Completadas"
          value={data.completedEvaluations}
          icon={ClipboardCheckIcon}
          color="purple" />

        <InlineKPICard
          title="Compatibilidad Promedio"
          value={`${data.avgCompatibility}%`}
          icon={TrendingUpIcon}
          color="orange" />

      </div>

      {/* Charts Row - Pure CSS bars instead of recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compatibility Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Compatibilidad
          </h3>
          <div className="space-y-3">
            {data.distribution.length === 0 ?
            <p className="text-sm text-gray-500">
                Todavía no hay candidatos con puntaje.
              </p> :

            data.distribution.map((item) =>
            <SimpleBar
              key={item.range}
              label={item.range}
              value={item.count}
              max={maxCount}
              color={item.color} />

            )
            }
          </div>
        </div>

        {/* Test Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Desempeño por Prueba
          </h3>
          <div className="space-y-3">
            {data.testPerformance.length === 0 ?
            <p className="text-sm text-gray-500">
                Todavía no hay pruebas aplicadas.
              </p> :

            data.testPerformance.map((item) =>
            <SimpleBar
              key={item.test}
              label={item.test}
              value={item.score}
              max={100}
              color="#3b82f6" />

            )
            }
          </div>
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
            {data.topCandidates.length === 0 ?
            <p className="text-sm text-gray-500">
                Aún no hay candidatos evaluados.
              </p> :

            data.topCandidates.map((candidate, index) =>
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
            )
            }
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
            {data.alerts.length === 0 ?
            <p className="text-sm text-gray-500">
                Sin alertas por ahora.
              </p> :

            data.alerts.map((alert) => {
              const style = ALERT_STYLES[alert.tone];
              return (
                <div
                  key={alert.title}
                  className={`flex items-start space-x-3 p-3 border rounded-lg ${style.box}`}>

                    <AlertTriangleIcon className={`w-5 h-5 mt-0.5 shrink-0 ${style.icon}`} />
                    <div>
                      <p className={`text-sm font-medium ${style.title}`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs mt-1 ${style.detail}`}>
                        {alert.detail}
                      </p>
                    </div>
                  </div>);

            })
            }
          </div>
        </div>
      </div>

      {/* Competency Meters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Competencias Promedio - Todos los Candidatos
        </h3>
        {data.competencies.length === 0 ?
        <p className="text-sm text-gray-500">
            Las competencias se calculan a partir de las respuestas de las
            pruebas aplicadas. Aún no hay datos suficientes.
          </p> :

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.competencies.map((competency) =>
          <ScoreMeter
            key={competency.label}
            score={competency.score}
            label={competency.label} />

          )}
          </div>
        }
      </div>
    </div>);

}
