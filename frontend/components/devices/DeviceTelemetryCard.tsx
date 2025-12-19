'use client';

import { ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeviceTelemetryCardProps {
  title: string;
  value: number;
  unit: string;
  icon: ReactNode;
  alertCondition?: boolean;
  alertMessage?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function DeviceTelemetryCard({
  title,
  value,
  unit,
  icon,
  alertCondition = false,
  alertMessage,
  trend,
}: DeviceTelemetryCardProps) {
  return (
    <div className={`relative p-4 rounded-lg transition-all ${
      alertCondition 
        ? 'bg-red-50 border-2 border-red-200' 
        : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      {alertCondition && (
        <div className="absolute -top-2 -right-2">
          <div className="relative">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-300" />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-red-100 text-red-800' :
            trend === 'down' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">
          {value.toFixed(2)}
        </span>
        <span className="ml-1 text-gray-500">{unit}</span>
      </div>
      
      {alertCondition && alertMessage && (
        <div className="mt-2">
          <p className="text-xs text-red-600 font-medium">{alertMessage}</p>
        </div>
      )}
    </div>
  );
}