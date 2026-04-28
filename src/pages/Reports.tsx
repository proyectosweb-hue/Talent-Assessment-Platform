import React, { useCallback, useEffect, useState } from 'react';

import {
  FileTextIcon,
  DownloadIcon,
  PrinterIcon,
  PlusIcon,
  Loader2,
  TrendingUpIcon,
  CalendarIcon,
  BarChart2Icon,
  EyeIcon } from
'lucide-react';

import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { ReportGeneratorModal } from '../components/ReportGeneratorModal';
import {
  getCompatibilityLevel,
  getCompatibilityLabel,
  getCompatibilityColor } from
'../utils/scoring';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface AnswerRow {
  questionText: string;
  answer: string;
}

interface ReportRow {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  testName: string;
  testId: string;
  score: number;
  compatibility: number;
  date: string;
  level: string;
  levelColor: string;
  gender?: string;
  age?: number;
  education?: string;
  rawAnswers?: Record<string, string>;
  hardAreas?: Record<string, number>;
  softAreas?: Record<string, number>;
  alerts?: {title: string;description: string;}[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getBarColor(v: number) {
  return v >= 80 ? '#16a34a' : v >= 65 ? '#2563eb' : v >= 50 ? '#d97706' : '#dc2626';
}

function getRecLabel(c: number) {
  if (c >= 80) return { text: 'Altamente Recomendable', color: '#166534', bg: '#f0fdf4' };
  if (c >= 65) return { text: 'Recomendable', color: '#1e40af', bg: '#eff6ff' };
  if (c >= 50) return { text: 'Recomendable con Reserva', color: '#92400e', bg: '#fffbeb' };
  return { text: 'No Recomendable', color: '#991b1b', bg: '#fef2f2' };
}

const AREA_INFO: Record<string, {label: string;bajo: string;alto: string;}> = {
  ajusteNormasSociales: { label: 'Ajuste Normas Sociales', bajo: 'Busca formas de evadir reglamentos, tareas, políticas e instrucciones, para beneficio propio.', alto: 'Tendencia a respetar a personas, jerarquías, normas sociales, reglas.' },
  ajusteNormasLaborales: { label: 'Ajuste a Normas Laborales', bajo: 'Probable tendencia a considerar políticas, reglas y lineamientos, como una cuestión sugerida la cual puede a voluntad seguirse o no.', alto: 'Esta área explora aspectos donde la persona sobrepone sus interés y voluntad sobre los de la sociedad, ya sea en lo personal o laboral.' },
  manipulacionMentiras: { label: 'Manipulación y Mentiras', bajo: 'Posiblemente ha introyectado la mentira y la manipulación en el ámbito laboral como forma convencional de actuar para lograr sus objetivos, admite haberlo hecho.', alto: 'Tendencia por actuar con sinceridad y rectitud en las relaciones laborales.' },
  satisfaccionAntisociales: { label: 'Satisfacción y Rasgos Antisociales', bajo: 'Condiciona la satisfacción laboral y su estilo de vida por logros materiales; pudiendo ser capaz de mostrar conductas que tiendan a transgredir normas sociales para lograrlo.', alto: 'Busca mantenerse ajustado a las normas sociales como norma básica para desenvolverse social y laboralmente.' },
  empatiaEmpresarial: { label: 'Empatía Empresarial', bajo: 'Habilidad cognitiva y emocional del individuo, en la cual este no es capaz de ponerse en la situación emocional de un conjunto de personas físicas. Mínima o ninguna compasión por los otros.', alto: 'Capacidad de ponerse en el lugar de otros y saber las implicaciones de sus actos, sin intención de perjudicarlos en un entorno organizacional.' },
  responsabilidad: { label: 'Responsabilidad', bajo: 'Busca formas de evadir o no cumplir con obligaciones y tareas, pretendiendo hacerlas a su modo.', alto: 'Tiende a cumplir con sus obligaciones y asignaciones.' },
  controlImpulsos: { label: 'Control de Impulsos', bajo: 'Sus deseos y emociones guían sus decisiones.', alto: 'Tiende a dominar sus deseos y motivos reflexionando.' },
  egocentrismo: { label: 'Egocentrismo', bajo: 'Considerado con los demás en sus necesidades, incluso a veces por encima de sí mismo.', alto: 'Exaltación de la propia personalidad, hasta considerarla como centro de la atención, por sobre los demás.' },
  motivacionLaboral: { label: 'Motivación Laboral', bajo: 'Necesidad de realizar actividades a cambio de ganancias materiales, escaso reconocimiento del trabajo en equipo por sobre lo individual.', alto: 'Su motivación para trabajar se orienta al servicio a los demás; también se observa su compromiso para con su grupo de trabajo y su jefe.' },
  metasProfesionales: { label: 'Metas Profesionales', bajo: 'Su inclinación laboral se dirige a ser independiente, desvinculado del plan de carrera de una empresa.', alto: 'Tendencia y preferencia a formar parte de una empresa y su compromiso como empleado.' },
  vidaFamiliar: { label: 'Vida Familiar', bajo: 'Orientado a un estilo de vida desvinculado de su familia, poco afecto por su origen y raíces.', alto: 'Se percibe el grado de integración con su familia nuclear y de origen, sus vínculos, proyectando el grado de empatía familiar.' },
  relacionesInterpersonales: { label: 'Relaciones Interpersonales', bajo: 'Tendencia por mantener desapego afectivo de parejas y demás personas con quienes se relaciona.', alto: 'Explora los vínculos con amistades y pareja(s), para entender el grado de empatía hacia ellos.' },
  correrRiesgos: { label: 'Correr Riesgos', bajo: 'Preferencia y tendencia por actividades tranquilas, rutinarias, que no impliquen riesgos físicos o emocionales.', alto: 'Gusto, necesidad y búsqueda de actividades dinámicas y riesgosas por sentir la adrenalina.' },
  emocionesRespeto: { label: 'Emociones y Respeto por los Demás', bajo: 'Potencial capacidad de una persona de ser agresiva en su entorno laboral, que puede tener un frágil control de impulsos; siendo poco empático por los sentimientos de otro.', alto: 'Se inclina a respetar y entender las emociones de la gente en su entorno laboral.' }
};

const HARD_KEYS = ['ajusteNormasSociales', 'ajusteNormasLaborales', 'manipulacionMentiras', 'satisfaccionAntisociales', 'empatiaEmpresarial'];
const SOFT_KEYS = ['responsabilidad', 'controlImpulsos', 'egocentrismo', 'motivacionLaboral', 'metasProfesionales', 'vidaFamiliar', 'relacionesInterpersonales', 'correrRiesgos', 'emocionesRespeto'];

function autoAlerts(r: ReportRow) {
  const alerts: {title: string;description: string;}[] = [];
  const soft = r.softAreas;
  const hard = r.hardAreas;
  if (soft?.controlImpulsos !== undefined && soft.controlImpulsos < 65)
  alerts.push({ title: 'Control de Impulsos', description: 'Al aparecer esta escala con porcentajes menores a 65, podría generar fallas en sus controles internos con reacciones emocionales agresivas tanto en ambientes laborales como sociales. Si esta escala se combina con alguna escala dura en rojo como satisfacción y rasgos antisociales, puede generar delitos de acoso sexual y/o laboral.' });
  if (hard?.manipulacionMentiras !== undefined && hard.manipulacionMentiras < 65)
  alerts.push({ title: 'Manipulación y Mentiras', description: 'El candidato podría incurrir en conductas de deshonestidad laboral. Se recomienda establecer controles de auditoría y verificación periódica en las actividades que maneje.' });
  if (hard?.satisfaccionAntisociales !== undefined && hard.satisfaccionAntisociales < 65)
  alerts.push({ title: 'Satisfacción y Rasgos Antisociales', description: 'La combinación de rasgos antisociales con baja empatía puede derivar en comportamientos que transgredan las normas sociales y laborales para beneficio personal.' });
  return alerts;
}

function barRow(key: string, val: number | undefined): string {
  if (val === undefined) return '';
  const info = AREA_INFO[key];if (!info) return '';
  const color = getBarColor(val);
  return `<tr>
    <td style="padding:5px 0;font-size:12.5px;color:#374151;font-weight:500;width:220px">${info.label}</td>
    <td style="padding:5px 0 5px 12px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:9px;background:#e5e7eb;border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${val}%;background:${color};border-radius:5px"></div>
        </div>
        <span style="font-size:12.5px;font-weight:700;color:${color};min-width:34px;text-align:right">${val}%</span>
      </div>
    </td>
  </tr>`;
}

function biRow(key: string, val: number | undefined): string {
  if (val === undefined) return '';
  const info = AREA_INFO[key];if (!info) return '';
  const isHigh = val >= 65;
  const dotColor = val < 65 ? '#dc2626' : val < 80 ? '#d97706' : '#16a34a';
  return `<tr style="border-bottom:1px solid #f3f4f6">
    <td style="padding:9px 8px;vertical-align:top;width:38%">
      <p style="font-size:11px;font-weight:700;color:${!isHigh ? '#b91c1c' : '#6b7280'};margin:0 0 3px 0">Bajo ${info.label}</p>
      <p style="font-size:11px;color:#6b7280;margin:0;line-height:1.5">${info.bajo}</p>
    </td>
    <td style="padding:9px 4px;text-align:center;vertical-align:middle;width:12%">
      <div style="display:flex;justify-content:space-around;align-items:center">
        <div style="width:1px;height:30px;background:#d1d5db"></div>
        <div style="width:11px;height:11px;border-radius:50%;background:${dotColor}"></div>
        <div style="width:1px;height:30px;background:#d1d5db"></div>
      </div>
    </td>
    <td style="padding:9px 8px;vertical-align:top;width:38%">
      <p style="font-size:11px;font-weight:700;color:${isHigh ? '#166534' : '#6b7280'};margin:0 0 3px 0">Alto ${info.label}</p>
      <p style="font-size:11px;color:#6b7280;margin:0;line-height:1.5">${info.alto}</p>
    </td>
  </tr>`;
}

// ── generatePDF ───────────────────────────────────────────────────────────────
export function generatePDF(report: ReportRow, answersWithText: AnswerRow[]) {
  const rec = getRecLabel(report.compatibility);
  const alerts = report.alerts && report.alerts.length > 0 ? report.alerts : autoAlerts(report);
  const hard = report.hardAreas;
  const soft = report.softAreas;
  const hasAreas = !!(hard || soft);

  const hardBarsHTML = HARD_KEYS.map((k) => barRow(k, hard?.[k])).join('');
  const softBarsHTML = SOFT_KEYS.map((k) => barRow(k, soft?.[k])).join('');
  const biDirHTML = [...HARD_KEYS, ...SOFT_KEYS].map((k) => biRow(k, hard?.[k] ?? soft?.[k])).join('');

  const recText = report.compatibility >= 80 ?
  `${report.candidateName} presenta un perfil altamente compatible con el puesto de ${report.position || 'la posición evaluada'}. Se recomienda proceder con el proceso de selección con alta prioridad.` :
  report.compatibility >= 65 ?
  `${report.candidateName} muestra buena compatibilidad con el perfil requerido. Se recomienda continuar con el proceso considerando los resultados obtenidos.` :
  report.compatibility >= 50 ?
  `Al responder de manera limítrofe ante los parámetros estadísticos para este test, se percibe como una persona con un regular nivel para ajustarse a las normas establecidas. Por lo que se recomienda algún tipo de supervisión o seguimiento hasta determinar sus motivaciones.` :
  `Los resultados de ${report.candidateName} indican que el perfil no es compatible con el puesto en este momento. Los indicadores presentan áreas de riesgo que requieren evaluación adicional.`;

  const angle = Math.PI - report.compatibility / 100 * Math.PI;
  const nx = Math.round(100 + 68 * Math.cos(angle));
  const ny = Math.round(100 - 68 * Math.sin(angle));

  // Respuestas reales
  const questionsHTML = answersWithText.length > 0 ?
  answersWithText.map((a, i) => `
        <p style="font-size:12px;color:#374151;margin:0 0 9px 0;line-height:1.5;padding:7px 11px;background:#f9fafb;border-left:3px solid #3b82f6;border-radius:0 5px 5px 0">
          <strong>${i + 1}.-</strong> ${a.questionText}
          &nbsp;<strong style="color:#1d4ed8">R: ${a.answer}</strong>
        </p>`).join('') :
  `<p style="font-size:12px;color:#9ca3af;font-style:italic;padding:12px">No se encontraron respuestas registradas para esta evaluación.</p>`;

  const alertsHTML = alerts.length > 0 ?
  alerts.map((a) => `
        <tr>
          <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#374151;vertical-align:top;border-right:1px solid #e5e7eb;width:180px">${a.title}</td>
          <td style="padding:10px 14px;font-size:12px;color:#374151;line-height:1.6">${a.description}</td>
        </tr>`).join('') :
  `<tr><td colspan="2" style="padding:14px;font-size:12px;color:#6b7280;text-align:center">Sin alertas registradas para este candidato.</td></tr>`;

  const HEADER = () => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:18px 32px;border-bottom:2px solid #1e293b">
      <div>
        <div style="display:flex;align-items:baseline;gap:14px;margin-bottom:3px">
          <span style="font-size:26px;font-weight:700;color:#1e293b;font-family:Georgia,serif">01</span>
          <span style="font-size:18px;font-weight:700;color:#1e293b">${report.candidateName}</span>
        </div>
        <div style="font-size:12.5px;color:#6b7280;margin-bottom:3px">${report.education || ''} ${report.gender ? '· ' + report.gender : ''} ${report.age ? '· ' + report.age + ' años' : ''}</div>
        <div style="font-size:12.5px;color:#374151"><strong>Puesto:</strong> ${report.position || '—'}</div>
        <div style="font-size:12.5px;color:#374151"><strong>Fecha de aplicación:</strong> ${report.date}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">Plataforma de Evaluación</div>
        <div style="font-size:18px;font-weight:800;color:#1d4ed8;letter-spacing:-.02em">TALENT<span style="color:#374151">ASSESS</span></div>
      </div>
    </div>`;

  const FOOTER = (page: number, total: number) => `
    <div style="display:flex;justify-content:space-between;padding:10px 32px;border-top:1px solid #e5e7eb">
      <span style="font-size:11px;color:#9ca3af">TalentAssess · ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <span style="font-size:11px;color:#9ca3af">Página ${page}/${total}</span>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte – ${report.candidateName}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Helvetica Neue',Arial,sans-serif;background:#e5e7eb;color:#1e293b;padding:24px}
    .page{background:#fff;max-width:820px;margin:0 auto 28px;border:1px solid #d1d5db;page-break-after:always}
    .body{padding:20px 32px 24px}
    table{border-collapse:collapse}
    @media print{body{background:#fff;padding:0}.page{border:none;margin:0;max-width:100%;page-break-after:always}}
  </style>
</head>
<body>

<!-- ══ PÁGINA 1 ══ -->
<div class="page">
  ${HEADER()}
  <div class="body">
    <h2 style="font-size:19px;font-weight:700;text-align:center;margin:0 0 18px 0;color:#1e293b;font-family:Georgia,serif">${report.testName}</h2>
    <div style="display:flex;gap:22px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        ${hasAreas ? `
          <p style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin-bottom:6px">Áreas Duras</p>
          <table style="width:100%">${hardBarsHTML}</table>
          <p style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin:14px 0 6px">Áreas Blandas</p>
          <table style="width:100%">${softBarsHTML}</table>
        ` : `
          <p style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin-bottom:8px">Compatibilidad General</p>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="flex:1;height:12px;background:#e5e7eb;border-radius:6px;overflow:hidden">
              <div style="height:100%;width:${report.compatibility}%;background:${getBarColor(report.compatibility)};border-radius:6px"></div>
            </div>
            <span style="font-size:16px;font-weight:800;color:${getBarColor(report.compatibility)}">${report.compatibility}%</span>
          </div>
          <p style="font-size:12px;color:#6b7280">Score obtenido: <strong>${report.score} pts</strong></p>
        `}
      </div>
      <div style="width:210px;flex-shrink:0;text-align:center">
        <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" width="200" height="110" style="display:block;margin:0 auto 6px">
          <path d="M 16 100 A 84 84 0 0 1 52 24"   stroke="#dc2626" stroke-width="20" fill="none" stroke-linecap="butt"/>
          <path d="M 52 24 A 84 84 0 0 1 100 16"   stroke="#f59e0b" stroke-width="20" fill="none" stroke-linecap="butt"/>
          <path d="M 100 16 A 84 84 0 0 1 148 24"  stroke="#eab308" stroke-width="20" fill="none" stroke-linecap="butt"/>
          <path d="M 148 24 A 84 84 0 0 1 184 100" stroke="#16a34a" stroke-width="20" fill="none" stroke-linecap="butt"/>
          <line x1="100" y1="100" x2="${nx}" y2="${ny}" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
          <circle cx="100" cy="100" r="5" fill="#111827"/>
        </svg>
        <div style="font-size:13px;font-weight:700;color:${rec.color};background:${rec.bg};padding:5px 10px;border-radius:16px;display:inline-block;margin-bottom:10px">${rec.text}</div>
        <p style="font-size:11.5px;color:#374151;line-height:1.6;text-align:left">${recText}</p>
      </div>
    </div>
    ${hasAreas ? `
    <div style="height:1px;background:#e5e7eb;margin:20px 0"></div>
    <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#374151">
            <th style="padding:7px 10px;font-size:10.5px;font-weight:700;color:#fff;text-align:left;width:38%">&nbsp;</th>
            <th style="padding:7px 10px;text-align:center;width:12%">
              <div style="display:flex;justify-content:space-around">
                <span style="background:#dc2626;padding:1px 8px;border-radius:3px;font-size:10px;color:#fff">1</span>
                <span style="background:#f59e0b;padding:1px 8px;border-radius:3px;font-size:10px;color:#fff">2</span>
                <span style="background:#16a34a;padding:1px 8px;border-radius:3px;font-size:10px;color:#fff">3</span>
              </div>
            </th>
            <th style="padding:7px 10px;font-size:10.5px;font-weight:700;color:#fff;text-align:left;width:38%">&nbsp;</th>
          </tr>
        </thead>
        <tbody>${biDirHTML}</tbody>
      </table>
    </div>` : ''}
  </div>
  ${FOOTER(1, 2)}
</div>

<!-- ══ PÁGINA 2 ══ -->
<div class="page">
  ${HEADER()}
  <div class="body">
    <p style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px">
      Recomendación, es necesario aclarar las respuestas de la persona en una entrevista sobre las frases siguientes:
    </p>
    ${questionsHTML}
    <div style="height:1px;background:#e5e7eb;margin:18px 0"></div>
    <p style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px">
      Posibles delitos corporativos asociados y/o advertencias de acuerdo con los resultados obtenidos:
    </p>
    <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse"><tbody>${alertsHTML}</tbody></table>
    </div>
    <div style="margin-top:18px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
      <p style="font-size:10.5px;color:#6b7280;font-style:italic;line-height:1.6">
        *De acuerdo con la media poblacional, cualquier área que tenga menos del 70% ya no debería considerarse como recomendable,
        sin embargo, se ha dado una tolerancia de 4 a 6 puntos porcentuales que corresponden a la desviación estándar.
      </p>
    </div>
  </div>
  ${FOOTER(2, 2)}
</div>

</body>
</html>`;

  const w = window.open('', '_blank', 'width=960,height=800');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}

// ── Componente Principal ──────────────────────────────────────────────────────
export function Reports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportRow | null>(null);

  // Cache de preguntas por test_id para no repetir fetches
  const questionsCache = React.useRef<Record<string, {id: string;text: string;options: any;}[]>>({});

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data: results, error } = await supabase.
      from('results').
      select('*').
      order('id', { ascending: false });
      if (error) throw error;

      const { data: candidates } = await supabase.from('candidates').select('*');
      const { data: tests } = await supabase.from('tests').select('*');

      const rows: ReportRow[] = (results || []).map((r: any) => {
        const candidate = candidates?.find((c: any) => String(c.id) === String(r.user_name));
        const test = tests?.find((t: any) => String(t.id) === String(r.test_id));
        const compat = Math.min(100, Math.round(r.score || 0));
        const lvl = getCompatibilityLevel(compat);

        // answers puede venir como objeto ya parseado (jsonb) o como string
        const rawAnswers = r.answers ?
        typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers :
        {};

        return {
          id: String(r.id),
          candidateName: candidate?.name || r.user_name || 'Sin nombre',
          candidateEmail: candidate?.email || '—',
          position: candidate?.position || '—',
          testName: test?.name || 'Sin test',
          testId: String(r.test_id || ''),
          score: r.score || 0,
          compatibility: compat,
          date: r.created_at ?
          new Date(r.created_at).toLocaleDateString('es-MX') :
          '—',
          level: getCompatibilityLabel(lvl),
          levelColor: getCompatibilityColor(lvl),
          gender: candidate?.gender,
          age: candidate?.age,
          education: candidate?.education,
          rawAnswers,
          hardAreas: r.hard_areas ?
          typeof r.hard_areas === 'string' ? JSON.parse(r.hard_areas) : r.hard_areas :
          undefined,
          softAreas: r.soft_areas ?
          typeof r.soft_areas === 'string' ? JSON.parse(r.soft_areas) : r.soft_areas :
          undefined,
          alerts: r.alerts ?
          typeof r.alerts === 'string' ? JSON.parse(r.alerts) : r.alerts :
          undefined
        };
      });
      setReports(rows);
    } catch (err: any) {
      showToast('Error al cargar reportes: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {fetchReports();}, [fetchReports]);

  // Cruza preguntas con respuestas reales
  const resolveAnswers = async (report: ReportRow): Promise<AnswerRow[]> => {
    if (!report.testId || !report.rawAnswers || Object.keys(report.rawAnswers).length === 0) return [];

    if (!questionsCache.current[report.testId]) {
      const { data: qs } = await supabase.
      from('questions').
      select('id, text, options').
      eq('test_id', report.testId);
      questionsCache.current[report.testId] = qs || [];
    }

    const questions = questionsCache.current[report.testId];
    const answers = report.rawAnswers;

    return questions.
    filter((q) => answers[q.id] !== undefined && answers[q.id] !== null).
    map((q) => {
      const rawAnswer = String(answers[q.id]);
      let displayAnswer = rawAnswer;

      // Intenta mapear el valor a su label si options es un array
      if (Array.isArray(q.options)) {
        const match = q.options.find((o: any) =>
        String(o?.value) === rawAnswer ||
        String(o?.id) === rawAnswer ||
        typeof o === 'string' && o === rawAnswer
        );
        if (match) {
          displayAnswer = match.label ?? match.text ?? match.value ?? rawAnswer;
        }
      }

      return { questionText: q.text, answer: displayAnswer };
    });
  };

  // Genera el PDF con respuestas reales
  const handleDownload = async (r: ReportRow) => {
    showToast('Preparando reporte…', 'info');
    const answersWithText = await resolveAnswers(r);
    generatePDF(r, answersWithText);
  };

  // Stats derivadas
  const avg = reports.length ?
  Math.round(reports.reduce((s, r) => s + r.compatibility, 0) / reports.length) :
  0;
  const highlyRec = reports.filter((r) => r.compatibility >= 80).length;
  const thisMonth = reports.filter((r) => {
    const now = new Date();
    const d = new Date(r.date.split('/').reverse().join('-'));
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Datos reales · conectado a Supabase · {reports.length} evaluaciones
          </p>
        </div>
        <button
          onClick={() => setShowGeneratorModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md font-bold text-sm">
          
          <PlusIcon className="w-4 h-4" />
          Generar Reporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
        { label: 'Total Reportes', value: reports.length, icon: <FileTextIcon className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50' },
        { label: 'Este Mes', value: thisMonth, icon: <CalendarIcon className="w-5 h-5 text-green-600" />, color: 'bg-green-50' },
        { label: 'Promedio Compat.', value: `${avg}%`, icon: <BarChart2Icon className="w-5 h-5 text-orange-600" />, color: 'bg-orange-50' },
        { label: 'Muy Recomendados', value: highlyRec, icon: <TrendingUpIcon className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50' }].
        map((s) =>
        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center`}>{s.icon}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Historial de Evaluaciones</h3>
          <span className="text-xs text-gray-400 font-medium">{reports.length} registros</span>
        </div>

        {loading ?
        <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-gray-400 text-sm">Cargando desde Supabase…</p>
          </div> :
        reports.length === 0 ?
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <FileTextIcon className="w-10 h-10 mb-2 opacity-40" />
            <p className="font-medium">No hay evaluaciones registradas</p>
            <p className="text-xs mt-1">Aplica pruebas a candidatos para ver reportes aquí</p>
          </div> :

        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-3">Candidato</th>
                  <th className="px-6 py-3">Prueba</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Compatibilidad</th>
                  <th className="px-6 py-3">Resultado</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((r) =>
              <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {r.candidateName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{r.candidateName}</p>
                          <p className="text-xs text-gray-400">{r.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{r.testName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{r.score} pts</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                        className={`h-full rounded-full ${r.compatibility >= 80 ? 'bg-emerald-500' : r.compatibility >= 65 ? 'bg-blue-500' : r.compatibility >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${r.compatibility}%` }} />
                      
                        </div>
                        <span className="text-sm font-bold text-gray-700">{r.compatibility}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.levelColor}`}>
                        {r.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{r.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                      onClick={() => setPreviewReport(r)}
                      title="Vista previa"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                      onClick={() => handleDownload(r)}
                      title="Descargar PDF"
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                      onClick={() => handleDownload(r)}
                      title="Imprimir"
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Modal vista previa */}
      {previewReport &&
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={() => setPreviewReport(null)}>
        
          <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Vista Previa del Reporte</p>
              <h2 className="text-white text-xl font-bold">{previewReport.candidateName}</h2>
              <p className="text-blue-200 text-sm">{previewReport.testName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Compatibilidad</span>
                <span className="text-3xl font-black text-gray-900">{previewReport.compatibility}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                className={`h-full rounded-full ${previewReport.compatibility >= 80 ? 'bg-emerald-500' : previewReport.compatibility >= 65 ? 'bg-blue-500' : previewReport.compatibility >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${previewReport.compatibility}%` }} />
              
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
              ['Puesto', previewReport.position],
              ['Score Raw', `${previewReport.score} pts`],
              ['Fecha', previewReport.date],
              ['Resultado', previewReport.level]].
              map(([label, value]) =>
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                  </div>
              )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                onClick={() => setPreviewReport(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                
                  Cerrar
                </button>
                <button
                onClick={() => {setPreviewReport(null);handleDownload(previewReport);}}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md">
                
                  <DownloadIcon className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <ReportGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => {setShowGeneratorModal(false);fetchReports();}} />
      
    </div>);

}