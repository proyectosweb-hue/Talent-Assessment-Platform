import React, { useEffect, useState } from 'react';
import { XIcon, UserIcon, BriefcaseIcon, MailIcon, PhoneIcon, Loader2Icon, CheckIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabase';
import { logAudit } from '../utils/useAudit';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
const inputBase = "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-300";
const inputStyle = {
  borderColor: '#e5e7eb'
};
const Field = ({
  label,
  children



}: {label: string;children: React.ReactNode;}) => <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>;
export function CandidateFormModal({
  isOpen,
  onClose,
  onSuccess
}: CandidateFormModalProps) {
  const {
    showToast
  } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [positions, setPositions] = useState<{
    id: string;
    name: string;
  }[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [form, setForm] = useState({
    name: '',
    document: '',
    age: '',
    gender: 'M',
    education: '',
    email: '',
    phone: '',
    position: ''
  });

  // Cargar puestos reales de Supabase al abrir
  useEffect(() => {
    if (!isOpen) return;
    setLoadingPositions(true);
    supabase.from('positions').select('id, name').or('archived.eq.false,archived.is.null').order('name').then(({
      data
    }) => setPositions(data || [])).finally(() => setLoadingPositions(false));
  }, [isOpen]);
  if (!isOpen) return null;
  const set = (k: string, v: string) => setForm((p) => ({
    ...p,
    [k]: v
  }));
  const step1Valid = form.name.trim() && form.document.trim() && form.age && form.education;
  const step2Valid = form.email.trim() && form.phone.trim() && form.position;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('candidates').insert([{
        name: form.name.trim(),
        email: form.email.trim(),
        position: form.position,
        status: 'pending',
        compatibility: 0
      }]);
      if (error) throw error;

      // ── Auditoría ──────────────────────────────────────────
      await logAudit({
        action: 'CREATE',
        module: 'candidates',
        description: `Candidato "${form.name}" registrado para el puesto "${form.position}"`,
        entity_name: form.name,
        metadata: {
          email: form.email,
          position: form.position,
          education: form.education
        }
      });
      showToast(`Candidato "${form.name}" registrado`, 'success');
      setForm({
        name: '',
        document: '',
        age: '',
        gender: 'M',
        education: '',
        email: '',
        phone: '',
        position: ''
      });
      setStep(1);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    setStep(1);
    onClose();
  };
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} style={{
      maxHeight: '92vh',
      display: 'flex',
      flexDirection: 'column'
    }}>

        {/* Header */}
        <div className="relative flex-shrink-0" style={{
        background: `linear-gradient(135deg, ${TR.navy} 0%, ${TR.blue} 100%)`
      }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 bg-white" />
          <div className="relative z-10 px-7 pt-6 pb-5">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15"><UserIcon className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">Nuevo Candidato</h2>
                  <p className="text-white/50 text-xs mt-0.5">Registrar para evaluación psicométrica</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><XIcon className="w-4 h-4 text-white" /></button>
            </div>
            {/* Stepper */}
            <div className="flex items-center gap-0">
              {([{
              n: 1,
              label: 'Información Personal'
            }, {
              n: 2,
              label: 'Contacto y Puesto'
            }] as const).map((s, i) => <React.Fragment key={s.n}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{
                  background: step > s.n ? TR.green : step === s.n ? '#ffffff' : 'rgba(255,255,255,0.2)',
                  color: step > s.n ? '#fff' : step === s.n ? TR.blue : 'rgba(255,255,255,0.45)'
                }}>
                      {step > s.n ? <CheckIcon className="w-3.5 h-3.5" /> : s.n}
                    </div>
                    <span className="text-xs font-semibold hidden sm:block" style={{
                  color: step === s.n ? 'white' : 'rgba(255,255,255,0.4)'
                }}>{s.label}</span>
                  </div>
                  {i === 0 && <div className="flex-1 h-px mx-3" style={{
                background: step > 1 ? TR.green : 'rgba(255,255,255,0.2)'
              }} />}
                </React.Fragment>)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden'
      }}>
          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
            {step === 1 && <>
                <Field label="Nombre Completo *"><input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputBase} style={inputStyle} placeholder="Ej: María González Pérez" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Documento *"><input type="text" required value={form.document} onChange={(e) => set('document', e.target.value)} className={inputBase} style={inputStyle} placeholder="RFC o ID" /></Field>
                  <Field label="Edad *"><input type="number" required min="18" max="100" value={form.age} onChange={(e) => set('age', e.target.value)} className={inputBase} style={inputStyle} placeholder="30" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Género *">
                    <select required value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputBase} style={inputStyle}>
                      <option value="M">Masculino</option><option value="F">Femenino</option><option value="Other">Otro</option>
                    </select>
                  </Field>
                  <Field label="Escolaridad *">
                    <select required value={form.education} onChange={(e) => set('education', e.target.value)} className={inputBase} style={inputStyle}>
                      <option value="">Seleccionar...</option>
                      <option>Secundaria</option><option>Preparatoria</option><option>Técnico</option>
                      <option>Licenciatura</option><option>Maestría</option><option>Doctorado</option>
                    </select>
                  </Field>
                </div>
              </>}
            {step === 2 && <>
                <Field label="Email *">
                  <div className="relative">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                    <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={`${inputBase} pl-10`} style={inputStyle} placeholder="correo@ejemplo.com" />
                  </div>
                </Field>
                <Field label="Teléfono *">
                  <div className="relative">
                    <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                    <input type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} className={`${inputBase} pl-10`} style={inputStyle} placeholder="+52 55 1234 5678" />
                  </div>
                </Field>
                <Field label="Puesto Aplicado *">
                  <div className="relative">
                    <BriefcaseIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                    <select required value={form.position} onChange={(e) => set('position', e.target.value)} className={`${inputBase} pl-10`} style={inputStyle} disabled={loadingPositions}>
                      <option value="">
                        {loadingPositions ? 'Cargando puestos...' : 'Seleccionar puesto...'}
                      </option>
                      {positions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      {!loadingPositions && positions.length === 0 && <option disabled>No hay puestos activos. Crea uno en Puestos.</option>}
                    </select>
                  </div>
                </Field>
                <div className="p-4 rounded-2xl" style={{
              background: `${TR.blue}06`,
              border: `1px solid ${TR.blue}12`
            }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Resumen</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{
                  background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
                }}>
                      {form.name.substring(0, 2).toUpperCase() || 'NC'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{form.name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-400">{form.education || '—'} · {form.age ? `${form.age} años` : '—'}</p>
                    </div>
                  </div>
                </div>
              </>}
          </div>
          <div className="flex-shrink-0 px-7 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
            {step === 1 ? <>
                <button type="button" onClick={handleClose} className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
                <button type="button" onClick={() => setStep(2)} disabled={!step1Valid} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-40" style={{
              background: step1Valid ? `linear-gradient(135deg, ${TR.blue}, ${TR.navy})` : '#94a3b8'
            }}>
                  Siguiente <ChevronRightIcon className="w-4 h-4" />
                </button>
              </> : <>
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100">
                  <ChevronLeftIcon className="w-4 h-4" /> Atrás
                </button>
                <button type="submit" disabled={isSubmitting || !step2Valid} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-50" style={{
              background: step2Valid ? `linear-gradient(135deg, ${TR.green}, ${TR.greenDark})` : '#94a3b8',
              boxShadow: step2Valid ? `0 4px 12px ${TR.green}40` : 'none'
            }}>
                  {isSubmitting ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckIcon className="w-4 h-4" /> Crear Candidato</>}
                </button>
              </>}
          </div>
        </form>
      </div>
    </div>;
}