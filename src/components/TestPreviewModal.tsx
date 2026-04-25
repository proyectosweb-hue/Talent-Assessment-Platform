import React, { useState } from 'react';
import { XIcon, PlayIcon, CheckCircle2Icon } from 'lucide-react';
interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: {
    id: string;
    name: string;
    description: string;
    items: number;
    format: string;
    factors: string[];
  } | null;
}
export function TestPreviewModal({
  isOpen,
  onClose,
  test
}: TestPreviewModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  if (!isOpen || !test) return null;
  const sampleQuestions = [
  {
    id: 1,
    text: 'Me considero una persona que cumple con sus compromisos laborales de manera consistente',
    type: 'likert',
    options: [
    'Totalmente en desacuerdo',
    'En desacuerdo',
    'Neutral',
    'De acuerdo',
    'Totalmente de acuerdo']

  },
  {
    id: 2,
    text: 'Prefiero trabajar de manera independiente antes que en equipo',
    type: 'likert',
    options: [
    'Totalmente en desacuerdo',
    'En desacuerdo',
    'Neutral',
    'De acuerdo',
    'Totalmente de acuerdo']

  },
  {
    id: 3,
    text: 'Un cliente se queja de un producto defectuoso. ¿Cuál sería tu mejor respuesta?',
    type: 'multiple',
    options: [
    'Informar que debe contactar al área de garantías',
    'Escuchar su queja y derivarlo al supervisor',
    'Disculparse, escuchar activamente y ofrecer una solución inmediata',
    'Reemplazar el producto de inmediato y hacer seguimiento']

  }];

  const question = sampleQuestions[currentQuestion];
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      
      <div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="text-white">
            <h2 className="text-xl font-bold">{test.name} - Vista Previa</h2>
            <p className="text-sm text-blue-100 mt-1">
              Ejemplo de preguntas de la prueba
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Pregunta {currentQuestion + 1} de {sampleQuestions.length}
              </span>
              <span className="text-blue-600 font-semibold">Vista Previa</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(currentQuestion + 1) / sampleQuestions.length * 100}%`
                }} />
              
            </div>
          </div>

          {/* Question */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {currentQuestion + 1}
              </div>
              <p className="text-lg text-gray-900 leading-relaxed">
                {question.text}
              </p>
            </div>

            <div className="space-y-2">
              {question.options.map((option, index) =>
              <button
                key={index}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
              setCurrentQuestion(Math.max(0, currentQuestion - 1))
              }
              disabled={currentQuestion === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
              Anterior
            </button>

            <div className="text-sm text-gray-600">
              Pregunta de ejemplo {currentQuestion + 1} de{' '}
              {sampleQuestions.length}
            </div>

            {currentQuestion < sampleQuestions.length - 1 ?
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              
                Siguiente
              </button> :

            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              
                <CheckCircle2Icon className="w-4 h-4" />
                <span>Finalizar Vista Previa</span>
              </button>
            }
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Esta es una vista previa con preguntas de
              ejemplo. La prueba completa contiene {test.items} reactivos y
              evalúa: {test.factors.join(', ')}.
            </p>
          </div>
        </div>
      </div>
    </div>);

}