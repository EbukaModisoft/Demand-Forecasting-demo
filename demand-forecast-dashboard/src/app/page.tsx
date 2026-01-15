'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  Sun, 
  ChevronDown, 
  Filter,
  MoreHorizontal,
  Sparkles,
  ArrowRight,
  DollarSign,
  Tag,
  Package,
  Cloud,
  Calendar,
  Activity,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// ============== TYPES ==============
type BusinessType = 'convenience' | 'grocery' | 'liquor' | 'restaurant';

interface ForecastPoint {
  date: string;
  forecastRevenue: number;
  actualRevenue?: number;
  forecastUnits: number;
  actualUnits?: number;
}

interface InsightEvent {
  id: string;
  dateRange: [string, string];
  label: string;
  type: 'weather' | 'promo' | 'seasonality';
  impact: string;
}

interface TopItem {
  id: string;
  name: string;
  department: string;
  forecastRevenue: number;
  forecastUnits: number;
  price: number;
  isPromoActive: boolean;
}

interface MetricCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

// ============== MOCK DATA ==============
const generateForecastData = (days: number, baseRevenue: number, baseUnits: number): ForecastPoint[] => {
  const data: ForecastPoint[] = [];
  const startDate = new Date('2026-01-01');
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.3 : 1;
    
    const variance = 0.9 + Math.random() * 0.2;
    const forecastRevenue = Math.round(baseRevenue * weekendMultiplier * variance);
    const forecastUnits = Math.round(baseUnits * weekendMultiplier * variance);
    
    // Only have actuals for past dates (before Jan 9)
    const isPast = i < 8;
    
    data.push({
      date: dateStr,
      forecastRevenue,
      actualRevenue: isPast ? Math.round(forecastRevenue * (0.95 + Math.random() * 0.1)) : undefined,
      forecastUnits,
      actualUnits: isPast ? Math.round(forecastUnits * (0.95 + Math.random() * 0.1)) : undefined,
    });
  }
  
  return data;
};

const INSIGHT_EVENTS: InsightEvent[] = [
  {
    id: '1',
    dateRange: ['2026-01-10', '2026-01-12'],
    label: 'Heat wave incoming',
    type: 'weather',
    impact: '+3% cold drinks/ice'
  },
  {
    id: '2', 
    dateRange: ['2026-01-08', '2026-01-15'],
    label: 'Snacks multi-buy promo',
    type: 'promo',
    impact: '+8% snack category'
  },
  {
    id: '3',
    dateRange: ['2026-01-18', '2026-01-19'],
    label: 'Big Game Weekend',
    type: 'seasonality',
    impact: '+12% overall traffic'
  }
];

const TOP_ITEMS: TopItem[] = [
  { id: '1', name: 'Coca-Cola 20oz', department: 'Beverages', forecastRevenue: 4250, forecastUnits: 1890, price: 2.49, isPromoActive: true },
  { id: '2', name: 'Lay\'s Classic Chips', department: 'Snacks', forecastRevenue: 3180, forecastUnits: 920, price: 3.99, isPromoActive: true },
  { id: '3', name: 'Red Bull 12oz', department: 'Beverages', forecastRevenue: 2940, forecastUnits: 680, price: 4.49, isPromoActive: false },
  { id: '4', name: 'Monster Energy', department: 'Beverages', forecastRevenue: 2650, forecastUnits: 610, price: 4.29, isPromoActive: false },
  { id: '5', name: 'Doritos Nacho', department: 'Snacks', forecastRevenue: 2420, forecastUnits: 590, price: 4.49, isPromoActive: true },
  { id: '6', name: 'Gatorade 32oz', department: 'Beverages', forecastRevenue: 2180, forecastUnits: 720, price: 2.99, isPromoActive: false },
  { id: '7', name: 'Snickers Bar', department: 'Snacks', forecastRevenue: 1950, forecastUnits: 1120, price: 1.79, isPromoActive: false },
  { id: '8', name: 'Pepsi 20oz', department: 'Beverages', forecastRevenue: 1840, forecastUnits: 820, price: 2.49, isPromoActive: true },
];

const METRICS: MetricCard[] = [
  {
    title: 'Money coming in',
    value: '$48.2K',
    subtitle: 'Next 14 days forecast',
    icon: <DollarSign className="w-5 h-5" />,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    title: 'Promo/Pricing boost',
    value: '+8.4%',
    subtitle: 'vs no-promo baseline',
    icon: <Tag className="w-5 h-5" />,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    title: 'Units we\'ll sell',
    value: '12.4K',
    subtitle: 'Projected volume',
    icon: <Package className="w-5 h-5" />,
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600'
  },
  {
    title: 'Weather & events',
    value: '+2.1%',
    subtitle: 'Heat wave this weekend',
    icon: <Cloud className="w-5 h-5" />,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600'
  },
  {
    title: 'Today vs Typical',
    value: '+1.2%',
    subtitle: 'Above average Tuesday',
    icon: <Calendar className="w-5 h-5" />,
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600'
  },
  {
    title: 'Data health',
    value: '98%',
    subtitle: 'All feeds connected',
    icon: <Activity className="w-5 h-5" />,
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600'
  }
];

const LOCATIONS = ['Downtown Market', 'Airport Express', 'University Plaza', 'Westside Mall'];

// ============== MAIN COMPONENT ==============
export default function DemandForecastingPage() {
  // State
  const [businessType, setBusinessType] = useState<BusinessType>('convenience');
  const [location, setLocation] = useState('Downtown Market');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-14');
  const [forecastWindow, setForecastWindow] = useState<7 | 14 | 28>(14);
  const [explainChanges, setExplainChanges] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSunnyOpen, setIsSunnyOpen] = useState(false);
  const [items, setItems] = useState(TOP_ITEMS);

  // Generate forecast data
  const forecastData = useMemo(() => {
    return generateForecastData(28, 3500, 850);
  }, []);

  // Filter data by date range
  const filteredForecastData = useMemo(() => {
    return forecastData.filter(point => {
      return point.date >= startDate && point.date <= endDate;
    });
  }, [forecastData, startDate, endDate]);

  // Chart data transformation
  const chartData = useMemo(() => {
    return filteredForecastData.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: point.date,
      forecast: point.forecastRevenue,
      actual: point.actualRevenue || null,
      forecastUnits: point.forecastUnits,
      actualUnits: point.actualUnits || null,
    }));
  }, [filteredForecastData]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!itemSearch) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [items, itemSearch]);

  // Paginated items
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle forecast window change
  const handleWindowChange = (window: 7 | 14 | 28) => {
    setForecastWindow(window);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + window - 1);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Toggle promo
  const handleTogglePromo = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isPromoActive: !item.isPromoActive } : item
    ));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Units') ? entry.value?.toLocaleString() : formatCurrency(entry.value || 0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ===== TOP NAV BAR ===== */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-gray-900">Modisoft</span>
            </div>

            {/* Business Type Pill */}
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100">
              <span>Convenience Store</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Location Dropdown */}
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Global Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              What's New
            </button>
            <button className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-100">
              <Clock className="w-4 h-4" />
              Clock In/Out
            </button>
            <button 
              onClick={() => setIsSunnyOpen(true)}
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors relative"
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
              JD
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">DEMAND PLANNING</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Demand Forecasting</h1>
            <p className="text-gray-500 text-sm">Track what's selling, forecast what's next, and optimize orders — all in one view.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-gray-700 border-none focus:outline-none bg-transparent"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm text-gray-700 border-none focus:outline-none bg-transparent"
              />
            </div>

            {/* Explain Changes Toggle */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600">Explain changes</span>
              <button
                onClick={() => setExplainChanges(!explainChanges)}
                className={`relative w-10 h-5 rounded-full transition-colors ${explainChanges ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${explainChanges ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Forecast Window Buttons */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {[7, 14, 28].map((window) => (
              <button
                key={window}
                onClick={() => handleWindowChange(window as 7 | 14 | 28)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  forecastWindow === window
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {window}-day
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Item Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by item name..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters Button */}
            <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* ===== METRICS CARDS ===== */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {METRICS.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{metric.title}</span>
                <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                  <span className={metric.iconColor}>{metric.icon}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
              <p className="text-xs text-gray-500">{metric.subtitle}</p>
            </div>
          ))}
        </div>

        {/* ===== CHARTS ROW ===== */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Revenue Forecast Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Revenue forecast</h3>
                <p className="text-sm text-gray-500">Before discounts</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#forecastGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="transparent"
                    strokeDasharray="4 4"
                  />
                  {explainChanges && (
                    <ReferenceLine x="Jan 10" stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '🌡️', position: 'top' }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Units Forecast Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Units forecast</h3>
                <p className="text-sm text-gray-500">Projected volume</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-violet-500"></div>
                  <span className="text-gray-600">Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-violet-300"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="forecastUnits" name="Forecast Units" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualUnits" name="Actual Units" fill="#C4B5FD" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ===== BOTTOM ROW: INSIGHTS + TABLE ===== */}
        <div className="grid grid-cols-4 gap-6">
          {/* Sunny's Insights Panel */}
          <div className="col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Sunny's Insights</h3>
            </div>
            
            <div className="space-y-3">
              {INSIGHT_EVENTS.map((insight) => (
                <div key={insight.id} className="bg-white/80 backdrop-blur rounded-lg p-3 border border-amber-100 hover:border-amber-200 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{insight.label}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      insight.type === 'weather' ? 'bg-sky-100 text-sky-700' :
                      insight.type === 'promo' ? 'bg-violet-100 text-violet-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {insight.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{insight.impact}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsSunnyOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-lg font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Ask Sunny
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Top Items Table */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Top items next 14 days</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{filteredItems.length} items</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Forecast $</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Forecast Units</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Promo</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          item.department === 'Beverages' ? 'bg-sky-50 text-sky-700' :
                          item.department === 'Snacks' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.department}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(item.forecastRevenue)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-gray-600">{item.forecastUnits.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleTogglePromo(item.id)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${item.isPromoActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${item.isPromoActive ? 'translate-x-4' : ''}`} />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-gray-600">${item.price.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== SUNNY SIDE PANEL ===== */}
      {isSunnyOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsSunnyOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Sunny AI</h3>
                  <p className="text-xs text-amber-600 font-medium">Demand Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsSunnyOpen(false)} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Insight</span>
                </div>
                <p className="text-sm text-gray-700">
                  Hi! I noticed a <span className="font-semibold text-orange-600">heat wave</span> incoming this weekend (90°F+). 
                  Should I adjust the forecast for cold beverages and ice?
                </p>
              </div>
              <div className="bg-gray-900 text-white rounded-2xl rounded-tr-none p-4 ml-8 shadow-md">
                <p className="text-sm">Yes, apply the hot weather pattern from last July.</p>
              </div>
              <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  <span>✓</span>
                  <span>Updated</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Done! I've updated forecasts:</p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-800">Cold Beverages</span>
                    <span className="font-semibold text-emerald-600">+12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-800">Ice Products</span>
                    <span className="font-semibold text-emerald-600">+8%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask Sunny a question..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
                <button className="absolute right-2 top-2 p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white shadow-md hover:shadow-lg transition-shadow">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Sunny can make mistakes. Please check important info.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
