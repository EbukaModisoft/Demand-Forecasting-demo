export type Department = 'Grocery' | 'Snacks' | 'Beverages' | 'Household' | 'Personal Care';

export type BusinessType = 'convenience' | 'grocery' | 'liquor' | 'restaurant';

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

// ============== SCENARIO INPUTS ==============
export interface ScenarioInputs {
  promoLiftPct: number;      // -50 to +50
  weatherImpactPct: number;  // -30 to +30
  eventLiftPct: number;      // -20 to +50
  manualOverridePct: number; // -50 to +50
}

export const DEFAULT_SCENARIO_INPUTS: ScenarioInputs = {
  promoLiftPct: 0,
  weatherImpactPct: 0,
  eventLiftPct: 0,
  manualOverridePct: 0,
};

// ============== ACTION SYSTEM ==============
export type ActionType = 'labor' | 'promo' | 'pricing' | 'event' | 'fuel';
export type ActionStatus = 'open' | 'accepted' | 'done' | 'ignored';
export type ActionPriority = 'high' | 'medium' | 'low';

export interface ActionItem {
  id: string;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  description: string;
  expectedValue: number; // in dollars
  expectedValueLabel: string; // e.g., "+$1,200 revenue" or "Save 4 labor hours"
  dueDate: string; // YYYY-MM-DD
  status: ActionStatus;
  ownerRole: 'owner' | 'manager' | 'staff';
  // For labor actions
  suggestedEmployee?: {
    name: string;
    phone: string;
    role: string;
  };
  // For promo/pricing actions
  relatedItem?: string;
  relatedCategory?: string;
  // Tracking
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  ignoredReason?: string;
  // Outcome (filled after action period ends)
  outcome?: ActionOutcome;
}

export interface ActionOutcome {
  expectedValue: number;
  realizedValue: number;
  notes?: string;
  measuredAt: string;
}

// ============== CONFIDENCE ==============
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ForecastConfidence {
  level: ConfidenceLevel;
  score: number; // 0-100
  reasons: string[];
}

// ============== FUEL / GAS STATION ==============
export type FuelGrade = 'regular' | 'plus' | 'premium' | 'diesel';

export interface FuelTank {
  grade: FuelGrade;
  capacity: number; // gallons
  currentLevel: number; // gallons
  pricePerGallon: number;
  dailyAvgSales: number; // gallons per day
  reorderThreshold: number; // gallons - trigger alert below this
  lastDeliveryDate: string;
  nextDeliveryDate?: string;
}

export interface FuelDemandHour {
  hour: number; // 0-23
  gallons: number;
  transactions: number;
  isRushHour: boolean;
  weatherMultiplier: number;
}

export interface FuelDayForecast {
  date: string;
  totalGallons: number;
  totalRevenue: number;
  byGrade: Record<FuelGrade, number>; // gallons per grade
  hourlyDemand: FuelDemandHour[];
  peakHour: number;
  conversionRate: number; // % of fuel customers who buy inside
  expectedTransactions: number;
}

export interface FuelInsight {
  id: string;
  type: 'rush_hour' | 'tank_low' | 'price_alert' | 'cross_sell' | 'weather' | 'event';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  expectedImpact?: string;
}

export const FUEL_GRADE_LABELS: Record<FuelGrade, string> = {
  regular: 'Regular (87)',
  plus: 'Plus (89)',
  premium: 'Premium (93)',
  diesel: 'Diesel',
};

export const FUEL_GRADE_COLORS: Record<FuelGrade, string> = {
  regular: '#22c55e', // green
  plus: '#3b82f6', // blue
  premium: '#8b5cf6', // purple
  diesel: '#f59e0b', // amber
};
