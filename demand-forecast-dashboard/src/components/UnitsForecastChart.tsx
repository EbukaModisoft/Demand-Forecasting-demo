import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList
} from 'recharts';
import { TimeSeriesPoint } from '../types';

interface UnitsForecastChartProps {
  data: TimeSeriesPoint[];
  showExplain: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-violet-100 shadow-xl shadow-violet-100/20 rounded-xl text-sm min-w-[180px]">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }}></span>
                         <span className="text-gray-600 font-medium text-xs">{p.name}</span>
                    </div>
                    <span className="font-bold font-mono text-gray-900">{p.value.toLocaleString()}</span>
                </div>
            ))}
          </div>
           {payload[0].payload.annotation && (
            <div className="mt-3 pt-2 border-t border-dashed border-violet-100">
                 <div className="flex items-start gap-2 text-xs font-semibold text-violet-700 bg-violet-50 p-2 rounded-lg border border-violet-100">
                    <span className="text-base">💡</span>
                    <span>{payload[0].payload.annotation}</span>
                </div>
            </div>
            )}
        </div>
      );
    }
    return null;
  };

export const UnitsForecastChart: React.FC<UnitsForecastChartProps> = ({ data, showExplain }) => {
  const todayEntry = data.find(d => !d.isFuture);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
       <div className="mb-6 flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Units Forecast</h3>
                <p className="text-sm text-gray-500 font-medium">Predicted volume by day</p>
            </div>
            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/50">
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-violet-500 rounded-sm shadow-sm"></div>
                    <span>Actual</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-violet-300/50 border border-violet-300 border-dashed rounded-sm"></div>
                    <span>Forecast</span>
                </div>
            </div>
        </div>
      <div className="flex-1 w-full min-h-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} barGap={0}>
            <defs>
                 <pattern id="stripe-pattern-units" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <rect width="4" height="8" transform="translate(0,0)" fill="#ddd6fe" opacity="0.4" />
                </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
              axisLine={{ stroke: '#f1f5f9' }}
              tickLine={false}
              minTickGap={30}
              dy={10}
            />
            <YAxis 
               tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
               axisLine={false}
               tickLine={false}
               tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', opacity: 0.8}} />
            
            <Bar 
                dataKey="actual" 
                name="Actual" 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
            />
            <Bar 
                dataKey="forecast" 
                name="Forecast" 
                fill="url(#stripe-pattern-units)"
                stroke="#a78bfa"
                strokeWidth={1}
                strokeDasharray="4 2"
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
            >
                {showExplain && <LabelList dataKey="annotation" position="top" style={{ fill: '#7c3aed', fontSize: '10px', fontWeight: 'bold' }} />}
            </Bar>

            {todayEntry && (
                <ReferenceLine x={todayEntry.date} stroke="#94a3b8" strokeDasharray="3 3">
                </ReferenceLine>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
