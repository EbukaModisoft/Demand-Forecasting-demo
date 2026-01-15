export type Department = 'Grocery' | 'Snacks' | 'Beverages' | 'Household' | 'Personal Care';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterState {
  searchTerm: string;
  departments: Department[];
  showExplain: boolean;
}

export interface KpiData {
  revenueForecast: number;
  promoBoost: number;
  unitsForecast: number;
  weatherImpact: number;
  todayVsTypical: number;
  dataHealthScore: number;
}

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  isFuture: boolean;
  actual?: number | null;
  forecast?: number | null;
  annotation?: string; // For "Explain changes"
}

export interface ItemRow {
  id: string;
  name: string;
  department: Department;
  forecastRevenue: number;
  forecastUnits: number;
  price: number;
  isPromoActive: boolean;
}

export interface Insight {
  id: string;
  title: string;
  impactLabel: string;
  description: string;
  type: 'weather' | 'promo' | 'alert';
}

export interface Scenario {
  id: string;
  name: string;
  changes: string[]; // description of changes
}
