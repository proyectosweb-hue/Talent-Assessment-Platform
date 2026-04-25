import { ScoreLevel, CompatibilityLevel } from '../types';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 25) return 'low';
  return 'very_low';
}

export function getCompatibilityLevel(score: number): CompatibilityLevel {
  if (score >= 80) return 'highly_recommended';
  if (score >= 65) return 'recommended';
  if (score >= 50) return 'recommended_with_reserves';
  return 'not_recommended';
}

export function getScoreLevelLabel(level: ScoreLevel): string {
  const labels: Record<ScoreLevel, string> = {
    very_low: 'Muy Bajo',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    very_high: 'Muy Alto'
  };
  return labels[level];
}

export function getCompatibilityLabel(level: CompatibilityLevel): string {
  const labels: Record<CompatibilityLevel, string> = {
    not_recommended: 'No Recomendable',
    recommended_with_reserves: 'Recomendable con Reservas',
    recommended: 'Recomendable',
    highly_recommended: 'Muy Recomendable'
  };
  return labels[level];
}

export function getScoreColor(level: ScoreLevel): string {
  const colors: Record<ScoreLevel, string> = {
    very_low: 'text-red-600 bg-red-50',
    low: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-green-600 bg-green-50',
    very_high: 'text-emerald-600 bg-emerald-50'
  };
  return colors[level];
}

export function getCompatibilityColor(level: CompatibilityLevel): string {
  const colors: Record<CompatibilityLevel, string> = {
    not_recommended: 'text-red-600 bg-red-50 border-red-200',
    recommended_with_reserves: 'text-orange-600 bg-orange-50 border-orange-200',
    recommended: 'text-green-600 bg-green-50 border-green-200',
    highly_recommended: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  };
  return colors[level];
}

export function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}