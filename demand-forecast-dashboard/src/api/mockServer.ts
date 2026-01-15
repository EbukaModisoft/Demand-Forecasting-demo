import { DateRange, FilterState, KpiData, TimeSeriesPoint, ItemRow, Insight, Department } from '../types';

// Simple seeded random to ensure deterministic results across renders
class Seeder {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Range [min, max)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

const seeder = new Seeder(12345);

const DEPARTMENTS: Department[] = ['Grocery', 'Snacks', 'Beverages', 'Household', 'Personal Care'];

// Helper to generate dates
const getDatesArray = (start: Date, end: Date) => {
  const arr = [];
  const dt = new Date(start);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
};

// --- MOCK DATA STORE ---
// We generate a static set of items first to simulate a DB
const ITEMS_DB: ItemRow[] = Array.from({ length: 100 }).map((_, i) => ({
  id: `item-${i}`,
  name: `Item ${i + 1} - ${['Classic', 'Super', 'Organic', 'Value'][i % 4]} ${['Chips', 'Soda', 'Soap', 'Bread', 'Milk'][i % 5]}`,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  forecastRevenue: 0, // dynamic
  forecastUnits: 0,   // dynamic
  price: 2.99 + (i % 10),
  isPromoActive: i % 10 === 0,
}));


export const mockServer = {
  getKpis: async (dateRange: DateRange, filters: FilterState): Promise<KpiData> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Dynamic based on inputs just for show
    const days = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    const baseRevenue = 15000 * days;
    const modifier = filters.searchTerm ? 0.4 : 1; 

    return {
      revenueForecast: baseRevenue * modifier + seeder.range(-1000, 1000),
      promoBoost: 8.4 + (filters.showExplain ? 0.5 : 0),
      unitsForecast: (baseRevenue / 15) * modifier,
      weatherImpact: 2.1,
      todayVsTypical: 1.2,
      dataHealthScore: 98
    };
  },

  getRevenueSeries: async (dateRange: DateRange, filters: FilterState): Promise<TimeSeriesPoint[]> => {
    const dates = getDatesArray(dateRange.from, dateRange.to);
    const today = new Date();
    today.setHours(0,0,0,0);

    return dates.map(d => {
      const isFuture = d > today;
      const isToday = d.getTime() === today.getTime();
      const baseVal = 5000 + (d.getDay() === 6 || d.getDay() === 0 ? 2000 : 0); // Weekends higher

      let actual = isFuture ? null : baseVal + seeder.range(-500, 500);
      let forecast = baseVal + seeder.range(-200, 800); // Forecast slightly optimistic

      // If explain changes is on, add annotations
      let annotation = undefined;
      if (filters.showExplain && isFuture && d.getDay() === 5) { // Fridays have insights
        annotation = "Heat wave";
      }

      // If strict future logic:
      // Past: Actual exists, Forecast maybe exists (comparison) or not. 
      // Future: Actual null, Forecast exists.
      
      return {
        date: d.toISOString().split('T')[0],
        isFuture,
        actual: isFuture ? null : actual,
        forecast: isFuture ? forecast : (actual ? actual : forecast), // visual continuity for past
        annotation
      };
    });
  },

  getUnitsSeries: async (dateRange: DateRange, filters: FilterState): Promise<TimeSeriesPoint[]> => {
    const dates = getDatesArray(dateRange.from, dateRange.to);
    const today = new Date();
    today.setHours(0,0,0,0);

    return dates.map(d => {
      const isFuture = d > today;
      const baseUnits = 400 + (d.getDay() === 6 || d.getDay() === 0 ? 150 : 0);

      let actual = isFuture ? null : baseUnits + seeder.range(-50, 50);
      let forecast = baseUnits + seeder.range(-30, 80);

      let annotation = undefined;
      if (filters.showExplain && isFuture && d.getDay() === 6) {
        annotation = "Sport Event";
      }

      return {
        date: d.toISOString().split('T')[0],
        isFuture,
        actual: isFuture ? null : actual,
        forecast: isFuture ? forecast : (actual ? actual : forecast), 
        annotation
      };
    });
  },

  getTopItems: async (params: { page: number, perPage: number, sort: string } & FilterState): Promise<{ items: ItemRow[], total: number }> => {
    let filtered = [...ITEMS_DB];
    
    // 1. Text Filter
    if (params.searchTerm) {
      filtered = filtered.filter(i => i.name.toLowerCase().includes(params.searchTerm.toLowerCase()));
    }
    
    // 2. Department Filter
    if (params.departments.length > 0) {
      filtered = filtered.filter(i => params.departments.includes(i.department));
    }

    // 3. Mock Sort (only handling Forecast $ for simplicity if requested, otherwise default id)
    // In a real app we'd sort dynamically.

    // 4. Pagination
    const start = (params.page - 1) * params.perPage;
    const end = start + params.perPage;
    const sliced = filtered.slice(start, end);

    // Decorate with dynamic forecast values based on randomness re-run
    const hydrated = sliced.map(item => ({
      ...item,
      forecastRevenue: Math.floor(Math.random() * 5000) + 1000,
      forecastUnits: Math.floor(Math.random() * 500) + 50,
    }));

    return {
      items: hydrated,
      total: filtered.length
    };
  },

  getInsights: async (): Promise<Insight[]> => {
    return [
      { id: '1', title: 'Heat wave +3%', impactLabel: 'Cold drinks/ice', description: 'Incoming heat wave this weekend will drive sales of beverages.', type: 'weather' },
      { id: '2', title: 'Snacks promo +8%', impactLabel: 'Promotion', description: 'The new multi-buy promo is performing well above category benchmark.', type: 'promo' },
      { id: '3', title: 'Today +1% vs typical', impactLabel: 'Performance', description: 'Traffic reflects a slightly busier than usual Tuesday.', type: 'alert' },
    ];
  }
};
