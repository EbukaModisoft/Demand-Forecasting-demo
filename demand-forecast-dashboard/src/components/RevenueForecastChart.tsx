import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList 
} from 'recharts';
import { TimeSeriesPoint } from '../types';

interface RevenueForecastChartProps {
  data: TimeSeriesPoint[];
  showExplain: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-xs ring-1 ring-black ring-opacity-5">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                 <span className="text-gray-500">{p.name}</span>
               </div>
               <span className="font-mono font-medium text-gray-900">${p.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        {payload[0]?.payload.annotation && (
          <div className="mt-2 pt-2 border-t border-gray-100">
             <div className="flex items-start gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 p-1.5 rounded">
               <span>💡</span>
               <span>{payload[0].payload.annotation}</span>
             </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const RevenueForecastChart: React.FC<RevenueForecastChartProps> = ({ data, showExplain }) => {
  const todayEntry = data.find(d => !d.isFuture); // approximate split
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-96 flex flex-col">
      <div className="mb-4 flex justify-between items-start">
         <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Revenue Forecast</h3>
            <p className="text-xs text-gray-500 mt-0.5">Historical vs Predicted</p>
         </div>
         {/* Lengend */}
         <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
               <span className="text-gray-600 font-medium">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-purple-500 opacity-50 border border-purple-500" style={{ borderStyle: 'dashed' }}></span>
               <span className="text-gray-600 font-medium">Forecast</span>
            </div>
         </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
                 <pattern id="patternForecast" patternUnits="userSpaceOnUse" width="4" height="4">
                   <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#8b5cf6" strokeWidth="0.5" strokeOpacity={0.3} />
                </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
              axisLine={{ stroke: '#f3f4f6' }}
              tickLine={false}
              minTickGap={35}
              dy={10}
            />
            <YAxis 
              tickFormatter={(v) => `$${v/1000}k`}
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Area 
              type="monotone" 
              dataKey="actual" 
              name="Actual"
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#colorActual)"
              connectNulls 
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area 
              type="monotone" 
              dataKey="forecast" 
              name="Forecast"
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#colorForecast)"
              connectNulls={false} 
              activeDot={{ r: 4, strokeWidth: 0 }}
            >
              {showExplain && <LabelList dataKey="annotation" position="top" style={{ fill: '#4f46e5', fontSize: '10px', fontWeight: 600 }} />}
            </Area>

            {/* Today Line */}
            {todayEntry && (
                <ReferenceLine x={todayEntry.date} stroke="#9ca3af" strokeDasharray="2 2">
                </ReferenceLine>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
