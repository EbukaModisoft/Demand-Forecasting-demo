import type {
  BusinessType,
  InventoryKpiData,
  InventoryItem,
  FastMoverItem,
  AutoReplenishmentItem,
  CycleCountItem,
  SlowMoverItem,
  SpoilageItem,
  PrepItem,
  WasteLedgerEntry,
  BundleSuggestion,
  InventoryHealthAction,
} from '../types';

// ============== KPI DATA ==============

// ============== AT-RISK ITEMS (items that need action) ==============
export type AtRiskItem = {
  name: string;
  department: string;
  onHand: number;
  forecastNeed: number;
  daysLeft: number;
  risk: 'critical' | 'warning';
  reason: string;
  aiInsight?: string;
  fix: string;
  fixAction: 'order' | 'substitute' | 'discount' | 'count' | 'move';
};

export const AT_RISK_ITEMS: Record<BusinessType, AtRiskItem[]> = {
  admin: [
    { name: 'Coca-Cola 20oz', department: 'Beverages', onHand: 8, forecastNeed: 45, daysLeft: 0.4, risk: 'critical', reason: 'Selling faster than expected — will stock out today', fix: 'Order 2 cases now', fixAction: 'order' },
    { name: 'Red Bull 12oz', department: 'Beverages', onHand: 5, forecastNeed: 30, daysLeft: 0.3, risk: 'critical', reason: 'Empty by lunch rush', fix: 'Move backroom stock to shelf', fixAction: 'move' },
    { name: 'Lays Classic', department: 'Snacks', onHand: 12, forecastNeed: 35, daysLeft: 0.7, risk: 'critical', reason: 'Weekend demand spike expected', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Oreo Single', department: 'Snacks', onHand: 18, forecastNeed: 25, daysLeft: 1.4, risk: 'warning', reason: 'Below reorder point', fix: 'Add to next PO', fixAction: 'order' },
    { name: 'Monster Energy', department: 'Beverages', onHand: 6, forecastNeed: 20, daysLeft: 0.6, risk: 'critical', reason: 'Hot weather driving sales up 40%', fix: 'Order or substitute with Reign', fixAction: 'substitute' },
    { name: 'Gatorade 20oz', department: 'Beverages', onHand: 10, forecastNeed: 22, daysLeft: 0.9, risk: 'warning', reason: 'Weather forecast: 90°F this week', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Marlboro Red', department: 'Tobacco', onHand: 3, forecastNeed: 12, daysLeft: 0.5, risk: 'critical', reason: 'Top seller running dry', fix: 'Emergency restock from distributor', fixAction: 'order' },
    { name: 'Doritos Nacho', department: 'Snacks', onHand: 15, forecastNeed: 20, daysLeft: 1.5, risk: 'warning', reason: 'Game day tomorrow', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Coffee Cups 16oz', department: 'Supplies', onHand: 22, forecastNeed: 85, daysLeft: 0.5, risk: 'critical', reason: 'Morning rush will burn through these', fix: 'Move backup sleeves from storage', fixAction: 'move' },
    { name: 'Hot Dog Buns', department: 'Bakery', onHand: 8, forecastNeed: 24, daysLeft: 0.7, risk: 'critical', reason: 'Roller grill gets busy at lunch', fix: 'Order from bakery vendor', fixAction: 'order' },
    { name: 'Bottled Water 16oz', department: 'Beverages', onHand: 24, forecastNeed: 50, daysLeft: 1.0, risk: 'warning', reason: 'Heat wave coming — demand up 60%', fix: 'Order 3 cases', fixAction: 'order' },
    { name: 'Swisher Sweets', department: 'Tobacco', onHand: 4, forecastNeed: 8, daysLeft: 1.0, risk: 'warning', reason: 'Below par level, count looks off', fix: 'Do a quick count first', fixAction: 'count' },
  ],
  convenience: [
    { name: 'Coca-Cola 20oz', department: 'Beverages', onHand: 8, forecastNeed: 45, daysLeft: 0.4, risk: 'critical', reason: 'Selling faster than expected — will stock out today', fix: 'Order 2 cases now', fixAction: 'order' },
    { name: 'Red Bull 12oz', department: 'Beverages', onHand: 5, forecastNeed: 30, daysLeft: 0.3, risk: 'critical', reason: 'Empty by lunch rush', fix: 'Move backroom stock to shelf', fixAction: 'move' },
    { name: 'Lays Classic', department: 'Snacks', onHand: 12, forecastNeed: 35, daysLeft: 0.7, risk: 'critical', reason: 'Weekend demand spike expected', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Oreo Single', department: 'Snacks', onHand: 18, forecastNeed: 25, daysLeft: 1.4, risk: 'warning', reason: 'Below reorder point', fix: 'Add to next PO', fixAction: 'order' },
    { name: 'Monster Energy', department: 'Beverages', onHand: 6, forecastNeed: 20, daysLeft: 0.6, risk: 'critical', reason: 'Hot weather driving sales up 40%', fix: 'Order or substitute with Reign', fixAction: 'substitute' },
    { name: 'Gatorade 20oz', department: 'Beverages', onHand: 10, forecastNeed: 22, daysLeft: 0.9, risk: 'warning', reason: 'Weather forecast: 90°F this week', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Marlboro Red', department: 'Tobacco', onHand: 3, forecastNeed: 12, daysLeft: 0.5, risk: 'critical', reason: 'Top seller running dry', fix: 'Emergency restock from distributor', fixAction: 'order' },
    { name: 'Doritos Nacho', department: 'Snacks', onHand: 15, forecastNeed: 20, daysLeft: 1.5, risk: 'warning', reason: 'Game day tomorrow', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Coffee Cups 16oz', department: 'Supplies', onHand: 22, forecastNeed: 85, daysLeft: 0.5, risk: 'critical', reason: 'Morning rush will burn through these', fix: 'Move backup sleeves from storage', fixAction: 'move' },
    { name: 'Hot Dog Buns', department: 'Bakery', onHand: 8, forecastNeed: 24, daysLeft: 0.7, risk: 'critical', reason: 'Roller grill gets busy at lunch', fix: 'Order from bakery vendor', fixAction: 'order' },
    { name: 'Bottled Water 16oz', department: 'Beverages', onHand: 24, forecastNeed: 50, daysLeft: 1.0, risk: 'warning', reason: 'Heat wave coming — demand up 60%', fix: 'Order 3 cases', fixAction: 'order' },
    { name: 'Swisher Sweets', department: 'Tobacco', onHand: 4, forecastNeed: 8, daysLeft: 1.0, risk: 'warning', reason: 'Below par level, count looks off', fix: 'Do a quick count first', fixAction: 'count' },
  ],
  grocery: [
    { name: 'Whole Milk Gallon', department: 'Dairy', onHand: 8, forecastNeed: 60, daysLeft: 0.3, risk: 'critical', reason: 'Sunday demand — families stocking up', aiInsight: 'Day-of-week model: Sunday dairy sales are 2.1× weekday avg. Combined with school-break pattern — demand +18% this week', fix: 'Order 3 cases ASAP', fixAction: 'order' },
    { name: 'Bananas', department: 'Produce', onHand: 15, forecastNeed: 80, daysLeft: 0.4, risk: 'critical', reason: '#1 produce item, almost out', aiInsight: 'Top SKU by volume. Velocity model: 11.4 units/hr during 8am-12pm. Will hit zero by 9:30am at current rate.', fix: 'Emergency produce order', fixAction: 'order' },
    { name: 'Large Eggs 12ct', department: 'Dairy', onHand: 12, forecastNeed: 55, daysLeft: 0.4, risk: 'critical', reason: 'Breakfast staple — will miss morning shoppers', aiInsight: 'Basket analysis: eggs appear in 31% of morning baskets. Stockout here reduces avg basket size by $4.20.', fix: 'Order from backup supplier', fixAction: 'order' },
    { name: 'Bread White', department: 'Bakery', onHand: 10, forecastNeed: 40, daysLeft: 0.5, risk: 'critical', reason: 'Runs out every weekend', fix: 'Double bread order', fixAction: 'order' },
    { name: 'Chicken Thighs', department: 'Meat', onHand: 18, forecastNeed: 35, daysLeft: 1.0, risk: 'warning', reason: 'Promo starting tomorrow', fix: 'Order extra for promo', fixAction: 'order' },
    { name: 'Greek Yogurt', department: 'Dairy', onHand: 20, forecastNeed: 30, daysLeft: 1.3, risk: 'warning', reason: 'Health trend — sales up 25%', fix: 'Add to next PO', fixAction: 'order' },
    { name: 'Avocados', department: 'Produce', onHand: 6, forecastNeed: 25, daysLeft: 0.5, risk: 'critical', reason: 'Taco Tuesday promo tomorrow', fix: 'Order 2 cases', fixAction: 'order' },
    { name: 'Ground Turkey', department: 'Meat', onHand: 10, forecastNeed: 18, daysLeft: 1.1, risk: 'warning', reason: 'Below par, no substitute on shelf', fix: 'Substitute with chicken if needed', fixAction: 'substitute' },
    { name: 'Strawberries', department: 'Produce', onHand: 8, forecastNeed: 22, daysLeft: 0.7, risk: 'critical', reason: 'Expiring in 2 days + high demand', aiInsight: 'Spoilage model: 35% waste probability if not sold by tomorrow. Price elasticity calc: 20% discount moves 3× volume', fix: 'Discount now, order fresh batch', fixAction: 'discount' },
    { name: 'Almond Milk', department: 'Dairy', onHand: 14, forecastNeed: 20, daysLeft: 1.4, risk: 'warning', reason: 'Growing demand, low on shelf', fix: 'Restock from backroom', fixAction: 'move' },
    { name: 'Paper Towels', department: 'Household', onHand: 5, forecastNeed: 15, daysLeft: 0.7, risk: 'critical', reason: 'Essential item — customers leave without it', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Pasta Sauce', department: 'Grocery', onHand: 22, forecastNeed: 28, daysLeft: 1.6, risk: 'warning', reason: 'Count might be off — last counted 12 days ago', fix: 'Quick count check', fixAction: 'count' },
  ],
  liquor: [
    { name: 'Modelo 12pk', department: 'Beer', onHand: 5, forecastNeed: 35, daysLeft: 0.3, risk: 'critical', reason: 'Weekend coming — #1 beer seller', aiInsight: 'Friday-Saturday model: Modelo outsells #2 beer by 2.8×. Last 6 weekends avg 38 units — current stock covers 14% of expected demand.', fix: 'Order 5 cases now', fixAction: 'order' },
    { name: 'Hennessy VS', department: 'Spirits', onHand: 3, forecastNeed: 12, daysLeft: 0.5, risk: 'critical', reason: 'High-margin item almost out', aiInsight: 'Margin analysis: $15/bottle margin × 12 units = $180 lost revenue if stocked out. Substitution rate to other cognac is only 22%.', fix: 'Emergency order', fixAction: 'order' },
    { name: 'White Claw 12pk', department: 'Seltzer', onHand: 8, forecastNeed: 25, daysLeft: 0.6, risk: 'critical', reason: 'Summer demand + low stock', aiInsight: 'Seasonal model: seltzer category +52% Apr-Sep. White Claw = 64% of seltzer sales. Cross-buy with Modelo in 38% of baskets.', fix: 'Order 3 cases', fixAction: 'order' },
    { name: 'Tito\'s 750ml', department: 'Spirits', onHand: 4, forecastNeed: 15, daysLeft: 0.5, risk: 'critical', reason: 'Best-selling spirit, almost empty', fix: 'Reorder from distributor', fixAction: 'order' },
    { name: 'Twisted Tea 12pk', department: 'Beer', onHand: 10, forecastNeed: 18, daysLeft: 1.1, risk: 'warning', reason: 'Warm weather boosting sales', fix: 'Add to PO', fixAction: 'order' },
    { name: 'Jack Daniels', department: 'Spirits', onHand: 6, forecastNeed: 10, daysLeft: 1.2, risk: 'warning', reason: 'Below par level', fix: 'Order 1 case', fixAction: 'order' },
    { name: 'Truly Variety', department: 'Seltzer', onHand: 7, forecastNeed: 14, daysLeft: 1.0, risk: 'warning', reason: 'Can substitute with White Claw if out', fix: 'Substitute or reorder', fixAction: 'substitute' },
    { name: 'Fireball 750ml', department: 'Spirits', onHand: 3, forecastNeed: 8, daysLeft: 0.8, risk: 'critical', reason: 'Party season pickup', fix: 'Order today', fixAction: 'order' },
  ],
  restaurant: [
    { name: 'Salmon Fillet', department: 'Protein', onHand: 5, forecastNeed: 25, daysLeft: 0.4, risk: 'critical', reason: 'Dinner feature item — will 86 by 7pm', aiInsight: 'Menu mix model: salmon appears in 18% of dinner tickets ($28 avg entree). 86-ing it drops avg check by $6.40 and increases walkouts 3%.', fix: 'Emergency order from fish supplier', fixAction: 'order' },
    { name: 'Cheese Slices', department: 'Dairy', onHand: 10, forecastNeed: 70, daysLeft: 0.3, risk: 'critical', reason: 'Used in burgers, sandwiches, breakfast — runs out fast', aiInsight: 'Ingredient dependency: cheese is used in 12 of 24 menu items. Stockout cascades to 50% of menu within 4 hours.', fix: 'Order 2 cases', fixAction: 'order' },
    { name: 'Mixed Greens', department: 'Produce', onHand: 8, forecastNeed: 45, daysLeft: 0.4, risk: 'critical', reason: 'Salads are 30% of lunch orders', aiInsight: 'Lunch model: 11:30am-1:30pm salad orders = 34% of tickets. Current greens last ~45 min into lunch rush.', fix: 'Emergency produce run', fixAction: 'order' },
    { name: 'Chicken Wings', department: 'Protein', onHand: 12, forecastNeed: 50, daysLeft: 0.5, risk: 'critical', reason: 'Game night special tomorrow', aiInsight: 'Event correlation: game nights drive wing sales 3.2× normal. Last 4 game nights averaged 48 units. Current stock covers 24%.', fix: 'Double the wing order', fixAction: 'order' },
    { name: 'Burger Buns', department: 'Bakery', onHand: 30, forecastNeed: 100, daysLeft: 0.6, risk: 'critical', reason: 'Weekend brunch + dinner rush', fix: 'Order from bakery vendor', fixAction: 'order' },
    { name: 'Tomatoes', department: 'Produce', onHand: 15, forecastNeed: 30, daysLeft: 1.0, risk: 'warning', reason: 'Below par — used in 8 menu items', fix: 'Add to produce order', fixAction: 'order' },
    { name: 'Heavy Cream', department: 'Dairy', onHand: 2, forecastNeed: 8, daysLeft: 0.5, risk: 'critical', reason: 'Needed for sauces and desserts tonight', fix: 'Quick run to wholesale', fixAction: 'order' },
    { name: 'French Fries', department: 'Frozen', onHand: 40, forecastNeed: 120, daysLeft: 0.7, risk: 'critical', reason: 'Most ordered side — burns through fast', fix: 'Order 2 cases', fixAction: 'order' },
    { name: 'Ranch Dressing', department: 'Condiments', onHand: 3, forecastNeed: 10, daysLeft: 0.6, risk: 'critical', reason: 'Customers ask for it with everything', fix: 'Substitute or emergency buy', fixAction: 'substitute' },
    { name: 'To-Go Containers', department: 'Supplies', onHand: 50, forecastNeed: 85, daysLeft: 1.2, risk: 'warning', reason: 'Delivery orders spiking', fix: 'Order next batch', fixAction: 'order' },
    { name: 'Olive Oil', department: 'Cooking', onHand: 1, forecastNeed: 4, daysLeft: 0.5, risk: 'critical', reason: 'Used in almost every dish', fix: 'Emergency purchase', fixAction: 'order' },
    { name: 'Bacon', department: 'Protein', onHand: 8, forecastNeed: 20, daysLeft: 0.8, risk: 'warning', reason: 'Brunch feature item this weekend', fix: 'Add extra to next meat order', fixAction: 'order' },
    { name: 'Lemon', department: 'Produce', onHand: 6, forecastNeed: 15, daysLeft: 0.8, risk: 'warning', reason: 'Bar + kitchen both need these', fix: 'Add to produce order', fixAction: 'order' },
    { name: 'Coffee Beans', department: 'Beverages', onHand: 3, forecastNeed: 10, daysLeft: 0.6, risk: 'critical', reason: 'Morning service depends on this', fix: 'Emergency reorder', fixAction: 'order' },
  ],
};
export const INVENTORY_KPI: Record<BusinessType, InventoryKpiData> = {
  admin: {
    itemsAtRisk: 12,
    moneyInSlowMovers: 75283,
    stockOutsPrevented: 7,
    dataHealthFixes: 18,
    inventoryHealthScore: 71,
  },
  convenience: {
    itemsAtRisk: 12,
    moneyInSlowMovers: 75283,
    stockOutsPrevented: 7,
    dataHealthFixes: 18,
    inventoryHealthScore: 71,
  },
  grocery: {
    itemsAtRisk: 12,
    moneyInSlowMovers: 75283,
    stockOutsPrevented: 7,
    dataHealthFixes: 18,
    inventoryHealthScore: 71,
  },
  liquor: {
    itemsAtRisk: 8,
    moneyInSlowMovers: 42150,
    stockOutsPrevented: 5,
    dataHealthFixes: 12,
    inventoryHealthScore: 76,
  },
  restaurant: {
    itemsAtRisk: 14,
    moneyInSlowMovers: 31200,
    stockOutsPrevented: 9,
    dataHealthFixes: 18,
    inventoryHealthScore: 65,
    wasteRisk: 5,
  },
};

// ============== INVENTORY ITEMS (What you have chart) ==============
export const INVENTORY_ITEMS: Record<BusinessType, InventoryItem[]> = {
  admin: [
    { id: 'a-1', name: 'Coca-Cola 20oz', department: 'Beverages', onHand: 280, forecastNeed: 150, price: 2.49, cost: 0.89, coverageStatus: 'covered', reorderPoint: 50, parLevel: 300, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Coca-Cola Dist.', caseSize: 24, upc: '049000042566', mlAdjusted: true },
    { id: 'a-2', name: 'Pepsi 20oz', department: 'Beverages', onHand: 180, forecastNeed: 120, price: 2.49, cost: 0.87, coverageStatus: 'covered', reorderPoint: 50, parLevel: 250, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'PepsiCo', caseSize: 24, upc: '012000001536' },
    { id: 'a-3', name: 'Lays Classic 2.75oz', department: 'Snacks', onHand: 120, forecastNeed: 80, price: 2.49, cost: 1.05, coverageStatus: 'covered', reorderPoint: 30, parLevel: 150, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Frito-Lay', caseSize: 28, upc: '028400443685' },
    { id: 'a-4', name: 'Oreo Single Serve', department: 'Snacks', onHand: 25, forecastNeed: 60, price: 2.29, cost: 0.95, coverageStatus: 'low_stock', reorderPoint: 40, parLevel: 120, lastCountDate: '2025-10-04', daysOfSupply: 1, vendor: 'Nabisco', caseSize: 12, upc: '044000032159' },
    { id: 'a-5', name: 'Red Bull 8.4oz', department: 'Beverages', onHand: 96, forecastNeed: 48, price: 3.49, cost: 1.85, coverageStatus: 'covered', reorderPoint: 24, parLevel: 120, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Red Bull Dist.', caseSize: 24, upc: '611269991000', mlAdjusted: true },
    { id: 'a-6', name: 'Marlboro Red Kings', department: 'Tobacco', onHand: 40, forecastNeed: 25, price: 9.89, cost: 7.20, coverageStatus: 'covered', reorderPoint: 15, parLevel: 50, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Altria', caseSize: 10, upc: '028200000101' },
    { id: 'a-7', name: 'Gatorade 20oz', department: 'Beverages', onHand: 144, forecastNeed: 70, price: 2.29, cost: 0.92, coverageStatus: 'covered', reorderPoint: 36, parLevel: 180, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'PepsiCo', caseSize: 24, upc: '052000328769', mlAdjusted: true },
    { id: 'a-8', name: 'Doritos Nacho 2.75oz', department: 'Snacks', onHand: 85, forecastNeed: 55, price: 2.49, cost: 1.05, coverageStatus: 'covered', reorderPoint: 28, parLevel: 112, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Frito-Lay', caseSize: 28, upc: '028400090896' },
    { id: 'a-9', name: 'Monster Energy 16oz', department: 'Beverages', onHand: 72, forecastNeed: 40, price: 3.49, cost: 1.75, coverageStatus: 'covered', reorderPoint: 24, parLevel: 96, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Monster Beverage', caseSize: 24, upc: '070847811169', mlAdjusted: true },
    { id: 'a-10', name: 'Hot Dog Roller', department: 'Foodservice', onHand: 15, forecastNeed: 30, price: 1.99, cost: 0.55, coverageStatus: 'low_stock', reorderPoint: 20, parLevel: 48, lastCountDate: '2025-10-05', daysOfSupply: 1, vendor: 'Sysco', caseSize: 48, upc: '073654005218', mlAdjusted: true },
    { id: 'a-11', name: 'Water Aquafina 20oz', department: 'Beverages', onHand: 200, forecastNeed: 80, price: 1.99, cost: 0.35, coverageStatus: 'covered', reorderPoint: 48, parLevel: 240, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'PepsiCo', caseSize: 24, upc: '012000001291' },
    { id: 'a-12', name: 'Snickers Bar', department: 'Candy', onHand: 110, forecastNeed: 45, price: 1.99, cost: 0.82, coverageStatus: 'covered', reorderPoint: 36, parLevel: 144, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Mars Inc.', caseSize: 36, upc: '040000423041' },
    { id: 'a-13', name: 'Wrigley Gum 15ct', department: 'Candy', onHand: 48, forecastNeed: 20, price: 1.69, cost: 0.78, coverageStatus: 'covered', reorderPoint: 20, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Mars Inc.', caseSize: 10, upc: '022000009425' },
    { id: 'a-14', name: 'Coffee Fresh Brew 12oz', department: 'Beverages', onHand: 30, forecastNeed: 50, price: 1.79, cost: 0.25, coverageStatus: 'low_stock', reorderPoint: 20, parLevel: 60, lastCountDate: '2025-10-03', daysOfSupply: 1, vendor: 'Sysco', caseSize: 6, mlAdjusted: true },
    { id: 'a-15', name: '5-Hour Energy', department: 'Beverages', onHand: 60, forecastNeed: 24, price: 3.99, cost: 2.10, coverageStatus: 'covered', reorderPoint: 12, parLevel: 72, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'Living Essentials', caseSize: 12, upc: '719410500122' },
    { id: 'a-16', name: 'Nutter Butter 3oz', department: 'Snacks', onHand: 55, forecastNeed: 30, price: 2.19, cost: 0.90, coverageStatus: 'covered', reorderPoint: 24, parLevel: 72, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'Nabisco', caseSize: 12 },
    { id: 'a-17', name: 'Slim Jim Giant', department: 'Snacks', onHand: 80, forecastNeed: 35, price: 1.99, cost: 0.92, coverageStatus: 'covered', reorderPoint: 24, parLevel: 96, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'ConAgra', caseSize: 24, upc: '026200001173' },
    { id: 'a-18', name: 'Lottery Scratch-offs', department: 'Lottery', onHand: 200, forecastNeed: 60, price: 5.00, cost: 4.50, coverageStatus: 'covered', reorderPoint: 50, parLevel: 300, lastCountDate: '2025-10-05', daysOfSupply: 7 },
    { id: 'a-19', name: 'Tide To-Go Pen', department: 'Sundries', onHand: 12, forecastNeed: 4, price: 4.99, cost: 2.20, coverageStatus: 'covered', reorderPoint: 6, parLevel: 18, lastCountDate: '2025-10-03', daysOfSupply: 6, vendor: 'P&G', caseSize: 6 },
    { id: 'a-20', name: 'Taquito Beef', department: 'Foodservice', onHand: 18, forecastNeed: 24, price: 2.49, cost: 0.65, coverageStatus: 'low_stock', reorderPoint: 12, parLevel: 36, lastCountDate: '2025-10-05', daysOfSupply: 1, vendor: 'Sysco', caseSize: 36 },
  ],
  convenience: [
    { id: 'c-1', name: 'Coca-Cola 20oz', department: 'Beverages', onHand: 280, forecastNeed: 150, price: 2.49, cost: 0.89, coverageStatus: 'covered', reorderPoint: 50, parLevel: 300, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Coca-Cola Dist.', caseSize: 24, upc: '049000042566', mlAdjusted: true },
    { id: 'c-2', name: 'Pepsi 20oz', department: 'Beverages', onHand: 180, forecastNeed: 120, price: 2.49, cost: 0.87, coverageStatus: 'covered', reorderPoint: 50, parLevel: 250, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'PepsiCo', caseSize: 24, upc: '012000001536' },
    { id: 'c-3', name: 'Lays Classic 2.75oz', department: 'Snacks', onHand: 120, forecastNeed: 80, price: 2.49, cost: 1.05, coverageStatus: 'covered', reorderPoint: 30, parLevel: 150, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Frito-Lay', caseSize: 28, upc: '028400443685' },
    { id: 'c-4', name: 'Oreo Single Serve', department: 'Snacks', onHand: 25, forecastNeed: 60, price: 2.29, cost: 0.95, coverageStatus: 'low_stock', reorderPoint: 40, parLevel: 120, lastCountDate: '2025-10-04', daysOfSupply: 1, vendor: 'Nabisco', caseSize: 12, upc: '044000032159' },
    { id: 'c-5', name: 'Red Bull 8.4oz', department: 'Beverages', onHand: 96, forecastNeed: 48, price: 3.49, cost: 1.85, coverageStatus: 'covered', reorderPoint: 24, parLevel: 120, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Red Bull Dist.', caseSize: 24, upc: '611269991000', mlAdjusted: true },
    { id: 'c-6', name: 'Marlboro Red Kings', department: 'Tobacco', onHand: 40, forecastNeed: 30, price: 9.89, cost: 7.20, coverageStatus: 'covered', reorderPoint: 15, parLevel: 50, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Altria', caseSize: 10, upc: '028200000101' },
    { id: 'c-7', name: 'Gatorade 20oz Fruit Punch', department: 'Beverages', onHand: 144, forecastNeed: 70, price: 2.29, cost: 0.92, coverageStatus: 'covered', reorderPoint: 36, parLevel: 180, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'PepsiCo', caseSize: 24, upc: '052000328769' },
    { id: 'c-8', name: 'Doritos Nacho 2.75oz', department: 'Snacks', onHand: 85, forecastNeed: 55, price: 2.49, cost: 1.05, coverageStatus: 'covered', reorderPoint: 28, parLevel: 112, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Frito-Lay', caseSize: 28, upc: '028400090896' },
    { id: 'c-9', name: 'Monster Energy 16oz', department: 'Beverages', onHand: 72, forecastNeed: 40, price: 3.49, cost: 1.75, coverageStatus: 'covered', reorderPoint: 24, parLevel: 96, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Monster Beverage', caseSize: 24, upc: '070847811169', mlAdjusted: true },
    { id: 'c-10', name: 'Hot Dog Roller', department: 'Foodservice', onHand: 15, forecastNeed: 30, price: 1.99, cost: 0.55, coverageStatus: 'low_stock', reorderPoint: 20, parLevel: 48, lastCountDate: '2025-10-05', daysOfSupply: 1, vendor: 'Sysco', caseSize: 48, upc: '073654005218', mlAdjusted: true },
    { id: 'c-11', name: 'Water Aquafina 20oz', department: 'Beverages', onHand: 200, forecastNeed: 80, price: 1.99, cost: 0.35, coverageStatus: 'covered', reorderPoint: 48, parLevel: 240, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'PepsiCo', caseSize: 24, upc: '012000001291' },
    { id: 'c-12', name: 'Snickers Bar', department: 'Candy', onHand: 110, forecastNeed: 45, price: 1.99, cost: 0.82, coverageStatus: 'covered', reorderPoint: 36, parLevel: 144, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Mars Inc.', caseSize: 36, upc: '040000423041' },
    { id: 'c-13', name: 'Camel Blue Kings', department: 'Tobacco', onHand: 30, forecastNeed: 20, price: 8.99, cost: 6.80, coverageStatus: 'covered', reorderPoint: 10, parLevel: 40, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'RJRT', caseSize: 10, upc: '012300000415' },
    { id: 'c-14', name: 'Coffee Fresh Brew 12oz', department: 'Beverages', onHand: 30, forecastNeed: 55, price: 1.79, cost: 0.25, coverageStatus: 'low_stock', reorderPoint: 20, parLevel: 60, lastCountDate: '2025-10-03', daysOfSupply: 1, vendor: 'Sysco', caseSize: 6 },
    { id: 'c-15', name: '5-Hour Energy', department: 'Beverages', onHand: 60, forecastNeed: 24, price: 3.99, cost: 2.10, coverageStatus: 'covered', reorderPoint: 12, parLevel: 72, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'Living Essentials', caseSize: 12, upc: '719410500122' },
    { id: 'c-16', name: 'Wrigley Doublemint 15ct', department: 'Candy', onHand: 48, forecastNeed: 20, price: 1.69, cost: 0.78, coverageStatus: 'covered', reorderPoint: 20, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Mars Inc.', caseSize: 10, upc: '022000009425' },
    { id: 'c-17', name: 'Slim Jim Giant', department: 'Snacks', onHand: 80, forecastNeed: 35, price: 1.99, cost: 0.92, coverageStatus: 'covered', reorderPoint: 24, parLevel: 96, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'ConAgra', caseSize: 24, upc: '026200001173' },
    { id: 'c-18', name: 'Taquito Beef/Cheese', department: 'Foodservice', onHand: 18, forecastNeed: 24, price: 2.49, cost: 0.65, coverageStatus: 'low_stock', reorderPoint: 12, parLevel: 36, lastCountDate: '2025-10-05', daysOfSupply: 1, vendor: 'Sysco', caseSize: 36 },
    { id: 'c-19', name: 'Newport 100s Box', department: 'Tobacco', onHand: 35, forecastNeed: 22, price: 9.49, cost: 7.00, coverageStatus: 'covered', reorderPoint: 10, parLevel: 40, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'RJRT', caseSize: 10 },
    { id: 'c-20', name: 'Takis Fuego 4oz', department: 'Snacks', onHand: 72, forecastNeed: 45, price: 2.49, cost: 1.10, coverageStatus: 'covered', reorderPoint: 24, parLevel: 96, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Barcel', caseSize: 24, upc: '757528005092' },
    { id: 'c-21', name: 'Lottery Scratch-offs', department: 'Lottery', onHand: 200, forecastNeed: 60, price: 5.00, cost: 4.50, coverageStatus: 'covered', reorderPoint: 50, parLevel: 300, lastCountDate: '2025-10-05', daysOfSupply: 7 },
    { id: 'c-22', name: 'Banana (each)', department: 'Produce', onHand: 40, forecastNeed: 25, price: 0.69, cost: 0.22, coverageStatus: 'covered', reorderPoint: 15, parLevel: 50, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Local Produce' },
    { id: 'c-23', name: 'Advil 2ct Travel', department: 'Sundries', onHand: 36, forecastNeed: 10, price: 2.99, cost: 0.85, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-03', daysOfSupply: 7, vendor: 'Pfizer', caseSize: 12 },
    { id: 'c-24', name: 'Bic Lighter', department: 'Sundries', onHand: 50, forecastNeed: 18, price: 2.49, cost: 0.95, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 6, vendor: 'Bic Corp', caseSize: 50 },
    { id: 'c-25', name: 'Swedish Fish 5oz', department: 'Candy', onHand: 8, forecastNeed: 20, price: 2.49, cost: 1.00, coverageStatus: 'used_up', reorderPoint: 18, parLevel: 48, lastCountDate: '2025-10-04', daysOfSupply: 1, vendor: 'Mondelez', caseSize: 12 },
  ],
  grocery: [
    { id: 'g-1', name: 'Whole Milk Gallon', department: 'Dairy', onHand: 200, forecastNeed: 80, price: 4.29, cost: 2.50, coverageStatus: 'covered', reorderPoint: 36, parLevel: 250, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'Dean Foods', caseSize: 4, upc: '041900065300', mlAdjusted: true },
    { id: 'g-2', name: 'Large Eggs 12ct', department: 'Dairy', onHand: 90, forecastNeed: 50, price: 3.99, cost: 2.65, coverageStatus: 'covered', reorderPoint: 24, parLevel: 120, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Eggland', caseSize: 12, upc: '071033000129' },
    { id: 'g-3', name: 'Bananas (lb)', department: 'Produce', onHand: 120, forecastNeed: 80, price: 0.59, cost: 0.22, coverageStatus: 'covered', reorderPoint: 40, parLevel: 150, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Chiquita', caseSize: 40 },
    { id: 'g-4', name: 'Chicken Breast (lb)', department: 'Meat', onHand: 50, forecastNeed: 45, price: 4.99, cost: 2.80, coverageStatus: 'low_stock', reorderPoint: 25, parLevel: 80, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Tyson', caseSize: 10, upc: '023700007445', mlAdjusted: true },
    { id: 'g-5', name: 'Coca-Cola 2L', department: 'Beverages', onHand: 72, forecastNeed: 35, price: 2.29, cost: 1.10, coverageStatus: 'covered', reorderPoint: 18, parLevel: 90, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Coca-Cola Dist.', caseSize: 8, upc: '049000050103' },
    { id: 'g-6', name: 'Wonder Bread White', department: 'Bakery', onHand: 45, forecastNeed: 30, price: 3.49, cost: 1.80, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Flowers Foods', caseSize: 8 },
    { id: 'g-7', name: 'Ground Beef 80/20 (lb)', department: 'Meat', onHand: 40, forecastNeed: 35, price: 5.99, cost: 3.40, coverageStatus: 'low_stock', reorderPoint: 20, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Cargill', caseSize: 10 },
    { id: 'g-8', name: 'Russet Potatoes 5lb', department: 'Produce', onHand: 55, forecastNeed: 25, price: 3.99, cost: 1.95, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'Local Produce', caseSize: 8 },
    { id: 'g-9', name: 'Kraft Mac & Cheese', department: 'Grocery', onHand: 100, forecastNeed: 40, price: 1.49, cost: 0.78, coverageStatus: 'covered', reorderPoint: 30, parLevel: 120, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'Kraft Heinz', caseSize: 12, upc: '021000658831' },
    { id: 'g-10', name: 'Romaine Hearts 3pk', department: 'Produce', onHand: 28, forecastNeed: 22, price: 3.49, cost: 1.60, coverageStatus: 'low_stock', reorderPoint: 15, parLevel: 40, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'Local Produce', caseSize: 6 },
    { id: 'g-11', name: 'Tide Pods 42ct', department: 'Household', onHand: 20, forecastNeed: 8, price: 13.99, cost: 8.50, coverageStatus: 'covered', reorderPoint: 6, parLevel: 24, lastCountDate: '2025-10-03', daysOfSupply: 5, vendor: 'P&G', caseSize: 4 },
    { id: 'g-12', name: 'Frozen Pizza DiGiorno', department: 'Frozen', onHand: 36, forecastNeed: 18, price: 7.49, cost: 4.20, coverageStatus: 'covered', reorderPoint: 10, parLevel: 40, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'Nestle', caseSize: 6, upc: '071921019106' },
    { id: 'g-13', name: 'Orange Juice 64oz', department: 'Dairy', onHand: 32, forecastNeed: 20, price: 4.49, cost: 2.40, coverageStatus: 'covered', reorderPoint: 12, parLevel: 40, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Tropicana', caseSize: 8 },
    { id: 'g-14', name: 'Cheerios 12oz', department: 'Grocery', onHand: 48, forecastNeed: 20, price: 4.99, cost: 2.80, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'General Mills', caseSize: 12 },
    { id: 'g-15', name: 'Avocado Hass (each)', department: 'Produce', onHand: 60, forecastNeed: 40, price: 1.29, cost: 0.65, coverageStatus: 'covered', reorderPoint: 20, parLevel: 80, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Local Produce', caseSize: 48, mlAdjusted: true },
    { id: 'g-16', name: 'Pepsi 12pk Cans', department: 'Beverages', onHand: 40, forecastNeed: 25, price: 6.99, cost: 3.80, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'PepsiCo', caseSize: 2 },
    { id: 'g-17', name: 'Bounty Paper Towels 6pk', department: 'Household', onHand: 18, forecastNeed: 10, price: 10.99, cost: 6.80, coverageStatus: 'covered', reorderPoint: 6, parLevel: 24, lastCountDate: '2025-10-03', daysOfSupply: 4, vendor: 'P&G', caseSize: 4 },
    { id: 'g-18', name: 'Strawberries 1lb', department: 'Produce', onHand: 22, forecastNeed: 25, price: 3.99, cost: 2.00, coverageStatus: 'low_stock', reorderPoint: 12, parLevel: 36, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'Driscoll', caseSize: 8, mlAdjusted: true },
    { id: 'g-19', name: 'Frozen Broccoli 16oz', department: 'Frozen', onHand: 40, forecastNeed: 15, price: 2.49, cost: 1.10, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Birds Eye', caseSize: 12 },
    { id: 'g-20', name: 'Salmon Fillet (lb)', department: 'Meat', onHand: 12, forecastNeed: 15, price: 12.99, cost: 8.50, coverageStatus: 'low_stock', reorderPoint: 8, parLevel: 24, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Trident Seafood', caseSize: 4 },
    { id: 'g-21', name: 'Greek Yogurt Chobani', department: 'Dairy', onHand: 60, forecastNeed: 30, price: 1.49, cost: 0.80, coverageStatus: 'covered', reorderPoint: 20, parLevel: 72, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Chobani', caseSize: 12 },
    { id: 'g-22', name: 'Peanut Butter Jif 16oz', department: 'Grocery', onHand: 30, forecastNeed: 12, price: 3.99, cost: 2.15, coverageStatus: 'covered', reorderPoint: 10, parLevel: 36, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Smucker', caseSize: 12 },
    { id: 'g-23', name: 'Rotisserie Chicken', department: 'Deli', onHand: 8, forecastNeed: 12, price: 7.99, cost: 4.50, coverageStatus: 'low_stock', reorderPoint: 6, parLevel: 16, lastCountDate: '2025-10-05', daysOfSupply: 1, vendor: 'In-store', caseSize: 1, mlAdjusted: true },
    { id: 'g-24', name: 'Butter Land O Lakes 1lb', department: 'Dairy', onHand: 36, forecastNeed: 18, price: 4.49, cost: 2.60, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Land O Lakes', caseSize: 12 },
    { id: 'g-25', name: 'Sparkling Water LaCroix 12pk', department: 'Beverages', onHand: 24, forecastNeed: 14, price: 5.49, cost: 3.20, coverageStatus: 'covered', reorderPoint: 8, parLevel: 32, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'National Beverage', caseSize: 2 },
  ],
  liquor: [
    { id: 'l-1', name: "Tito's Vodka 750ml", department: 'Spirits', onHand: 45, forecastNeed: 20, price: 24.99, cost: 14.50, coverageStatus: 'covered', reorderPoint: 10, parLevel: 50, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'Fifth Generation', caseSize: 12, upc: '619947000020' },
    { id: 'l-2', name: 'Jameson 750ml', department: 'Spirits', onHand: 32, forecastNeed: 15, price: 29.99, cost: 18.00, coverageStatus: 'covered', reorderPoint: 8, parLevel: 40, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Pernod Ricard', caseSize: 12, upc: '080432400432' },
    { id: 'l-3', name: 'Modelo Especial 12pk', department: 'Beer', onHand: 80, forecastNeed: 50, price: 16.99, cost: 10.80, coverageStatus: 'covered', reorderPoint: 20, parLevel: 100, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Constellation', caseSize: 2, upc: '018172678150', mlAdjusted: true },
    { id: 'l-4', name: 'White Claw Variety 12pk', department: 'Seltzer', onHand: 55, forecastNeed: 40, price: 17.99, cost: 11.50, coverageStatus: 'low_stock', reorderPoint: 25, parLevel: 70, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Mark Anthony', caseSize: 2, upc: '856054006600', mlAdjusted: true },
    { id: 'l-5', name: 'Josh Cabernet 750ml', department: 'Wine', onHand: 38, forecastNeed: 18, price: 14.99, cost: 8.20, coverageStatus: 'covered', reorderPoint: 10, parLevel: 45, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Deutsch Family', caseSize: 12 },
    { id: 'l-6', name: 'Patron Silver 750ml', department: 'Spirits', onHand: 22, forecastNeed: 10, price: 48.99, cost: 30.00, coverageStatus: 'covered', reorderPoint: 5, parLevel: 25, lastCountDate: '2025-10-05', daysOfSupply: 5, vendor: 'Bacardi', caseSize: 6, upc: '721733000012' },
    { id: 'l-7', name: 'Fireball 750ml', department: 'Spirits', onHand: 40, forecastNeed: 25, price: 18.99, cost: 10.50, coverageStatus: 'covered', reorderPoint: 12, parLevel: 50, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Sazerac', caseSize: 12, upc: '088004000325' },
    { id: 'l-8', name: 'Hennessy VS 750ml', department: 'Spirits', onHand: 18, forecastNeed: 12, price: 39.99, cost: 25.00, coverageStatus: 'low_stock', reorderPoint: 8, parLevel: 25, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Moet Hennessy', caseSize: 12, upc: '081753800406', mlAdjusted: true },
    { id: 'l-9', name: 'Corona Extra 12pk', department: 'Beer', onHand: 65, forecastNeed: 35, price: 15.99, cost: 10.20, coverageStatus: 'covered', reorderPoint: 20, parLevel: 80, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Constellation', caseSize: 2, upc: '018397000027' },
    { id: 'l-10', name: "Maker's Mark 750ml", department: 'Spirits', onHand: 28, forecastNeed: 14, price: 32.99, cost: 20.00, coverageStatus: 'covered', reorderPoint: 8, parLevel: 35, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Beam Suntory', caseSize: 6, upc: '085246139462' },
    { id: 'l-11', name: 'Bud Light 24pk', department: 'Beer', onHand: 90, forecastNeed: 60, price: 22.99, cost: 15.80, coverageStatus: 'covered', reorderPoint: 24, parLevel: 120, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'AB InBev', caseSize: 1, upc: '018200533327' },
    { id: 'l-12', name: 'Jack Daniels 750ml', department: 'Spirits', onHand: 35, forecastNeed: 18, price: 26.99, cost: 16.00, coverageStatus: 'covered', reorderPoint: 10, parLevel: 40, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Brown-Forman', caseSize: 12, upc: '082184000267' },
    { id: 'l-13', name: 'Kim Crawford Sauv Blanc', department: 'Wine', onHand: 20, forecastNeed: 12, price: 15.99, cost: 9.00, coverageStatus: 'covered', reorderPoint: 8, parLevel: 30, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Constellation', caseSize: 12 },
    { id: 'l-14', name: 'Michelob Ultra 12pk', department: 'Beer', onHand: 48, forecastNeed: 30, price: 15.99, cost: 10.50, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'AB InBev', caseSize: 2 },
    { id: 'l-15', name: 'Casamigos Blanco 750ml', department: 'Spirits', onHand: 15, forecastNeed: 8, price: 49.99, cost: 32.00, coverageStatus: 'covered', reorderPoint: 5, parLevel: 20, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Diageo', caseSize: 6 },
    { id: 'l-16', name: 'Truly Variety 12pk', department: 'Seltzer', onHand: 30, forecastNeed: 22, price: 16.99, cost: 10.80, coverageStatus: 'low_stock', reorderPoint: 15, parLevel: 40, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Boston Beer', caseSize: 2 },
    { id: 'l-17', name: 'Apothic Red 750ml', department: 'Wine', onHand: 24, forecastNeed: 10, price: 10.99, cost: 5.80, coverageStatus: 'covered', reorderPoint: 8, parLevel: 30, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'E&J Gallo', caseSize: 12 },
    { id: 'l-18', name: 'Twisted Tea 12pk', department: 'Beer', onHand: 36, forecastNeed: 24, price: 16.99, cost: 11.00, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Boston Beer', caseSize: 2, mlAdjusted: true },
    { id: 'l-19', name: 'Grey Goose 750ml', department: 'Spirits', onHand: 12, forecastNeed: 6, price: 34.99, cost: 22.00, coverageStatus: 'covered', reorderPoint: 4, parLevel: 18, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Bacardi', caseSize: 6 },
    { id: 'l-20', name: 'Prosecco La Marca 750ml', department: 'Wine', onHand: 18, forecastNeed: 10, price: 14.99, cost: 8.00, coverageStatus: 'covered', reorderPoint: 6, parLevel: 24, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'E&J Gallo', caseSize: 12 },
    { id: 'l-21', name: 'Crown Royal 750ml', department: 'Spirits', onHand: 20, forecastNeed: 10, price: 29.99, cost: 18.50, coverageStatus: 'covered', reorderPoint: 6, parLevel: 24, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Diageo', caseSize: 12, upc: '082000001034' },
    { id: 'l-22', name: 'High Noon Variety 8pk', department: 'Seltzer', onHand: 42, forecastNeed: 28, price: 19.99, cost: 13.50, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'E&J Gallo', caseSize: 3, mlAdjusted: true },
    { id: 'l-23', name: 'Barefoot Moscato 1.5L', department: 'Wine', onHand: 14, forecastNeed: 8, price: 10.99, cost: 5.50, coverageStatus: 'covered', reorderPoint: 6, parLevel: 20, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'E&J Gallo', caseSize: 6 },
    { id: 'l-24', name: 'Smirnoff Vodka 1.75L', department: 'Spirits', onHand: 25, forecastNeed: 12, price: 19.99, cost: 11.50, coverageStatus: 'covered', reorderPoint: 8, parLevel: 30, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Diageo', caseSize: 6 },
    { id: 'l-25', name: 'IPA Variety Local Craft', department: 'Beer', onHand: 10, forecastNeed: 15, price: 12.99, cost: 8.50, coverageStatus: 'low_stock', reorderPoint: 8, parLevel: 24, lastCountDate: '2025-10-04', daysOfSupply: 1, vendor: 'Local Brewery', caseSize: 4 },
  ],
  restaurant: [
    { id: 'r-1', name: 'Chicken Breast (case)', department: 'Protein', onHand: 120, forecastNeed: 90, price: 8.99, cost: 4.20, coverageStatus: 'covered', reorderPoint: 40, parLevel: 150, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'Sysco', caseSize: 40, upc: '023700007445', mlAdjusted: true },
    { id: 'r-2', name: 'Ground Beef 80/20 (case)', department: 'Protein', onHand: 80, forecastNeed: 60, price: 12.99, cost: 6.50, coverageStatus: 'covered', reorderPoint: 30, parLevel: 100, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'Sysco', caseSize: 30 },
    { id: 'r-3', name: 'Salmon Fillet (case)', department: 'Protein', onHand: 15, forecastNeed: 25, price: 18.99, cost: 12.00, coverageStatus: 'low_stock', reorderPoint: 15, parLevel: 50, lastCountDate: '2025-10-04', daysOfSupply: 1, vendor: 'US Foods', caseSize: 15, mlAdjusted: true },
    { id: 'r-4', name: 'Mixed Greens (case)', department: 'Produce', onHand: 60, forecastNeed: 45, price: 4.49, cost: 2.10, coverageStatus: 'covered', reorderPoint: 20, parLevel: 80, lastCountDate: '2025-10-04', daysOfSupply: 2, vendor: 'Sysco', caseSize: 10 },
    { id: 'r-5', name: 'Roma Tomatoes (case)', department: 'Produce', onHand: 45, forecastNeed: 30, price: 3.99, cost: 1.80, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Local Produce', caseSize: 25 },
    { id: 'r-6', name: 'French Fries 5lb (case)', department: 'Frozen', onHand: 200, forecastNeed: 120, price: 5.99, cost: 2.80, coverageStatus: 'covered', reorderPoint: 50, parLevel: 250, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Sysco', caseSize: 6, mlAdjusted: true },
    { id: 'r-7', name: 'Burger Buns (pack)', department: 'Bakery', onHand: 150, forecastNeed: 100, price: 2.49, cost: 1.10, coverageStatus: 'covered', reorderPoint: 40, parLevel: 180, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'Bimbo Bakeries', caseSize: 8 },
    { id: 'r-8', name: 'American Cheese Slices', department: 'Dairy', onHand: 40, forecastNeed: 70, price: 6.99, cost: 3.50, coverageStatus: 'low_stock', reorderPoint: 35, parLevel: 120, lastCountDate: '2025-10-04', daysOfSupply: 1, vendor: 'Sysco', caseSize: 4 },
    { id: 'r-9', name: 'Coffee Beans 5lb', department: 'Beverages', onHand: 40, forecastNeed: 20, price: 14.99, cost: 8.00, coverageStatus: 'covered', reorderPoint: 10, parLevel: 50, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'US Foods', caseSize: 2 },
    { id: 'r-10', name: 'Iced Tea Mix (case)', department: 'Beverages', onHand: 55, forecastNeed: 35, price: 3.99, cost: 1.80, coverageStatus: 'covered', reorderPoint: 15, parLevel: 70, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Sysco', caseSize: 12 },
    { id: 'r-11', name: 'Bacon Sliced (case)', department: 'Protein', onHand: 30, forecastNeed: 25, price: 9.99, cost: 5.60, coverageStatus: 'low_stock', reorderPoint: 15, parLevel: 45, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'Sysco', caseSize: 15 },
    { id: 'r-12', name: 'Shrimp 16/20 (case)', department: 'Protein', onHand: 20, forecastNeed: 15, price: 16.99, cost: 10.50, coverageStatus: 'covered', reorderPoint: 10, parLevel: 30, lastCountDate: '2025-10-04', daysOfSupply: 3, vendor: 'US Foods', caseSize: 5 },
    { id: 'r-13', name: 'Yellow Onion (case)', department: 'Produce', onHand: 50, forecastNeed: 20, price: 1.99, cost: 0.80, coverageStatus: 'covered', reorderPoint: 15, parLevel: 60, lastCountDate: '2025-10-04', daysOfSupply: 5, vendor: 'Local Produce', caseSize: 50 },
    { id: 'r-14', name: 'Mozzarella Shredded 5lb', department: 'Dairy', onHand: 24, forecastNeed: 18, price: 8.49, cost: 4.80, coverageStatus: 'covered', reorderPoint: 10, parLevel: 30, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Sysco', caseSize: 4 },
    { id: 'r-15', name: 'Wing Flats & Drums (case)', department: 'Protein', onHand: 60, forecastNeed: 50, price: 7.99, cost: 4.00, coverageStatus: 'low_stock', reorderPoint: 30, parLevel: 80, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'US Foods', caseSize: 40, mlAdjusted: true },
    { id: 'r-16', name: 'Fryer Oil 35lb (jug)', department: 'Supplies', onHand: 8, forecastNeed: 4, price: 32.99, cost: 22.00, coverageStatus: 'covered', reorderPoint: 3, parLevel: 10, lastCountDate: '2025-10-03', daysOfSupply: 4, vendor: 'Sysco', caseSize: 1 },
    { id: 'r-17', name: 'To-Go Containers 9x9', department: 'Supplies', onHand: 200, forecastNeed: 80, price: 0.35, cost: 0.12, coverageStatus: 'covered', reorderPoint: 100, parLevel: 500, lastCountDate: '2025-10-03', daysOfSupply: 5, vendor: 'US Foods', caseSize: 200 },
    { id: 'r-18', name: 'Hot Sauce Frank\'s 1gal', department: 'Condiments', onHand: 6, forecastNeed: 3, price: 12.99, cost: 7.50, coverageStatus: 'covered', reorderPoint: 2, parLevel: 8, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'Sysco', caseSize: 4 },
    { id: 'r-19', name: 'Heavy Cream Qt', department: 'Dairy', onHand: 12, forecastNeed: 10, price: 5.49, cost: 2.80, coverageStatus: 'low_stock', reorderPoint: 6, parLevel: 18, lastCountDate: '2025-10-05', daysOfSupply: 2, vendor: 'Sysco', caseSize: 12 },
    { id: 'r-20', name: 'Jalapeno Peppers (case)', department: 'Produce', onHand: 20, forecastNeed: 10, price: 2.49, cost: 1.00, coverageStatus: 'covered', reorderPoint: 8, parLevel: 25, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'Local Produce', caseSize: 10 },
    { id: 'r-21', name: 'Tortillas 12in (pack)', department: 'Bakery', onHand: 80, forecastNeed: 40, price: 3.49, cost: 1.50, coverageStatus: 'covered', reorderPoint: 20, parLevel: 100, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'Mission Foods', caseSize: 12 },
    { id: 'r-22', name: 'Ketchup Heinz 114oz', department: 'Condiments', onHand: 10, forecastNeed: 4, price: 9.99, cost: 5.80, coverageStatus: 'covered', reorderPoint: 3, parLevel: 12, lastCountDate: '2025-10-03', daysOfSupply: 5, vendor: 'Kraft Heinz', caseSize: 6 },
    { id: 'r-23', name: 'Rice Jasmine 25lb', department: 'Dry Goods', onHand: 6, forecastNeed: 3, price: 18.99, cost: 12.00, coverageStatus: 'covered', reorderPoint: 2, parLevel: 8, lastCountDate: '2025-10-04', daysOfSupply: 4, vendor: 'US Foods', caseSize: 1 },
    { id: 'r-24', name: 'Lemons (case)', department: 'Produce', onHand: 35, forecastNeed: 20, price: 1.49, cost: 0.55, coverageStatus: 'covered', reorderPoint: 12, parLevel: 48, lastCountDate: '2025-10-05', daysOfSupply: 4, vendor: 'Local Produce', caseSize: 140 },
    { id: 'r-25', name: 'Sour Cream 5lb', department: 'Dairy', onHand: 8, forecastNeed: 6, price: 6.99, cost: 3.50, coverageStatus: 'covered', reorderPoint: 4, parLevel: 12, lastCountDate: '2025-10-05', daysOfSupply: 3, vendor: 'Sysco', caseSize: 4 },
  ],
};

// ============== WHAT YOU CAN SELL CARDS ==============
export const WHAT_YOU_CAN_SELL: Record<BusinessType, { name: string; forecast: number; onHand: number; status: 'covered' | 'low_stock' | 'used_up'; parLevel: number }[]> = {
  admin: [
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 72, status: 'covered', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 8, status: 'low_stock', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 8, status: 'used_up', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 72, status: 'covered', parLevel: 18 },
  ],
  convenience: [
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 72, status: 'covered', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 8, status: 'low_stock', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 8, status: 'used_up', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 72, status: 'covered', parLevel: 18 },
  ],
  grocery: [
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 72, status: 'covered', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 8, status: 'low_stock', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 8, status: 'used_up', parLevel: 18 },
    { name: 'Coca-Cola 20oz', forecast: 15, onHand: 72, status: 'covered', parLevel: 18 },
  ],
  liquor: [
    { name: "Tito's Vodka", forecast: 8, onHand: 45, status: 'covered', parLevel: 12 },
    { name: 'Modelo 12pk', forecast: 12, onHand: 5, status: 'low_stock', parLevel: 15 },
    { name: 'Hennessy VS', forecast: 6, onHand: 3, status: 'used_up', parLevel: 10 },
    { name: 'Josh Cabernet', forecast: 5, onHand: 38, status: 'covered', parLevel: 8 },
  ],
  restaurant: [
    { name: 'Chicken breast', forecast: 45, onHand: 120, status: 'covered', parLevel: 50 },
    { name: 'Salmon fillet', forecast: 12, onHand: 5, status: 'low_stock', parLevel: 15 },
    { name: 'Mixed greens', forecast: 20, onHand: 60, status: 'covered', parLevel: 25 },
    { name: 'Cheese slices', forecast: 35, onHand: 10, status: 'used_up', parLevel: 40 },
  ],
};

// ============== FAST MOVER REFILL ==============
export const FAST_MOVERS: Record<BusinessType, FastMoverItem[]> = {
  admin: [
    { item: 'Water 24pk', expected6h: 42, onHand: 60, refillNow: 32 },
    { item: 'Soda 20oz', expected6h: 35, onHand: 58, refillNow: 27 },
    { item: 'Chips mix', expected6h: 20, onHand: 67, refillNow: 14 },
    { item: 'Water 24pk', expected6h: 42, onHand: 38, refillNow: 32 },
    { item: 'Soda 20oz', expected6h: 35, onHand: 86, refillNow: 27 },
    { item: 'Chips mix', expected6h: 20, onHand: 64, refillNow: 14 },
    { item: 'Water 24pk', expected6h: 42, onHand: 12, refillNow: 32 },
  ],
  convenience: [
    { item: 'Water 24pk', expected6h: 42, onHand: 60, refillNow: 32 },
    { item: 'Soda 20oz', expected6h: 35, onHand: 58, refillNow: 27 },
    { item: 'Chips mix', expected6h: 20, onHand: 67, refillNow: 14 },
    { item: 'Water 24pk', expected6h: 42, onHand: 38, refillNow: 32 },
    { item: 'Soda 20oz', expected6h: 35, onHand: 86, refillNow: 27 },
    { item: 'Chips mix', expected6h: 20, onHand: 64, refillNow: 14 },
    { item: 'Water 24pk', expected6h: 42, onHand: 12, refillNow: 32 },
  ],
  grocery: [
    { item: 'Beverages', department: 'Beverages', category: 'Cold drinks', expected6h: 220, onHand: 140, refillNow: 0, stockYouCanSell: 140, hoursLeft: 30, badge: 'inventory_based' },
    { item: 'Snacks', department: 'Snacks', category: 'Chips', expected6h: 160, onHand: 60, refillNow: 0, stockYouCanSell: 60, hoursLeft: 19, badge: 'pace_based' },
    { item: 'Ice', department: 'Ice', category: 'Ice bags', expected6h: 90, onHand: 28, refillNow: 0, stockYouCanSell: 28, hoursLeft: 15, badge: 'pace_based' },
  ],
  liquor: [
    { item: 'Modelo 12pk', expected6h: 25, onHand: 80, refillNow: 15 },
    { item: 'White Claw 12pk', expected6h: 20, onHand: 55, refillNow: 12 },
    { item: "Tito's Vodka", expected6h: 10, onHand: 45, refillNow: 5 },
    { item: 'Corona 12pk', expected6h: 18, onHand: 65, refillNow: 10 },
    { item: 'Fireball 750ml', expected6h: 15, onHand: 40, refillNow: 8 },
  ],
  restaurant: [
    { item: 'Chicken breast', department: 'Protein', expected6h: 45, onHand: 120, refillNow: 0, stockYouCanSell: 120, hoursLeft: 16, badge: 'inventory_based' },
    { item: 'Ground beef', department: 'Protein', expected6h: 30, onHand: 80, refillNow: 0, stockYouCanSell: 80, hoursLeft: 16, badge: 'inventory_based' },
    { item: 'French fries', department: 'Frozen', expected6h: 60, onHand: 200, refillNow: 0, stockYouCanSell: 200, hoursLeft: 20, badge: 'pace_based' },
  ],
};

// ============== COLD DRINKS & ICE BOOST (AI suggestions) ==============
export const COLD_DRINKS_BOOST: { item: string; action: string }[] = [
  { item: 'Water (24pk)', action: 'Order 10' },
  { item: 'Ice Bags', action: 'Order 20' },
  { item: 'Soda 20oz', action: 'Run 2-for promo' },
];

// ============== AUTO REPLENISHMENT ==============
export const AUTO_REPLENISHMENT: Record<BusinessType, AutoReplenishmentItem[]> = {
  admin: [
    { item: 'Energy drink 12oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Pepsi 20oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Lays classic', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Energy drink 12oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Pepsi 20oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Lays classic', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
  ],
  convenience: [
    { item: 'Energy drink 12oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Pepsi 20oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Lays classic', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Energy drink 12oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Pepsi 20oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Lays classic', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
  ],
  grocery: [
    { item: 'Energy drink 12oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Pepsi 20oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Lays classic', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Energy drink 12oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Pepsi 20oz', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
    { item: 'Lays classic', onHand: 72, onOrder: 24, leadTimeDays: 2, caseSize: 24, orderQty: 216 },
  ],
  liquor: [
    { item: "Tito's Vodka", onHand: 45, onOrder: 12, leadTimeDays: 3, caseSize: 6, orderQty: 36 },
    { item: 'Modelo 12pk', onHand: 80, onOrder: 24, leadTimeDays: 2, caseSize: 12, orderQty: 96 },
    { item: 'White Claw 12pk', onHand: 55, onOrder: 18, leadTimeDays: 2, caseSize: 12, orderQty: 72 },
    { item: 'Patron Silver', onHand: 22, onOrder: 6, leadTimeDays: 3, caseSize: 6, orderQty: 18 },
    { item: 'Josh Cabernet', onHand: 38, onOrder: 12, leadTimeDays: 3, caseSize: 12, orderQty: 48 },
  ],
  restaurant: [
    { item: 'Chicken breast (case)', onHand: 120, onOrder: 40, leadTimeDays: 1, caseSize: 40, orderQty: 120 },
    { item: 'Ground beef (case)', onHand: 80, onOrder: 30, leadTimeDays: 1, caseSize: 30, orderQty: 90 },
    { item: 'Salmon fillet (case)', onHand: 35, onOrder: 15, leadTimeDays: 1, caseSize: 15, orderQty: 45 },
    { item: 'Mixed greens (case)', onHand: 60, onOrder: 20, leadTimeDays: 1, caseSize: 10, orderQty: 40 },
    { item: 'Burger buns (case)', onHand: 150, onOrder: 50, leadTimeDays: 1, caseSize: 50, orderQty: 150 },
    { item: 'French fries (case)', onHand: 200, onOrder: 40, leadTimeDays: 2, caseSize: 40, orderQty: 120 },
  ],
};

// ============== QUICK CYCLE COUNT ==============
export const CYCLE_COUNT_ITEMS: CycleCountItem[] = [
  { item: 'Pepsi', onHand: 40, suggestedOnHand: 50, lastCount: '10/09/2025', reason: 'Stale count' },
  { item: 'Oreo single', onHand: 18, suggestedOnHand: 32, lastCount: '10/09/2025', reason: 'Stale count' },
  { item: 'Gatorade', onHand: 50, suggestedOnHand: 45, lastCount: '10/09/2025', reason: 'Stale count' },
  { item: 'Hot dog', onHand: -3, suggestedOnHand: 18, lastCount: '10/09/2025', reason: 'Negative OH' },
  { item: 'Pepsi', onHand: -40, suggestedOnHand: 50, lastCount: '10/09/2025', reason: 'Stale count' },
  { item: 'Oreo single', onHand: -18, suggestedOnHand: 32, lastCount: '10/09/2025', reason: 'Stale count' },
];

// ============== SLOW MOVERS ==============
export const SLOW_MOVERS: SlowMoverItem[] = [
  { item: 'Gum variety', onHand: 320, recentPace: '2/d', price: 1.50, suggestion: 'Promo 2-for' },
  { item: 'Seasonal candy', onHand: 180, recentPace: '1/d', price: 1.50, suggestion: 'Discount 30%' },
  { item: 'Gum variety', onHand: 320, recentPace: '2/d', price: 1.50, suggestion: 'Promo 2-for' },
];

// ============== AI INSIGHTS FOR INVENTORY ==============
export const INVENTORY_AI_INSIGHTS: Record<BusinessType, { title: string; description: string; action: string; actionLabel: string; priority: 'high' | 'medium' | 'low' }[]> = {
  admin: [
    { title: 'Stock out risk in 6h', description: 'Hot dog bun B act short by ~2. Bring up shelf now or add to PO', action: 'fix', actionLabel: 'Fix', priority: 'high' },
    { title: 'Data health problem', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'fix', actionLabel: 'Fix', priority: 'medium' },
    { title: 'Overstock likely', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'promo', actionLabel: 'Create promo', priority: 'low' },
  ],
  convenience: [
    { title: 'Stock out risk in 6h', description: 'Hot dog bun B act short by ~2. Bring up shelf now or add to PO', action: 'fix', actionLabel: 'Fix', priority: 'high' },
    { title: 'Data health problem', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'fix', actionLabel: 'Fix', priority: 'medium' },
    { title: 'Overstock likely', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'promo', actionLabel: 'Create promo', priority: 'low' },
  ],
  grocery: [
    { title: 'Stock out risk in 6h', description: 'Hot dog bun B act short by ~2. Bring up shelf now or add to PO', action: 'fix', actionLabel: 'Fix', priority: 'high' },
    { title: 'Data health problem', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'fix', actionLabel: 'Fix', priority: 'medium' },
    { title: 'Overstock likely', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'promo', actionLabel: 'Create promo', priority: 'low' },
  ],
  liquor: [
    { title: 'Stock out risk in 6h', description: 'Hennessy VS and White Claw running low. Bring up shelf now or add to PO', action: 'fix', actionLabel: 'Fix', priority: 'high' },
    { title: 'Data health problem', description: '3 items have stale counts. Run a quick cycle count.', action: 'fix', actionLabel: 'Fix', priority: 'medium' },
    { title: 'Overstock likely', description: 'Fireball 750ml and Patron Silver sitting above par. Consider bundling or promo.', action: 'promo', actionLabel: 'Create promo', priority: 'low' },
  ],
  restaurant: [
    { title: 'Stock out risk in 6h', description: 'Salmon fillet and cheese slices running low. Bring up shelf now or add to PO', action: 'fix', actionLabel: 'Fix', priority: 'high' },
    { title: 'Data health problem', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'fix', actionLabel: 'Fix', priority: 'medium' },
    { title: 'Overstock likely', description: '4 items have stale/negative counts(e.g., Pepsi 20oz, Oreo single). Run a quick cycle count.', action: 'promo', actionLabel: 'Create promo', priority: 'low' },
  ],
};

// ============== TOP ITEMS TO REORDER ==============
export const TOP_REORDER_ITEMS: { item: string; orderQty: number; estCost: number }[] = [
  { item: 'Energy drink 12oz', orderQty: 48, estCost: 96 },
  { item: 'Sparkling water', orderQty: 36, estCost: 77 },
  { item: 'Chocolate bar', orderQty: 24, estCost: 42 },
];

// ============== RESTAURANT-SPECIFIC: SPOILAGE RISK ==============
export const SPOILAGE_ITEMS: SpoilageItem[] = [
  { item: 'Chicken salad', prepDate: 'Today 6am', shelfLifeHrs: 36, stockYouCanSell: 24, hoursLeft: 20, risk: 'high' },
  { item: 'Veggie wrap', prepDate: 'Today 7am', shelfLifeHrs: 45, stockYouCanSell: 30, hoursLeft: 15, risk: 'medium' },
  { item: 'Fruit platter', prepDate: 'Today 8am', shelfLifeHrs: 50, stockYouCanSell: 40, hoursLeft: 10, risk: 'low' },
  { item: 'Pasta primavera', prepDate: 'Today 9am', shelfLifeHrs: 30, stockYouCanSell: 22, hoursLeft: 18, risk: 'high' },
  { item: 'Taco platter', prepDate: 'Today 10am', shelfLifeHrs: 40, stockYouCanSell: 25, hoursLeft: 12, risk: 'medium' },
  { item: 'Quinoa bowl', prepDate: 'Today 11am', shelfLifeHrs: 35, stockYouCanSell: 40, hoursLeft: 14, risk: 'low' },
  { item: 'Sushi platter', prepDate: 'Today 12pm', shelfLifeHrs: 28, stockYouCanSell: 18, hoursLeft: 16, risk: 'high' },
];

// ============== RESTAURANT-SPECIFIC: PREP NOW ==============
export const PREP_ITEMS: PrepItem[] = [
  { meal: 'breakfast', item: 'Egg bites', suggestedBatch: 30 },
  { meal: 'lunch', item: 'Chicken wrap', suggestedBatch: 30 },
  { meal: 'dinner', item: 'Soup based', suggestedBatch: 30 },
];

// ============== RESTAURANT-SPECIFIC: WASTE LEDGER ==============
export const WASTE_LEDGER: WasteLedgerEntry[] = [
  { when: '09/01/2025 10:32:45AM', item: 'Lemon', qty: 10, reason: 'Spilled' },
  { when: '09/02/2025 11:15:30AM', item: 'Apple', qty: 5, reason: 'Dropped' },
  { when: '09/03/2025 12:45:12PM', item: 'Banana', qty: 8, reason: 'Smashed' },
];

// ============== LIQUOR-SPECIFIC: BUNDLE SUGGESTIONS ==============
export const BUNDLE_SUGGESTIONS: BundleSuggestion[] = [
  { items: 'Whiskey + Ginger ale', placement: 'end cap idea' },
  { items: 'Tequila + Lime mix', placement: 'front display' },
  { items: 'Red wine + Cheese crackers', placement: '' },
];

// ============== LIQUOR-SPECIFIC: WEEKEND RUN-UP DATA ==============
export const WEEKEND_RUNUP_DATA = [
  { date: 'Oct 21', fri: 140, sat: 180, sun: 160 },
  { date: 'Oct 22', fri: 160, sat: 200, sun: 170 },
  { date: 'Oct 23', fri: 150, sat: 190, sun: 165 },
];

// ============== INVENTORY HEALTH ACTIONS ==============
export const HEALTH_ACTIONS: InventoryHealthAction[] = [
  { label: 'Reorder Red Bull 12oz — demand up 22% vs last week', impact: '+4 pts', aiSource: true },
  { label: 'Move Old Seasonal Candy ($1.2k slow stock)', impact: '+5 pts' },
  { label: 'Adjust Gatorade reorder point 36→52 — warm weather pattern detected', impact: '+3 pts', aiSource: true },
  { label: 'Flag Oreo for promo — velocity dropped 30% in 14d', impact: '+2 pts', aiSource: true },
  { label: 'Increase Modelo safety stock before weekend — Friday spike pattern', impact: '+3 pts', aiSource: true },
];

// ============== OVERSTOCK TO MOVE (Grocery) ==============
export const OVERSTOCK_ITEMS: SlowMoverItem[] = [
  { item: 'Gum variety', onHand: 320, recentPace: '2/d', price: 1.50, suggestion: 'Promo 2-for' },
  { item: 'Seasonal candy', onHand: 180, recentPace: '1/d', price: 1.50, suggestion: 'Discount 30%' },
  { item: 'Gum variety', onHand: 320, recentPace: '2/d', price: 1.50, suggestion: 'Promo 2-for' },
];

// ============== WEEKLY WINS — ROI PROOF ==============
export type WeeklyWinItem = {
  label: string;
  detail: string;
};

export type WeeklyWinsData = {
  stockoutsPrevented: number;
  stockoutsSavedRevenue: number;
  wasteAvoided: number;
  wasteSavedDollars: number;
  reorderOptimized: number;
  overstockSaved: number;
  wins: WeeklyWinItem[];
  profitImpact: number;
  weekOverWeekChange: number;
};

export const WEEKLY_WINS: Record<BusinessType, WeeklyWinsData> = {
  admin: {
    stockoutsPrevented: 14,
    stockoutsSavedRevenue: 3280,
    wasteAvoided: 5,
    wasteSavedDollars: 420,
    reorderOptimized: 11,
    overstockSaved: 890,
    profitImpact: 4590,
    weekOverWeekChange: 12,
    wins: [
      { label: 'Caught Red Bull 12oz trending up 22%', detail: 'Auto-raised reorder point from 36→52 before weekend rush — avoided selling out Friday night' },
      { label: 'Flagged Seasonal Candy as slow mover', detail: '$1,200 in aging stock identified early — promo discount moved 60% of units in 4 days' },
      { label: 'Gatorade demand spike detected', detail: 'Warm weather pattern triggered early reorder — 48 extra units arrived 2 days before heatwave' },
      { label: 'Prevented Modelo stockout', detail: 'Friday spike pattern predicted 3x normal demand — extra case ordered saved ~$680 in lost sales' },
      { label: 'Reduced Oreo overstock', detail: 'Velocity drop of 30% detected → reorder point lowered, saving $210 in excess inventory' },
    ],
  },
  convenience: {
    stockoutsPrevented: 14,
    stockoutsSavedRevenue: 3280,
    wasteAvoided: 5,
    wasteSavedDollars: 420,
    reorderOptimized: 11,
    overstockSaved: 890,
    profitImpact: 4590,
    weekOverWeekChange: 12,
    wins: [
      { label: 'Caught Red Bull 12oz trending up 22%', detail: 'Auto-raised reorder point from 36→52 before weekend rush — avoided selling out Friday night' },
      { label: 'Flagged Seasonal Candy as slow mover', detail: '$1,200 in aging stock identified early — promo discount moved 60% of units in 4 days' },
      { label: 'Gatorade demand spike detected', detail: 'Warm weather pattern triggered early reorder — 48 extra units arrived 2 days before heatwave' },
      { label: 'Prevented Modelo stockout', detail: 'Friday spike pattern predicted 3x normal demand — extra case ordered saved ~$680 in lost sales' },
      { label: 'Reduced Oreo overstock', detail: 'Velocity drop of 30% detected → reorder point lowered, saving $210 in excess inventory' },
    ],
  },
  grocery: {
    stockoutsPrevented: 18,
    stockoutsSavedRevenue: 5640,
    wasteAvoided: 9,
    wasteSavedDollars: 780,
    reorderOptimized: 16,
    overstockSaved: 1340,
    profitImpact: 7760,
    weekOverWeekChange: 8,
    wins: [
      { label: 'Avocados: predicted ripeness spike', detail: 'Forecast caught 3-day shelf-life overlap with incoming shipment — reduced order by 40 units, saved $96 in spoilage' },
      { label: 'Bananas sell-through optimized', detail: 'ML model detected Tuesday banana demand 25% higher than avg — shifted reorder earlier to prevent gap' },
      { label: 'Bread aisle stockout prevented', detail: 'Wonder Bread and Sara Lee both flagged 2 days early — emergency reorder avoided $1,400 in lost basket sales' },
      { label: 'Dairy markdown timing improved', detail: 'Milk approaching expiry flagged 3 days out → discount moved 85% of units vs. usual 50%' },
      { label: 'Deli meat waste cut by half', detail: 'Forecast accurately predicted slower deli traffic mid-week → prep volume reduced, saved $340 in waste' },
      { label: 'Chip aisle overstock caught', detail: 'Post-Super Bowl demand normalized faster than expected — reorder paused, saved $520 in excess inventory' },
    ],
  },
  liquor: {
    stockoutsPrevented: 9,
    stockoutsSavedRevenue: 4120,
    wasteAvoided: 2,
    wasteSavedDollars: 180,
    reorderOptimized: 8,
    overstockSaved: 1560,
    profitImpact: 5860,
    weekOverWeekChange: 15,
    wins: [
      { label: 'Tequila surge before Cinco de Mayo', detail: 'Seasonal model predicted 4x demand increase — extra cases ordered 10 days early, captured $2,800 in sales competitors missed' },
      { label: 'Craft beer rotation optimized', detail: 'Slow-moving IPAs flagged at 14 days → moved to end-cap promo, cleared $480 in aging stock' },
      { label: 'Wine inventory right-sized', detail: 'Red wine demand drops 18% in warm months — ML adjusted par levels down, freed up $1,100 in cash' },
      { label: 'Whiskey reorder timing improved', detail: 'Lead time model accounted for distributor delays — order placed 3 days earlier, avoided weekend gap' },
    ],
  },
  restaurant: {
    stockoutsPrevented: 22,
    stockoutsSavedRevenue: 6800,
    wasteAvoided: 12,
    wasteSavedDollars: 1450,
    reorderOptimized: 14,
    overstockSaved: 980,
    profitImpact: 9230,
    weekOverWeekChange: 18,
    wins: [
      { label: 'Chicken wing demand nailed for game night', detail: 'Sports calendar integration predicted 2.5x wing orders — extra 200 lbs prepped, zero stockout during peak' },
      { label: 'Salmon waste reduced 65%', detail: 'Forecast showed Thursday salmon orders dropping — prep reduced from 30 to 18 portions, saved $380 in waste' },
      { label: 'Fry oil replacement optimized', detail: 'Usage-based forecast predicted oil change needed Thursday not Friday — avoided quality complaints and $120 rush order' },
      { label: 'Lettuce freshness managed', detail: '3-day shelf life tracked against predicted salad volume — order quantities matched exactly, zero waste this week' },
      { label: 'Weekend brunch prep accurate within 5%', detail: 'Egg and bacon orders predicted within 5% of actual — reduced over-prep waste by $290 vs. last month avg' },
      { label: 'Pasta portions right-sized', detail: 'Weekday dinner traffic model detected 12% drop → portion prep adjusted down, saved $180 in food cost' },
      { label: 'Dessert menu timing improved', detail: 'Cheesecake sell-through drops after 9pm — reduced late-night prep, saving $120/week in unsold desserts' },
    ],
  },
};
