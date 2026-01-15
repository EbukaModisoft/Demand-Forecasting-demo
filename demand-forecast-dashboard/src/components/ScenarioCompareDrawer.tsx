import React, { useState } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { ItemRow } from '../types';

interface ScenarioCompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: ItemRow | null;
}

export const ScenarioCompareDrawer: React.FC<ScenarioCompareDrawerProps> = ({ isOpen, onClose, activeItem }) => {
  const [lift, setLift] = useState(8);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 ring-1 ring-gray-950/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
          <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                    <Calculator className="w-4 h-4" />
                </div>
                Edit Scenario
            </h3>
            {activeItem && <p className="text-sm text-gray-500 mt-1 font-medium">{activeItem.name}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
           {/* Control Section */}
           <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <label className="block text-sm font-bold text-gray-900">Promotional Lift</label>
                 <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">Elasticity Mode</span>
             </div>
             
             <div className="space-y-6 pt-2">
                <input 
                    type="range" 
                    min="0" 
                    max="25" 
                    value={lift} 
                    onChange={(e) => setLift(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 active:accent-indigo-800 transition-all"
                />
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Conservative (0%)</span>
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-sm shadow-indigo-200">+{lift}%</span>
                    <span>Aggressive (25%)</span>
                </div>
             </div>
             
             <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200/50">
               Adjusting this value triggers a recalculation of the "Units Forecast" and "Revenue" KPIs based on our predictive elasticity models.
             </p>
           </div>

           {/* Preview Section */}
           <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/80 rounded-xl space-y-4 shadow-sm">
             <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 border-b border-amber-100 pb-2">Simulation Impact</h4>
             
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-900/70 font-medium">Baseline Revenue</span>
                    <span className="font-mono text-sm text-gray-900">$1,240</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-900/70 font-medium">Baseline Units</span>
                    <span className="font-mono text-sm text-gray-900">142</span>
                </div>
                 <div className="h-px bg-amber-200/50 my-2"></div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-amber-900">New Forecast</span>
                    <span className="font-mono text-base font-bold text-emerald-600 bg-white px-2 py-0.5 rounded shadow-sm">
                        ${Math.floor(1240 * (1 + lift / 100)).toLocaleString()}
                    </span>
                </div>
             </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm">
          <button onClick={onClose} className="w-full py-3 flex items-center justify-center space-x-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl active:scale-[0.98]">
            <Save className="w-4 h-4" />
            <span>Apply Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
