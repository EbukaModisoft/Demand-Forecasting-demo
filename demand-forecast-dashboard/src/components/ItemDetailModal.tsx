'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ShoppingCart,
  Printer,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  History,
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

export interface ItemDetailData {
  name: string;
  department?: string;
  onHand: number;
  parLevel?: number;
  price?: number;
  cost?: number;
  forecastUnits?: number;
  status?: 'covered' | 'low_stock' | 'used_up' | string;
  lastCount?: string;
  lastOrder?: string;
  vendor?: string;
  upc?: string;
  category?: string;
}

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetailData | null;
  onOrder: (item: ItemDetailData) => void;
  onShowToast: (message: string) => void;
}

// Generate mock 7-day sales history for any item
function generateSalesHistory(itemName: string): { day: string; units: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const seed = itemName.length * 7;
  return days.map((day, i) => {
    const base = 8 + (seed % 15);
    const weekend = i >= 5 ? 1.3 : 1;
    const variance = 0.7 + ((seed * (i + 1)) % 60) / 100;
    return { day, units: Math.round(base * weekend * variance) };
  });
}

// Mock recent activity
function generateRecentActivity(itemName: string): { action: string; date: string; detail: string }[] {
  return [
    { action: 'Sold', date: '2 hours ago', detail: '3 units at register' },
    { action: 'Count adjusted', date: 'Yesterday', detail: 'Changed from 42 to 38' },
    { action: 'Order received', date: '3 days ago', detail: '24 units from distributor' },
    { action: 'Price changed', date: '1 week ago', detail: `Updated to $${((itemName.length * 1.3) % 10 + 2).toFixed(2)}` },
  ];
}

const statusConfig = {
  covered: { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  low_stock: { label: 'Running Low', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  used_up: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
} as const;

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ isOpen, onClose, item, onOrder, onShowToast }) => {
  const [adjustedCount, setAdjustedCount] = useState<number | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  if (!isOpen || !item) return null;

  const salesHistory = generateSalesHistory(item.name);
  const recentActivity = generateRecentActivity(item.name);
  const avgDailySales = Math.round(salesHistory.reduce((s, d) => s + d.units, 0) / 7);
  const daysOfStock = item.onHand > 0 ? Math.round(item.onHand / Math.max(1, avgDailySales)) : 0;
  const trend = salesHistory[6].units > salesHistory[0].units ? 'up' : salesHistory[6].units < salesHistory[0].units ? 'down' : 'flat';
  const status = item.status || (daysOfStock > 5 ? 'covered' : daysOfStock > 2 ? 'low_stock' : 'used_up');
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.covered;

  const effectiveCount = adjustedCount ?? item.onHand;

  const handleSaveCount = () => {
    setIsAdjusting(false);
    onShowToast(`Count updated: ${item.name} → ${effectiveCount} units`);
  };

  const handlePrintLabel = () => {
    onShowToast(`Label queued for printing: ${item.name}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-modisoft-blue to-modisoft-teal px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{item.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                {item.department && (
                  <span className="text-white/70 text-sm">{item.department}</span>
                )}
                {item.upc && (
                  <span className="text-white/50 text-xs font-mono">UPC: {item.upc}</span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
            <div className="p-4 border-r border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-500 mb-1">On Hand</p>
              <p className="text-2xl font-bold text-modisoft-blue">{item.onHand}</p>
              <p className="text-xs text-gray-400">units</p>
            </div>
            <div className="p-4 border-r border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-500 mb-1">Par Level</p>
              <p className="text-2xl font-bold text-modisoft-blue">{item.parLevel || '—'}</p>
              <p className="text-xs text-gray-400">target</p>
            </div>
            <div className="p-4 border-r border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-500 mb-1">Avg Daily Sales</p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-modisoft-blue">{avgDailySales}</p>
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
              <p className="text-xs text-gray-400">units/day</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 mb-1">Days of Stock</p>
              <p className={`text-2xl font-bold ${daysOfStock <= 2 ? 'text-red-600' : daysOfStock <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {daysOfStock}
              </p>
              <p className="text-xs text-gray-400">at current pace</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Count Adjust */}
            {isAdjusting ? (
              <div className="bg-modisoft-turquoise/5 border border-modisoft-turquoise/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-modisoft-blue mb-3">Adjust count for {item.name}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdjustedCount(Math.max(0, effectiveCount - 1))}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={effectiveCount}
                    onChange={(e) => setAdjustedCount(Math.max(0, Number(e.target.value)))}
                    className="w-24 text-center text-2xl font-bold text-modisoft-blue border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise"
                  />
                  <button
                    onClick={() => setAdjustedCount(effectiveCount + 1)}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveCount}
                    className="ml-4 px-5 py-2.5 bg-modisoft-turquoise hover:bg-modisoft-teal text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Save Count
                  </button>
                  <button
                    onClick={() => { setIsAdjusting(false); setAdjustedCount(null); }}
                    className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Quick Action Buttons */
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => onOrder(item)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-modisoft-turquoise/20 bg-modisoft-turquoise/5 hover:bg-modisoft-turquoise/10 hover:border-modisoft-turquoise/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-modisoft-turquoise/15 group-hover:bg-modisoft-turquoise/25 flex items-center justify-center transition-colors">
                    <ShoppingCart className="w-5 h-5 text-modisoft-teal" />
                  </div>
                  <span className="text-sm font-semibold text-modisoft-teal">Order More</span>
                </button>
                <button
                  onClick={() => { setIsAdjusting(true); setAdjustedCount(item.onHand); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-modisoft-blue/30 hover:bg-modisoft-blue/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-modisoft-blue/10 flex items-center justify-center transition-colors">
                    <Edit3 className="w-5 h-5 text-gray-600 group-hover:text-modisoft-blue" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Adjust Count</span>
                </button>
                <button
                  onClick={handlePrintLabel}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-modisoft-yellow/50 hover:bg-modisoft-yellow/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-modisoft-yellow/15 flex items-center justify-center transition-colors">
                    <Printer className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Print Label</span>
                </button>
                <button
                  onClick={() => onShowToast(`Viewing sales history for ${item.name}`)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-modisoft-green/40 hover:bg-modisoft-green/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-modisoft-green/15 flex items-center justify-center transition-colors">
                    <History className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">View History</span>
                </button>
              </div>
            )}

            {/* Sales Chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-modisoft-teal" />
                <h3 className="text-sm font-bold text-modisoft-blue">Last 7 Days Sales</h3>
                <span className="text-xs text-gray-400 ml-auto">
                  {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'} this week
                </span>
              </div>
              <div className="h-36 bg-gray-50 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`${value} units`, 'Sold']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {salesHistory.map((entry, i) => (
                        <Cell key={i} fill={i >= 5 ? '#4DC1B4' : '#2E595A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Price + Vendor Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Pricing</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sell price</span>
                    <span className="text-sm font-bold text-modisoft-blue">${item.price?.toFixed(2) || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cost</span>
                    <span className="text-sm font-bold text-gray-700">${item.cost?.toFixed(2) || (item.price ? (item.price * 0.6).toFixed(2) : '—')}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-sm text-gray-600">Margin</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {item.price ? `${Math.round(((item.price - (item.cost || item.price * 0.6)) / item.price) * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Supply Info</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendor</span>
                    <span className="text-sm font-medium text-gray-700">{item.vendor || 'Primary Dist.'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lead time</span>
                    <span className="text-sm font-medium text-gray-700">1–2 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last ordered</span>
                    <span className="text-sm font-medium text-gray-700">{item.lastOrder || '3 days ago'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-modisoft-teal" />
                <h3 className="text-sm font-bold text-modisoft-blue">Recent Activity</h3>
              </div>
              <div className="space-y-2">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.action === 'Sold' ? 'bg-modisoft-turquoise' :
                      activity.action.includes('Count') ? 'bg-modisoft-yellow' :
                      activity.action.includes('Order') ? 'bg-modisoft-green' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700">{activity.action}</span>
                      <span className="text-sm text-gray-400 ml-2">{activity.detail}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{activity.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Last counted: {item.lastCount || 'Yesterday'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onOrder(item)}
              className="px-5 py-2 text-sm font-semibold text-white bg-modisoft-turquoise hover:bg-modisoft-teal rounded-lg transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Order More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
