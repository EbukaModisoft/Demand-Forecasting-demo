'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  Database,
  Heart,
  Info,
  ChevronUp,
  ChevronDown,
  Printer,
  CheckCircle,
  Sun,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BusinessType } from '../types';
import {
  INVENTORY_KPI,
  INVENTORY_ITEMS,
  WHAT_YOU_CAN_SELL,
  FAST_MOVERS,
  COLD_DRINKS_BOOST,
  AUTO_REPLENISHMENT,
  CYCLE_COUNT_ITEMS,
  INVENTORY_AI_INSIGHTS,
  TOP_REORDER_ITEMS,
  SPOILAGE_ITEMS,
  PREP_ITEMS,
  WASTE_LEDGER,
  BUNDLE_SUGGESTIONS,
  WEEKEND_RUNUP_DATA,
  HEALTH_ACTIONS,
  OVERSTOCK_ITEMS,
} from '../lib/inventoryData';

interface InventoryOptimizationProps {
  businessType: BusinessType;
  onOrder: (category: string, expected: number, stock: number) => void;
  onSubstitute: (category: string) => void;
  onOpenSunny: () => void;
  onShowToast: (message: string) => void;
  onViewItem: (item: { name: string; department?: string; onHand: number; parLevel?: number; price?: number; forecastUnits?: number; status?: string }) => void;
}

// ============== INVENTORY HEALTH CARD ==============
const InventoryHealthCard = ({ score, onHover }: { score: number; onHover?: boolean }) => {
  const status = score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Risk';
  const statusColor = score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  const barColor = score >= 70 ? 'bg-modisoft-green' : score >= 50 ? 'bg-modisoft-yellow' : 'bg-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-turquoise to-modisoft-green" />
      <div className="flex items-start gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold text-modisoft-blue">{score}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
              {status}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Stock status</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Based on stock risk, slow stock, and count issues.
          </p>
        </div>
      </div>
      {onHover && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          {HEALTH_ACTIONS.map((action, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 text-modisoft-turquoise flex-shrink-0" />
              <span>{action.label} ({action.impact})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============== WHAT YOU CAN SELL CARD ==============
const SellableCard = ({ name, forecast, onHand, status, parLevel, refilled, onClick }: {
  name: string; forecast: number; onHand: number; status: 'covered' | 'low_stock' | 'used_up'; parLevel: number; refilled: boolean; onClick?: () => void;
}) => {
  const statusConfig = {
    covered: { label: 'Enough', bg: 'bg-modisoft-turquoise/10', border: 'border-modisoft-turquoise/30', text: 'text-modisoft-teal', dot: 'bg-modisoft-turquoise' },
    low_stock: { label: 'Running low', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    used_up: { label: 'Empty soon', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', dot: 'bg-red-500' },
  };
  const cfg = statusConfig[status];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 min-w-[220px] cursor-pointer transition-all hover:shadow-md`} onClick={onClick}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
      </div>
      <p className="font-semibold text-modisoft-blue text-sm mb-1">{name}</p>
      <p className="text-xs text-gray-500">• Forecast: {forecast}</p>
      <p className="text-xs text-gray-500">• On-Hand: {onHand}</p>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          className="bg-modisoft-yellow hover:bg-amber-400 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 active:scale-95"
        >
          Check stock: bring up to {parLevel}
        </button>
        {refilled && (
          <span className="text-xs text-modisoft-turquoise font-semibold whitespace-nowrap">Refilled {parLevel}</span>
        )}
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
export const InventoryOptimization: React.FC<InventoryOptimizationProps> = ({ businessType, onOrder, onSubstitute, onOpenSunny, onShowToast, onViewItem }) => {
  const kpi = INVENTORY_KPI[businessType];
  const inventoryItems = INVENTORY_ITEMS[businessType];
  const sellableItems = WHAT_YOU_CAN_SELL[businessType];
  const fastMovers = FAST_MOVERS[businessType];
  const autoReplenishment = AUTO_REPLENISHMENT[businessType];
  const insights = INVENTORY_AI_INSIGHTS[businessType];
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const [prepQuantities, setPrepQuantities] = useState<Record<string, number>>(
    Object.fromEntries(PREP_ITEMS.map(p => [p.item, p.suggestedBatch]))
  );

  // Chart data for "What you have"
  const chartData = inventoryItems.map(item => ({
    name: item.name,
    onHand: item.onHand,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100" style={{ borderTop: '2px solid #4DC1B4' }}>
          <p className="font-semibold text-modisoft-blue text-sm mb-1">{label}</p>
          <p className="text-sm text-gray-600">On hand: <strong>{payload[0].value}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ===== KPI CARDS ROW ===== */}
      <div className={`grid ${businessType === 'restaurant' ? 'grid-cols-5' : 'grid-cols-5'} gap-4`}>
        {/* Items at risk */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-400" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              Need action today
              <Info className="w-3 h-3 text-gray-300" />
            </span>
          </div>
          <p className="text-2xl font-bold text-modisoft-blue">{kpi.itemsAtRisk}</p>
          <p className="text-sm text-gray-500">Items that could miss demand soon</p>
        </div>

        {/* Money tied in slow movers */}
        <div className="bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-turquoise to-modisoft-green" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              Cash tied up in slow stock
              <Info className="w-3 h-3 text-gray-300" />
            </span>
          </div>
          <p className="text-2xl font-bold text-modisoft-blue">${kpi.moneyInSlowMovers.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Estimate</p>
        </div>

        {/* Stock-out prevented */}
        <div className="bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-turquoise to-modisoft-green" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              Stock-outs avoided
              <Info className="w-3 h-3 text-gray-300" />
            </span>
          </div>
          <p className="text-2xl font-bold text-modisoft-blue">{kpi.stockOutsPrevented}</p>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>

        {/* Waste Risk (Restaurant only) or Data Health Fixes */}
        {businessType === 'restaurant' && kpi.wasteRisk !== undefined ? (
          <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-400" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                Use first soon
                <Info className="w-3 h-3 text-gray-300" />
              </span>
            </div>
            <p className="text-2xl font-bold text-modisoft-blue">{kpi.wasteRisk} items</p>
            <p className="text-sm text-gray-500">Could turn into waste soon</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-turquoise to-modisoft-green" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                Counts to check
                <Info className="w-3 h-3 text-gray-300" />
              </span>
            </div>
            <p className="text-2xl font-bold text-modisoft-blue">{kpi.dataHealthFixes}</p>
            <p className="text-sm text-gray-500">These items need a quick count check</p>
          </div>
        )}

        {/* Inventory Health Score */}
        <div 
          className="relative"
          onMouseEnter={() => setShowHealthDetails(true)}
          onMouseLeave={() => setShowHealthDetails(false)}
        >
          <InventoryHealthCard score={kpi.inventoryHealthScore} onHover={showHealthDetails} />
        </div>
      </div>

      {/* ===== WHAT YOU HAVE (Bar Chart) ===== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Stock on hand</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="onHand" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill="#2E595A" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-3 h-3 rounded-sm bg-modisoft-teal" />
          <span className="text-xs text-gray-500">On hand</span>
        </div>
      </div>

      {/* ===== WHAT YOU CAN SELL + AI INSIGHTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* What you can sell - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">Ready to sell today</h2>
            <p className="text-xs text-gray-500">Use this to spot what is fine, what is running low, and what needs shelf refill first.</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 mt-3">
            {sellableItems.map((item, i) => (
              <SellableCard
                key={i}
                name={item.name}
                forecast={item.forecast}
                onHand={item.onHand}
                status={item.status}
                parLevel={item.parLevel}
                refilled={i % 2 === 1}
                onClick={() => onViewItem({ name: item.name, onHand: item.onHand, parLevel: item.parLevel, forecastUnits: item.forecast, status: item.status })}
              />
            ))}
          </div>
        </div>

        {/* AI Insights - 1 col */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Suggested actions</h2>
            <button onClick={onOpenSunny} className="bg-modisoft-yellow hover:bg-amber-400 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95">
              <Sparkles className="w-3 h-3" />
              Ask Sunny
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Based on your counts and forecast</p>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="border-b border-gray-50 pb-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-modisoft-blue">{insight.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{insight.description}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => onShowToast(`Action started: ${insight.title}`)} className={`px-3 py-1 rounded text-[10px] font-semibold active:scale-95 ${
                      insight.priority === 'high' ? 'bg-modisoft-turquoise text-white' :
                      insight.priority === 'medium' ? 'bg-modisoft-turquoise text-white' :
                      'bg-modisoft-green text-white'
                    }`}>
                      {insight.actionLabel}
                    </button>
                    {insight.action === 'fix' && (
                      <button onClick={() => onShowToast(`Added to PO: ${insight.title}`)} className="px-3 py-1 rounded text-[10px] font-semibold bg-modisoft-blue text-white active:scale-95">
                        Add to PO
                      </button>
                    )}
                    {insight.action === 'promo' && (
                      <button onClick={() => onShowToast(`Order reduced for: ${insight.title}`)} className="px-3 py-1 rounded text-[10px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95">
                        Reduce order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FAST MOVER REFILL + COLD DRINKS (or business-specific) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fast mover refill - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Order today</h2>
              <Info className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <p className="text-xs text-gray-500">
              {businessType === 'grocery' ? 'Move stock from backroom before you miss sales.' : 'These are the items most likely to need refill or reorder next.'}
            </p>
          </div>

          {businessType === 'grocery' || businessType === 'restaurant' ? (
            // Category-level view for grocery/restaurant
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Department</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Category</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Expected (6H)</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Stock you can sell</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Hours left</th>
                  <th className="text-center py-2 text-[10px] font-semibold text-gray-400 uppercase">Badge</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {fastMovers.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.department || item.item, department: item.category, onHand: item.stockYouCanSell || item.onHand, forecastUnits: item.expected6h })}>
                    <td className="py-2.5 text-xs text-modisoft-blue font-medium">{item.department || item.item}</td>
                    <td className="py-2.5 text-xs text-gray-600">{item.category || '-'}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.expected6h}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.stockYouCanSell || item.onHand}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.hoursLeft || '-'}</td>
                    <td className="py-2.5 text-center">
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          item.badge === 'inventory_based' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.badge === 'inventory_based' ? 'Inventory based' : 'Pace based'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => onSubstitute(item.category || item.department || item.item)} className="bg-modisoft-turquoise text-white px-2 py-1 rounded text-[10px] font-semibold active:scale-95">Substitute</button>
                        <button onClick={() => onOrder(item.category || item.item, item.expected6h, item.stockYouCanSell || item.onHand)} className="bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-semibold active:scale-95">Order</button>
                        <button onClick={() => onShowToast(`Hidden: ${item.item || item.category}`)} className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-[10px] font-semibold active:scale-95">Hide</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Item-level view for convenience/liquor/admin
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item ↕</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Expected (6H) ↕</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On-Hand ↕</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Refill Now ↕</th>
                </tr>
              </thead>
              <tbody>
                {fastMovers.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.item, onHand: item.onHand, forecastUnits: item.expected6h })}>
                    <td className="py-2.5 text-xs text-modisoft-blue font-medium hover:underline">{item.item}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.expected6h}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.onHand}</td>
                    <td className="py-2.5 text-right">
                      <span className="text-xs text-gray-600">{item.refillNow}</span>
                      <button onClick={() => onShowToast(`Print list sent for ${item.item}`)} className="ml-2 bg-modisoft-turquoise text-white px-2.5 py-1 rounded text-[10px] font-semibold active:scale-95">
                        Print list
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Cold drinks & ice boost (or business-specific right panel) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          {businessType === 'liquor' ? (
            // Bundle suggestions for liquor
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Bundle ideas</h2>
                  <span className="bg-modisoft-turquoise/10 text-modisoft-teal px-2 py-0.5 rounded-full text-[10px] font-semibold">AI Insights</span>
                </div>
                <button onClick={() => onShowToast('Bundle tags sent to printer')} className="bg-modisoft-turquoise text-white px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95">Print Tag</button>
              </div>
              <div className="space-y-2">
                {BUNDLE_SUGGESTIONS.map((bundle, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    i === 0 ? 'bg-yellow-50 border-yellow-200' :
                    i === 1 ? 'bg-modisoft-turquoise/5 border-modisoft-turquoise/20' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className="text-xs font-semibold text-modisoft-blue">
                      {bundle.items} {bundle.placement && `– ${bundle.placement}`}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Cold drinks & ice boost for others
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">Weather opportunity</h2>
                <span className="bg-modisoft-turquoise/10 text-modisoft-teal px-2 py-0.5 rounded-full text-[10px] font-semibold">AI Insights</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-4">
                Warm weather next week means stronger cold drink and ice sales.<br />
                Place a cooler near checkout.
              </p>
              <div className="space-y-3">
                {COLD_DRINKS_BOOST.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-modisoft-blue">{item.item}</span>
                    <span className="text-xs text-gray-500">{item.action}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== BUSINESS-TYPE SPECIFIC SECTIONS ===== */}

      {/* LIQUOR: Weekend run-up chart */}
      {businessType === 'liquor' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">Weekend run-up (Fri-Sun)</h2>
              <Info className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <p className="text-[10px] text-gray-400">Plans ahead</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKEND_RUNUP_DATA} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fri" fill="#2E595A" radius={[4, 4, 0, 0]} maxBarSize={30} name="Fri" />
                <Bar dataKey="sat" fill="#4DC1B4" radius={[4, 4, 0, 0]} maxBarSize={30} name="Sat" />
                <Bar dataKey="sun" fill="#A4CF5C" radius={[4, 4, 0, 0]} maxBarSize={30} name="Sun" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* RESTAURANT: Spoilage risk table */}
      {businessType === 'restaurant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">Spoilage risk (Next 48h)</h2>
                <Info className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <p className="text-[10px] text-gray-400">Use first, discount, or log waste</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item ↕</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Prep Date</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Shelf Life (hrs)</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Stock you can sell</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Hours left ↕</th>
                  <th className="text-center py-2 text-[10px] font-semibold text-gray-400 uppercase">Risk ↕</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {SPOILAGE_ITEMS.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.item, onHand: item.stockYouCanSell, status: item.risk === 'high' ? 'used_up' : item.risk === 'medium' ? 'low_stock' : 'covered' })}>
                    <td className="py-2.5 text-xs text-modisoft-blue font-medium hover:underline">{item.item}</td>
                    <td className="py-2.5 text-xs text-gray-600">{item.prepDate}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.shelfLifeHrs}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.stockYouCanSell}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{item.hoursLeft}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        item.risk === 'high' ? 'bg-red-100 text-red-700' :
                        item.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.risk.charAt(0).toUpperCase() + item.risk.slice(1)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => onShowToast(`Prioritized: ${item.item} — move to front display`)} className="bg-modisoft-turquoise text-white px-2 py-0.5 rounded text-[10px] font-medium active:scale-95">Prioritize sell</button>
                        <button onClick={() => onShowToast(`Discount applied to ${item.item}`)} className="bg-modisoft-yellow text-gray-900 px-2 py-0.5 rounded text-[10px] font-medium active:scale-95">Discount</button>
                        <button onClick={() => onShowToast(`Waste logged: ${item.item}`)} className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium active:scale-95">Log waste</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Prep now */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Prep now – Breakfast/lunch/dinner</h2>
            <div className="space-y-4 mt-3">
              {['breakfast', 'lunch', 'dinner'].map(meal => {
                const items = PREP_ITEMS.filter(p => p.meal === meal);
                return (
                  <div key={meal}>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 underline decoration-modisoft-turquoise underline-offset-4">
                      {meal}:
                    </p>
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-xs font-medium text-modisoft-blue">{item.item}</p>
                          <p className="text-[10px] text-gray-400">Suggested batch for next period</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPrepQuantities(prev => ({ ...prev, [item.item]: Math.max(0, (prev[item.item] || 0) - 5) }))}
                            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-modisoft-blue w-8 text-center">{prepQuantities[item.item] || item.suggestedBatch}</span>
                          <button
                            onClick={() => setPrepQuantities(prev => ({ ...prev, [item.item]: (prev[item.item] || 0) + 5 }))}
                            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => onShowToast(`Prep sheet printed: ${item.item} × ${prepQuantities[item.item] || item.suggestedBatch}`)} className="bg-modisoft-blue text-white px-3 py-1 rounded text-[10px] font-semibold active:scale-95">Print</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GROCERY: Overstock to move */}
      {businessType === 'grocery' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Overstock to move</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On Hand</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Recent Pace</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Suggestion</th>
              </tr>
            </thead>
            <tbody>
              {OVERSTOCK_ITEMS.map((item, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.item, onHand: item.onHand })}>
                  <td className="py-2.5 text-xs text-modisoft-blue font-medium hover:underline">{item.item}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.onHand}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.recentPace}</td>
                  <td className="py-2.5 text-xs text-right">
                    <span className="bg-modisoft-turquoise/10 text-modisoft-teal px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {item.suggestion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== AUTO REPLENISHMENT + QUICK CYCLE COUNT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Auto replenishment (PO draft) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Suggested order draft</h2>
            <p className="text-xs text-gray-500">Ordered in case-friendly quantities</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">OH Hand ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On Order ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">LTD ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Case ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Order ↕</th>
              </tr>
            </thead>
            <tbody>
              {autoReplenishment.map((item, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.item, onHand: item.onHand })}>
                  <td className="py-2.5 text-xs text-modisoft-blue font-medium hover:underline">{item.item}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.onHand}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.onOrder}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.leadTimeDays}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.caseSize}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.orderQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick cycle count */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Counts to check</h2>
            <p className="text-xs text-gray-500">These numbers look stale or suspicious</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On Hand</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Suggested On-Hand</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Last Count</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody>
              {CYCLE_COUNT_ITEMS.map((item, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.item, onHand: item.onHand })}>
                  <td className="py-2.5 text-xs text-modisoft-blue font-medium hover:underline">{item.item}</td>
                  <td className={`py-2.5 text-xs text-right font-medium ${item.onHand < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.onHand}
                  </td>
                  <td className={`py-2.5 text-xs text-right font-medium ${
                    item.suggestedOnHand > item.onHand ? 'text-modisoft-turquoise' : 'text-orange-500'
                  }`}>
                    {item.suggestedOnHand}
                  </td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.lastCount}</td>
                  <td className="py-2.5 text-xs text-gray-500 text-right">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TOP ITEMS TO REORDER + RESTAURANT WASTE LEDGER ===== */}
      <div className={`grid grid-cols-1 ${businessType === 'restaurant' ? 'lg:grid-cols-2' : ''} gap-4`}>
        {/* Top items to reorder */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">
              {businessType === 'liquor' ? 'Top 12 to reorder' : 'Top items to reorder'}
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-gray-400">
                {businessType === 'liquor' 
                  ? 'Order ↑ = max (0, forecast − on-hand)'
                  : 'Sized from forecast & recent sales pace'}
              </p>
              <Info className="w-3 h-3 text-gray-300" />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Order Qty ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Est. Cost ↕</th>
                <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {TOP_REORDER_ITEMS.map((item, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewItem({ name: item.item, onHand: 0, forecastUnits: item.orderQty, price: item.estCost / Math.max(1, item.orderQty) })}>
                  <td className="py-2.5 text-xs text-modisoft-blue font-medium hover:underline">{item.item}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">{item.orderQty}</td>
                  <td className="py-2.5 text-xs text-gray-600 text-right">${item.estCost}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => onShowToast(`Added to PO: ${item.item} × ${item.orderQty}`)} className="bg-modisoft-green text-white px-3 py-1 rounded text-[10px] font-semibold active:scale-95">
                      Apply to PO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Restaurant waste ledger */}
        {businessType === 'restaurant' && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Waste Ledger (Last 5)</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs w-24 focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
                />
                <input
                  type="text"
                  placeholder="Qty"
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs w-12 focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
                />
                <select className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise">
                  <option>Expired</option>
                  <option>Spilled</option>
                  <option>Dropped</option>
                  <option>Smashed</option>
                  <option>Overcooked</option>
                </select>
                <button onClick={() => onShowToast('Waste entry added to ledger')} className="bg-modisoft-green text-white px-3 py-1 rounded text-[10px] font-semibold active:scale-95">Add</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">When ↕</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item ↕</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Qty ↕</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Reason ↕</th>
                </tr>
              </thead>
              <tbody>
                {WASTE_LEDGER.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 text-xs text-gray-600">{entry.when}</td>
                    <td className="py-2.5 text-xs text-modisoft-blue font-medium">{entry.item}</td>
                    <td className="py-2.5 text-xs text-gray-600 text-right">{entry.qty}</td>
                    <td className="py-2.5 text-xs text-gray-500 text-right">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
