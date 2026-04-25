import React, { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon } from
'lucide-react';
interface Question {
  id: number;
  text: string;
  type: 'likert' | 'multiple' | 'forced';
  options: string[];
}
const sampleQuestions: Question[] = [
{
  id: 1,
  type: 'likert',
  text: 'Me considero una persona que cumple con sus compromisos laborales de manera consistente',
  options: [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Totalmente de acuerdo']

},
{
  id: 2,
  type: 'likert',
  text: 'Prefiero seguir procedimientos establecidos antes que improvisar soluciones',
  options: [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Totalmente de acuerdo']

},
{
  id: 3,
  type: 'multiple',
  text: 'Un cliente se queja de un producto defectuoso. ¿Cuál sería tu mejor respuesta?',
  options: [
  'Informar que debe contactar al área de garantías',
  'Escuchar su queja y derivarlo al supervisor',
  'Disculparse, escuchar activamente y ofrecer una solución inmediata',
  'Reemplazar el producto de inmediato y hacer seguimiento para asegurar satisfacción']

},
{
  id: 4,
  type: 'forced',
  text: 'Selecciona la frase que MÁS te describe y la que MENOS te describe:',
  options: [
  'Me gusta tomar decisiones rápidas',
  'Prefiero trabajar en equipo',
  'Soy muy detallista con los procedimientos',
  'Me motiva persuadir a otros']

}];

export function TestApplication() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const progress = (currentQuestion + 1) / sampleQuestions.length * 100;
  const question = sampleQuestions[currentQuestion];
  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [question.id]: value
    });
  };
  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                IRV-20: Integridad, Responsabilidad y Valores
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Evaluación de integridad y valores laborales
              </p>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono text-lg">
                {formatTime(timeElapsed)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Pregunta {currentQuestion + 1} de {sampleQuestions.length}
              </span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`
                }} />
              
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-start space-x-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {currentQuestion + 1}
              </div>
              <p className="text-lg text-gray-900 leading-relaxed">
                {question.text}
              </p>
            </div>

            {question.type === 'likert' &&
            <div className="space-y-3">
                {question.options.map((option, index) =>
              <button
                key={index}
                onClick={() => handleAnswer(index + 1)}
                className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${answers[question.id] === index + 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{option}</span>
                      {answers[question.id] === index + 1 &&
                  <CheckCircle2Icon className="w-5 h-5 text-blue-600" />
                  }
                    </div>
                  </button>
              )}
              </div>
            }

            {question.type === 'multiple' &&
            <div className="space-y-3">
                {question.options.map((option, index) =>
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${answers[question.id] === index ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                
                    <div className="flex items-start space-x-3">
                      <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${answers[question.id] === index ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                    
                        {answers[question.id] === index &&
                    <div className="w-2 h-2 rounded-full bg-white" />
                    }
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </button>
              )}
              </div>
            }

            {question.type === 'forced' &&
            <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    MÁS me describe:
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, index) =>
                  <button
                    key={`most-${index}`}
                    onClick={() =>
                    handleAnswer({
                      most: index,
                      least: answers[question.id]?.least
                    })
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${answers[question.id]?.most === index ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    
                        {option}
                      </button>
                  )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    MENOS me describe:
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, index) =>
                  <button
                    key={`least-${index}`}
                    onClick={() =>
                    handleAnswer({
                      most: answers[question.id]?.most,
                      least: index
                    })
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${answers[question.id]?.least === index ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    
                        {option}
                      </button>
                  )}
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Anterior</span>
            </button>

            {currentQuestion === sampleQuestions.length - 1 ?
            <button className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle2Icon className="w-5 h-5" />
                <span className="font-medium">Finalizar Prueba</span>
              </button> :

            <button
              onClick={handleNext}
              disabled={!answers[question.id]}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
                <span className="font-medium">Siguiente</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            }
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Responde con honestidad. No hay respuestas correctas o incorrectas.
          </p>
          <p className="mt-1">
            Tus respuestas son confidenciales y serán utilizadas únicamente para
            fines de evaluación laboral.
          </p>
        </div>
      </div>
    </div>);

}