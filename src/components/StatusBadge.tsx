import React from 'react';
import { CandidateStatus, ScoreLevel } from '../types';
import { getScoreLevelLabel, getScoreColor } from '../utils/scoring';
interface StatusBadgeProps {
  status?: CandidateStatus;
  scoreLevel?: ScoreLevel;
}
export function StatusBadge({ status, scoreLevel }: StatusBadgeProps) {
  if (scoreLevel) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreColor(scoreLevel)}`}>
        
        {getScoreLevelLabel(scoreLevel)}
      </span>);

  }
  const statusConfig: Record<
    CandidateStatus,
    {
      label: string;
      className: string;
    }> =
  {
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
    }
  };
  if (!status) return null;
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      
      {config.label}
    </span>);

}