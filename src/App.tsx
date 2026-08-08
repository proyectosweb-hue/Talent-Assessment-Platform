import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { CandidateFormModal } from './components/CandidateFormModal';
import { Dashboard } from './pages/Dashboard';
import { Candidates } from './pages/Candidates';
import { CandidateDetail } from './pages/CandidateDetail';
import { Positions } from './pages/Positions';
import { Tests } from './pages/Tests';
import { Results } from './pages/Results';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Audit } from './pages/Audit';
import { LiveMonitor } from './pages/LiveMonitor';
import { TestApplication } from './pages/TestApplication';
import { Candidate } from './types';
import { Login } from './login';
import { supabase } from './supabase';
import { logAudit } from './utils/useAudit';
import { initTheme, watchSystemTheme } from './utils/useTheme';
import { ClipboardListIcon, PlayIcon, BarChart3Icon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';

// Inicializar tema al arrancar (antes del primer render)
initTheme();
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
export type PermissionLevel = 'full' | 'readonly' | 'none';
export interface ModulePermission {
  module: string;
  label: string;
  level: PermissionLevel;
}
export interface PermissionsMap {
  [module: string]: PermissionLevel;
}

// ── Hook configuración empresa ────────────────────────────────────
function useAppSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('EVAL-PRO');
  useEffect(() => {
    supabase.from('app_settings').select('logo_url, company_name').eq('id', SETTINGS_ID).single().then(({
      data
    }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
      if (data?.company_name) setCompanyName(data.company_name);
    });
  }, []);
  return {
    logoUrl,
    companyName
  };
}

// ── Vista de pruebas del candidato ────────────────────────────────
function CandidateTestsView({
  candidateRecordId,
  onStartTest



}: {candidateRecordId: string | null;onStartTest: (testId: string, candidateId: string) => void;}) {
  const [tests, setTests] = useState<any[]>([]);
  const [completedTestIds, setCompletedTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (candidateRecordId === null) return;
    const load = async () => {
      try {
        // Buscar grupos asignados a este candidato
        const {
          data: groupCandidates
        } = await supabase.from('test_group_candidates').select('group_id').eq('candidate_id', String(candidateRecordId));
        if (groupCandidates && groupCandidates.length > 0) {
          // Tiene grupos → solo mostrar pruebas de esos grupos
          const groupIds = groupCandidates.map((r: any) => r.group_id);
          const {
            data: groupTests
          } = await supabase.from('test_group_tests').select('test_id').in('group_id', groupIds);
          console.log('[Portal] groupTests raw:', groupTests);
          if (groupTests && groupTests.length > 0) {
            // Cargar TODAS las pruebas activas y filtrar en el cliente
            // para evitar problemas de tipo numérico vs string en el .in()
            const {
              data: allTests
            } = await supabase.from('tests').select('*').or('archived.eq.false,archived.is.null');
            const allowedTestIds = groupTests.map((r: any) => String(r.test_id));
            console.log('[Portal] allowedTestIds:', allowedTestIds);
            console.log('[Portal] allTests ids:', (allTests || []).map((t: any) => String(t.id)));
            const filtered = (allTests || []).filter((t: any) => allowedTestIds.includes(String(t.id)));
            console.log('[Portal] filtered tests:', filtered.length);
            setTests(filtered);
          } else {
            setTests([]);
          }
        } else {
          // Sin grupos → mostrar todas
          const {
            data: testsData
          } = await supabase.from('tests').select('*').or('archived.eq.false,archived.is.null');
          setTests(testsData || []);
        }

        // Resultados ya completados
        const {
          data: results
        } = await supabase.from('results').select('test_id').eq('user_name', candidateRecordId);
        setCompletedTestIds(new Set((results || []).map((r: any) => String(r.test_id))));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [candidateRecordId]);
  const completed = tests.filter((t) => completedTestIds.has(String(t.id))).length;
  const pending = tests.length - completed;
  const progress = tests.length > 0 ? Math.round(completed / tests.length * 100) : 0;
  if (loading || candidateRecordId === null) return <div className="flex flex-col items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-medium">Cargando tus pruebas...</p>
    </div>;
  return <div className="space-y-8">

      {/* Hero banner */}
      <div className="rounded-3xl overflow-hidden shadow-lg" style={{
      background: 'linear-gradient(135deg, #1a2d6b 0%, #2D4494 60%, #3a55b5 100%)'
    }}>
        <div className="px-8 py-8 relative">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10 bg-white" />
          <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full opacity-5 bg-white" />
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Portal de Evaluación</p>
            <h1 className="text-3xl font-black text-white mb-1">Mis Pruebas</h1>
            <p className="text-white/50 text-sm">
              {pending > 0 ? `Tienes ${pending} prueba${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''}` : '¡Has completado todas las pruebas!'}
            </p>
            {tests.length > 0 && <div className="mt-5 flex items-center gap-4">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7DB928, #5e8c1e)'
              }} />
                </div>
                <span className="text-white font-black text-sm flex-shrink-0">{completed}/{tests.length}</span>
              </div>}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10">
                <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                <span className="text-white text-xs font-bold">{completed} completadas</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10">
                <ClipboardListIcon className="w-4 h-4 text-blue-300" />
                <span className="text-white text-xs font-bold">{pending} pendientes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      {tests.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
        background: '#2D449412'
      }}>
            <ClipboardListIcon className="w-8 h-8" style={{
          color: '#2D4494'
        }} />
          </div>
          <p className="text-gray-500 font-semibold">No tienes pruebas asignadas</p>
          <p className="text-sm text-gray-400 mt-1">Contacta al equipo de Recursos Humanos</p>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tests.map((test) => {
        const done = completedTestIds.has(String(test.id));
        return <div key={test.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-md" style={{
          borderColor: done ? '#7DB92830' : '#e5e7eb'
        }}>
                <div className="flex">
                  {/* Franja lateral */}
                  <div className="w-1.5 flex-shrink-0" style={{
              background: done ? 'linear-gradient(180deg, #7DB928, #5e8c1e)' : 'linear-gradient(180deg, #2D4494, #1a2d6b)'
            }} />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        {done && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1" style={{
                    background: '#7DB92815',
                    color: '#5e8c1e'
                  }}>
                            <CheckCircle2Icon className="w-3 h-3" /> Completada
                          </span>}
                        <h3 className="font-black text-gray-900 leading-tight">{String(test.name || '')}</h3>
                        {test.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{String(test.description)}</p>}
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: done ? '#7DB92812' : '#2D449412'
                }}>
                        {done ? <CheckCircle2Icon className="w-6 h-6" style={{
                    color: '#7DB928'
                  }} /> : <ClipboardListIcon className="w-6 h-6" style={{
                    color: '#2D4494'
                  }} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4 pt-3 border-t border-gray-50">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <BarChart3Icon className="w-3.5 h-3.5" />{String(test.format || 'Selección múltiple')}
                      </span>
                      {test.duration && <span className="text-xs text-gray-400 font-medium">· ⏱ {test.duration} min</span>}
                    </div>
                    {done ? <div className="w-full py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2" style={{
                background: '#7DB92810',
                color: '#5e8c1e',
                border: '1px solid #7DB92830'
              }}>
                        <CheckCircle2Icon className="w-4 h-4" /> Prueba Completada
                      </div> : <button onClick={() => {
                if (!candidateRecordId) return;
                onStartTest(test.id, candidateRecordId);
              }} className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-95" style={{
                background: 'linear-gradient(135deg, #2D4494, #1a2d6b)',
                boxShadow: '0 4px 14px rgba(45,68,148,0.3)'
              }}>
                        <PlayIcon className="w-4 h-4" /> Iniciar Prueba
                      </button>}
                  </div>
                </div>
              </div>;
      })}
        </div>}
    </div>;
}

// ── Portal candidato ──────────────────────────────────────────────
function CandidatePortal({
  onLogout,
  candidateRecordId,
  permissions




}: {onLogout: () => void;candidateRecordId: string | null;permissions: ModulePermission[];}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
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
  const initials = String(user.name || 'C').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return <div className="min-h-screen" style={{
    background: '#f1f5f9'
  }}>

      {/* Header moderno */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain" /> : <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #1a2d6b, #2D4494)'
          }}>
                  <ClipboardListIcon className="w-5 h-5 text-white" />
                </div>}
            <div className="hidden sm:block">
              <p className="text-sm font-black text-gray-900 leading-tight">{companyName}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Portal de pruebas psicométricas</p>
            </div>
          </div>

          {/* Nav */}
          {allowedModules.length > 1 && <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {allowedModules.map((mod) => <button key={mod.module} onClick={() => setCurrentPage(mod.module)} className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all" style={{
            background: currentPage === mod.module ? 'white' : 'transparent',
            color: currentPage === mod.module ? '#2D4494' : '#6b7280',
            boxShadow: currentPage === mod.module ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
          }}>
                  {moduleLabels[mod.module] || mod.label}
                </button>)}
            </nav>}

          {/* Usuario */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
              <p className="text-[11px] text-gray-400">{user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{
            background: 'linear-gradient(135deg, #2D4494, #7DB928)'
          }}>
              {initials}
            </div>
            <button onClick={onLogout} className="px-3 py-1.5 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {allowedModules.length === 0 ? <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <AlertCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-semibold">Sin módulos asignados</p>
            <p className="text-sm text-gray-400 mt-1">Contacta al administrador</p>
          </div> : <>
            {currentPage === 'tests' && <CandidateTestsView candidateRecordId={candidateRecordId} onStartTest={handleStartTest} />}
            {currentPage === 'results' && <Results candidateId={candidateRecordId ?? undefined} />}
          </>}
      </main>
    </div>;
}

// ── App principal ─────────────────────────────────────────────────
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userRole, setUserRole] = useState<string>('');
  const [candidateRecordId, setCandidateRecordId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<ModulePermission[]>([]);
  const [permissionsMap, setPermissionsMap] = useState<PermissionsMap>({});
  useEffect(() => {
    // Escuchar cambios del sistema para modo Automático
    const unwatch = watchSystemTheme();
    return unwatch;
  }, []);
  const SESSION_DURATION = 8 * 60 * 60 * 1000;
  const resolveCandidateRecord = async (email: string) => {
    try {
      const {
        data
      } = await supabase.from('candidates').select('id').eq('email', email).single();
      setCandidateRecordId(data?.id ? String(data.id) : null);
    } catch {
      setCandidateRecordId(null);
    }
  };
  const loadRolePermissions = async (roleName: string) => {
    try {
      const {
        data
      } = await supabase.from('roles').select('permissions').eq('name', roleName).single();
      if (data?.permissions) {
        const perms: ModulePermission[] = data.permissions;
        setRolePermissions(perms);
        const map: PermissionsMap = {};
        perms.forEach((p) => {
          map[p.module] = p.level;
        });
        setPermissionsMap(map);
      }
    } catch {
      setRolePermissions([]);
      setPermissionsMap({});
    }
  };
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - (parsed.loginAt || 0) > SESSION_DURATION) {
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }
        const role = String(parsed.role || '');
        setUserRole(role.toLowerCase());
        setIsAuthenticated(true);
        if (role.toLowerCase() === 'candidato' && parsed.email) resolveCandidateRecord(parsed.email);
        if (role) loadRolePermissions(role);
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);
  const handleCandidateAdded = useCallback(() => {
    setShowCandidateModal(false);
    setRefreshKey((p) => p + 1);
  }, []);
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const stored = localStorage.getItem('user');
      if (!stored) {
        handleLogout();
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - (parsed.loginAt || 0) > SESSION_DURATION) handleLogout();
      } catch {
        handleLogout();
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  const handleLoginSuccess = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const role = String(parsed.role || '');
        setUserRole(role.toLowerCase());
        if (role.toLowerCase() === 'candidato' && parsed.email) resolveCandidateRecord(parsed.email);
        if (role) loadRolePermissions(role);
      } catch {}
    }
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };
  const handleLogout = async () => {
    await logAudit({
      action: 'LOGOUT',
      module: 'session',
      description: 'Cierre de sesión'
    });
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserRole('');
    setCandidateRecordId(null);
    setRolePermissions([]);
    setPermissionsMap({});
    setCurrentPage('dashboard');
  };
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>;
  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (userRole === 'candidato') return <CandidatePortal onLogout={handleLogout} candidateRecordId={candidateRecordId} permissions={rolePermissions} />;
  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCurrentPage('candidate-detail');
  };
  const handleApplyTest = (testId: string, candidateId: string) => {
    setTestId(testId);
    setCandidateId(candidateId);
    setCurrentPage('test-application');
  };
  const getPerm = (module: string): PermissionLevel => permissionsMap[module] ?? 'full';
  const renderPage = () => {
    if (currentPage === 'test-application') return <TestApplication testId={testId} candidateId={candidateId} />;
    if (currentPage === 'candidate-detail' && selectedCandidate) return <CandidateDetail candidate={selectedCandidate} onBack={() => {
      setSelectedCandidate(null);
      setCurrentPage('candidates');
    }} onAddNew={() => setShowCandidateModal(true)} />;
    return <Layout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} permissionsMap={permissionsMap}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'candidates' && <Candidates key={refreshKey} onViewCandidate={handleViewCandidate} onAddNewCandidate={() => setShowCandidateModal(true)} permission={getPerm('candidates')} />}
        {currentPage === 'positions' && <Positions permission={getPerm('positions')} />}
        {currentPage === 'tests' && <Tests onApplyTest={handleApplyTest} permission={getPerm('tests')} />}
        {currentPage === 'results' && <Results permission={getPerm('results')} />}
        {currentPage === 'reports' && <Reports permission={getPerm('reports')} />}
        {currentPage === 'settings' && <Settings permissionsMap={permissionsMap} />}
        {currentPage === 'monitor' && <LiveMonitor />}
        {currentPage === 'audit' && <Audit />}
      </Layout>;
  };
  return <>
      {renderPage()}
      <CandidateFormModal isOpen={showCandidateModal} onClose={() => setShowCandidateModal(false)} onSuccess={handleCandidateAdded} />
    </>;
}
export function App() {
  return <ToastProvider><AppContent /></ToastProvider>;
}