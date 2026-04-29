import React from 'react';
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple';
}
export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue'
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend &&
          <p
            className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs mes
              anterior
            </p>
          }
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>);

}