import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import {
  CheckIcon, ClockIcon, ChevronRightIcon, ChevronLeftIcon,
  AlertCircleIcon, BookOpenIcon, PlayIcon, ListChecksIcon,
  RotateCcwIcon } from
'lucide-react';
import { logAudit } from '../utils/useAudit';

const TR = { blue: '#2D4494', navy: '#1a2d6b', green: '#7DB928', greenDark: '#5e8c1e' };
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── Clave única de progreso en localStorage ────────────────────────
function progressKey(testId: string, candidateId: string) {
  return `test_progress_${testId}_${candidateId}`;
}

interface SavedProgress {
  testId: string;
  candidateId: string;
  answers: Record<string, number>; // { questionId: selectedIndex }
  currentQ: number;
  timeLeft: number;
  savedAt: number; // timestamp
  startedAt: number; // cuando inició
}

function saveProgress(data: SavedProgress) {
  try {
    localStorage.setItem(progressKey(data.testId, data.candidateId), JSON.stringify(data));
  } catch {/* storage lleno — ignorar */}
}

function loadProgress(testId: string, candidateId: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(testId, candidateId));
    if (!raw) return null;
    return JSON.parse(raw) as SavedProgress;
  } catch {return null;}
}

function clearProgress(testId: string, candidateId: string) {
  localStorage.removeItem(progressKey(testId, candidateId));
}

// ── Pantalla de instrucciones ──────────────────────────────────────
function InstructionsScreen({
  test, questions, savedProgress, onStart, onResume






}: {test: any;questions: any[];savedProgress: SavedProgress | null;onStart: () => void;onResume: () => void;}) {
  const instructions = test?.description ?
  test.description.split(/\.\s+/).filter((s: string) => s.trim().length > 10) :
  [];

  const answeredCount = savedProgress ? Object.keys(savedProgress.answers).length : 0;
  const savedMins = savedProgress ? Math.floor(savedProgress.timeLeft / 60) : 0;
  const savedSecs = savedProgress ? String(savedProgress.timeLeft % 60).padStart(2, '0') : '00';
  const savedDate = savedProgress ? new Date(savedProgress.savedAt).toLocaleString('es-MX') : '';

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
    style={{ background: `linear-gradient(160deg, ${TR.navy} 0%, ${TR.blue} 60%, #1e3a8a 100%)` }}>
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <BookOpenIcon className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Evaluación</p>
          <h1 className="text-3xl font-black text-white leading-tight">{String(test?.name || '')}</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            {[
            { label: 'Preguntas', value: questions.length, icon: ListChecksIcon },
            { label: 'Duración', value: `${test?.duration || 45} min`, icon: ClockIcon },
            { label: 'Formato', value: test?.format || 'Selección múltiple', icon: CheckIcon }].
            map((s) =>
            <div key={s.label} className="px-6 py-5 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: TR.blue }} />
                <p className="text-lg font-black" style={{ color: TR.navy }}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            )}
          </div>

          {/* Aviso de progreso guardado */}
          {savedProgress &&
          <div className="mx-6 mt-5 p-4 rounded-2xl border-2"
          style={{ borderColor: `${TR.green}40`, background: `${TR.green}08` }}>
              <div className="flex items-start gap-3">
                <RotateCcwIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: TR.green }} />
                <div className="flex-1">
                  <p className="font-black text-sm" style={{ color: TR.greenDark }}>Tienes un progreso guardado</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dejaste la prueba el <strong>{savedDate}</strong> con{' '}
                    <strong>{answeredCount} de {questions.length}</strong> preguntas respondidas
                    y <strong>{savedMins}:{savedSecs}</strong> restantes.
                  </p>
                </div>
              </div>
            </div>
          }

          {/* Instrucciones */}
          <div className="px-8 py-6">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: TR.blue }}>
              Instrucciones
            </h2>
            <div className="space-y-3">
              {(instructions.length > 0 ? instructions : [
              'Lea cada pregunta cuidadosamente antes de seleccionar una respuesta.',
              'Marque una sola opción por pregunta: A, B, C o D.',
              'Su progreso se guarda automáticamente — puede cerrar la sesión y continuar después.',
              'Este examen es para detección de necesidades de formación.']).
              map((inst: string, i: number) =>
              <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black text-white"
                style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{inst.trim().replace(/\.$/, '')}.</p>
                </div>
              )}
            </div>

            <div className="mt-5 p-4 rounded-2xl flex items-start gap-3"
            style={{ background: `${TR.blue}08`, border: `1px solid ${TR.blue}15` }}>
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TR.blue }} />
              <p className="text-xs text-gray-600 leading-relaxed">
                {savedProgress ?
                'Puede continuar donde lo dejó o iniciar de nuevo. Si inicia de nuevo, el progreso anterior se perderá.' :
                'Una vez que presione Iniciar Examen, el tiempo comenzará a correr. Su progreso se guardará automáticamente.'}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="px-8 pb-8 space-y-3">
            {savedProgress &&
            <button onClick={onResume}
            className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg hover:opacity-90 flex items-center justify-center gap-3"
            style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`, boxShadow: `0 6px 20px ${TR.green}40` }}>
                <RotateCcwIcon className="w-5 h-5" />
                Continuar desde donde lo dejé ({answeredCount}/{questions.length})
              </button>
            }
            <button onClick={onStart}
            className="w-full py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2"
            style={{
              background: savedProgress ? 'white' : `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`,
              color: savedProgress ? TR.blue : 'white',
              border: savedProgress ? `2px solid ${TR.blue}30` : 'none',
              boxShadow: savedProgress ? 'none' : `0 6px 20px ${TR.green}40`
            }}>
              <PlayIcon className="w-4 h-4" />
              {savedProgress ? 'Iniciar de nuevo' : 'Iniciar Examen'}
            </button>
          </div>
        </div>
      </div>
    </div>);

}

// ── Componente principal ───────────────────────────────────────────
interface Question {id: string;text: string;type: string;options: any;factor?: string;weight?: number;}

export function TestApplication({ testId, candidateId }: any) {
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answersRef = useRef<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'instructions' | 'exam'>('instructions');
  const [timerActive, setTimerActive] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  // ── Cargar prueba y detectar progreso guardado ─────────────────
  useEffect(() => {
    if (testId && candidateId) loadTest();
  }, [testId, candidateId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const [{ data: testData }, { data: questionsData }] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).single(),
      supabase.from('questions').select('*').eq('test_id', testId)]
      );
      setTest(testData);
      setQuestions(questionsData || []);

      // Detectar progreso guardado
      const saved = loadProgress(String(testId), String(candidateId));
      setSavedProgress(saved);

      // Tiempo default si no hay progreso
      setTimeLeft((testData?.duration || 45) * 60);
    } catch (err) {console.error(err);} finally
    {setLoading(false);}
  };

  // ── Guardar progreso automáticamente cada vez que cambia algo ──
  const persistProgress = useCallback((
  currentAnswers: Record<string, number>,
  currentIndex: number,
  currentTimeLeft: number) =>
  {
    if (!testId || !candidateId || phase !== 'exam') return;
    const data: SavedProgress = {
      testId: String(testId),
      candidateId: String(candidateId),
      answers: currentAnswers,
      currentQ: currentIndex,
      timeLeft: currentTimeLeft,
      savedAt: Date.now(),
      startedAt: Date.now()
    };
    saveProgress(data);
  }, [testId, candidateId, phase]);

  // ── Timer — solo cuando el examen está activo ──────────────────
  useEffect(() => {
    if (!timerActive || finished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        // Guardar progreso cada 10 segundos para no sobrecargar
        if (next % 10 === 0) persistProgress(answers, current, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, finished, answers, current, persistProgress]);

  // ── Tiempo agotado ─────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && timerActive && questions.length > 0 && !finished) {
      handleFinish(true); // fromTimer=true → usa answersRef para evitar stale closure
    }
  }, [timeLeft]);

  // ── Iniciar examen desde cero ──────────────────────────────────
  const handleStart = async () => {
    // Limpiar cualquier progreso anterior
    clearProgress(String(testId), String(candidateId));
    setAnswers({});
    answersRef.current = {}; // el ref debe seguir SIEMPRE a answers
    setCurrent(0);
    setTimeLeft((test?.duration || 45) * 60);
    setPhase('exam');
    setTimerActive(true);

    await logAudit({
      action: 'TEST_START',
      module: 'tests',
      description: `Prueba "${test?.name}" iniciada`,
      entity_id: String(testId),
      entity_name: test?.name,
      metadata: { candidateId, questions: questions.length }
    });
  };

  // ── Continuar desde progreso guardado ─────────────────────────
  const handleResume = () => {
    if (!savedProgress) return;
    setAnswers(savedProgress.answers);
    // Sin esta linea el ref se queda vacio al reanudar y, al enviar, se
    // perdian todas las respuestas guardadas antes de cerrar el navegador.
    answersRef.current = savedProgress.answers;
    setCurrent(savedProgress.currentQ);
    setTimeLeft(savedProgress.timeLeft);
    setPhase('exam');
    setTimerActive(true);
    // No registrar audit de TEST_START al reanudar
  };

  // ── Responder ──────────────────────────────────────────────────
  const handleAnswer = (optionIndex: number) => {
    const newAnswers = { ...answers, [questions[current].id]: optionIndex };
    setAnswers(newAnswers);
    answersRef.current = newAnswers; // siempre actualizado, sin closure stale
    persistProgress(newAnswers, current, timeLeft);
  };

  const next = () => {
    if (answers[questions[current].id] === undefined) return;
    const nextIndex = current + 1;
    setCurrent(nextIndex);
    persistProgress(answers, nextIndex, timeLeft);
  };

  // ── Calcular score ─────────────────────────────────────────────
  const calculateScore = () => {
    let rawTotal = 0;let maxPossible = 0;
    questions.forEach((q) => {
      const selectedIndex = answers[q.id];
      if (selectedIndex === undefined) return;
      const opts = parseOptions(q.options);
      const weight = q.weight || 1;
      const maxVal = Math.max(...opts.map((o) => o.value), 1);
      rawTotal += (opts[selectedIndex]?.value ?? 0) * weight;
      maxPossible += maxVal * weight;
    });
    return maxPossible > 0 ? Math.round(rawTotal / maxPossible * 100) : 0;
  };

  const handleFinish = async (fromTimer = false) => {
    if (saving) return;
    setSaving(true);
    try {
      const currentAnswers = fromTimer ? answersRef.current : answers;

      // Calcular score — preguntas sin responder cuentan como 0 (incorrectas)
      let rawTotal = 0;let maxPossible = 0;
      questions.forEach((q) => {
        const opts = parseOptions(q.options);
        const weight = q.weight || 1;
        const maxVal = Math.max(...opts.map((o: any) => o.value), 1);
        maxPossible += maxVal * weight;

        const selectedIndex = currentAnswers[q.id];
        if (selectedIndex !== undefined) {
          // Pregunta respondida — sumar su valor
          rawTotal += (opts[selectedIndex]?.value ?? 0) * weight;
        }
        // Si no respondida → rawTotal no suma nada = 0 puntos = incorrecta
      });
      const finalScore = maxPossible > 0 ? Math.round(rawTotal / maxPossible * 100) : 0;

      const answeredCount = Object.keys(currentAnswers).length;
      const unansweredCount = questions.length - answeredCount;

      const { error } = await supabase.from('results').insert({
        test_id: testId,
        user_name: candidateId || 'Usuario',
        answers: JSON.stringify(currentAnswers),
        score: finalScore
      });
      if (error) {console.error(error.message);return;}

      if (candidateId) {
        const { data: allScores } = await supabase.from('results').select('score').eq('user_name', String(candidateId));
        const avg = allScores?.length ?
        Math.round(allScores.reduce((s: number, r: any) => s + (r.score || 0), 0) / allScores.length) :
        finalScore;
        await supabase.from('candidates').update({ status: 'completed', compatibility: avg }).eq('id', candidateId);
      }

      await logAudit({
        action: 'TEST_COMPLETE',
        module: 'results',
        description: `Evaluación "${test?.name}" ${fromTimer ? 'finalizada por tiempo agotado' : 'completada'} — ${answeredCount} respondidas, ${unansweredCount} sin responder (incorrectas)`,
        entity_id: String(testId),
        entity_name: test?.name,
        metadata: { score: finalScore, candidateId, answered: answeredCount, unanswered: unansweredCount, timedOut: fromTimer }
      });

      clearProgress(String(testId), String(candidateId));
      if (fromTimer) setTimedOut(true);
      setFinalAnswers(currentAnswers);
      setFinished(true);
    } catch (err: any) {console.error(err.message);} finally
    {setSaving(false);}
  };

  // ── Parsear opciones ───────────────────────────────────────────
  const parseOptions = (raw: any): {label: string;value: number;}[] => {
    try {
      const opts = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(opts)) return [];
      return opts.map((o: any) => ({ label: String(o?.label || o?.text || ''), value: Number(o?.value ?? 0) }));
    } catch {return [];}
  };

  // ── Guardar al cerrar/salir de la página ──────────────────────
  useEffect(() => {
    if (phase !== 'exam' || finished) return;
    const handleBeforeUnload = () => {
      persistProgress(answers, current, timeLeft);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase, finished, answers, current, timeLeft, persistProgress]);

  // ─────────────────────────────────────────────────────────────
  // RENDERS
  // ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})` }}>
      <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin mb-4" />
      <p className="text-white/60 text-sm">Cargando evaluación...</p>
    </div>);


  if (!test) return (
    <div className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})` }}>
      <AlertCircleIcon className="w-12 h-12 text-white/40 mb-3" />
      <p className="text-white font-bold">No se encontró la prueba</p>
    </div>);


  // ── Instrucciones ──────────────────────────────────────────────
  if (phase === 'instructions') return (
    <InstructionsScreen
      test={test}
      questions={questions}
      savedProgress={savedProgress}
      onStart={handleStart}
      onResume={handleResume} />);



  // ── Pantalla de éxito ──────────────────────────────────────────
  if (finished) {
    const answeredCount = Object.keys(finalAnswers).length;
    const unansweredCount = questions.length - answeredCount;
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: `linear-gradient(135deg, ${TR.navy}, ${TR.blue})` }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-8 py-8 text-center"
          style={{ background: timedOut ? '#fef2f215' : `${TR.green}12`, borderBottom: `1px solid ${timedOut ? '#fecaca' : TR.green + '20'}` }}>
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mx-auto"
              style={{ background: timedOut ? 'linear-gradient(135deg, #dc2626, #991b1b)' : `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})` }}>
              {timedOut ?
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" strokeLinecap="round" strokeLinejoin="round" /></svg> :
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: TR.navy }}>
            {timedOut ? '¡Tiempo Agotado!' : '¡Evaluación Enviada!'}
          </h1>
          <p className="text-sm font-semibold" style={{ color: timedOut ? '#dc2626' : TR.green }}>
            {String(test.name || '')}
          </p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {timedOut && unansweredCount > 0 &&
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H2.645c-1.73 0-2.813-1.874-1.948-3.374l8.04-13.748c.866-1.5 3.032-1.5 3.898 0l8.04 13.748zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <p className="text-xs text-red-600 leading-relaxed">
                El tiempo se agotó. Las <strong>{unansweredCount} pregunta{unansweredCount !== 1 ? 's' : ''} sin responder</strong> fueron marcadas como incorrectas.
              </p>
            </div>
            }

          <p className="text-gray-500 text-sm text-center leading-relaxed">
            Tu evaluación ha sido registrada. El equipo de Recursos Humanos procesará tus resultados y te contactará con los próximos pasos.
          </p>

          <div className={`grid gap-3 ${timedOut && unansweredCount > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="p-3 rounded-xl text-center" style={{ background: `${TR.blue}08`, border: `1px solid ${TR.blue}12` }}>
              <p className="text-xs text-gray-400 mb-0.5">Respondidas</p>
              <p className="text-xl font-black" style={{ color: TR.blue }}>{answeredCount}</p>
            </div>
            {timedOut && unansweredCount > 0 &&
              <div className="p-3 rounded-xl text-center bg-red-50 border border-red-100">
                <p className="text-xs text-gray-400 mb-0.5">Incorrectas</p>
                <p className="text-xl font-black text-red-500">{unansweredCount}</p>
              </div>
              }
            <div className="p-3 rounded-xl text-center"
              style={{ background: timedOut ? '#fef2f2' : `${TR.green}08`, border: `1px solid ${timedOut ? '#fecaca' : TR.green + '20'}` }}>
              <p className="text-xs text-gray-400 mb-0.5">Estado</p>
              <p className="text-sm font-black" style={{ color: timedOut ? '#dc2626' : TR.green }}>
                {timedOut ? 'Tiempo ✗' : 'Completa ✓'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <AlertCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">Los resultados son confidenciales y solo serán revisados por el equipo evaluador autorizado.</p>
          </div>
        </div>

        <div className="px-8 pb-7">
          <button onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
            Volver al Portal
          </button>
        </div>
      </div>
    </div>);
  }

  // ── Examen ─────────────────────────────────────────────────────
  const question = questions[current];
  const parsedOptions = parseOptions(question?.options);
  const progress = (current + 1) / questions.length * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const isUrgent = timeLeft < 120;
  const answeredCount = Object.keys(answers).length;
  const selectedIndex = answers[question?.id];

  return (
    <div className="min-h-screen flex flex-col"
    style={{ background: `linear-gradient(160deg, ${TR.navy} 0%, ${TR.blue} 60%, #1e3a8a 100%)` }}>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md"
      style={{ background: 'rgba(26,45,107,0.88)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm truncate max-w-xs">{String(test.name || '')}</p>
            <p className="text-white/40 text-xs mt-0.5">{answeredCount} de {questions.length} respondidas · guardado automáticamente</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-black ${isUrgent ? 'bg-red-500/25 text-red-300' : 'bg-white/10 text-white'}`}>
            <ClockIcon className={`w-4 h-4 ${isUrgent ? 'animate-pulse' : ''}`} />
            {minutes}:{seconds}
          </div>
        </div>
        <div className="h-0.5 bg-white/10">
          <div className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${TR.green}, ${TR.greenDark})` }} />
        </div>
      </header>

      {/* Pregunta */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">Pregunta {current + 1} de {questions.length}</span>
            <span className="text-white/50 text-sm">{Math.round(progress)}% completado</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` }}>
                  {current + 1}
                </div>
                <h2 className="text-base font-bold text-gray-800 leading-relaxed pt-1.5">{String(question?.text || '')}</h2>
              </div>
            </div>

            <div className="px-8 pb-8 space-y-2.5">
              {parsedOptions.map((opt, i) => {
                const isSelected = selectedIndex === i;
                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                  className="w-full text-left p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-150"
                  style={{
                    borderColor: isSelected ? TR.blue : '#e5e7eb',
                    background: isSelected ? `${TR.blue}10` : '#fafafa'
                  }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{
                      background: isSelected ? TR.blue : '#f1f5f9',
                      color: isSelected ? 'white' : '#94a3b8'
                    }}>
                      {LETTERS[i]}
                    </div>
                    <span className="text-sm font-medium leading-relaxed"
                    style={{ color: isSelected ? TR.navy : '#374151' }}>
                      {opt.label}
                    </span>
                  </button>);

              })}
            </div>
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between">
            {current > 0 ?
            <button onClick={() => {setCurrent((c) => c - 1);}}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <ChevronLeftIcon className="w-4 h-4" /> Anterior
                </button> :
            <div />}

            {current < questions.length - 1 ?
            <button onClick={next} disabled={selectedIndex === undefined}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ background: selectedIndex !== undefined ? `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` : 'rgba(255,255,255,0.15)' }}>
                  Siguiente <ChevronRightIcon className="w-4 h-4" />
                </button> :
            <button onClick={() => handleFinish()} disabled={saving || selectedIndex === undefined}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})`, boxShadow: `0 4px 14px ${TR.green}40` }}>
                  {saving ?
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> :
              <><CheckIcon className="w-4 h-4" /> Enviar Evaluación</>}
                </button>}
          </div>

          {/* Mini mapa */}
          <div className="flex flex-wrap gap-1.5 justify-center pt-1">
            {questions.map((q, i) => {
              const answered = answers[q.id] !== undefined;
              return (
                <button key={q.id} onClick={() => setCurrent(i)}
                className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: i === current ? TR.green : answered ? `${TR.green}30` : 'rgba(255,255,255,0.1)',
                  color: i === current ? '#fff' : answered ? TR.green : 'rgba(255,255,255,0.35)',
                  border: `1px solid ${i === current ? TR.green : answered ? `${TR.green}40` : 'rgba(255,255,255,0.12)'}`
                }}>
                  {i + 1}
                </button>);

            })}
          </div>
        </div>
      </main>
    </div>);

}