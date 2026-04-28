import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
interface Question {
  id: string;
  text: string;
  type: string;
  options: any;
  factor?: string;
  weight?: number;
}
export function TestApplication({ testId, candidateId }: any) {
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (testId) loadTest();
  }, [testId]);
  const loadTest = async () => {
    try {
      setLoading(true);
      const { data: testData } = await supabase.
      from('tests').
      select('*').
      eq('id', testId).
      single();
      const { data: questionsData } = await supabase.
      from('questions').
      select('*').
      eq('test_id', testId);
      setTest(testData);
      setQuestions(questionsData || []);
      setTimeLeft((testData?.duration || 10) * 60);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // ⏱️ Timer
  useEffect(() => {
    if (!timeLeft) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
  // Auto finalizar cuando se acaba el tiempo
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0) handleFinish();
  }, [timeLeft]);
  const handleAnswer = (value: any) => {
    setAnswers((prev: any) => ({
      ...prev,
      [questions[current].id]: value
    }));
  };
  const next = () => {
    if (!answers[questions[current].id]) return;
    setCurrent((prev) => prev + 1);
  };
  // 🧠 Cálculo de score normalizado a escala 0-100
  const calculateScore = () => {
    let rawTotal = 0;
    let maxPossible = 0;
    const factors: any = {};
    questions.forEach((q) => {
      const value = answers[q.id] || 0;
      const factor = q.factor || 'general';
      const weight = q.weight || 1;
      // Calcular el valor máximo posible de esta pregunta
      const parsedOpts = q.options ?
      typeof q.options === 'string' ?
      JSON.parse(q.options) :
      q.options :
      [];
      const maxValue =
      parsedOpts.length > 0 ?
      Math.max(...parsedOpts.map((o: any) => o.value || 0)) :
      5;
      rawTotal += value * weight;
      maxPossible += maxValue * weight;
      if (!factors[factor]) factors[factor] = 0;
      factors[factor] += value * weight;
    });
    // Normalizar a escala 0-100
    const normalizedScore =
    maxPossible > 0 ? Math.round(rawTotal / maxPossible * 100) : 0;
    return {
      total: normalizedScore,
      factors
    };
  };
  const handleFinish = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const result = calculateScore();
      const finalScore = Math.round(result.total);
      // 1️⃣ Guardar resultado en la tabla results
      const { error: resultError } = await supabase.from('results').insert({
        test_id: testId,
        user_name: candidateId || 'Usuario',
        answers: JSON.stringify(answers),
        score: finalScore
      });
      if (resultError) {
        console.error('Error guardando resultado:', resultError);
        alert(`Error guardando resultados: ${resultError.message}`);
        return;
      }
      // 2️⃣ ✅ ACTUALIZAR ESTADO DEL CANDIDATO A "completed"
      if (candidateId) {
        // Verificar cuántas pruebas tiene el candidato en total
        const { data: allResults } = await supabase.
        from('results').
        select('id').
        eq('user_name', String(candidateId));
        // Calcular compatibilidad promedio para actualizar el campo
        const { data: allScores } = await supabase.
        from('results').
        select('score').
        eq('user_name', String(candidateId));
        const avgScore =
        allScores && allScores.length > 0 ?
        Math.round(
          allScores.reduce((s: number, r: any) => s + (r.score || 0), 0) /
          allScores.length
        ) :
        finalScore;
        const { error: candidateError } = await supabase.
        from('candidates').
        update({
          status: 'completed',
          compatibility: avgScore
        }).
        eq('id', candidateId);
        if (candidateError) {
          console.error('Error actualizando candidato:', candidateError);
          // No bloqueamos el flujo — el resultado ya se guardó
        }
      }
      alert('Prueba completada ✅ — El estado del candidato fue actualizado.');
      window.location.reload();
    } catch (err: any) {
      console.error('Error completo:', err);
      alert(`Error guardando resultados: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };
  if (loading)
  return (
    <div className="flex items-center justify-center h-screen text-gray-500">
        Cargando prueba...
      </div>);

  if (!test)
  return (
    <div className="flex items-center justify-center h-screen">
        No se encontró el test
      </div>);

  const question = questions[current];
  const parsedOptions = question?.options ?
  typeof question.options === 'string' ?
  JSON.parse(question.options) :
  question.options :
  [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{test.name}</h1>
          <p className="text-gray-500 text-sm">{test.description}</p>
          <p className="mt-2 text-red-500 font-bold">
            Tiempo: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, '0')}
          </p>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              Pregunta {current + 1} de {questions.length}
            </span>
            <span>{Math.round((current + 1) / questions.length * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${(current + 1) / questions.length * 100}%`
              }} />
            
          </div>
        </div>

        {/* Tarjeta de pregunta */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            {current + 1}. {question?.text}
          </h2>
          <div className="space-y-3">
            {parsedOptions.map((opt: any, i: number) => {
              const selected = answers[question.id] === opt.value;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                  
                  {opt.label}
                </button>);

            })}
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between mt-6">
          {current > 0 &&
          <button
            onClick={() => setCurrent((p) => p - 1)}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">
            
              Anterior
            </button>
          }
          <div className="ml-auto">
            {current < questions.length - 1 ?
            <button
              onClick={next}
              disabled={!answers[question?.id]}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
              
                Siguiente
              </button> :

            <button
              onClick={handleFinish}
              disabled={saving || !answers[question?.id]}
              className="px-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              
                {saving ?
              <>
                    <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24">
                  
                      <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4" />
                  
                      <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z" />
                  
                    </svg>
                    Guardando...
                  </> :

              'Finalizar Prueba'
              }
              </button>
            }
          </div>
        </div>
      </div>
    </div>);

}