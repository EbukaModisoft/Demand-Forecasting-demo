/**
 * Action Engine - Generates smart recommendations based on forecast data
 * Actions types: labor, promo, pricing, event/weather
 */

import { 
  ActionItem, 
  ActionType, 
  ActionPriority,
  ScenarioInputs,
  ForecastConfidence,
  ConfidenceLevel,
  FuelInsight
} from '../types';

// ============== INPUT TYPES ==============
export interface LaborPlanDay {
  date: string;
  dayLabel: string;
  covers: number;
  scheduledHours: number;
  neededHours: number;
  deltaHours: number;
  recommendation: 'Upstaff' | 'Downstaff' | 'Hold';
  reason: string;
  assignedEmployees: string[];
  suggestedEmployees: string[];
}

export interface InsightEvent {
  id: string;
  dateRange: [string, string];
  label: string;
  type: 'weather' | 'promo' | 'seasonality';
  impact: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  availability: number[];
  maxHoursPerWeek: number;
  hourlyRate: number;
}

export interface TopItem {
  id: string;
  name: string;
  department: string;
  forecastRevenue: number;
  forecastUnits: number;
  price: number;
  isPromoActive: boolean;
}

export interface KpiData {
  revenueForecast: number;
  promoBoost: number;
  unitsForecast: number;
  weatherImpact: number;
  todayVsTypical: number;
  dataHealthScore: number;
}

export type BusinessType = 'convenience' | 'grocery' | 'liquor' | 'restaurant';

export interface ActionEngineInput {
  businessType: BusinessType;
  laborPlan: LaborPlanDay[];
  insightEvents: InsightEvent[];
  topItems: TopItem[];
  employees: Employee[];
  kpiData: KpiData;
  scenarioInputs: ScenarioInputs;
  currentDate: string; // YYYY-MM-DD

  // Optional fuel insights (convenience stores / gas stations)
  fuelInsights?: FuelInsight[];
  fuelPrimaryDate?: string; // YYYY-MM-DD for due dates
}

// ============== HELPER FUNCTIONS ==============
function generateId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now().toString(36)}`;
}

function getPriority(value: number, thresholds: { high: number; medium: number }): ActionPriority {
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
}

function formatCurrency(value: number): string {
  return value >= 0 ? `+$${value.toLocaleString()}` : `-$${Math.abs(value).toLocaleString()}`;
}

// ============== ACTION GENERATORS ==============

function generateLaborActions(input: ActionEngineInput): ActionItem[] {
  const actions: ActionItem[] = [];
  const { laborPlan, employees, currentDate, businessType } = input;

  // Find days that need upstaffing (high priority)
  const upstaffDays = laborPlan.filter(day => day.recommendation === 'Upstaff' && day.deltaHours > 2);
  
  upstaffDays.slice(0, 3).forEach((day, index) => {
    const dayOfWeek = new Date(day.date).getDay();
    const availableEmployee = employees.find(emp => 
      emp.availability.includes(dayOfWeek) && 
      !day.assignedEmployees.includes(emp.name)
    );

    const laborSavings = Math.abs(day.deltaHours) * 18; // Estimated revenue per labor hour

    actions.push({
      id: generateId('labor-up', index),
      type: 'labor',
      priority: getPriority(Math.abs(day.deltaHours), { high: 6, medium: 3 }),
      title: `Add staff for ${day.dayLabel}`,
      description: `Need ${Math.abs(day.deltaHours)} more hours. ${day.reason}`,
      expectedValue: laborSavings,
      expectedValueLabel: `${formatCurrency(laborSavings)} potential revenue`,
      dueDate: day.date,
      status: 'open',
      ownerRole: 'manager',
      suggestedEmployee: availableEmployee ? {
        name: availableEmployee.name,
        phone: availableEmployee.phone,
        role: availableEmployee.role,
      } : undefined,
      createdAt: currentDate,
    });
  });

  // Find days that can reduce staff (cost savings)
  const downstaffDays = laborPlan.filter(day => day.recommendation === 'Downstaff' && day.deltaHours < -3);
  
  downstaffDays.slice(0, 2).forEach((day, index) => {
    const laborSavings = Math.abs(day.deltaHours) * 15; // Hourly rate estimate

    actions.push({
      id: generateId('labor-down', index),
      type: 'labor',
      priority: 'medium',
      title: `Reduce hours on ${day.dayLabel}`,
      description: `${Math.abs(day.deltaHours)} hours over-scheduled. ${day.reason}`,
      expectedValue: laborSavings,
      expectedValueLabel: `Save $${laborSavings} in labor`,
      dueDate: day.date,
      status: 'open',
      ownerRole: 'manager',
      createdAt: currentDate,
    });
  });

  return actions;
}

function generatePromoActions(input: ActionEngineInput): ActionItem[] {
  const actions: ActionItem[] = [];
  const { topItems, insightEvents, currentDate, businessType, scenarioInputs } = input;

  // Find items that could benefit from a promo based on events
  const upcomingEvents = insightEvents.filter(evt => 
    evt.dateRange[0] >= currentDate && 
    (evt.type === 'seasonality' || evt.type === 'weather')
  );

  if (upcomingEvents.length > 0) {
    const event = upcomingEvents[0];
    const topItem = topItems.find(item => !item.isPromoActive);
    
    if (topItem) {
      const expectedLift = topItem.forecastRevenue * 0.12; // 12% lift estimate

      actions.push({
        id: generateId('promo-event', 0),
        type: 'promo',
        priority: 'high',
        title: `Run promo for ${event.label}`,
        description: `${topItem.name} could see +12% lift during this period. Consider a promotional price or bundle.`,
        expectedValue: Math.round(expectedLift),
        expectedValueLabel: formatCurrency(Math.round(expectedLift)) + ' revenue',
        dueDate: event.dateRange[0],
        status: 'open',
        ownerRole: 'manager',
        relatedItem: topItem.name,
        relatedCategory: topItem.department,
        createdAt: currentDate,
      });
    }
  }

  // Suggest extending successful promos
  const activePromoItems = topItems.filter(item => item.isPromoActive).slice(0, 2);
  activePromoItems.forEach((item, index) => {
    const extendValue = item.forecastRevenue * 0.08;

    actions.push({
      id: generateId('promo-extend', index),
      type: 'promo',
      priority: 'medium',
      title: `Consider extending ${item.name} promo`,
      description: `Current promo is performing well. Extending could maintain momentum.`,
      expectedValue: Math.round(extendValue),
      expectedValueLabel: formatCurrency(Math.round(extendValue)) + ' continued lift',
      dueDate: currentDate,
      status: 'open',
      ownerRole: 'manager',
      relatedItem: item.name,
      relatedCategory: item.department,
      createdAt: currentDate,
    });
  });

  return actions;
}

function generatePricingActions(input: ActionEngineInput): ActionItem[] {
  const actions: ActionItem[] = [];
  const { topItems, kpiData, currentDate, businessType } = input;

  // Only suggest pricing tests on high-volume items without active promos
  const candidateItems = topItems
    .filter(item => !item.isPromoActive && item.forecastUnits > 100)
    .slice(0, 2);

  // If demand is strong (positive todayVsTypical), suggest a small price test
  if (kpiData.todayVsTypical > 0) {
    candidateItems.forEach((item, index) => {
      const priceIncrease = item.price * 0.05; // 5% increase
      const expectedGain = item.forecastUnits * priceIncrease * 0.7; // Assume 30% volume loss

      if (expectedGain > 50) {
        actions.push({
          id: generateId('pricing-up', index),
          type: 'pricing',
          priority: 'low',
          title: `Test price increase on ${item.name}`,
          description: `Demand is strong. A ${(priceIncrease).toFixed(2)} increase could improve margin with minimal volume loss.`,
          expectedValue: Math.round(expectedGain),
          expectedValueLabel: formatCurrency(Math.round(expectedGain)) + ' margin',
          dueDate: currentDate,
          status: 'open',
          ownerRole: 'owner',
          relatedItem: item.name,
          relatedCategory: item.department,
          createdAt: currentDate,
        });
      }
    });
  }

  // If demand is weak, suggest promotional pricing
  if (kpiData.todayVsTypical < -5) {
    const slowItem = topItems.find(item => !item.isPromoActive);
    if (slowItem) {
      const discountAmount = slowItem.price * 0.10;
      const volumeLift = slowItem.forecastUnits * 0.25;
      const netValue = (volumeLift * slowItem.price) - (slowItem.forecastUnits * discountAmount);

      actions.push({
        id: generateId('pricing-down', 0),
        type: 'pricing',
        priority: 'medium',
        title: `Consider discount on ${slowItem.name}`,
        description: `Slower than usual traffic. A 10% discount could drive volume.`,
        expectedValue: Math.round(Math.max(netValue, 0)),
        expectedValueLabel: `+${Math.round(volumeLift)} units potential`,
        dueDate: currentDate,
        status: 'open',
        ownerRole: 'owner',
        relatedItem: slowItem.name,
        relatedCategory: slowItem.department,
        createdAt: currentDate,
      });
    }
  }

  return actions;
}

function generateEventActions(input: ActionEngineInput): ActionItem[] {
  const actions: ActionItem[] = [];
  const { insightEvents, currentDate, businessType, kpiData } = input;

  // Weather-related actions
  const weatherEvents = insightEvents.filter(evt => 
    evt.type === 'weather' && 
    evt.dateRange[0] >= currentDate
  );

  weatherEvents.slice(0, 2).forEach((event, index) => {
    const isPositive = event.impact.includes('+');
    const impactValue = kpiData.revenueForecast * 0.03; // 3% of forecast

    actions.push({
      id: generateId('event-weather', index),
      type: 'event',
      priority: isPositive ? 'medium' : 'high',
      title: `Prepare for: ${event.label}`,
      description: isPositive 
        ? `Expected boost of ${event.impact}. Ensure adequate staffing and stock.`
        : `Expected impact of ${event.impact}. Consider adjusting staffing down or running promotions.`,
      expectedValue: Math.round(impactValue),
      expectedValueLabel: isPositive ? formatCurrency(Math.round(impactValue)) + ' opportunity' : 'Risk mitigation',
      dueDate: event.dateRange[0],
      status: 'open',
      ownerRole: 'manager',
      createdAt: currentDate,
    });
  });

  // Seasonality/local event actions
  const localEvents = insightEvents.filter(evt => 
    evt.type === 'seasonality' && 
    evt.dateRange[0] >= currentDate
  );

  localEvents.slice(0, 2).forEach((event, index) => {
    const isPositive = event.impact.includes('+');
    const impactValue = kpiData.revenueForecast * 0.05;

    actions.push({
      id: generateId('event-local', index),
      type: 'event',
      priority: 'high',
      title: `${event.label}`,
      description: `Expected ${event.impact}. ${isPositive ? 'Great opportunity to maximize sales!' : 'Plan accordingly.'}`,
      expectedValue: Math.round(impactValue),
      expectedValueLabel: formatCurrency(Math.round(impactValue)) + ' potential',
      dueDate: event.dateRange[0],
      status: 'open',
      ownerRole: 'owner',
      createdAt: currentDate,
    });
  });

  return actions;
}

function estimateFuelExpectedValue(insight: FuelInsight): number {
  // Demo-friendly heuristics: show plausible $ impact so actions have a "value".
  switch (insight.type) {
    case 'tank_low':
      return insight.priority === 'high' ? 800 : insight.priority === 'medium' ? 400 : 200;
    case 'rush_hour':
      return insight.priority === 'high' ? 250 : 120;
    case 'cross_sell':
      return 90;
    case 'price_alert':
      return 300;
    case 'weather':
    case 'event':
      return 150;
    default:
      return 100;
  }
}

function generateFuelActions(input: ActionEngineInput): ActionItem[] {
  const { fuelInsights, currentDate, fuelPrimaryDate, businessType } = input;
  if (businessType !== 'convenience') return [];
  if (!fuelInsights || fuelInsights.length === 0) return [];

  const dueDate = fuelPrimaryDate ?? currentDate;

  return fuelInsights.map((insight, index) => {
    const expectedValue = estimateFuelExpectedValue(insight);

    const titlePrefix =
      insight.type === 'tank_low' ? 'Fuel: ' :
      insight.type === 'rush_hour' ? 'Fuel: ' :
      insight.type === 'cross_sell' ? 'Fuel → Store: ' :
      'Fuel: ';

    return {
      id: generateId('fuel', index),
      type: 'fuel',
      priority: insight.priority,
      title: `${titlePrefix}${insight.title}`,
      description: insight.description,
      expectedValue,
      expectedValueLabel: insight.expectedImpact
        ? `${insight.expectedImpact}`
        : `${formatCurrency(expectedValue)} potential`,
      dueDate,
      status: 'open',
      ownerRole: insight.type === 'tank_low' ? 'manager' : 'owner',
      relatedCategory: 'Fuel',
      createdAt: currentDate,
    } satisfies ActionItem;
  });
}

// ============== MAIN FUNCTION ==============
export function buildActions(input: ActionEngineInput): ActionItem[] {
  const laborActions = generateLaborActions(input);
  const promoActions = generatePromoActions(input);
  const pricingActions = generatePricingActions(input);
  const eventActions = generateEventActions(input);
  const fuelActions = generateFuelActions(input);

  // Combine and sort by priority, then by expected value
  const allActions = [
    ...laborActions,
    ...promoActions,
    ...pricingActions,
    ...eventActions,
    ...fuelActions,
  ];

  const priorityOrder: Record<ActionPriority, number> = { high: 0, medium: 1, low: 2 };

  return allActions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.expectedValue - a.expectedValue;
  });
}

// ============== SCENARIO MULTIPLIER ==============
export function calculateScenarioMultiplier(inputs: ScenarioInputs): number {
  const { promoLiftPct, weatherImpactPct, eventLiftPct, manualOverridePct } = inputs;
  
  // Combine effects (not strictly additive—diminishing returns)
  const combinedPct = promoLiftPct + weatherImpactPct + eventLiftPct + manualOverridePct;
  const cappedPct = Math.max(-50, Math.min(100, combinedPct)); // Cap at -50% to +100%
  
  return 1 + (cappedPct / 100);
}

// ============== CONFIDENCE CALCULATION ==============
export function calculateConfidence(input: {
  dataHealthScore: number;
  activeEventCount: number;
  historicalVariance?: number; // 0-100, higher = more volatile
}): ForecastConfidence {
  const { dataHealthScore, activeEventCount, historicalVariance = 20 } = input;

  // Base score from data health (lower issues = better)
  let score = 100 - (dataHealthScore * 2); // dataHealthScore of 30 → 40 points

  // Penalize for multiple overlapping events (more uncertainty)
  score -= activeEventCount * 8;

  // Penalize for historical variance
  score -= historicalVariance * 0.3;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: ConfidenceLevel;
  const reasons: string[] = [];

  if (score >= 70) {
    level = 'high';
  } else if (score >= 45) {
    level = 'medium';
    if (dataHealthScore > 20) reasons.push('Some data quality issues');
    if (activeEventCount > 1) reasons.push('Multiple events affecting forecast');
  } else {
    level = 'low';
    if (dataHealthScore > 25) reasons.push('Data quality needs attention');
    if (activeEventCount > 2) reasons.push('High uncertainty from overlapping events');
    if (historicalVariance > 40) reasons.push('Category has high historical volatility');
  }

  if (reasons.length === 0) {
    reasons.push(level === 'high' ? 'Stable patterns, good data quality' : 'Based on available data');
  }

  return { level, score: Math.round(score), reasons };
}

// ============== ACTION STATE HELPERS ==============
export function updateActionStatus(
  actions: ActionItem[],
  actionId: string,
  newStatus: ActionItem['status'],
  additionalData?: Partial<ActionItem>
): ActionItem[] {
  return actions.map(action => {
    if (action.id !== actionId) return action;

    const now = new Date().toISOString().split('T')[0];
    const updates: Partial<ActionItem> = { status: newStatus, ...additionalData };

    if (newStatus === 'accepted') updates.acceptedAt = now;
    if (newStatus === 'done') updates.completedAt = now;

    return { ...action, ...updates };
  });
}

export function getActionStats(actions: ActionItem[]) {
  const open = actions.filter(a => a.status === 'open');
  const accepted = actions.filter(a => a.status === 'accepted');
  const done = actions.filter(a => a.status === 'done');
  const ignored = actions.filter(a => a.status === 'ignored');

  return {
    openCount: open.length,
    acceptedCount: accepted.length,
    doneCount: done.length,
    ignoredCount: ignored.length,
    totalExpectedValue: open.reduce((sum, a) => sum + a.expectedValue, 0),
    completedValue: done.reduce((sum, a) => sum + a.expectedValue, 0),
  };
}
