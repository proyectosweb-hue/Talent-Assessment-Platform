import {
  Candidate,
  Position,
  TestResult,
  FactorResult,
  Alert,
  PositionLevel } from
'../types';

export const mockCandidates: Candidate[] = [
{
  id: '1',
  name: 'María González Pérez',
  document: 'RFC-MGP850615',
  age: 38,
  gender: 'F',
  education: 'Licenciatura en Administración',
  phone: '+52 55 1234 5678',
  email: 'maria.gonzalez@email.com',
  position: 'Gerente de Ventas',
  status: 'completed',
  evaluationDate: '2024-01-15',
  compatibility: 87,
  recommendation: 'highly_recommended'
},
{
  id: '2',
  name: 'Carlos Ramírez López',
  document: 'RFC-CRL920420',
  age: 31,
  gender: 'M',
  education: 'Ingeniería Industrial',
  phone: '+52 55 2345 6789',
  email: 'carlos.ramirez@email.com',
  position: 'Supervisor de Producción',
  status: 'completed',
  evaluationDate: '2024-01-14',
  compatibility: 72,
  recommendation: 'recommended'
},
{
  id: '3',
  name: 'Ana Martínez Sánchez',
  document: 'RFC-AMS880910',
  age: 35,
  gender: 'F',
  education: 'Licenciatura en Psicología',
  phone: '+52 55 3456 7890',
  email: 'ana.martinez@email.com',
  position: 'Coordinador de RRHH',
  status: 'in_progress',
  evaluationDate: '2024-01-16',
  compatibility: 65,
  recommendation: 'recommended'
},
{
  id: '4',
  name: 'Roberto Fernández Cruz',
  document: 'RFC-RFC950305',
  age: 28,
  gender: 'M',
  education: 'Técnico en Administración',
  phone: '+52 55 4567 8901',
  email: 'roberto.fernandez@email.com',
  position: 'Asistente Administrativo',
  status: 'pending',
  compatibility: undefined,
  recommendation: undefined
},
{
  id: '5',
  name: 'Laura Jiménez Torres',
  document: 'RFC-LJT900825',
  age: 33,
  gender: 'F',
  education: 'Licenciatura en Contaduría',
  phone: '+52 55 5678 9012',
  email: 'laura.jimenez@email.com',
  position: 'Ejecutivo de Ventas',
  status: 'completed',
  evaluationDate: '2024-01-13',
  compatibility: 58,
  recommendation: 'recommended_with_reserves'
},
{
  id: '6',
  name: 'Diego Morales Ruiz',
  document: 'RFC-DMR870512',
  age: 36,
  gender: 'M',
  education: 'Maestría en Administración',
  phone: '+52 55 6789 0123',
  email: 'diego.morales@email.com',
  position: 'Director de Operaciones',
  status: 'completed',
  evaluationDate: '2024-01-12',
  compatibility: 91,
  recommendation: 'highly_recommended'
}];


export const mockPositions: Position[] = [
{
  id: '1',
  name: 'Gerente de Ventas',
  area: 'Comercial',
  level: 'management',
  activeVacancies: 2,
  minScore: 70
},
{
  id: '2',
  name: 'Supervisor de Producción',
  area: 'Operaciones',
  level: 'supervisor',
  activeVacancies: 3,
  minScore: 65
},
{
  id: '3',
  name: 'Ejecutivo de Ventas',
  area: 'Comercial',
  level: 'sales',
  activeVacancies: 5,
  minScore: 60
},
{
  id: '4',
  name: 'Asistente Administrativo',
  area: 'Administración',
  level: 'administrative',
  activeVacancies: 4,
  minScore: 55
}];


export const testCatalog = [
{
  id: 'ECL-24',
  name: 'Estilo Conductual Laboral',
  description: 'Evalúa empuje, influencia, estabilidad y apego a normas',
  items: 24,
  format: 'Bloques forzados',
  factors: [
  'Empuje/Iniciativa',
  'Influencia/Persuasión',
  'Estabilidad/Colaboración',
  'Apego a Normas/Orden']

},
{
  id: 'IRV-20',
  name: 'Integridad, Responsabilidad y Valores',
  description:
  'Evalúa integridad, responsabilidad, juicio ético y confiabilidad',
  items: 20,
  format: 'Escala Likert 1-5',
  factors: ['Integridad', 'Responsabilidad', 'Juicio Ético', 'Confiabilidad']
},
{
  id: 'AER-20',
  name: 'Autocontrol, Estrés y Regulación',
  description:
  'Evalúa autocontrol, tolerancia a presión y recuperación emocional',
  items: 20,
  format: 'Escala Likert 1-5',
  factors: [
  'Autocontrol',
  'Tolerancia a Presión',
  'Recuperación Emocional',
  'Impulsividad']

},
{
  id: 'SCO-20',
  name: 'Servicio, Colaboración y Orientación al Cliente',
  description:
  'Evalúa orientación al cliente, colaboración y empatía laboral',
  items: 20,
  format: 'Casos situacionales',
  factors: [
  'Orientación al Cliente',
  'Colaboración',
  'Comunicación Funcional',
  'Empatía Laboral']

},
{
  id: 'RLP-18',
  name: 'Razonamiento Lógico Práctico',
  description: 'Evalúa lógica, comprensión verbal y razonamiento numérico',
  items: 18,
  format: 'Opción múltiple',
  factors: [
  'Lógica',
  'Comprensión Verbal',
  'Razonamiento Numérico',
  'Análisis Práctico']

},
{
  id: 'LSD-16',
  name: 'Liderazgo, Supervisión y Desarrollo',
  description: 'Evalúa dirección, delegación y desarrollo de personas',
  items: 16,
  format: 'Casos situacionales',
  factors: [
  'Dirección',
  'Delegación',
  'Desarrollo de Personas',
  'Seguimiento/Accountability']

},
{
  id: 'VMI-16',
  name: 'Valores, Motivadores e Intereses',
  description: 'Evalúa logro, estabilidad, poder, servicio y aprendizaje',
  items: 16,
  format: 'Preferencias',
  factors: [
  'Logro',
  'Estabilidad',
  'Poder/Influencia',
  'Servicio',
  'Aprendizaje',
  'Orden']

},
{
  id: 'CCO-12',
  name: 'Cumplimiento, Orden y Apego a Normas',
  description: 'Evalúa seguimiento de procedimientos y atención al detalle',
  items: 12,
  format: 'Mixto Likert y situacional',
  factors: [
  'Seguimiento de Procedimientos',
  'Atención al Detalle',
  'Orden Documental',
  'Conducta Preventiva']

}];


export const positionWeights: Record<PositionLevel, Record<string, number>> = {
  operative: {
    'ECL-24': 20,
    'IRV-20': 20,
    'AER-20': 15,
    'SCO-20': 15,
    'RLP-18': 15,
    'CCO-12': 15
  },
  administrative: {
    'ECL-24': 15,
    'IRV-20': 20,
    'AER-20': 10,
    'SCO-20': 10,
    'RLP-18': 15,
    'CCO-12': 20,
    'VMI-16': 10
  },
  sales: {
    'ECL-24': 20,
    'IRV-20': 15,
    'AER-20': 10,
    'SCO-20': 20,
    'RLP-18': 10,
    'VMI-16': 15,
    'CCO-12': 10
  },
  supervisor: {
    'ECL-24': 15,
    'IRV-20': 15,
    'AER-20': 10,
    'SCO-20': 10,
    'RLP-18': 10,
    'LSD-16': 25,
    'VMI-16': 5,
    'CCO-12': 10
  },
  management: {
    'ECL-24': 10,
    'IRV-20': 15,
    'AER-20': 10,
    'SCO-20': 10,
    'RLP-18': 10,
    'LSD-16': 30,
    'VMI-16': 10,
    'CCO-12': 5
  },
  executive: {
    'ECL-24': 10,
    'IRV-20': 15,
    'AER-20': 10,
    'SCO-20': 10,
    'RLP-18': 10,
    'LSD-16': 30,
    'VMI-16': 10,
    'CCO-12': 5
  }
};

export const mockTestResults: TestResult[] = [
{
  testId: 'ECL-24',
  testName: 'Estilo Conductual Laboral',
  score: 82,
  level: 'very_high',
  weight: 10
},
{
  testId: 'IRV-20',
  testName: 'Integridad y Valores',
  score: 88,
  level: 'very_high',
  weight: 15
},
{
  testId: 'AER-20',
  testName: 'Autocontrol y Estrés',
  score: 75,
  level: 'high',
  weight: 10
},
{
  testId: 'SCO-20',
  testName: 'Servicio al Cliente',
  score: 91,
  level: 'very_high',
  weight: 10
},
{
  testId: 'RLP-18',
  testName: 'Razonamiento Lógico',
  score: 78,
  level: 'high',
  weight: 10
},
{
  testId: 'LSD-16',
  testName: 'Liderazgo y Supervisión',
  score: 95,
  level: 'very_high',
  weight: 30
},
{
  testId: 'VMI-16',
  testName: 'Valores y Motivadores',
  score: 85,
  level: 'very_high',
  weight: 10
},
{
  testId: 'CCO-12',
  testName: 'Cumplimiento y Orden',
  score: 72,
  level: 'high',
  weight: 5
}];


export const mockFactorResults: FactorResult[] = [
{ name: 'Empuje/Iniciativa', score: 85, level: 'very_high' },
{ name: 'Influencia/Persuasión', score: 78, level: 'high' },
{ name: 'Estabilidad/Colaboración', score: 82, level: 'very_high' },
{ name: 'Apego a Normas', score: 75, level: 'high' },
{ name: 'Integridad', score: 92, level: 'very_high' },
{ name: 'Responsabilidad', score: 88, level: 'very_high' },
{ name: 'Autocontrol', score: 76, level: 'high' },
{ name: 'Tolerancia a Presión', score: 74, level: 'high' },
{ name: 'Orientación al Cliente', score: 93, level: 'very_high' },
{ name: 'Colaboración', score: 89, level: 'very_high' },
{ name: 'Dirección', score: 96, level: 'very_high' },
{ name: 'Delegación', score: 94, level: 'very_high' }];


export const mockAlerts: Alert[] = [
{
  type: 'info',
  message: 'Perfil altamente compatible con posiciones de liderazgo'
},
{
  type: 'warning',
  message:
  'Considerar apoyo en gestión de estrés en periodos de alta demanda'
}];