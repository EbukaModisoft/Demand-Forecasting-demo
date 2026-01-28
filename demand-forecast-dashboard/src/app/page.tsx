'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Clock, 
  ChevronDown, 
  Filter,
  MoreHorizontal,
  ArrowRight,
  X,
  Star,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Info,
  Menu,
  HelpCircle,
  ChevronUp,
  Download,
  RefreshCw
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

// Filter weightings to keep KPIs/charts responsive to store/department filters
const STORE_WEIGHTS: Record<string, number> = {
  'All Stores': 1,
  'Main Street Store': 1.15,
  'Downtown Location': 1.1,
  'West Side Store': 0.95,
  'Airport Terminal': 1.25,
};

const DEPARTMENT_WEIGHTS: Record<string, number> = {
  'All Departments': 1,
  Beverages: 1.12,
  Snacks: 1.05,
  Dairy: 1.08,
  Produce: 0.98,
  Bakery: 1.02,
  Meat: 1.1,
  'Prepared Foods': 1.15,
  Household: 0.9,
};

// ============== MOCK DATA ==============
const generateForecastData = (days: number, baseRevenue: number, baseUnits: number): ForecastPoint[] => {
  const data: ForecastPoint[] = [];
  const startDate = new Date('2026-09-10');
  
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
    
    const isPast = i < 5;
    
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

const BUSINESS_PROFILES: Record<BusinessType, {
  label: string;
  baseRevenue: number;
  baseUnits: number;
  promoBoost: number;
  weatherImpact: number;
  todayVsTypical: number;
  dataHealthScore: number;
}> = {
  convenience: {
    label: 'Convenience Store',
    baseRevenue: 350,
    baseUnits: 1200,
    promoBoost: 8,
    weatherImpact: 3,
    todayVsTypical: -8,
    dataHealthScore: 28,
  },
  grocery: {
    label: 'Grocery Store',
    baseRevenue: 520,
    baseUnits: 2100,
    promoBoost: 6,
    weatherImpact: 2,
    todayVsTypical: -5,
    dataHealthScore: 32,
  },
  liquor: {
    label: 'Liquor Store',
    baseRevenue: 410,
    baseUnits: 730,
    promoBoost: 9,
    weatherImpact: 4,
    todayVsTypical: -3,
    dataHealthScore: 24,
  },
  restaurant: {
    label: 'Restaurant',
    baseRevenue: 440,
    baseUnits: 1250,
    promoBoost: 7,
    weatherImpact: 3,
    todayVsTypical: -6,
    dataHealthScore: 28,
  },
};

const INSIGHT_EVENTS: InsightEvent[] = [
  {
    id: '1',
    dateRange: ['2026-09-10', '2026-09-12'],
    label: 'Heat wave +3% for cold drinks/ice',
    type: 'weather',
    impact: '+3% cold drinks/ice'
  },
  {
    id: '2', 
    dateRange: ['2026-09-08', '2026-09-15'],
    label: 'Snacks promo: +8%',
    type: 'promo',
    impact: '+8% snack category'
  },
  {
    id: '3',
    dateRange: ['2026-09-18', '2026-09-19'],
    label: 'Today +1% vs typical',
    type: 'seasonality',
    impact: '+1% overall'
  }
];

const BUSINESS_TOP_ITEMS: Record<BusinessType, TopItem[]> = {
  convenience: [
    { id: 'c1', name: 'Bottled Water', department: 'Beverages', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: true },
    { id: 'c2', name: 'Sparkling Water', department: 'Beverages', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: false },
    { id: 'c3', name: 'Snacks Mix', department: 'Snacks', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: true },
    { id: 'c4', name: 'Bananas', department: 'Produce', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: true },
    { id: 'c5', name: 'Sourdough', department: 'Bakery', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: true },
    { id: 'c6', name: 'Chicken Wrap', department: 'Prepared', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: false },
    { id: 'c7', name: 'Paper Towel', department: 'Household', forecastRevenue: 880, forecastUnits: 190, price: 2.49, isPromoActive: true },
  ],
  grocery: [
    { id: 'g1', name: 'Organic Milk', department: 'Dairy', forecastRevenue: 1250, forecastUnits: 320, price: 4.99, isPromoActive: true },
    { id: 'g2', name: 'Fresh Bread', department: 'Bakery', forecastRevenue: 980, forecastUnits: 280, price: 3.49, isPromoActive: false },
    { id: 'g3', name: 'Chicken Breast', department: 'Meat', forecastRevenue: 1540, forecastUnits: 190, price: 8.99, isPromoActive: true },
    { id: 'g4', name: 'Organic Eggs', department: 'Dairy', forecastRevenue: 720, forecastUnits: 180, price: 5.99, isPromoActive: false },
    { id: 'g5', name: 'Mixed Greens', department: 'Produce', forecastRevenue: 640, forecastUnits: 210, price: 4.49, isPromoActive: true },
    { id: 'g6', name: 'Orange Juice', department: 'Beverages', forecastRevenue: 890, forecastUnits: 240, price: 4.29, isPromoActive: false },
    { id: 'g7', name: 'Greek Yogurt', department: 'Dairy', forecastRevenue: 560, forecastUnits: 190, price: 3.99, isPromoActive: true },
  ],
  liquor: [
    { id: 'l1', name: 'Tito\'s Vodka', department: 'Spirits', forecastRevenue: 2180, forecastUnits: 95, price: 24.99, isPromoActive: true },
    { id: 'l2', name: 'Jameson Irish', department: 'Spirits', forecastRevenue: 1890, forecastUnits: 72, price: 29.99, isPromoActive: false },
    { id: 'l3', name: 'Modelo 12pk', department: 'Beer', forecastRevenue: 1540, forecastUnits: 110, price: 16.99, isPromoActive: true },
    { id: 'l4', name: 'White Claw 12pk', department: 'Seltzer', forecastRevenue: 1320, forecastUnits: 98, price: 17.99, isPromoActive: false },
    { id: 'l5', name: 'Josh Cabernet', department: 'Wine', forecastRevenue: 980, forecastUnits: 78, price: 14.99, isPromoActive: false },
    { id: 'l6', name: 'Patron Silver', department: 'Spirits', forecastRevenue: 2450, forecastUnits: 52, price: 48.99, isPromoActive: true },
    { id: 'l7', name: 'Fireball 750ml', department: 'Spirits', forecastRevenue: 890, forecastUnits: 68, price: 18.99, isPromoActive: false },
  ],
  restaurant: [
    { id: 'r1', name: 'Signature Burger', department: 'Entrees', forecastRevenue: 2180, forecastUnits: 185, price: 12.99, isPromoActive: true },
    { id: 'r2', name: 'Grilled Salmon', department: 'Entrees', forecastRevenue: 1980, forecastUnits: 112, price: 18.99, isPromoActive: false },
    { id: 'r3', name: 'Caesar Salad', department: 'Salads', forecastRevenue: 890, forecastUnits: 145, price: 11.99, isPromoActive: true },
    { id: 'r4', name: 'Fish & Chips', department: 'Entrees', forecastRevenue: 1450, forecastUnits: 98, price: 15.99, isPromoActive: false },
    { id: 'r5', name: 'Iced Tea', department: 'Beverages', forecastRevenue: 420, forecastUnits: 280, price: 2.99, isPromoActive: true },
    { id: 'r6', name: 'House Coffee', department: 'Beverages', forecastRevenue: 380, forecastUnits: 320, price: 2.49, isPromoActive: false },
    { id: 'r7', name: 'Kids Meal', department: 'Kids', forecastRevenue: 680, forecastUnits: 145, price: 7.99, isPromoActive: true },
  ],
};

// ============== SIDEBAR ICONS ==============
const SidebarIcon = ({ icon: Icon, active = false, badge = false }: { icon: any; active?: boolean; badge?: boolean }) => (
  <button className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
    active ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
  }`}>
    <Icon className="w-5 h-5" />
    {badge && (
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#1E3A5F]" />
    )}
  </button>
);

// ============== KPI CARD COMPONENT ==============
const KpiCard = ({ 
  title, 
  value, 
  subtitle,
  tooltip 
}: { 
  title: string; 
  value: string; 
  subtitle: string;
  tooltip?: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
        {title}
        {tooltip && <Info className="w-3 h-3 text-gray-300" />}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs text-gray-400">{subtitle}</p>
  </div>
);

// ============== MAIN COMPONENT ==============
export default function DemandForecastingPage() {
  // State
  const [businessType, setBusinessType] = useState<BusinessType>('convenience');
  const businessProfile = BUSINESS_PROFILES[businessType];
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-20');
  const [forecastWindow, setForecastWindow] = useState<7 | 14 | 28>(14);
  const [explainChanges, setExplainChanges] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSunnyOpen, setIsSunnyOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [items, setItems] = useState(BUSINESS_TOP_ITEMS[businessType]);
  
  // Filter state
  const [selectedStores, setSelectedStores] = useState<string[]>(['all']);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['all']);

  // Generate forecast data
  const forecastData = useMemo(() => {
    return generateForecastData(28, businessProfile.baseRevenue, businessProfile.baseUnits);
  }, [businessType]);

  useEffect(() => {
    setItems(BUSINESS_TOP_ITEMS[businessType]);
    setCurrentPage(1);
  }, [businessType]);

  // Filter data by date range
  const filteredForecastData = useMemo(() => {
    return forecastData.filter(point => {
      return point.date >= startDate && point.date <= endDate;
    });
  }, [forecastData, startDate, endDate]);

  // Multiplier derived from store/department filters so KPIs/charts respond to selections
  const filterMultiplier = useMemo(() => {
    const storeWeight = selectedStores.includes('all')
      ? 1
      : selectedStores.reduce((sum, store) => sum + (STORE_WEIGHTS[store] ?? 1), 0) / selectedStores.length;

    const deptWeight = selectedDepartments.includes('all')
      ? 1
      : selectedDepartments.reduce((sum, dept) => sum + (DEPARTMENT_WEIGHTS[dept] ?? 1), 0) / selectedDepartments.length;

    return Number((storeWeight * deptWeight).toFixed(2));
  }, [selectedStores, selectedDepartments]);

  // Chart data transformation
  const chartData = useMemo(() => {
    return filteredForecastData.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: point.date,
      // Actual = past/current, Forecast = future. Keep them mutually exclusive so the
      // series do not overlap/intertwine.
      forecast: point.actualRevenue != null ? null : Math.round(point.forecastRevenue * filterMultiplier),
      actual: point.actualRevenue != null ? Math.round(point.actualRevenue * filterMultiplier) : null,
      forecastUnits: point.actualUnits != null ? null : Math.round(point.forecastUnits * filterMultiplier),
      actualUnits: point.actualUnits != null ? Math.round(point.actualUnits * filterMultiplier) : null,
    }));
  }, [filteredForecastData, filterMultiplier]);

  // KPI calculations
  const kpiData = useMemo(() => {
    const revenueForecast = filteredForecastData.reduce((sum, p) => sum + (p.actualRevenue ?? p.forecastRevenue), 0);
    const unitsForecast = filteredForecastData.reduce((sum, p) => sum + (p.actualUnits ?? p.forecastUnits), 0);
    return {
      revenueForecast: Math.round(revenueForecast * filterMultiplier),
      promoBoost: businessProfile.promoBoost,
      unitsForecast: Math.round(unitsForecast * filterMultiplier),
      weatherImpact: businessProfile.weatherImpact,
      todayVsTypical: businessProfile.todayVsTypical,
      dataHealthScore: businessProfile.dataHealthScore,
    };
  }, [filteredForecastData, businessProfile, filterMultiplier]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    const byDept = selectedDepartments.includes('all')
      ? items
      : items.filter(item => selectedDepartments.includes(item.department));

    if (!itemSearch) return byDept;

    return byDept.filter(item => 
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [items, itemSearch, selectedDepartments]);

  // Paginated items
  const itemsPerPage = 7;
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

  // Quick date presets for non-technical users
  const applyQuickPreset = (preset: string) => {
    const anchor = new Date(endDate);

    const setRange = (start: Date, end: Date) => {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      const spanDays = Math.min(28, Math.max(7, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1));
      if (spanDays === 7 || spanDays === 14 || spanDays === 28) {
        setForecastWindow(spanDays as 7 | 14 | 28);
      }
    };

    const dayMs = 24 * 60 * 60 * 1000;
    switch (preset) {
      case 'Today':
        setRange(anchor, anchor);
        break;
      case 'This Week': {
        const start = new Date(anchor.getTime() - 6 * dayMs);
        setRange(start, anchor);
        break;
      }
      case 'This Month': {
        const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        setRange(start, anchor);
        break;
      }
      case 'Last 7 Days': {
        const end = anchor;
        const start = new Date(anchor.getTime() - 6 * dayMs);
        setRange(start, end);
        break;
      }
      case 'Last 30 Days': {
        const end = anchor;
        const start = new Date(anchor.getTime() - 29 * dayMs);
        setRange(start, end);
        break;
      }
      default:
        break;
    }
  };

  // Toggle promo
  const handleTogglePromo = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isPromoActive: !item.isPromoActive } : item
    ));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString();
  };

  // Format large numbers (matching Figma: $19,75,283)
  const formatLargeNumber = (value: number) => {
    // Convert to Indian/Figma style comma notation
    const str = value.toString();
    let result = '';
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      if (count === 3) {
        result = ',' + result;
        count = 0;
      }
      if (count === 5 && i > 0) {
        result = ',' + result;
        count = 0;
      }
      result = str[i] + result;
      count++;
    }
    return '$' + result;
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
    <div className="min-h-screen flex bg-[#E8ECF0]">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="w-16 bg-[#1E3A5F] flex flex-col items-center py-4 fixed left-0 top-0 bottom-0 z-50">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
          <Image src="/modisoft%20logo.png" alt="Modisoft" width={40} height={40} className="object-contain" />
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 flex-1">
          <SidebarIcon icon={Star} />
          <SidebarIcon icon={Package} badge />
          <SidebarIcon icon={ShoppingCart} />
          <SidebarIcon icon={BarChart3} active />
          <SidebarIcon icon={FileText} />
          <SidebarIcon icon={Users} />
          <SidebarIcon icon={Calendar} />
          <SidebarIcon icon={TrendingUp} />
          <SidebarIcon icon={Settings} />
        </div>

        {/* Bottom icon */}
        <div className="mt-auto">
          <SidebarIcon icon={HelpCircle} />
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 ml-16">
        {/* ===== TOP NAV BAR ===== */}
        <nav className="bg-[#1E3A5F] px-6 py-3 sticky top-0 z-40 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Logo text */}
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-lg">Modisoft</span>
              <span className="text-white/40">•</span>
            </div>

            {/* Business Name Pill */}
            <div className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Business Name
            </div>

            {/* Business Type Selector */}
            <div className="relative">
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="appearance-none bg-white/15 hover:bg-white/20 text-white px-3 pr-9 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
                aria-label="Business type"
              >
                <option value="convenience">Convenience</option>
                <option value="grocery">Grocery/Retail</option>
                <option value="liquor">Liquor</option>
                <option value="restaurant">Restaurant</option>
              </select>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search For Pages, Reports And More"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              What's New
            </button>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Clock In/Out
            </button>
            <button 
              onClick={() => setIsSunnyOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Image src="/sunny.png" alt="Sunny" width={18} height={18} className="w-[18px] h-[18px]" />
              Sunny
            </button>
            <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </nav>

        {/* ===== MAIN CONTENT ===== */}
        <main className="p-6">
          {/* Page Header Row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Demand Forecasting</h1>
              <p className="text-gray-500 text-sm">Before discounts &amp; promotions</p>
              <p className="text-gray-500 text-sm">Track what's selling, forecast what's next, and optimize orders — all in one view.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Explain Changes Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={explainChanges}
                  onChange={(e) => setExplainChanges(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-600">Explain changes</span>
              </label>

              {/* Filter by item name */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by item name"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">From Date - To Date</span>
              </div>

              {/* View Filter Button */}
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                View Filter
              </button>
            </div>
          </div>

          {/* Forecast Window Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-500">Forecast window:</span>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              {[7, 14, 28].map((window) => (
                <button
                  key={window}
                  onClick={() => handleWindowChange(window as 7 | 14 | 28)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    forecastWindow === window
                      ? 'bg-[#1E3A5F] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {window} Days
                </button>
              ))}
            </div>
          </div>

          {/* ===== KPI CARDS ROW ===== */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            <KpiCard 
              title="Money coming in"
              value={formatLargeNumber(kpiData.revenueForecast)}
              subtitle={`Next ${forecastWindow} days`}
              tooltip="Predicted revenue"
            />
            <KpiCard 
              title="Promo/Pricing boost"
              value={`${kpiData.promoBoost}%`}
              subtitle="This period"
            />
            <KpiCard 
              title="Units we'll sell"
              value={`${kpiData.unitsForecast.toLocaleString()} items`}
              subtitle={`Next ${forecastWindow} days`}
            />
            <KpiCard 
              title="Weather & Events impact"
              value={`${kpiData.weatherImpact}%`}
              subtitle="This period"
            />
            <KpiCard 
              title="Today VS Typical"
              value={`${kpiData.todayVsTypical}%`}
              subtitle="Compared to normal day here"
            />
            <KpiCard 
              title="Data Health (Fixes)"
              value={`${kpiData.dataHealthScore}`}
              subtitle="Tap to Review"
            />
          </div>

          {/* ===== CHARTS ROW ===== */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Revenue Forecast Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Revenue forecast (before discounts)</h3>
                <div className="flex items-center gap-4">
                  <button className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1">
                    <Image src="/sunny.png" alt="Tip" width={12} height={12} className="w-3 h-3" />
                    Tip
                  </button>
                  <Info className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                  <span className="text-gray-600">Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      tickFormatter={(value) => value.toString()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast"
                      stroke="#14B8A6"
                      strokeWidth={2}
                      fill="url(#forecastGradient)"
                      connectNulls={false}
                      dot={{ r: 4, fill: '#14B8A6', strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Actual"
                      stroke="#FBBF24"
                      strokeWidth={2}
                      fill="url(#actualGradient)"
                      connectNulls={false}
                      dot={{ r: 4, fill: '#FBBF24', strokeWidth: 0 }}
                    />
                    {explainChanges && (
                      <>
                        <ReferenceLine x="Sep 14" stroke="#14B8A6" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'Heat wave: +3% for cold drinks/ice', position: 'top', fill: '#14B8A6', fontSize: 10 }} />
                        <ReferenceLine x="Sep 15" stroke="#F59E0B" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'Today +1% vs typical', position: 'top', fill: '#F59E0B', fontSize: 10 }} />
                        <ReferenceLine x="Sep 17" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'Snacks promo +8%', position: 'top', fill: '#8B5CF6', fontSize: 10 }} />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Units Forecast Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Units Forecast</h3>
                <div className="flex items-center gap-4">
                  <button className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1">
                    <Image src="/sunny.png" alt="Tip" width={12} height={12} className="w-3 h-3" />
                    Tip
                  </button>
                  <Info className="w-4 h-4 text-gray-300" />
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-teal-500"></div>
                  <span className="text-gray-600">Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-400"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="forecastUnits" name="Forecast Units" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actualUnits" name="Actual Units" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ===== BUSINESS-TYPE WIDGETS ===== */}
          {businessType === 'convenience' && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Fast-Mover Refill Widget */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Fast-Mover Refill (Now → +6h)</h3>
                  <button className="text-teal-600 text-sm font-medium">Print refill list</button>
                </div>
                <div className="space-y-3">
                  {[{ name: 'Bottled Water', expected: 45, onShelf: 12, backroom: 20, refillNow: 13 },
                    { name: 'Energy Drink', expected: 38, onShelf: 8, backroom: 15, refillNow: 15 },
                    { name: 'Snack Chips', expected: 32, onShelf: 5, backroom: 25, refillNow: 2 }].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-500">Expected: <strong className="text-gray-900">{item.expected}</strong></span>
                        <span className="text-gray-500">On-shelf: <strong className="text-gray-900">{item.onShelf}</strong></span>
                        <span className="text-gray-500">Backroom: <strong className="text-gray-900">{item.backroom}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.refillNow > 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          Refill: {item.refillNow}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Cold Drinks & Ice Boost Widget */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌡️</span>
                  <h3 className="font-semibold text-gray-900">Cold Drinks & Ice Boost</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Heat wave expected this weekend. +12% lift on cold beverages predicted.</p>
                <div className="flex items-center gap-2">
                  <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Order Extra</button>
                  <button className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium">Run 2-for Promo</button>
                  <button className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium border">Print Tag</button>
                </div>
              </div>
            </div>
          )}

          {businessType === 'grocery' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Categories at Risk (next 48h)</h3>
                <span className="text-xs text-gray-400">Inventory-based alerts</span>
              </div>
              <div className="space-y-3">
                {[{ category: 'Dairy', expected: 450, stockCanSell: 180, hoursLeft: 12, badge: 'Velocity-based' },
                  { category: 'Produce', expected: 380, stockCanSell: 95, hoursLeft: 8, badge: 'Inventory-based' },
                  { category: 'Bakery', expected: 220, stockCanSell: 45, hoursLeft: 6, badge: 'Inventory-based' }].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${item.badge === 'Velocity-based' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{item.badge}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-500">Expected (48h): <strong className="text-gray-900">{item.expected}</strong></span>
                      <span className="text-gray-500">Stock: <strong className="text-gray-900">{item.stockCanSell}</strong></span>
                      <span className={`font-medium ${item.hoursLeft < 12 ? 'text-red-600' : 'text-amber-600'}`}>{item.hoursLeft}h left</span>
                      <div className="flex gap-1">
                        <button className="bg-teal-500 text-white px-2 py-1 rounded text-xs">Order</button>
                        <button className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Substitute</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {businessType === 'liquor' && (
            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Weekend Run-up Widget */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Weekend Run-up (Fri–Sun)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-gray-600">🍺 Beer</span><span className="font-bold text-gray-900">+340 units</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600">🍷 Wine</span><span className="font-bold text-gray-900">+180 units</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600">🥃 Spirits</span><span className="font-bold text-gray-900">+95 units</span></div>
                </div>
              </div>
              
              {/* Bundle Suggestions Widget */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">🎁 Bundle Suggestions</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="font-medium">Tito's + Mixers Bundle</p>
                    <p className="text-gray-500 text-xs">Vodka + Tonic + Limes</p>
                    <button className="mt-2 text-teal-600 text-xs font-medium">Print shelf tag</button>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="font-medium">Wine Night Pack</p>
                    <p className="text-gray-500 text-xs">2 Reds + Cheese Crackers</p>
                    <button className="mt-2 text-teal-600 text-xs font-medium">Print shelf tag</button>
                  </div>
                </div>
              </div>
              
              {/* Top 12 to Re-Order Widget */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Top 12 to Re-Order</h3>
                <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                  {['Tito\'s Vodka', 'Modelo 12pk', 'White Claw', 'Jameson'].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{item}</span>
                      <button className="text-teal-600 text-xs font-medium">+ Add to PO</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {businessType === 'restaurant' && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Spoilage Risk Widget */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">⚠️ Spoilage Risk (next 48h)</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {[{ item: 'Fresh Salmon', prepDate: 'Jan 13', shelfLife: '48h', stock: 12, hoursLeft: 8, risk: 'High' },
                    { item: 'Mixed Greens', prepDate: 'Jan 14', shelfLife: '24h', stock: 8, hoursLeft: 16, risk: 'Med' }].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="font-medium text-gray-900">{row.item}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-xs">Prep: {row.prepDate}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{row.risk}</span>
                        <button className="text-teal-600 text-xs">Prioritize</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Prep Now Widget */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">👨‍🍳 Prep Now (Lunch)</h3>
                <div className="space-y-2 text-sm">
                  {[{ item: 'Burger Patties', qty: 24 }, { item: 'Caesar Dressing', qty: '2 gal' }, { item: 'Fries (blanched)', qty: '15 lb' }].map((row, i) => (
                    <div key={i} className="flex justify-between items-center bg-white rounded-lg p-2 border border-green-200">
                      <span className="font-medium">{row.item}</span>
                      <span className="text-gray-600">{row.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Print prep list</button>
                  <button className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium border">Defer to later</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== BOTTOM ROW: INSIGHTS + TABLE ===== */}
          <div className="grid grid-cols-4 gap-6">
            {/* AI Insights Panel */}
            <div className="col-span-1 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">AI Insights</h3>
                <button 
                  onClick={() => setIsSunnyOpen(true)}
                  className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  <Image src="/sunny.png" alt="Sunny" width={16} height={16} className="w-4 h-4" />
                  Ask Sunny
                </button>
              </div>
              
              <div className="space-y-3">
                {INSIGHT_EVENTS.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`p-3 rounded-lg text-sm font-medium ${
                      insight.type === 'weather' ? 'bg-sky-50 text-sky-800' :
                      insight.type === 'promo' ? 'bg-amber-50 text-amber-800' :
                      'bg-teal-50 text-teal-800'
                    }`}
                  >
                    {insight.label}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-gray-400">
                Sunny reads the same filters (stores, department, items) you're using here.
              </p>
            </div>

            {/* Top Items Table */}
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Top items next 14 days</h3>
                <div className="flex items-center gap-2">
                  <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Edit scenario the compare
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item <ChevronUp className="w-3 h-3 inline ml-1" />
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department <ChevronUp className="w-3 h-3 inline ml-1" />
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Forecast $ <ChevronUp className="w-3 h-3 inline ml-1" />
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Forecast Units <ChevronUp className="w-3 h-3 inline ml-1" />
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Promo <ChevronUp className="w-3 h-3 inline ml-1" />
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price <ChevronUp className="w-3 h-3 inline ml-1" />
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-gray-600">{item.department}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-medium text-gray-900">{formatCurrency(item.forecastRevenue)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-gray-600">{item.forecastUnits}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => handleTogglePromo(item.id)}
                            className={`relative w-9 h-5 rounded-full transition-colors ${item.isPromoActive ? 'bg-teal-500' : 'bg-gray-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${item.isPromoActive ? 'translate-x-4' : ''}`} />
                          </button>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-gray-600">{item.price.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                            Apply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ===== SUNNY SIDE PANEL ===== */}
      {isSunnyOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsSunnyOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-4 bg-[#1E3A5F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white rounded-lg">
                  <Image src="/sunny.png" alt="Sunny" width={28} height={28} className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Sunny</h3>
                </div>
              </div>
              <button onClick={() => setIsSunnyOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-700 mb-3">
                  Hi 👋 good question! 🙌 Heatwaves usually change customer behavior in predictable ways! Here's a quick friendly breakdown of how forecaster 🌡️ might affect your sales and some practical moves to help you prepare and profit:
                </p>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold">🌡️ Likely sales impacts:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Cold drinks & freezer treats</strong> ↑ → Bottled drinks, iced coffee, slushies, ice cream, and chilled snack sales see higher demand.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type message..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
                <button className="absolute right-2 top-2 p-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== VIEW FILTER DRAWER ===== */}
      {isFilterOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-5 bg-[#1E3A5F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white text-lg">View Filter</h3>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Filter Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-gray-50">
              {/* Store Selector */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Store Location</label>
                <div className="space-y-2">
                  {['All Stores', 'Main Street Store', 'Downtown Location', 'West Side Store', 'Airport Terminal'].map((store) => (
                    <label key={store} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStores.includes('all') || selectedStores.includes(store)}
                        onChange={(e) => {
                          if (store === 'All Stores') {
                            setSelectedStores(e.target.checked ? ['all'] : []);
                          } else {
                            setSelectedStores(prev => 
                              e.target.checked 
                                ? [...prev.filter(s => s !== 'all'), store]
                                : prev.filter(s => s !== store)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{store}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Department Filter */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Department</label>
                <div className="space-y-2">
                  {['All Departments', 'Beverages', 'Snacks', 'Dairy', 'Produce', 'Bakery', 'Meat', 'Prepared Foods', 'Household'].map((dept) => (
                    <label key={dept} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes('all') || selectedDepartments.includes(dept)}
                        onChange={(e) => {
                          if (dept === 'All Departments') {
                            setSelectedDepartments(e.target.checked ? ['all'] : []);
                          } else {
                            setSelectedDepartments(prev => 
                              e.target.checked 
                                ? [...prev.filter(d => d !== 'all'), dept]
                                : prev.filter(d => d !== dept)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Quick Select</label>
                <div className="flex flex-wrap gap-2">
                  {['Today', 'This Week', 'This Month', 'Last 7 Days', 'Last 30 Days'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyQuickPreset(preset)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-teal-50 hover:text-teal-600 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
              <button 
                onClick={() => {
                  setSelectedStores(['all']);
                  setSelectedDepartments(['all']);
                  setStartDate('2026-09-10');
                  setEndDate('2026-09-20');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
