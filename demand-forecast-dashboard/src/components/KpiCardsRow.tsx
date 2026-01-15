import React from 'react';
import { DollarSign, Tag, ShoppingBag, CloudRain, Calendar, Activity, TrendingUp, Info } from 'lucide-react';
import { KpiData } from '../types';

interface KpiCardsRowProps {
  data: KpiData;
  loading: boolean;
}

const KpiCard = ({ title, value, subValue, icon: Icon, colorClass, loading, tooltip }: any) => (
  <div className="bg-white p-4 lg:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between h-32">
    <div className="flex justify-between items-start">
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 backdrop-blur-sm`}>
        <Icon className={`w-5 h-5`} style={{ color: 'inherit' }} />
      </div>
       <div className="relative group/tooltip z-10">
        <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
        <div className="absolute right-0 top-6 w-56 bg-gray-900/95 text-white text-[11px] p-3 rounded-lg shadow-xl opacity-0 translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all pointer-events-none border border-white/10 backdrop-blur-md">
          {tooltip}
        </div>
      </div>
    </div>
    
    <div>
      <p className="text-[12px] uppercase tracking-wide font-semibold text-gray-400 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-1/2 bg-gray-100 animate-pulse rounded"></div>
      ) : (
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
            {subValue && (
                <span className={`text-[11px] font-bold py-0.5 px-1.5 rounded-md ${subValue.includes('+') ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-50'}`}>
                    {subValue}
                </span>
            )}
        </div>
      )}
    </div>
  </div>
);

export const KpiCardsRow: React.FC<KpiCardsRowProps> = ({ data, loading }) => {
  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatNum = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <KpiCard 
        title="Revenue (Est)" 
        value={formatMoney(data.revenueForecast)} 
        subValue="+12%"
        icon={DollarSign} 
        colorClass="text-emerald-600 bg-emerald-500" 
        tooltip="Predicted revenue for the selected timeframe based on historical trends."
        loading={loading}
      />
      <KpiCard 
        title="Promo Lift" 
        value={`+${data.promoBoost.toFixed(1)}%`}
        subValue="High"
        icon={Tag} 
        colorClass="text-blue-600 bg-blue-500"
        tooltip="Revenue uplift specifically attributed to active promotions."
        loading={loading}
      />
      <KpiCard 
        title="Units Forecast" 
        value={formatNum(data.unitsForecast)}
        subValue="Vol."
        icon={ShoppingBag} 
        colorClass="text-violet-600 bg-violet-500"
        tooltip="Total quantity of units forecasted to be sold."
        loading={loading}
      />
      <KpiCard 
        title="Weather Impact" 
        value={`+${data.weatherImpact}%`}
        subValue="Events"
        icon={CloudRain} 
        colorClass="text-amber-600 bg-amber-500"
        tooltip="Estimated deviation due to local weather conditions (e.g. Heat Wave)."
        loading={loading}
      />
      <KpiCard 
        title="Vs Typical" 
        value={`+${data.todayVsTypical}%`}
        icon={Calendar} 
        colorClass="text-indigo-600 bg-indigo-500"
        tooltip="Comparison of today's real-time performance vs the 30-day average for this weekday."
        loading={loading}
      />
      <KpiCard 
        title="Data Confidence" 
        value={`${data.dataHealthScore}%`}
        subValue="Safe"
        icon={Activity} 
        colorClass="text-rose-600 bg-rose-500"
        tooltip="Quality score of the prediction model based on data completeness."
        loading={loading}
      />
    </div>
  );
};
