import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { mockServer } from '../api/mockServer';
import { Insight } from '../types';

interface AiInsightsPanelProps {
  onOpenSunny: () => void;
}

export const AiInsightsPanel: React.FC<AiInsightsPanelProps> = ({ onOpenSunny }) => {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    mockServer.getInsights().then(setInsights);
  }, []);

  return (
    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100/50 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

      <div className="flex items-center space-x-2.5 mb-6 relative z-10">
        <div className="p-1.5 bg-amber-500 rounded-lg shadow-sm shadow-amber-200">
           <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-lg text-gray-900">Sunny's Insights</h3>
      </div>

      <div className="space-y-3 flex-1 relative z-10">
        {insights.map((insight) => (
          <button
            key={insight.id}
            onClick={onOpenSunny}
            className="w-full text-left p-4 rounded-xl border bg-white/80 backdrop-blur-sm border-modisoft-yellow/20 hover:border-modisoft-yellow/40 hover:shadow-lg hover:shadow-modisoft-yellow/10 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-gray-900 text-sm group-hover:text-modisoft-blue transition-colors">{insight.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border 
                ${insight.type === 'weather' ? 'bg-modisoft-yellow/10 text-modisoft-blue border-modisoft-yellow/20' : 
                  insight.type === 'promo' ? 'bg-modisoft-turquoise/10 text-modisoft-turquoise border-modisoft-turquoise/20' : 
                  'bg-modisoft-blue/10 text-modisoft-blue border-modisoft-blue/20'}`}>
                {insight.impactLabel}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800">
               {insight.description}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-amber-100 relative z-10">
        <button 
          onClick={onOpenSunny}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200 rounded-xl text-white text-sm font-bold hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask Sunny</span>
          <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
