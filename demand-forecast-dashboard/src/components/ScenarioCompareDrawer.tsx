import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, RotateCcw, TrendingUp, Cloud, Calendar, Sliders, DollarSign, Sparkles } from 'lucide-react';
import { ScenarioInputs, DEFAULT_SCENARIO_INPUTS } from '../types';

interface ScenarioCompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentInputs: ScenarioInputs;
  onApply: (inputs: ScenarioInputs) => void;
  baselineRevenue: number;
  baselineUnits: number;
}

interface SliderConfig {
  key: keyof ScenarioInputs;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  color: string;
  description: string;
}

const SLIDER_CONFIGS: SliderConfig[] = [
  {
    key: 'promoLiftPct',
    label: 'Promotional Lift',
    icon: <TrendingUp className="w-4 h-4" />,
    min: -20,
    max: 50,
    color: 'indigo',
    description: 'Expected lift from promotions and discounts',
  },
  {
    key: 'weatherImpactPct',
    label: 'Weather Impact',
    icon: <Cloud className="w-4 h-4" />,
    min: -30,
    max: 30,
    color: 'sky',
    description: 'Adjust for weather conditions (heat waves, rain, etc.)',
  },
  {
    key: 'eventLiftPct',
    label: 'Event / Holiday Lift',
    icon: <Calendar className="w-4 h-4" />,
    min: -20,
    max: 50,
    color: 'amber',
    description: 'Local events, sports games, holidays, concerts',
  },
  {
    key: 'manualOverridePct',
    label: 'Manual Adjustment',
    icon: <Sliders className="w-4 h-4" />,
    min: -50,
    max: 50,
    color: 'emerald',
    description: 'Your own judgment—override the forecast up or down',
  },
  {
    key: 'priceImpactPct',
    label: 'Price Change',
    icon: <DollarSign className="w-4 h-4" />,
    min: -30,
    max: 30,
    color: 'rose',
    description: 'Price increase (negative lift) or decrease (positive lift)',
  },
  {
    key: 'newItemImpactPct',
    label: 'New Item Launch',
    icon: <Sparkles className="w-4 h-4" />,
    min: -10,
    max: 50,
    color: 'violet',
    description: 'Expected lift from introducing new menu or product',
  },
];

export const ScenarioCompareDrawer: React.FC<ScenarioCompareDrawerProps> = ({ 
  isOpen, 
  onClose, 
  currentInputs,
  onApply,
  baselineRevenue,
  baselineUnits,
}) => {
  const [inputs, setInputs] = useState<ScenarioInputs>(currentInputs);

  // Sync with external inputs when drawer opens
  useEffect(() => {
    if (isOpen) {
      setInputs(currentInputs);
    }
  }, [isOpen, currentInputs]);

  if (!isOpen) return null;

  const handleSliderChange = (key: keyof ScenarioInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_SCENARIO_INPUTS);
  };

  const handleApply = () => {
    onApply(inputs);
    onClose();
  };

  // Calculate combined effect
  const combinedPct = 
    inputs.promoLiftPct + 
    inputs.weatherImpactPct + 
    inputs.eventLiftPct + 
    inputs.manualOverridePct + 
    inputs.priceImpactPct + 
    inputs.newItemImpactPct;
  const cappedPct = Math.max(-50, Math.min(120, combinedPct));
  const multiplier = 1 + (cappedPct / 100);

  const newRevenue = Math.round(baselineRevenue * multiplier);
  const newUnits = Math.round(baselineUnits * multiplier);
  const revenueDelta = newRevenue - baselineRevenue;
  const unitsDelta = newUnits - baselineUnits;

  const isModified = Object.values(inputs).some(v => v !== 0);

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-50`,
    border: `border-${color}-200`,
    text: `text-${color}-700`,
    iconBg: `bg-${color}-100`,
    accent: `accent-${color}-600`,
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#1E3A5F] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Scenario Compare</h3>
              <p className="text-sm text-white/70">What-if analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Sliders */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto bg-gray-50">
          {SLIDER_CONFIGS.map((config) => {
            const value = inputs[config.key];
            const isNonZero = value !== 0;
            
            return (
              <div 
                key={config.key} 
                className={`bg-white rounded-xl p-4 border transition-all ${
                  isNonZero ? 'border-indigo-200 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isNonZero ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                      {config.icon}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{config.label}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-lg font-bold text-sm ${
                    value > 0 ? 'bg-emerald-100 text-emerald-700' :
                    value < 0 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {value > 0 ? '+' : ''}{value}%
                  </span>
                </div>
                
                <input 
                  type="range" 
                  min={config.min}
                  max={config.max}
                  value={value}
                  onChange={(e) => handleSliderChange(config.key, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{config.min}%</span>
                  <span className="text-gray-500">{config.description}</span>
                  <span>+{config.max}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Impact Summary */}
        <div className="p-5 border-t border-gray-200 bg-white">
          <div className={`p-4 rounded-xl mb-4 ${
            isModified 
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {isModified ? 'Scenario Impact' : 'No Changes'}
              </span>
              <span className={`text-lg font-bold ${
                cappedPct > 0 ? 'text-emerald-600' : cappedPct < 0 ? 'text-red-600' : 'text-gray-400'
              }`}>
                {cappedPct > 0 ? '+' : ''}{cappedPct}% total
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Revenue</p>
                <p className="text-xl font-bold text-gray-900">${newRevenue.toLocaleString()}</p>
                {isModified && (
                  <p className={`text-xs font-medium ${revenueDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {revenueDelta >= 0 ? '+' : ''}{revenueDelta.toLocaleString()} vs base
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Units</p>
                <p className="text-xl font-bold text-gray-900">{newUnits.toLocaleString()}</p>
                {isModified && (
                  <p className={`text-xs font-medium ${unitsDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {unitsDelta >= 0 ? '+' : ''}{unitsDelta.toLocaleString()} vs base
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              disabled={!isModified}
              className="flex-1 py-3 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={handleApply}
              className="flex-1 py-3 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-teal-200"
            >
              <Save className="w-4 h-4" />
              Apply Scenario
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
