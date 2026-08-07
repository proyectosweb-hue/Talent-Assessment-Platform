import React from 'react';
import { CandidateStatus, ScoreLevel } from '../types';
import { getScoreLevelLabel, getScoreColor } from '../utils/scoring';
interface StatusBadgeProps {
  status?: CandidateStatus | string;
  scoreLevel?: ScoreLevel;
}
export function StatusBadge({
  status,
  scoreLevel
}: StatusBadgeProps) {
  if (scoreLevel) {
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreColor(scoreLevel)}`}>
        {getScoreLevelLabel(scoreLevel)}
      </span>;
  }
  if (!status) return null;
  const statusConfig: Record<string, {
    label: string;
    className: string;
  }> = {
    // Minúsculas (valores del sistema)
    pending: {
      label: 'Pendiente',
      className: 'bg-gray-100 text-gray-700'
    },
    in_progress: {
      label: 'En Proceso',
      className: 'bg-blue-100 text-blue-700'
    },
    completed: {
      label: 'Completado',
      className: 'bg-green-100 text-green-700'
    },
    rejected: {
      label: 'Rechazado',
      className: 'bg-red-100 text-red-700'
    },
    hired: {
      label: 'Contratado',
      className: 'bg-emerald-100 text-emerald-700'
    },
    active: {
      label: 'Activo',
      className: 'bg-green-100 text-green-700'
    },
    inactive: {
      label: 'Inactivo',
      className: 'bg-gray-100 text-gray-700'
    },
    // Mayúsculas (valores de Supabase DB)
    Qualified: {
      label: 'Calificado',
      className: 'bg-emerald-100 text-emerald-700'
    },
    'In Progress': {
      label: 'En Proceso',
      className: 'bg-blue-100 text-blue-700'
    },
    Rejected: {
      label: 'Rechazado',
      className: 'bg-red-100 text-red-700'
    },
    Hired: {
      label: 'Contratado',
      className: 'bg-emerald-100 text-emerald-700'
    },
    Open: {
      label: 'Abierto',
      className: 'bg-green-100 text-green-700'
    },
    Closed: {
      label: 'Cerrado',
      className: 'bg-red-100 text-red-700'
    },
    Draft: {
      label: 'Borrador',
      className: 'bg-gray-100 text-gray-700'
    }
  };
  const config = statusConfig[status];
  if (!config) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        {String(status)}
      </span>;
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>;
}