'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  DollarSign, 
  MapPin, 
  Tag, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package,
  ShoppingCart,
  Calendar,
  Info,
  Lightbulb
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { NewItemInput, NewItemProjection, DEFAULT_NEW_ITEM_INPUT, BusinessType } from '../types';

interface NewItemSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  businessType: BusinessType;
  baselineRevenue: number; // Current daily revenue for context
  baselineUnits: number;
}

// Category benchmarks for different business types
const CATEGORY_BENCHMARKS: Record<string, { avgPrice: number; avgDailyUnits: number; elasticity: number }> = {
  'Snacks': { avgPrice: 3.49, avgDailyUnits: 45, elasticity: -1.2 },
  'Beverages': { avgPrice: 2.99, avgDailyUnits: 85, elasticity: -0.9 },
  'Grocery': { avgPrice: 5.99, avgDailyUnits: 25, elasticity: -1.5 },
  'Household': { avgPrice: 8.99, avgDailyUnits: 12, elasticity: -1.8 },
  'Personal Care': { avgPrice: 6.49, avgDailyUnits: 18, elasticity: -1.4 },
  'Prepared Foods': { avgPrice: 7.99, avgDailyUnits: 55, elasticity: -0.8 },
  'Hot Beverages': { avgPrice: 3.49, avgDailyUnits: 120, elasticity: -0.7 },
  'Alcohol': { avgPrice: 12.99, avgDailyUnits: 35, elasticity: -1.1 },
  'Spirits': { avgPrice: 24.99, avgDailyUnits: 15, elasticity: -1.3 },
  'Beer/Wine': { avgPrice: 11.99, avgDailyUnits: 45, elasticity: -1.0 },
};

// Store traffic multipliers
const STORE_TRAFFIC: Record<string, { multiplier: number; label: string }> = {
  'all': { multiplier: 1.0, label: 'All Stores (Average)' },
  'main_street': { multiplier: 1.15, label: 'Main Street Store' },
  'downtown': { multiplier: 1.25, label: 'Downtown Location' },
  'west_side': { multiplier: 0.85, label: 'West Side Store' },
  'airport': { multiplier: 1.45, label: 'Airport Terminal' },
};

// Calculate projections based on inputs
function calculateProjections(
  input: NewItemInput, 
  businessType: BusinessType,
  baselineRevenue: number
): NewItemProjection {
  const benchmark = CATEGORY_BENCHMARKS[input.category] || CATEGORY_BENCHMARKS['Snacks'];
  const storeData = STORE_TRAFFIC[input.storeId] || STORE_TRAFFIC['all'];
  
  // Base units calculation using price elasticity
  const priceRatio = input.price / benchmark.avgPrice;
  const elasticityEffect = Math.pow(priceRatio, benchmark.elasticity);
  let baseUnits = Math.round(benchmark.avgDailyUnits * elasticityEffect * storeData.multiplier);
  
  // Business type adjustments
  const businessMultipliers: Record<BusinessType, number> = {
    convenience: 1.0,
    grocery: 1.4,
    liquor: 0.7,
    restaurant: 1.2,
  };
  baseUnits = Math.round(baseUnits * businessMultipliers[businessType]);
  
  // Promo boost
  if (input.isPromo && input.promoDiscountPct > 0) {
    const promoLift = 1 + (input.promoDiscountPct * 0.02); // 2% lift per 1% discount
    baseUnits = Math.round(baseUnits * promoLift);
  }
  
  // New item excitement factor (typically 20-40% higher in first 2 weeks)
  const newItemBoost = 1.25;
  const launchUnits = Math.round(baseUnits * newItemBoost);
  
  // Daily metrics (using launch boost for first week average)
  const dailyUnits = Math.max(1, launchUnits);
  const effectivePrice = input.isPromo ? input.price * (1 - input.promoDiscountPct / 100) : input.price;
  const dailyRevenue = dailyUnits * effectivePrice;
  
  // Weekly/Monthly projections (slight decay as novelty wears off)
  const weeklyUnits = Math.round(dailyUnits * 7 * 0.95);
  const weeklyRevenue = weeklyUnits * effectivePrice;
  const monthlyUnits = Math.round(dailyUnits * 30 * 0.85);
  const monthlyRevenue = monthlyUnits * effectivePrice;
  
  // Cannibalization estimate (similar category items)
  // Higher for similar price points, lower for unique offerings
  const cannibalizationPct = Math.min(35, Math.max(5, 
    25 - Math.abs(input.price - benchmark.avgPrice) * 3
  ));
  
  // Net new revenue (after cannibalization)
  const cannibalized = dailyRevenue * (cannibalizationPct / 100);
  const netNewRevenue = dailyRevenue - cannibalized;
  
  // Break-even calculation (assuming $50 initial setup cost per item)
  const setupCost = 50;
  const dailyProfit = netNewRevenue * 0.35; // Assuming 35% margin
  const breakEvenDays = dailyProfit > 0 ? Math.ceil(setupCost / dailyProfit) : 999;
  
  // Confidence score based on data quality
  let confidenceScore = 75;
  if (input.name.length > 3) confidenceScore += 5;
  if (input.price > 0 && input.price < 100) confidenceScore += 10;
  if (input.storeId !== 'all') confidenceScore += 5;
  confidenceScore = Math.min(95, confidenceScore);
  
  // Generate demand curve (30 days)
  const demandCurve = [];
  for (let day = 1; day <= 30; day++) {
    // Excitement decays over time
    const excitementFactor = day <= 7 ? newItemBoost : 
                             day <= 14 ? 1.15 : 
                             day <= 21 ? 1.05 : 1.0;
    
    // Weekend boost
    const isWeekend = day % 7 === 0 || day % 7 === 6;
    const weekendFactor = isWeekend ? 1.3 : 1.0;
    
    const dayUnits = Math.round(baseUnits * excitementFactor * weekendFactor * (0.9 + Math.random() * 0.2));
    const dayRevenue = dayUnits * effectivePrice;
    
    demandCurve.push({ day, units: dayUnits, revenue: Math.round(dayRevenue) });
  }
  
  // Generate insights
  const insights: string[] = [];
  
  if (input.price < benchmark.avgPrice * 0.8) {
    insights.push(`Price is ${Math.round((1 - input.price/benchmark.avgPrice) * 100)}% below category average—expect higher volume but lower margins.`);
  } else if (input.price > benchmark.avgPrice * 1.2) {
    insights.push(`Premium pricing detected. Consider highlighting quality/uniqueness to justify the ${Math.round((input.price/benchmark.avgPrice - 1) * 100)}% premium.`);
  }
  
  if (storeData.multiplier > 1.2) {
    insights.push(`${storeData.label} has high foot traffic—ideal for new item launches.`);
  } else if (storeData.multiplier < 0.9) {
    insights.push(`${storeData.label} has lower traffic. Consider testing here before expanding.`);
  }
  
  if (cannibalizationPct > 25) {
    insights.push(`High cannibalization risk (${cannibalizationPct}%). This item may compete with existing products.`);
  }
  
  if (input.isPromo && input.promoDiscountPct >= 20) {
    insights.push(`Launch promo of ${input.promoDiscountPct}% off will drive trial but watch margin impact.`);
  }
  
  if (businessType === 'restaurant' && ['Prepared Foods', 'Hot Beverages'].includes(input.category)) {
    insights.push(`Strong category fit for restaurants. Consider combo/upsell opportunities.`);
  }
  
  return {
    dailyUnits,
    dailyRevenue: Math.round(dailyRevenue),
    weeklyUnits,
    weeklyRevenue: Math.round(weeklyRevenue),
    monthlyUnits,
    monthlyRevenue: Math.round(monthlyRevenue),
    cannibalizationPct,
    netNewRevenue: Math.round(netNewRevenue),
    breakEvenDays,
    confidenceScore,
    demandCurve,
    insights,
  };
}

export const NewItemSimulator: React.FC<NewItemSimulatorProps> = ({
  isOpen,
  onClose,
  businessType,
  baselineRevenue,
  baselineUnits,
}) => {
  const [input, setInput] = useState<NewItemInput>(DEFAULT_NEW_ITEM_INPUT);
  
  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setInput(DEFAULT_NEW_ITEM_INPUT);
    }
  }, [isOpen]);
  
  const projection = useMemo(() => {
    if (!input.name || input.price <= 0) return null;
    return calculateProjections(input, businessType, baselineRevenue);
  }, [input, businessType, baselineRevenue]);
  
  // Get relevant categories based on business type
  const categories = useMemo(() => {
    switch (businessType) {
      case 'restaurant':
        return ['Prepared Foods', 'Hot Beverages', 'Beverages', 'Snacks'];
      case 'liquor':
        return ['Spirits', 'Beer/Wine', 'Alcohol', 'Snacks'];
      case 'grocery':
        return ['Grocery', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Prepared Foods'];
      default:
        return ['Snacks', 'Beverages', 'Grocery', 'Household', 'Personal Care', 'Prepared Foods', 'Hot Beverages'];
    }
  }, [businessType]);
  
  if (!isOpen) return null;
  
  const impactOnTotal = projection 
    ? ((projection.netNewRevenue / baselineRevenue) * 100).toFixed(1)
    : '0';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">New Item Simulator</h2>
              <p className="text-xs text-gray-500">See real-time demand projections</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-500" />
              Item Details
            </h3>
            
            {/* Item Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Item Name</label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Spicy Chicken Sandwich"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
            </div>
            
            {/* Price & Category Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={input.price || ''}
                    onChange={(e) => setInput(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Category
                </label>
                <select
                  value={input.category}
                  onChange={(e) => setInput(prev => ({ ...prev, category: e.target.value as typeof prev.category }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Store Location */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Launch Location
              </label>
              <select
                value={input.storeId}
                onChange={(e) => setInput(prev => ({ ...prev, storeId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
              >
                {Object.entries(STORE_TRAFFIC).map(([id, data]) => (
                  <option key={id} value={id}>{data.label}</option>
                ))}
              </select>
            </div>
            
            {/* Launch Promo Toggle */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.isPromo}
                  onChange={(e) => setInput(prev => ({ ...prev, isPromo: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm font-medium text-gray-700">Launch with promotional pricing</span>
              </label>
              
              {input.isPromo && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Discount %</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={input.promoDiscountPct}
                    onChange={(e) => setInput(prev => ({ ...prev, promoDiscountPct: parseInt(e.target.value) }))}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5% off</span>
                    <span className="font-medium text-violet-600">{input.promoDiscountPct}% off</span>
                    <span>50% off</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Projections */}
          {projection && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Projected Performance
              </h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <p className="text-xs text-emerald-600 font-medium">Daily Revenue</p>
                  <p className="text-xl font-bold text-emerald-700">${projection.dailyRevenue}</p>
                  <p className="text-xs text-emerald-500">{projection.dailyUnits} units</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-xs text-blue-600 font-medium">Weekly</p>
                  <p className="text-xl font-bold text-blue-700">${projection.weeklyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-blue-500">{projection.weeklyUnits} units</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-xs text-purple-600 font-medium">Monthly</p>
                  <p className="text-xl font-bold text-purple-700">${projection.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-purple-500">{projection.monthlyUnits} units</p>
                </div>
              </div>
              
              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${parseFloat(impactOnTotal) > 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    {parseFloat(impactOnTotal) > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                    )}
                    <p className="text-xs text-gray-600 font-medium">Impact on Daily Total</p>
                  </div>
                  <p className={`text-lg font-bold ${parseFloat(impactOnTotal) > 0 ? 'text-emerald-700' : 'text-gray-600'}`}>
                    +{impactOnTotal}%
                  </p>
                  <p className="text-xs text-gray-500">Net new: ${projection.netNewRevenue}/day</p>
                </div>
                
                <div className={`p-3 rounded-xl ${projection.cannibalizationPct > 20 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    {projection.cannibalizationPct > 20 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    <p className="text-xs text-gray-600 font-medium">Cannibalization Risk</p>
                  </div>
                  <p className={`text-lg font-bold ${projection.cannibalizationPct > 20 ? 'text-amber-700' : 'text-gray-700'}`}>
                    {projection.cannibalizationPct}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {projection.cannibalizationPct > 20 ? 'May compete with existing' : 'Low overlap with catalog'}
                  </p>
                </div>
              </div>
              
              {/* Break-even & Confidence */}
              <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-600 font-medium">Break-even</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {projection.breakEvenDays < 30 ? `${projection.breakEvenDays} days` : '30+ days'}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-600 font-medium">Confidence</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${projection.confidenceScore >= 80 ? 'bg-emerald-500' : projection.confidenceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${projection.confidenceScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{projection.confidenceScore}%</span>
                  </div>
                </div>
              </div>
              
              {/* Demand Curve Chart */}
              <div className="p-4 bg-white border border-gray-100 rounded-xl">
                <h4 className="text-xs font-semibold text-gray-700 mb-3">30-Day Demand Forecast</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projection.demandCurve} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        tickFormatter={(day) => day % 7 === 1 ? `W${Math.ceil(day/7)}` : ''}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(value, name) => [
                          name === 'revenue' ? `$${value}` : value,
                          name === 'revenue' ? 'Revenue' : 'Units'
                        ]}
                        labelFormatter={(day) => `Day ${day}`}
                      />
                      <ReferenceLine 
                        x={7} 
                        stroke="#8B5CF6" 
                        strokeDasharray="3 3" 
                        strokeOpacity={0.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Launch excitement typically peaks in Week 1, then normalizes
                </p>
              </div>
              
              {/* Insights */}
              {projection.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    AI Insights
                  </h4>
                  <div className="space-y-2">
                    {projection.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Empty State */}
          {!projection && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">Enter item details</h3>
              <p className="text-sm text-gray-500">
                Add a name and price to see<br />real-time demand projections
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Projections based on category benchmarks and store traffic patterns
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
