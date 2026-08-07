import React, { useCallback, useEffect, useState, createElement } from 'react';
import {
  ShieldCheckIcon,
  SearchIcon,
  XCircleIcon,
  FilterIcon,
  Loader2Icon,
  DownloadIcon,
  RefreshCwIcon,
  LogInIcon,
  LogOutIcon,
  PlusCircleIcon,
  EditIcon,
  ArchiveIcon,
  TrashIcon,
  PlayIcon,
  CheckCircle2Icon,
  UserCheckIcon,
  FileTextIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  AlertCircleIcon } from
'lucide-react';
import { supabase } from '../supabase';
import { Pagination } from '../components/Pagination';
import { useRealtime } from '../utils/useRealtime';
const TR = {
  blue: '#2D4494',
  navy: '#1a2d6b',
  green: '#7DB928',
  greenDark: '#5e8c1e'
};
const PAGE_SIZE = 15;
const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }> =
{
  LOGIN: {
    label: 'Inicio de sesión',
    icon: LogInIcon,
    color: TR.blue,
    bg: `${TR.blue}12`
  },
  LOGOUT: {
    label: 'Cierre de sesión',
    icon: LogOutIcon,
    color: '#64748b',
    bg: '#f1f5f9'
  },
  CREATE: {
    label: 'Creación',
    icon: PlusCircleIcon,
    color: TR.green,
    bg: `${TR.green}12`
  },
  UPDATE: {
    label: 'Edición',
    icon: EditIcon,
    color: '#d97706',
    bg: '#fffbeb'
  },
  DELETE: {
    label: 'Eliminación',
    icon: TrashIcon,
    color: '#dc2626',
    bg: '#fef2f2'
  },
  ARCHIVE: {
    label: 'Archivado',
    icon: ArchiveIcon,
    color: '#b45309',
    bg: '#fffbeb'
  },
  UNARCHIVE: {
    label: 'Desarchivado',
    icon: ArchiveIcon,
    color: TR.green,
    bg: `${TR.green}12`
  },
  TEST_START: {
    label: 'Prueba iniciada',
    icon: PlayIcon,
    color: '#7c3aed',
    bg: '#f5f3ff'
  },
  TEST_COMPLETE: {
    label: 'Prueba completada',
    icon: CheckCircle2Icon,
    color: TR.green,
    bg: `${TR.green}12`
  },
  HIRE: {
    label: 'Contratación',
    icon: UserCheckIcon,
    color: TR.navy,
    bg: `${TR.navy}12`
  },
  EXPORT: {
    label: 'Exportación',
    icon: FileTextIcon,
    color: '#0891b2',
    bg: '#ecfeff'
  },
  BACKUP: {
    label: 'Respaldo',
    icon: DatabaseIcon,
    color: '#059669',
    bg: '#ecfdf5'
  }
};
const MODULE_LABELS: Record<string, string> = {
  session: 'Sesión',
  candidates: 'Candidatos',
  positions: 'Puestos',
  tests: 'Pruebas',
  results: 'Resultados',
  reports: 'Reportes',
  users: 'Usuarios',
  roles: 'Roles',
  settings: 'Configuración'
};
interface AuditLog {
  id: number;
  created_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  module: string;
  description: string;
  entity_id: string | null;
  entity_name: string | null;
  metadata: any;
}
function AuditRow({ log }: {log: AuditLog;}) {
  const cfg = ACTION_CONFIG[log.action] || {
    label: log.action,
    icon: AlertTriangleIcon,
    color: '#64748b',
    bg: '#f1f5f9'
  };
  const Icon = cfg.icon;
  const date = new Date(log.created_at);
  return (
    <div className="grid grid-cols-12 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors border-b border-gray-50 last:border-0">
      {/* Acción */}
      <div className="col-span-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: cfg.bg
          }}>
          
          <Icon
            className="w-4 h-4"
            style={{
              color: cfg.color
            }} />
          
        </div>
        <div>
          <span
            className="text-xs font-bold"
            style={{
              color: cfg.color
            }}>
            
            {cfg.label}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">
            {MODULE_LABELS[log.module] || log.module}
          </p>
        </div>
      </div>
      {/* Descripción */}
      <div className="col-span-4">
        <p className="text-sm text-gray-700 font-medium leading-snug">
          {log.description}
        </p>
        {log.entity_name &&
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
            {log.entity_name}
          </p>
        }
      </div>
      {/* Usuario */}
      <div className="col-span-3 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${TR.blue}, ${TR.navy})`
          }}>
          
          {String(log.user_name || 'S').
          substring(0, 2).
          toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {log.user_name}
          </p>
          <p className="text-xs text-gray-400 truncate">{log.user_role}</p>
        </div>
      </div>
      {/* Fecha */}
      <div className="col-span-2 text-right">
        <p className="text-xs font-medium text-gray-600">
          {date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </p>
        <p className="text-xs text-gray-400 font-mono">
          {date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
    </div>);

}
export function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setTableError(null);
      const { data, error } = await supabase.
      from('audit_logs').
      select('*').
      order('created_at', {
        ascending: false
      }).
      limit(500);
      if (error) {
        // Detectar si la tabla no existe
        if (
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation'))
        {
          setTableError(
            'La tabla audit_logs no existe en Supabase. Ejecuta el SQL de creación primero.'
          );
        } else {
          setTableError(`Error al cargar: ${error.message}`);
        }
        setLogs([]);
        return;
      }
      setLogs(data || []);
    } catch (err: any) {
      setTableError(`Error de conexión: ${err?.message || 'desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchLogs();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAction, filterModule]);
  // ── Tiempo real: nuevos registros de auditoría aparecen al instante ──
  useRealtime({
    table: 'audit_logs',
    onChange: fetchLogs
  });
  const filtered = logs.filter((log) => {
    const matchSearch =
    !searchTerm.trim() ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.entity_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchModule = filterModule === 'all' || log.module === filterModule;
    return matchSearch && matchAction && matchModule;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const today = new Date().toDateString();
  const todayCount = logs.filter(
    (l) => new Date(l.created_at).toDateString() === today
  ).length;
  const loginCount = logs.filter((l) => l.action === 'LOGIN').length;
  const criticalCount = logs.filter((l) =>
  ['DELETE', 'HIRE', 'TEST_COMPLETE'].includes(l.action)
  ).length;
  const handleExport = () => {
    const headers = [
    'ID',
    'Fecha',
    'Usuario',
    'Email',
    'Rol',
    'Acción',
    'Módulo',
    'Descripción',
    'Entidad'];

    const rows = filtered.map((l) => [
    l.id,
    new Date(l.created_at).toLocaleString('es-MX'),
    l.user_name,
    l.user_email,
    l.user_role,
    l.action,
    l.module,
    `"${l.description}"`,
    l.entity_name || '']
    );
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{
              color: TR.navy
            }}>
            
            Auditoría del Sistema
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Registro completo de todas las acciones realizadas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
            
            <RefreshCwIcon className="w-4 h-4" /> Actualizar
          </button>
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm disabled:opacity-50">
            
            <DownloadIcon className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Error de tabla */}
      {tableError &&
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50">
          <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800 text-sm">{tableError}</p>
            {tableError.includes('no existe') &&
          <div className="mt-2">
                <p className="text-xs text-red-600 mb-2">
                  Ejecuta este SQL en Supabase → SQL Editor:
                </p>
                <pre className="text-xs bg-red-100 rounded-lg p-3 overflow-x-auto text-red-800 font-mono">{`CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  user_name     TEXT NOT NULL,
  user_email    TEXT NOT NULL,
  user_role     TEXT,
  action        TEXT NOT NULL,
  module        TEXT NOT NULL,
  description   TEXT NOT NULL,
  entity_id     TEXT,
  entity_name   TEXT,
  metadata      JSONB DEFAULT '{}'
);
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;`}</pre>
              </div>
          }
          </div>
        </div>
      }

      {/* Stats */}
      {!tableError &&
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
        {
          label: 'Total Registros',
          value: logs.length,
          icon: ShieldCheckIcon,
          color: TR.blue
        },
        {
          label: 'Hoy',
          value: todayCount,
          icon: FilterIcon,
          color: TR.navy
        },
        {
          label: 'Inicios de sesión',
          value: loginCount,
          icon: LogInIcon,
          color: TR.green
        },
        {
          label: 'Acciones críticas',
          value: criticalCount,
          icon: AlertTriangleIcon,
          color: '#dc2626'
        }].
        map((s) =>
        <div
          key={s.label}
          className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          
              <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${s.color}12`
            }}>
            
                <s.icon
              className="w-5 h-5"
              style={{
                color: s.color
              }} />
            
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p
              className="text-xl font-black"
              style={{
                color: TR.navy
              }}>
              
                  {s.value}
                </p>
              </div>
            </div>
        )}
        </div>
      }

      {/* Filtros */}
      {!tableError &&
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
            type="text"
            placeholder="Buscar por descripción, usuario, entidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:bg-white" />
          
            {searchTerm &&
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            
                <XCircleIcon className="w-4 h-4" />
              </button>
          }
          </div>
          <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="py-2 px-3 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 min-w-[160px]">
          
            <option value="all">Todas las acciones</option>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) =>
          <option key={key} value={key}>
                {cfg.label}
              </option>
          )}
          </select>
          <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="py-2 px-3 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 min-w-[140px]">
          
            <option value="all">Todos los módulos</option>
            {Object.entries(MODULE_LABELS).map(([key, label]) =>
          <option key={key} value={key}>
                {label}
              </option>
          )}
          </select>
        </div>
      }

      {/* Tabla */}
      {!tableError &&
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
          className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100"
          style={{
            background: '#fafafa'
          }}>
          
            <div className="col-span-3">Acción</div>
            <div className="col-span-4">Descripción</div>
            <div className="col-span-3">Usuario</div>
            <div className="col-span-2 text-right">Fecha y Hora</div>
          </div>

          {loading ?
        <div className="flex flex-col items-center justify-center py-20">
              <Loader2Icon
            className="w-8 h-8 animate-spin mb-2"
            style={{
              color: TR.blue
            }} />
          
              <p className="text-gray-400 text-sm">Cargando registros...</p>
            </div> :
        paginated.length === 0 ?
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <ShieldCheckIcon className="w-12 h-12 mb-3" />
              <p className="text-gray-400 font-medium">
                {searchTerm || filterAction !== 'all' || filterModule !== 'all' ?
            'Sin resultados para los filtros aplicados' :
            'Sin registros de auditoría aún'}
              </p>
              {!searchTerm &&
          filterAction === 'all' &&
          filterModule === 'all' &&
          <p className="text-sm text-gray-300 mt-1">
                    Las acciones aparecerán aquí automáticamente
                  </p>
          }
            </div> :

        paginated.map((log) => <AuditRow key={log.id} log={log} />)
        }

          <div className="border-t border-gray-100 px-6">
            <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setCurrentPage} />
          
          </div>
        </div>
      }
    </div>);

}