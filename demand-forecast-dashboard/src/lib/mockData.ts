import { Plus, Minus, TrendingUp, TrendingDown, Sun, CloudRain, AlertCircle, Info, Calendar as CalendarIcon, Filter, Search, Clock, HelpCircle } from 'lucide-react';

export type Department = 'Grocery' | 'Snacks' | 'Beverages' | 'Household' | 'Personal Care';

export interface Item {
  id: string;
  name: string;
  department: Department;
  basePrice: number;
  avgDailyUnits: number;
  promoActive: boolean;
}

export interface DayData {
  date: string;
  isFuture: boolean;
  revenueActual: number | null;
  revenueForecast: number | null;
  unitsActual: number | null;
  unitsForecast: number | null;
}

export interface ItemForecast {
    itemId: string;
    forecastUnits: number;
    forecastRevenue: number;
}

// Generate Items
export const generateItems = (): Item[] => {
  const departments: Department[] = ['Grocery', 'Snacks', 'Beverages', 'Household', 'Personal Care'];
  const items: Item[] = [];
  
  for (let i = 1; i <= 85; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    items.push({
      id: `item-${i}`,
      name: `${dept} Item ${i}`,
      department: dept,
      basePrice: Number((Math.random() * 20 + 2).toFixed(2)),
      avgDailyUnits: Math.floor(Math.random() * 50) + 10,
      promoActive: false,
    });
  }
  return items;
};

// Generate Time Series Data
export const generateTimeSeriesData = (items: Item[]): DayData[] => {
  const data: DayData[] = [];
  const today = new Date();
  
  // 60 days history + today + 28 days future = 89 days
  for (let i = -60; i <= 28; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isFuture = i > 0;
    
    // Simulate aggregates
    const dailyBaseUnits = items.reduce((sum, item) => sum + item.avgDailyUnits, 0);
    const dailyBaseRevenue = items.reduce((sum, item) => sum + (item.avgDailyUnits * item.basePrice), 0);
    
    // Random variations
    const noise = (Math.random() - 0.5) * 0.2; // +/- 10%
    const trend = isFuture ? 1.05 : 1; // Slight uplift in forecast
    
    const units = Math.floor(dailyBaseUnits * (1 + noise) * trend);
    const revenue = Number((dailyBaseRevenue * (1 + noise) * trend).toFixed(2));

    data.push({
      date: dateStr,
      isFuture,
      revenueActual: isFuture ? null : revenue,
      revenueForecast: isFuture ? revenue : null, // Simplify: Forecast only for future in this view, or we could have past forecasts
      unitsActual: isFuture ? null : units,
      unitsForecast: isFuture ? units : null,
    });
  }
  return data;
};

// Helper for date formatting
export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
