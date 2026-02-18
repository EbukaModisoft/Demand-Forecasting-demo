export type Department = 'Grocery' | 'Snacks' | 'Beverages' | 'Household' | 'Personal Care';

export type BusinessType = 'admin' | 'convenience' | 'grocery' | 'liquor' | 'restaurant';

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
  baselineRevenue?: number | null;
  baselineUnits?: number | null;
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
  priceImpactPct: number;    // -30 to +30 (price increase = negative demand, decrease = positive)
  newItemImpactPct: number;  // -10 to +50 (new menu/product launch lift)
}

export const DEFAULT_SCENARIO_INPUTS: ScenarioInputs = {
  promoLiftPct: 0,
  weatherImpactPct: 0,
  eventLiftPct: 0,
  manualOverridePct: 0,
  priceImpactPct: 0,
  newItemImpactPct: 0,
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
  label: string; // display name e.g. "Regular Unleaded 1"
  capacity: number; // gallons
  currentLevel: number; // gallons
  pricePerGallon: number;
  profitPerGallon: number; // margin per gallon
  dailyAvgSales: number; // gallons per day
  averageSellingPrice: number; // average daily selling revenue
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
  tips?: string[];
}

export const FUEL_GRADE_LABELS: Record<FuelGrade, string> = {
  regular: 'Regular (87)',
  plus: 'Plus (89)',
  premium: 'Premium (93)',
  diesel: 'Diesel',
};

export const FUEL_GRADE_COLORS: Record<FuelGrade, string> = {
  regular: '#0B1932', // modisoft-blue
  plus: '#3b82f6', // blue (unused)
  premium: '#4DC1B4', // modisoft-turquoise
  diesel: '#2E595A', // modisoft-teal
};

// ============== NEW ITEM SIMULATOR ==============
export interface NewItemInput {
  name: string;
  price: number;
  category: Department | 'Prepared Foods' | 'Hot Beverages' | 'Alcohol' | 'Spirits' | 'Beer/Wine';
  storeId: string;
  isPromo: boolean;
  promoDiscountPct: number;
}

export interface NewItemProjection {
  dailyUnits: number;
  dailyRevenue: number;
  weeklyUnits: number;
  weeklyRevenue: number;
  monthlyUnits: number;
  monthlyRevenue: number;
  cannibalizationPct: number;
  netNewRevenue: number;
  breakEvenDays: number;
  confidenceScore: number;
  demandCurve: { day: number; units: number; revenue: number }[];
  insights: string[];
}

export const DEFAULT_NEW_ITEM_INPUT: NewItemInput = {
  name: '',
  price: 0,
  category: 'Snacks',
  storeId: 'all',
  isPromo: false,
  promoDiscountPct: 0,
};

// ============== EXECUTION / PLAN SYSTEM ==============
export type PlanStatus = 'draft' | 'approved' | 'in_progress' | 'completed' | 'archived';

export interface ApprovedPlan {
  id: string;
  name: string;
  status: PlanStatus;
  dateRange: { from: string; to: string }; // YYYY-MM-DD
  scenarioInputs: ScenarioInputs;
  approvedAt: string;
  approvedBy: string;
  notes: string;
  // Snapshot at time of approval
  forecastedRevenue: number;
  forecastedUnits: number;
  // Tracked actuals (filled as days pass)
  actualRevenue: number;
  actualUnits: number;
  // Actions locked to this plan
  actionIds: string[];
}

export interface PacingDay {
  date: string;
  dayLabel: string;
  forecastRevenue: number;
  actualRevenue: number | null;
  forecastUnits: number;
  actualUnits: number | null;
  variance: number | null;     // % vs forecast
  status: 'ahead' | 'on_track' | 'behind' | 'pending';
}

export interface WeeklyReviewSummary {
  planId: string;
  planName: string;
  dateRange: { from: string; to: string };
  forecastRevenue: number;
  actualRevenue: number;
  revenueVariance: number;     // %
  forecastUnits: number;
  actualUnits: number;
  unitsVariance: number;       // %
  actionsCompleted: number;
  actionsTotal: number;
  completedValue: number;
  highlights: string[];
  lessonsLearned: string[];
}

