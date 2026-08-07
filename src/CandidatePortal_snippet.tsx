// ─────────────────────────────────────────────────────────────────────────────
// FRAGMENTO: reemplaza CandidateTestsView y CandidatePortal en App.tsx
// Diseño moderno con hero, cards con gradientes y animaciones
// ─────────────────────────────────────────────────────────────────────────────

const TR_C = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};

// ── Vista de pruebas ──────────────────────────────────────────────────────────
function CandidateTestsView({
  candidateRecordId,
  onStartTest,
  userName = ''




}: {candidateRecordId: string | null;onStartTest: (testId: string, candidateId: string) => void;userName?: string;}) {
  const [tests, setTests] = useState<any[]>([]);
  const [completedTestIds, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, [candidateRecordId]);
  const loadData = async () => {
    try {
      setLoading(true);
      const {
        data: testsData
      } = await supabase.from('tests').select('*').or('archived.eq.false,archived.is.null');
      setTests(testsData || []);
      if (candidateRecordId) {
        const {
          data: results
        } = await supabase.from('results').select('test_id').eq('user_name', String(candidateRecordId));
        if (results) setCompleted(new Set(results.map((r: any) => String(r.test_id))));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-medium">Cargando pruebas...</p>
    </div>;
  const completed = completedTestIds.size;
  const total = tests.length;
  const pct = total > 0 ? Math.round(completed / total * 100) : 0;
  return <div>
      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
      background: `linear-gradient(135deg, ${TR_C.navy} 0%, ${TR_C.blue} 60%, #3a55b5 100%)`
    }}>

        {/* Decoraciones de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{
          background: TR_C.green
        }} />
          <div className="absolute top-10 right-40 w-32 h-32 rounded-full opacity-5" style={{
          background: 'white'
        }} />
          <div className="absolute -bottom-10 left-1/3 w-48 h-48 rounded-full opacity-5" style={{
          background: TR_C.green
        }} />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{
              color: `${TR_C.green}`
            }}>
                ● Portal de Evaluación Psicométrica
              </p>
              <h1 className="text-3xl font-black text-white mb-1">
                {userName ? `Hola, ${userName.split(' ')[0]}` : 'Mis Evaluaciones'}
              </h1>
              <p className="text-white/50 text-sm">
                {completed === total && total > 0 ? '¡Has completado todas tus evaluaciones!' : `Tienes ${total - completed} evaluación${total - completed !== 1 ? 'es' : ''} pendiente${total - completed !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Progress ring */}
            {total > 0 && <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/15">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke={TR_C.green} strokeWidth="6" strokeDasharray={`${pct / 100 * 163} 163`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-black text-sm">{pct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-black text-2xl">{completed}<span className="text-white/40 font-normal text-base">/{total}</span></p>
                  <p className="text-white/50 text-xs">Completadas</p>
                </div>
              </div>}
          </div>

          {/* Barra de progreso */}
          {total > 0 && <div className="mt-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/40 text-xs">Progreso general</span>
                <span className="text-white/60 text-xs font-bold">{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${TR_C.green}, ${TR_C.greenDark})`
            }} />
              </div>
            </div>}
        </div>
      </div>

      {/* ── LISTA DE PRUEBAS ─────────────────────────────────────── */}
      <div className="p-6 space-y-4">
        {tests.length === 0 ? <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
          background: `${TR_C.blue}10`
        }}>
              <svg className="w-8 h-8" style={{
            color: TR_C.blue
          }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-semibold text-gray-500">No hay pruebas asignadas</p>
            <p className="text-sm text-gray-400 mt-1">Contacta al evaluador para más información.</p>
          </div> : tests.map((test, index) => {
        const isCompleted = completedTestIds.has(String(test.id));
        return <div key={test.id} className="relative overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5" style={{
          background: isCompleted ? '#ffffff' : '#ffffff',
          border: `1px solid ${isCompleted ? `${TR_C.green}30` : '#e5e7eb'}`
        }}>

              {/* Gradiente de fondo sutil */}
              <div className="absolute inset-0 pointer-events-none" style={{
            background: isCompleted ? `linear-gradient(135deg, ${TR_C.green}06 0%, transparent 60%)` : `linear-gradient(135deg, ${TR_C.blue}06 0%, transparent 60%)`
          }} />

              <div className="relative z-10 p-6 flex items-center gap-5">

                {/* Número / check */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{
              background: isCompleted ? `linear-gradient(135deg, ${TR_C.green}, ${TR_C.greenDark})` : `linear-gradient(135deg, ${TR_C.blue}, ${TR_C.navy})`
            }}>
                  {isCompleted ? <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg> : <span className="text-white font-black text-xl">{index + 1}</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900 text-base leading-tight">
                      {String(test.name || '')}
                    </h3>
                    {isCompleted && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0" style={{
                  background: `${TR_C.green}15`,
                  color: TR_C.greenDark
                }}>
                        ✓ Completada
                      </span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 leading-snug">
                    {String(test.description || 'Evaluación psicométrica laboral')}
                  </p>
                  <div className="flex items-center gap-4 mt-2.5">
                    {test.format && <span className="flex items-center gap-1.5 text-xs font-medium" style={{
                  color: isCompleted ? TR_C.greenDark : TR_C.blue
                }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {String(test.format)}
                      </span>}
                    {test.duration && <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" strokeLinecap="round" />
                        </svg>
                        {test.duration} min
                      </span>}
                  </div>
                </div>

                {/* Botón */}
                <div className="flex-shrink-0">
                  {isCompleted ? <div className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold cursor-default" style={{
                background: `${TR_C.green}12`,
                color: TR_C.green
              }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Completada
                    </div> : <button onClick={() => {
                if (candidateRecordId) onStartTest(String(test.id), candidateRecordId);
              }} disabled={!candidateRecordId} className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg" style={{
                background: `linear-gradient(135deg, ${TR_C.blue}, ${TR_C.navy})`,
                boxShadow: `0 6px 20px ${TR_C.blue}35`
              }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Iniciar
                    </button>}
                </div>
              </div>
            </div>;
      })}
      </div>
    </div>;
}

// ── Portal principal ──────────────────────────────────────────────────────────
function CandidatePortal({
  onLogout,
  candidateRecordId,
  permissions




}: {onLogout: () => void;candidateRecordId: string | null;permissions: ModulePermission[];}) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [currentPage, setCurrentPage] = useState<string>('');
  const [testId, setTestId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const {
    logoUrl,
    companyName
  } = useAppSettings();
  const allowedModules = permissions.filter((p) => p.level !== 'none');
  useEffect(() => {
    if (allowedModules.length > 0 && !currentPage) setCurrentPage(allowedModules[0].module);
  }, [allowedModules]);
  const handleStartTest = (testId: string, candidateId: string) => {
    setTestId(testId);
    setCandidateId(candidateId);
    setCurrentPage('test-application');
  };
  if (currentPage === 'test-application' && testId && candidateId) return <TestApplication testId={testId} candidateId={candidateId} />;
  const moduleLabels: Record<string, string> = {
    tests: 'Mis Pruebas',
    results: 'Mis Resultados'
  };
  const userInitials = String(user.name || 'C').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return <div className="min-h-screen" style={{
    background: '#f1f5f9'
  }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10" style={{
      boxShadow: '0 1px 12px rgba(0,0,0,0.06)'
    }}>
        <div className="px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain" /> : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{
            background: `linear-gradient(135deg, ${TR_C.navy}, ${TR_C.blue})`
          }}>TR</div>}
            <div className="border-l border-gray-200 pl-3">
              <p className="text-sm font-black leading-tight" style={{
              color: TR_C.navy
            }}>{companyName}</p>
              <p className="text-xs font-semibold" style={{
              color: TR_C.green
            }}>Portal del Candidato</p>
            </div>
          </div>

          {allowedModules.length > 1 && <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {allowedModules.map((mod) => <button key={mod.module} onClick={() => setCurrentPage(mod.module)} className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all" style={{
            background: currentPage === mod.module ? '#ffffff' : 'transparent',
            color: currentPage === mod.module ? TR_C.blue : '#9ca3af',
            fontWeight: currentPage === mod.module ? '700' : '500',
            boxShadow: currentPage === mod.module ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
          }}>
                  {moduleLabels[mod.module] || mod.label}
                </button>)}
            </nav>}

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{
            background: `linear-gradient(135deg, ${TR_C.blue}, ${TR_C.navy})`
          }}>
              {userInitials}
            </div>
            <button onClick={onLogout} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto w-full">
        {allowedModules.length === 0 ? <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <p className="font-semibold text-gray-500">Sin módulos asignados</p>
          </div> : <>
            {currentPage === 'tests' && <CandidateTestsView candidateRecordId={candidateRecordId} onStartTest={handleStartTest} userName={user.name || ''} />}
            {currentPage === 'results' && <Results candidateId={candidateRecordId ?? undefined} />}
          </>}
      </main>
    </div>;
}