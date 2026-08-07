import React, { useCallback, useEffect, useState } from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  ClipboardCheckIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  AwardIcon,
  BarChart3Icon,
  SparklesIcon,
  CheckCircle2Icon,
  Loader2Icon } from
'lucide-react';
import { ScoreMeter } from '../components/ScoreMeter';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';

// ─── piezas visuales ──────────────────────────────────────────────────────
const KPI_GRADIENTS: Record<string, string> = {
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-green-600',
  orange: 'from-orange-500 to-amber-600',
  purple: 'from-purple-500 to-indigo-600'
};

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue'




}: {title: string;value: string | number;icon: React.ElementType;trend?: {value: number;isPositive: boolean;};color?: 'blue' | 'green' | 'orange' | 'purple';}) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {value}
          </p>
          {trend &&
          <p
            className={`text-xs mt-2 font-semibold flex items-center gap-1 ${
            trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`
            }>

              {trend.isPositive ?
            <TrendingUpIcon className="w-3.5 h-3.5" /> :
            <TrendingDownIcon className="w-3.5 h-3.5" />}
              {Math.abs(trend.value)}% vs mes anterior
            </p>
          }
        </div>
        <div
          className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${KPI_GRADIENTS[color]} flex items-center justify-center shadow-md`}>

          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>);

}

function GradientBar({
  label,
  value,
  max,
  from,
  to,
  suffix = '',
  labelWidth = 'w-20'






}: {label: string;value: number;max: number;from: string;to: string;suffix?: string;labelWidth?: string;}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-sm text-gray-600 ${labelWidth} text-right shrink-0 truncate`}
        title={label}>

        {label}
      </span>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${from} ${to} transition-all duration-700 ease-out`}
          style={{ width: `${max > 0 ? Math.max(value / max * 100, value > 0 ? 4 : 0) : 0}%` }} />

      </div>
      <span className="text-sm font-bold text-gray-800 w-10 shrink-0">
        {value}{suffix}
      </span>
    </div>);

}

function SectionCard({
  title,
  icon: Icon,
  accent,
  children



}: {title: string;icon: React.ElementType;accent: string;children: React.ReactNode;}) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-sm`}>

          <Icon className="w-[18px] h-[18px] text-white" />
        </div>
      </div>
      {children}
    </div>);

}

function EmptyState({
  icon: Icon,
  message


}: {icon: React.ElementType;message: string;}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{message}</p>
    </div>);

}

// ─── tipos de la vista ────────────────────────────────────────────────────
interface Trend {value: number;isPositive: boolean;}
interface DistributionBucket {range: string;count: number;from: string;to: string;}
interface TestPerformance {test: string;score: number;}
interface TopCandidate {id: string;name: string;position: string;compatibility: number;}
interface DashboardAlert {tone: 'yellow' | 'orange' | 'blue';title: string;detail: string;}
interface Competency {label: string;score: number;}

const EMPTY_DASHBOARD = {
  totalCandidates: 0,
  activeVacancies: 0,
  completedEvaluations: 0,
  avgCompatibility: 0,
  candidatesTrend: undefined as Trend | undefined,
  evaluationsTrend: undefined as Trend | undefined,
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

/** Medallas para los tres primeros del ranking. */
const RANK_GRADIENTS = [
'from-amber-400 to-yellow-600',
'from-slate-300 to-slate-500',
'from-orange-400 to-amber-700'];


/** `options`/`answers` pueden llegar como jsonb ya parseado o como texto. */
function parseJson(value: any, fallback: any) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** "atencion_detalle" → "Atencion detalle" */
function prettifyFactor(factor: string) {
  const clean = factor.replace(/[_-]+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Índice de mes absoluto, para comparar meses sin liarse con el cambio de año. */
function monthIndex(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

/**
 * Variación porcentual de este mes contra el anterior, contando por `created_at`.
 *
 * Devuelve `undefined` cuando no hay base honesta de comparación: si las filas
 * no traen fecha, si el mes pasado no hubo ninguna, o si no hubo cambio. Antes
 * esta cifra estaba escrita a mano ("↑ 12%") y no significaba nada.
 */
function computeTrend(rows: any[]): Trend | undefined {
  const now = new Date();
  const currentMonth = monthIndex(now);
  const previousMonth = currentMonth - 1;

  let current = 0;
  let previous = 0;
  let withDate = 0;

  rows.forEach((row) => {
    const raw = row?.created_at;
    if (typeof raw !== 'string') return;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return;
    withDate += 1;
    const index = monthIndex(parsed);
    if (index === currentMonth) current += 1;else
    if (index === previousMonth) previous += 1;
  });

  if (withDate === 0 || previous === 0) return undefined;

  const percentage = Math.round((current - previous) / previous * 100);
  if (percentage === 0) return undefined;

  return { value: percentage, isPositive: percentage > 0 };
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

      const scored = candidates.filter((c: any) => Number(c.compatibility) > 0);
      const avgCompatibility = scored.length > 0 ?
      Math.round(
        scored.reduce((sum: number, c: any) => sum + Number(c.compatibility), 0) /
        scored.length
      ) :
      0;

      // ── Distribución de compatibilidad ────────────────────────────────
      const buckets: DistributionBucket[] = [
      { range: '0-49', count: 0, from: 'from-red-400', to: 'to-red-600' },
      { range: '50-64', count: 0, from: 'from-orange-400', to: 'to-orange-600' },
      { range: '65-79', count: 0, from: 'from-lime-400', to: 'to-green-600' },
      { range: '80-100', count: 0, from: 'from-emerald-400', to: 'to-emerald-600' }];

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
      const questionsById = new Map(questions.map((q: any) => [String(q.id), q]));
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
        candidatesTrend: computeTrend(candidates),
        evaluationsTrend: computeTrend(results),
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
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex flex-col items-center justify-center">
      <Loader2Icon className="w-10 h-10 animate-spin text-blue-600 mb-3" />
      <p className="text-gray-500 font-medium">Cargando dashboard...</p>
    </div>);


  const maxCount = Math.max(...data.distribution.map((d) => d.count), 1);
  const hasScored = data.distribution.some((d) => d.count > 0);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard Ejecutivo
        </h1>
        <p className="text-gray-500 mt-1">
          Resumen general del sistema de evaluación
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Candidatos"
          value={data.totalCandidates}
          icon={UsersIcon}
          color="blue"
          trend={data.candidatesTrend} />

        <KPICard
          title="Vacantes Activas"
          value={data.activeVacancies}
          icon={BriefcaseIcon}
          color="green" />

        <KPICard
          title="Evaluaciones Completadas"
          value={data.completedEvaluations}
          icon={ClipboardCheckIcon}
          color="purple"
          trend={data.evaluationsTrend} />

        <KPICard
          title="Compatibilidad Promedio"
          value={`${data.avgCompatibility}%`}
          icon={TrendingUpIcon}
          color="orange" />

      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Distribución de Compatibilidad"
          icon={BarChart3Icon}
          accent="from-blue-500 to-indigo-600">

          {!hasScored ?
          <EmptyState
            icon={BarChart3Icon}
            message="Todavía no hay candidatos con puntaje. Aparecerán aquí en cuanto completen una prueba." /> :


          <div className="space-y-3">
              {data.distribution.map((item) =>
            <GradientBar
              key={item.range}
              label={item.range}
              value={item.count}
              max={maxCount}
              from={item.from}
              to={item.to} />

            )}
            </div>
          }
        </SectionCard>

        <SectionCard
          title="Desempeño por Prueba"
          icon={ClipboardCheckIcon}
          accent="from-violet-500 to-purple-600">

          {data.testPerformance.length === 0 ?
          <EmptyState
            icon={ClipboardCheckIcon}
            message="Todavía no se ha aplicado ninguna prueba. El promedio de cada una aparecerá aquí." /> :


          <div className="space-y-3">
              {data.testPerformance.map((item) =>
            <GradientBar
              key={item.test}
              label={item.test}
              value={item.score}
              max={100}
              from="from-blue-400"
              to="to-indigo-600"
              suffix="%"
              labelWidth="w-36" />

            )}
            </div>
          }
        </SectionCard>
      </div>

      {/* Ranking y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Top Candidatos Recomendables"
          icon={AwardIcon}
          accent="from-amber-400 to-yellow-600">

          {data.topCandidates.length === 0 ?
          <EmptyState
            icon={AwardIcon}
            message="Aún no hay candidatos evaluados. El ranking se arma con su porcentaje de compatibilidad." /> :


          <div className="space-y-3">
              {data.topCandidates.map((candidate, index) =>
            <div
              key={candidate.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                  className={`w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br ${
                  RANK_GRADIENTS[index] || 'from-blue-500 to-indigo-700'
                  } flex items-center justify-center text-white font-bold text-sm shadow-sm`}>

                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {candidate.position}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-600 shrink-0 ml-3">
                    {candidate.compatibility}%
                  </p>
                </div>
            )}
            </div>
          }
        </SectionCard>

        <SectionCard
          title="Alertas Recientes"
          icon={AlertTriangleIcon}
          accent="from-orange-500 to-red-500">

          {data.alerts.length === 0 ?
          <EmptyState
            icon={CheckCircle2Icon}
            message="Sin alertas por ahora. Aquí avisamos de puntajes bajo el mínimo del puesto y de evaluaciones sin terminar." /> :


          <div className="space-y-3">
              {data.alerts.map((alert) => {
              const style = ALERT_STYLES[alert.tone];
              return (
                <div
                  key={alert.title}
                  className={`flex items-start gap-3 p-3 border rounded-xl ${style.box}`}>

                    <AlertTriangleIcon
                    className={`w-5 h-5 mt-0.5 shrink-0 ${style.icon}`} />

                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${style.title}`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs mt-1 ${style.detail}`}>
                        {alert.detail}
                      </p>
                    </div>
                  </div>);

            })}
            </div>
          }
        </SectionCard>
      </div>

      {/* Competencias */}
      <SectionCard
        title="Competencias Promedio - Todos los Candidatos"
        icon={SparklesIcon}
        accent="from-emerald-500 to-teal-600">

        {data.competencies.length === 0 ?
        <EmptyState
          icon={SparklesIcon}
          message="Las competencias salen de cruzar las respuestas de cada prueba con el factor de sus preguntas. Aparecerán al aplicar la primera prueba." /> :


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {data.competencies.map((competency) =>
          <ScoreMeter
            key={competency.label}
            score={competency.score}
            label={competency.label} />

          )}
          </div>
        }
      </SectionCard>
    </div>);

}
