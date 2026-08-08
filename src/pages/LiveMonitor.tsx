import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIcon,
  UsersIcon,
  ClipboardCheckIcon,
  ClockIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  DatabaseIcon,
  Loader2Icon,
  RadioIcon,
  AlertTriangleIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { useRealtime } from '../utils/useRealtime';

// Paleta Torres Rodríguez
const TR = {
  blue: '#2D4494',
  blueLight: '#3a55b5',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};

/** Sin noticias del candidato durante este tiempo → se marca como inactivo. */
const INACTIVO_MS = 2 * 60 * 1000;

/** Refresco de respaldo por si Realtime no está habilitado en la tabla. */
const REFRESCO_MS = 10 * 1000;

interface Sesion {
  id: string;
  testId: string;
  candidateId: string;
  candidateName: string;
  candidatePosition: string;
  testName: string;
  answers: Record<string, number>;
  answeredCount: number;
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  startedAt: number;
  updatedAt: number;
}

interface Pregunta {
  id: string;
  text: string;
  options: {label: string;value: number;}[];
}

function parseJson(value: any, fallback: any) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Normaliza `options` (jsonb o texto) al mismo formato que usa el examen. */
function parseOptions(raw: any): {label: string;value: number;}[] {
  const opts = parseJson(raw, []);
  if (!Array.isArray(opts)) return [];
  return opts.map((o: any) => ({
    label: String(o?.label || o?.text || ''),
    value: Number(o?.value ?? 0)
  }));
}

function iniciales(nombre: string) {
  return nombre.split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??';
}

function hace(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.floor(m / 60)} h`;
}

function reloj(segundos: number) {
  const s = Math.max(0, segundos);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function colorAvance(pct: number) {
  if (pct >= 80) return TR.green;
  if (pct >= 40) return TR.blue;
  return '#f59e0b';
}

// ── Tarjeta de estadística ──────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color



}: {label: string;value: string | number;icon: React.ElementType;color: string;}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight" style={{ color: TR.navy }}>
          {value}
        </p>
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>

        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>);

}

export function LiveMonitor() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [preguntasPorPrueba, setPreguntasPorPrueba] = useState<Record<string, Pregunta[]>>({});
  const [cargando, setCargando] = useState(true);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reloj propio: hace que los "hace X s" avancen sin depender de la red.
  const [ahora, setAhora] = useState(() => Date.now());

  const preguntasCache = useRef<Record<string, Pregunta[]>>({});

  const cargar = useCallback(async () => {
    try {
      const { data, error: progresoError } = await supabase.
      from('test_progress').
      select('*').
      eq('status', 'in_progress').
      order('updated_at', { ascending: false });

      if (progresoError) {
        // La tabla todavía no existe → hay que ejecutar schema-v3.sql.
        if (/does not exist|schema cache|relation/i.test(progresoError.message)) {
          setFaltaTabla(true);
          setSesiones([]);
          return;
        }
        throw progresoError;
      }

      setFaltaTabla(false);
      const filas = data || [];

      if (filas.length === 0) {
        setSesiones([]);
        setError(null);
        return;
      }

      const [candidatosRes, pruebasRes] = await Promise.all([
      supabase.from('candidates').select('id, name, position'),
      supabase.from('tests').select('id, name')]
      );

      const candidatos = new Map(
        (candidatosRes.data || []).map((c: any) => [String(c.id), c])
      );
      const pruebas = new Map(
        (pruebasRes.data || []).map((t: any) => [String(t.id), t])
      );

      setSesiones(
        filas.map((row: any) => {
          const answers = parseJson(row.answers, {}) || {};
          const candidato: any = candidatos.get(String(row.candidate_id));
          const prueba: any = pruebas.get(String(row.test_id));
          return {
            id: String(row.id),
            testId: String(row.test_id),
            candidateId: String(row.candidate_id),
            candidateName: candidato?.name || `Candidato ${row.candidate_id}`,
            candidatePosition: candidato?.position || 'Sin puesto',
            testName: prueba?.name || `Prueba ${row.test_id}`,
            answers,
            answeredCount: Object.keys(answers).length,
            currentQuestion: Number(row.current_question) || 0,
            totalQuestions: Number(row.total_questions) || 0,
            timeLeft: Number(row.time_left) || 0,
            startedAt: row.started_at ? new Date(row.started_at).getTime() : 0,
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0
          };
        })
      );
      setError(null);
    } catch (err: any) {
      console.error('Error cargando monitoreo:', err);
      setError(err?.message || 'No se pudo cargar el monitoreo');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {cargar();}, [cargar]);

  // Realtime: reacciona al instante a cada respuesta del candidato.
  useRealtime({ table: 'test_progress', onChange: cargar });

  // Respaldo: si Realtime no está habilitado en la tabla, esto mantiene la
  // pantalla viva igualmente.
  useEffect(() => {
    const id = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  // Ticker para los tiempos relativos.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Selección automática de la primera sesión, y limpieza si la que estaba
  // seleccionada ya terminó.
  useEffect(() => {
    if (sesiones.length === 0) {
      if (seleccionada !== null) setSeleccionada(null);
      return;
    }
    if (!seleccionada || !sesiones.some((s) => s.id === seleccionada)) {
      setSeleccionada(sesiones[0].id);
    }
  }, [sesiones, seleccionada]);

  const activa = useMemo(
    () => sesiones.find((s) => s.id === seleccionada) || null,
    [sesiones, seleccionada]
  );

  // Carga (una sola vez por prueba) las preguntas de la sesión abierta.
  useEffect(() => {
    if (!activa) return;
    const testId = activa.testId;
    if (preguntasCache.current[testId]) return;

    let cancelado = false;
    (async () => {
      const { data } = await supabase.
      from('questions').
      select('id, text, options').
      eq('test_id', testId).
      order('id');

      if (cancelado) return;
      const preguntas: Pregunta[] = (data || []).map((q: any) => ({
        id: String(q.id),
        text: String(q.text || ''),
        options: parseOptions(q.options)
      }));
      preguntasCache.current[testId] = preguntas;
      setPreguntasPorPrueba((prev) => ({ ...prev, [testId]: preguntas }));
    })();

    return () => {cancelado = true;};
  }, [activa]);

  const totales = useMemo(() => {
    const respuestas = sesiones.reduce((s, x) => s + x.answeredCount, 0);
    const avances = sesiones.
    filter((s) => s.totalQuestions > 0).
    map((s) => s.answeredCount / s.totalQuestions * 100);
    const promedio = avances.length > 0 ?
    Math.round(avances.reduce((a, b) => a + b, 0) / avances.length) :
    0;
    return { respuestas, promedio };
  }, [sesiones]);

  // ── Estados de carga / configuración pendiente ────────────────────
  if (cargando) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2Icon className="w-10 h-10 animate-spin mb-3" style={{ color: TR.blue }} />
      <p className="text-gray-400 text-sm font-medium">Cargando monitoreo...</p>
    </div>);


  if (faltaTabla) return (
    <div className="p-6">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-2xl mx-auto text-center"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: `${TR.blue}12` }}>
          <DatabaseIcon className="w-8 h-8" style={{ color: TR.blue }} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: TR.navy }}>
          Falta crear la tabla de monitoreo
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-5">
          Esta pantalla necesita la tabla <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">test_progress</code>,
          que guarda el avance de cada prueba mientras se contesta.
        </p>
        <div className="text-left rounded-xl p-4 text-sm text-gray-600 border border-gray-200 bg-gray-50">
          <p className="font-semibold mb-2" style={{ color: TR.navy }}>Para activarla:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Abre el panel de Supabase → <strong>SQL Editor</strong> → New query.</li>
            <li>Pega el contenido de <code className="px-1 rounded bg-white border">supabase/schema-v3.sql</code>.</li>
            <li>Pulsa <strong>Run</strong> y recarga esta página.</li>
          </ol>
        </div>
      </div>
    </div>);


  const preguntas = activa ? preguntasPorPrueba[activa.testId] || [] : [];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: TR.navy }}>
            Monitoreo en Vivo
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Respuestas de los candidatos mientras contestan una prueba
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: `${TR.green}15`, color: TR.greenDark, border: `1px solid ${TR.green}30` }}>

          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: TR.green }} />

            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: TR.green }} />

          </span>
          En directo
        </div>
      </div>

      {error &&
      <div className="flex items-start gap-3 p-4 rounded-xl border border-red-100 bg-red-50/50">
          <AlertTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      }

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pruebas en curso"
          value={sesiones.length}
          icon={UsersIcon}
          color={TR.blue} />

        <StatCard
          label="Respuestas registradas"
          value={totales.respuestas}
          icon={ClipboardCheckIcon}
          color={TR.green} />

        <StatCard
          label="Avance promedio"
          value={`${totales.promedio}%`}
          icon={ActivityIcon}
          color="#f59e0b" />

      </div>

      {sesiones.length === 0 ?
      <div
        className="bg-white rounded-2xl p-12 border border-gray-100 text-center"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#f3f4f6' }}>

            <RadioIcon className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">
            Ningún candidato está contestando ahora mismo
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            En cuanto alguien empiece una prueba aparecerá aquí, y verás sus
            respuestas según las va marcando.
          </p>
        </div> :

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Lista de sesiones */}
          <div className="lg:col-span-2 space-y-3">
            {sesiones.map((s) => {
            const pct = s.totalQuestions > 0 ?
            Math.round(s.answeredCount / s.totalQuestions * 100) :
            0;
            const inactivo = ahora - s.updatedAt > INACTIVO_MS;
            const activaEsta = s.id === seleccionada;
            return (
              <button
                key={s.id}
                onClick={() => setSeleccionada(s.id)}
                className="w-full text-left bg-white rounded-2xl p-4 border transition-all"
                style={{
                  borderColor: activaEsta ? TR.blue : '#f3f4f6',
                  boxShadow: activaEsta ?
                  `0 4px 18px ${TR.blue}20` :
                  '0 1px 4px rgba(0,0,0,0.06)'
                }}>

                  <div className="flex items-center gap-3 mb-3">
                    <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.blueLight})` }}>

                      {iniciales(s.candidateName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {s.candidateName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{s.testName}</p>
                    </div>
                    <span
                    className="px-2 py-1 rounded-full text-[10px] font-bold shrink-0"
                    style={
                    inactivo ?
                    { background: '#fffbeb', color: '#92400e' } :
                    { background: `${TR.green}15`, color: TR.greenDark }
                    }>

                      {inactivo ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {s.answeredCount} de {s.totalQuestions || '?'} respondidas
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: colorAvance(pct) }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: colorAvance(pct) }} />

                  </div>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {reloj(s.timeLeft)} restantes
                    </span>
                    <span>{hace(ahora - s.updatedAt)}</span>
                  </div>
                </button>);

          })}
          </div>

          {/* Detalle de la sesión seleccionada */}
          <div className="lg:col-span-3">
            {activa &&
          <div
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                {/* Cabecera */}
                <div
              className="p-5 flex items-center gap-4"
              style={{ background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})` }}>

                  <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white font-bold shrink-0">
                    {iniciales(activa.candidateName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold truncate">{activa.candidateName}</p>
                    <p className="text-white/60 text-xs truncate">
                      {activa.candidatePosition} · {activa.testName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-black text-lg">
                      {reloj(activa.timeLeft)}
                    </p>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">
                      restantes
                    </p>
                  </div>
                </div>

                {/* Respuestas */}
                <div className="p-5">
                  {preguntas.length === 0 ?
              <p className="text-center text-gray-300 py-8 text-sm">
                      Cargando preguntas...
                    </p> :

              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                      {preguntas.map((q, i) => {
                  const elegida = activa.answers[q.id];
                  const respondida = elegida !== undefined && elegida !== null;
                  const enCurso = i === activa.currentQuestion && !respondida;
                  const opcion = respondida ? q.options[elegida] : undefined;

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl p-3.5 border transition-all"
                      style={{
                        borderColor: respondida ?
                        `${TR.green}40` :
                        enCurso ?
                        `${TR.blue}50` :
                        '#f3f4f6',
                        background: respondida ?
                        `${TR.green}08` :
                        enCurso ?
                        `${TR.blue}08` :
                        '#fff'
                      }}>

                            <div className="flex items-start gap-3">
                              <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                          style={
                          respondida ?
                          { background: TR.green, color: '#fff' } :
                          enCurso ?
                          { background: TR.blue, color: '#fff' } :
                          { background: '#f3f4f6', color: '#9ca3af' }
                          }>

                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 leading-snug">
                                  {q.text}
                                </p>

                                {respondida ?
                          <p
                            className="text-xs font-semibold mt-1.5 flex items-center gap-1.5"
                            style={{ color: TR.greenDark }}>

                                    <CheckCircle2Icon className="w-3.5 h-3.5 shrink-0" />
                                    {opcion?.label || `Opción ${elegida + 1}`}
                                  </p> :
                          enCurso ?
                          <p
                            className="text-xs font-semibold mt-1.5 flex items-center gap-1.5"
                            style={{ color: TR.blue }}>

                                    <CircleDashedIcon className="w-3.5 h-3.5 shrink-0 animate-spin" />
                                    Contestando ahora...
                                  </p> :

                          <p className="text-xs text-gray-300 mt-1.5">
                                    Sin responder
                                  </p>
                          }
                              </div>
                            </div>
                          </div>);

                })}
                    </div>
              }
                </div>
              </div>
          }
          </div>
        </div>
      }
    </div>);

}
