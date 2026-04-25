import React from 'react';
import { getScoreBarColor } from '../utils/scoring';
interface ScoreMeterProps {
  score: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
export function ScoreMeter({
  score,
  label,
  showLabel = true,
  size = 'md'
}: ScoreMeterProps) {
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  return (
    <div className="w-full">
      {showLabel && label &&
      <div className="flex justify-between items-center mb-1.5">
          <span className={`font-medium text-gray-700 ${textSizes[size]}`}>
            {label}
          </span>
          <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
            {score}
          </span>
        </div>
      }
      <div className="relative w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${heights[size]} ${getScoreBarColor(score)} rounded-full transition-all duration-500`}
          style={{
            width: `${score}%`
          }} />
        
      </div>
    </div>);

}