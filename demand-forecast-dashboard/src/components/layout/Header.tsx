import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export const Header = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between">
      <div>
        <div className="flex items-center space-x-2 text-gray-500 mb-1">
             <LayoutDashboard className="w-4 h-4" />
             <span className="text-xs font-semibold uppercase tracking-wider">Demand Planning</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Track real-time demand, forecast performance, and AI-driven insights to optimize inventory levels.
        </p>
      </div>
      <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm font-medium text-gray-500">Last updated</p>
          <p className="text-sm font-bold text-gray-900">{today}</p>
      </div>
    </div>
  );
};
