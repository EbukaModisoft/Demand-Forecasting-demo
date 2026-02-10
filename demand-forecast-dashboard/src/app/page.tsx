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
  RefreshCw,
  Phone,
  AlertTriangle,
  CheckCircle,
  Sun,
  LayoutDashboard,
  LayoutList
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
  ReferenceLine,
  Cell
} from 'recharts';
import { ScenarioInputs, DEFAULT_SCENARIO_INPUTS, ActionItem, FuelTank, FuelDayForecast, FuelGrade, FuelInsight, FUEL_GRADE_LABELS, FUEL_GRADE_COLORS } from '../types';
import { buildActions, calculateScenarioMultiplier, calculateConfidence, updateActionStatus, getActionStats } from '../lib/actionEngine';
import { ScenarioCompareDrawer } from '../components/ScenarioCompareDrawer';

// ============== TYPES ==============
type BusinessType = 'convenience' | 'grocery' | 'liquor' | 'restaurant';

interface ForecastPoint {
  date: string;
  forecastRevenue: number;
  actualRevenue?: number;
  forecastUnits: number;
  actualUnits?: number;
}

interface LaborPlanRow {
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

interface Employee {
  id: string;
  name: string;
  phone: string;
  role: 'Manager' | 'Cashier' | 'Stocker' | 'Server' | 'Cook' | 'Bartender' | 'Host' | 'Busser';
  availability: number[]; // days of week available (0-6)
  maxHoursPerWeek: number;
  hourlyRate: number;
}

type ViewMode = 'briefing' | 'dashboard';

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

// Labor configuration for all business types
const LABOR_CONFIG: Record<BusinessType, {
  minutesPerUnit: number;
  unitLabel: string;
  baseSchedule: Record<number, number>;
}> = {
  convenience: {
    minutesPerUnit: 0.8,
    unitLabel: 'transactions',
    baseSchedule: { 0: 32, 1: 28, 2: 28, 3: 30, 4: 32, 5: 36, 6: 38 },
  },
  grocery: {
    minutesPerUnit: 0.6,
    unitLabel: 'transactions',
    baseSchedule: { 0: 48, 1: 40, 2: 40, 3: 42, 4: 44, 5: 52, 6: 56 },
  },
  liquor: {
    minutesPerUnit: 1.2,
    unitLabel: 'transactions',
    baseSchedule: { 0: 28, 1: 24, 2: 24, 3: 26, 4: 28, 5: 38, 6: 42 },
  },
  restaurant: {
    minutesPerUnit: 7,
    unitLabel: 'covers',
    baseSchedule: { 0: 54, 1: 42, 2: 42, 3: 44, 4: 48, 5: 58, 6: 62 },
  },
};

// Sample employees for all business types (with phone numbers for tap-to-call)
const EMPLOYEES: Record<BusinessType, Employee[]> = {
  convenience: [
    { id: 'e1', name: 'Marcus Johnson', phone: '555-0101', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 22 },
    { id: 'e2', name: 'Sarah Chen', phone: '555-0102', role: 'Cashier', availability: [1,2,3,4,5], maxHoursPerWeek: 35, hourlyRate: 15 },
    { id: 'e3', name: 'Devon Williams', phone: '555-0103', role: 'Cashier', availability: [0,4,5,6], maxHoursPerWeek: 25, hourlyRate: 15 },
    { id: 'e4', name: 'Aisha Patel', phone: '555-0104', role: 'Stocker', availability: [0,1,2,3,4], maxHoursPerWeek: 40, hourlyRate: 14 },
    { id: 'e5', name: 'Jake Morrison', phone: '555-0105', role: 'Stocker', availability: [2,3,4,5,6], maxHoursPerWeek: 30, hourlyRate: 14 },
    { id: 'e6', name: 'Emily Rodriguez', phone: '555-0106', role: 'Cashier', availability: [0,1,5,6], maxHoursPerWeek: 20, hourlyRate: 15 },
  ],
  grocery: [
    { id: 'g1', name: 'Robert Taylor', phone: '555-0201', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 24 },
    { id: 'g2', name: 'Jennifer Kim', phone: '555-0202', role: 'Cashier', availability: [1,2,3,4,5], maxHoursPerWeek: 40, hourlyRate: 16 },
    { id: 'g3', name: 'Michael Brown', phone: '555-0203', role: 'Cashier', availability: [0,4,5,6], maxHoursPerWeek: 32, hourlyRate: 16 },
    { id: 'g4', name: 'Lisa Martinez', phone: '555-0204', role: 'Stocker', availability: [0,1,2,3,4,5], maxHoursPerWeek: 40, hourlyRate: 15 },
    { id: 'g5', name: 'David Lee', phone: '555-0205', role: 'Stocker', availability: [1,2,3,4,5,6], maxHoursPerWeek: 40, hourlyRate: 15 },
    { id: 'g6', name: 'Amanda Wilson', phone: '555-0206', role: 'Cashier', availability: [0,1,2,5,6], maxHoursPerWeek: 35, hourlyRate: 16 },
    { id: 'g7', name: 'Chris Anderson', phone: '555-0207', role: 'Stocker', availability: [0,3,4,5,6], maxHoursPerWeek: 28, hourlyRate: 15 },
    { id: 'g8', name: 'Nicole Thomas', phone: '555-0208', role: 'Manager', availability: [1,2,3,4,5], maxHoursPerWeek: 40, hourlyRate: 23 },
  ],
  liquor: [
    { id: 'l1', name: 'James Walker', phone: '555-0301', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 25 },
    { id: 'l2', name: 'Stephanie Green', phone: '555-0302', role: 'Cashier', availability: [2,3,4,5,6], maxHoursPerWeek: 35, hourlyRate: 17 },
    { id: 'l3', name: 'Brian Harris', phone: '555-0303', role: 'Stocker', availability: [0,1,2,3,4], maxHoursPerWeek: 40, hourlyRate: 16 },
    { id: 'l4', name: 'Rachel Clark', phone: '555-0304', role: 'Cashier', availability: [0,4,5,6], maxHoursPerWeek: 28, hourlyRate: 17 },
    { id: 'l5', name: 'Kevin Lewis', phone: '555-0305', role: 'Stocker', availability: [1,2,3,5,6], maxHoursPerWeek: 32, hourlyRate: 16 },
  ],
  restaurant: [
    { id: 'r1', name: 'Maria Santos', phone: '555-0401', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 26 },
    { id: 'r2', name: 'Anthony Garcia', phone: '555-0402', role: 'Cook', availability: [1,2,3,4,5,6], maxHoursPerWeek: 40, hourlyRate: 20 },
    { id: 'r3', name: 'Jessica Moore', phone: '555-0403', role: 'Server', availability: [0,3,4,5,6], maxHoursPerWeek: 35, hourlyRate: 12 },
    { id: 'r4', name: 'Tyler Jackson', phone: '555-0404', role: 'Server', availability: [0,1,4,5,6], maxHoursPerWeek: 30, hourlyRate: 12 },
    { id: 'r5', name: 'Samantha White', phone: '555-0405', role: 'Host', availability: [0,4,5,6], maxHoursPerWeek: 25, hourlyRate: 14 },
    { id: 'r6', name: 'Brandon Thompson', phone: '555-0406', role: 'Cook', availability: [0,1,2,3,4,5], maxHoursPerWeek: 40, hourlyRate: 19 },
    { id: 'r7', name: 'Ashley Davis', phone: '555-0407', role: 'Server', availability: [1,2,3,4,5], maxHoursPerWeek: 38, hourlyRate: 12 },
    { id: 'r8', name: 'Ryan Martinez', phone: '555-0408', role: 'Bartender', availability: [0,3,4,5,6], maxHoursPerWeek: 32, hourlyRate: 15 },
    { id: 'r9', name: 'Megan Robinson', phone: '555-0409', role: 'Busser', availability: [0,1,2,5,6], maxHoursPerWeek: 25, hourlyRate: 13 },
    { id: 'r10', name: 'Daniel Hall', phone: '555-0410', role: 'Cook', availability: [0,2,3,4,5,6], maxHoursPerWeek: 42, hourlyRate: 21 },
  ],
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
  },
  {
    id: '4',
    dateRange: ['2026-09-13', '2026-09-14'],
    label: 'Local football game: +12% traffic',
    type: 'seasonality',
    impact: '+12% overall'
  },
  {
    id: '5',
    dateRange: ['2026-09-15', '2026-09-17'],
    label: 'Back-to-school rush: +6%',
    type: 'seasonality',
    impact: '+6% overall'
  },
  {
    id: '6',
    dateRange: ['2026-09-20', '2026-09-21'],
    label: 'Rainy forecast: -4% foot traffic',
    type: 'weather',
    impact: '-4% overall'
  },
  {
    id: '7',
    dateRange: ['2026-09-22', '2026-09-24'],
    label: 'Happy Hour promo: +15% beverages',
    type: 'promo',
    impact: '+15% beverages'
  },
  {
    id: '8',
    dateRange: ['2026-09-25', '2026-09-28'],
    label: 'End of month paycheck boost: +9%',
    type: 'seasonality',
    impact: '+9% overall'
  },
  {
    id: '9',
    dateRange: ['2026-09-16', '2026-09-16'],
    label: 'Competitor sale nearby: -5%',
    type: 'seasonality',
    impact: '-5% overall'
  },
  {
    id: '10',
    dateRange: ['2026-09-19', '2026-09-20'],
    label: 'Concert at arena: +18% evening traffic',
    type: 'seasonality',
    impact: '+18% evening'
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

// ============== FUEL / GAS STATION CONFIG ==============
const FUEL_TANKS: FuelTank[] = [
  { grade: 'regular', capacity: 10000, currentLevel: 3200, pricePerGallon: 3.29, dailyAvgSales: 1800, reorderThreshold: 2500, lastDeliveryDate: '2026-02-07' },
  { grade: 'plus', capacity: 6000, currentLevel: 4100, pricePerGallon: 3.59, dailyAvgSales: 450, reorderThreshold: 1500, lastDeliveryDate: '2026-02-07' },
  { grade: 'premium', capacity: 6000, currentLevel: 4800, pricePerGallon: 3.99, dailyAvgSales: 380, reorderThreshold: 1500, lastDeliveryDate: '2026-02-07' },
  { grade: 'diesel', capacity: 8000, currentLevel: 2100, pricePerGallon: 3.79, dailyAvgSales: 650, reorderThreshold: 2000, lastDeliveryDate: '2026-02-05' },
];

// Hourly traffic pattern (0-23 hours) - multiplier of base demand
const HOURLY_FUEL_PATTERN: number[] = [
  0.15, 0.10, 0.08, 0.08, 0.12, 0.35, // 12am-5am (low overnight, early risers at 5am)
  0.85, 1.40, 1.35, 0.90, 0.75, 0.95, // 6am-11am (morning rush 7-8am)
  1.10, 0.85, 0.70, 0.80, 1.25, 1.45, // 12pm-5pm (lunch bump, evening rush 4-5pm)
  1.20, 0.85, 0.55, 0.40, 0.30, 0.20  // 6pm-11pm (tapering off)
];

// Function to generate fuel forecast for a given day
function generateFuelDayForecast(date: string, weatherMultiplier: number = 1.0, eventMultiplier: number = 1.0): FuelDayForecast {
  const dayOfWeek = new Date(date).getDay();
  
  // Weekend vs weekday adjustment
  const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0; // Less commuter traffic on weekends
  const fridayMultiplier = dayOfWeek === 5 ? 1.15 : 1.0; // Friday travel boost
  
  const baseGallonsPerHour = 120; // base gallons per hour
  const combinedMultiplier = weekendMultiplier * fridayMultiplier * weatherMultiplier * eventMultiplier;
  
  const hourlyDemand = HOURLY_FUEL_PATTERN.map((pattern, hour) => {
    const gallons = Math.round(baseGallonsPerHour * pattern * combinedMultiplier);
    const transactions = Math.round(gallons / 12); // avg 12 gallons per transaction
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    
    return {
      hour,
      gallons,
      transactions,
      isRushHour,
      weatherMultiplier,
    };
  });
  
  const totalGallons = hourlyDemand.reduce((sum, h) => sum + h.gallons, 0);
  const expectedTransactions = hourlyDemand.reduce((sum, h) => sum + h.transactions, 0);
  
  // Distribution by grade (typical US split)
  const byGrade: Record<FuelGrade, number> = {
    regular: Math.round(totalGallons * 0.60), // 60% regular
    plus: Math.round(totalGallons * 0.15),    // 15% plus
    premium: Math.round(totalGallons * 0.13), // 13% premium
    diesel: Math.round(totalGallons * 0.12),  // 12% diesel
  };
  
  // Calculate revenue
  const totalRevenue = 
    byGrade.regular * FUEL_TANKS[0].pricePerGallon +
    byGrade.plus * FUEL_TANKS[1].pricePerGallon +
    byGrade.premium * FUEL_TANKS[2].pricePerGallon +
    byGrade.diesel * FUEL_TANKS[3].pricePerGallon;
  
  // Find peak hour
  const peakHour = hourlyDemand.reduce((max, h) => h.gallons > max.gallons ? h : max).hour;
  
  // Conversion rate: % of fuel customers who buy in-store (varies by time)
  const avgConversionRate = 0.32 + (Math.random() * 0.08); // 32-40%
  
  return {
    date,
    totalGallons,
    totalRevenue: Math.round(totalRevenue),
    byGrade,
    hourlyDemand,
    peakHour,
    conversionRate: avgConversionRate,
    expectedTransactions,
  };
}

// Generate fuel insights based on current state
function generateFuelInsights(tanks: FuelTank[], todayForecast: FuelDayForecast): FuelInsight[] {
  const insights: FuelInsight[] = [];
  
  // Check tank levels
  tanks.forEach(tank => {
    const daysUntilEmpty = tank.currentLevel / tank.dailyAvgSales;
    if (tank.currentLevel <= tank.reorderThreshold) {
      insights.push({
        id: `tank-${tank.grade}`,
        type: 'tank_low',
        priority: daysUntilEmpty < 1 ? 'high' : 'medium',
        title: `${FUEL_GRADE_LABELS[tank.grade]} tank low`,
        description: `${Math.round(tank.currentLevel).toLocaleString()} gal remaining (~${daysUntilEmpty.toFixed(1)} days). Reorder now.`,
        actionLabel: 'Schedule Delivery',
        expectedImpact: 'Avoid stockout',
      });
    }
  });
  
  // Rush hour staffing alert
  const morningRush = todayForecast.hourlyDemand.filter(h => h.hour >= 7 && h.hour <= 9);
  const morningTransactions = morningRush.reduce((sum, h) => sum + h.transactions, 0);
  if (morningTransactions > 80) {
    insights.push({
      id: 'rush-morning',
      type: 'rush_hour',
      priority: 'medium',
      title: 'Morning rush: extra pump traffic',
      description: `Expecting ${morningTransactions} fuel transactions 7-9 AM. Consider opening register early.`,
      actionLabel: 'Adjust Schedule',
      expectedImpact: '+$120 in-store sales',
    });
  }
  
  // Evening rush alert
  const eveningRush = todayForecast.hourlyDemand.filter(h => h.hour >= 16 && h.hour <= 18);
  const eveningTransactions = eveningRush.reduce((sum, h) => sum + h.transactions, 0);
  if (eveningTransactions > 75) {
    insights.push({
      id: 'rush-evening',
      type: 'rush_hour',
      priority: 'medium',
      title: 'Evening commute: peak pump time',
      description: `Expecting ${eveningTransactions} transactions 4-6 PM. Stock grab-and-go cooler.`,
      actionLabel: 'Prep Station',
      expectedImpact: '+$95 cross-sell',
    });
  }
  
  // Cross-sell opportunity
  const conversionPct = Math.round(todayForecast.conversionRate * 100);
  insights.push({
    id: 'cross-sell',
    type: 'cross_sell',
    priority: 'low',
    title: 'In-store conversion opportunity',
    description: `${conversionPct}% of fuel customers buy inside. Display coffee & snacks at pump sightline.`,
    actionLabel: 'View Tips',
    expectedImpact: `+${Math.round(todayForecast.expectedTransactions * 0.05 * 8)} potential`,
  });
  
  return insights;
}

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
  const [viewMode, setViewMode] = useState<ViewMode>('briefing');
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
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [items, setItems] = useState(BUSINESS_TOP_ITEMS[businessType]);
  
  // Filter state
  const [selectedStores, setSelectedStores] = useState<string[]>(['all']);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['all']);

  // Scenario state
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInputs>(DEFAULT_SCENARIO_INPUTS);
  const scenarioMultiplier = useMemo(() => calculateScenarioMultiplier(scenarioInputs), [scenarioInputs]);
  const isScenarioActive = Object.values(scenarioInputs).some(v => v !== 0);

  // Actions state
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [actionFilter, setActionFilter] = useState<'all' | 'open' | 'accepted' | 'done'>('all');

  // Generate forecast data
  const forecastData = useMemo(() => {
    return generateForecastData(28, businessProfile.baseRevenue, businessProfile.baseUnits);
  }, [businessType]);

  // ===== FUEL STATION DATA (convenience store only) =====
  const fuelTanks = useMemo(() => FUEL_TANKS, []);

  const fuelPrimaryDate = useMemo(() => {
    if (businessType !== 'convenience') return null;

    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr >= startDate && todayStr <= endDate) return todayStr;
    // When users change date ranges, they usually anchor on the range end.
    // Using endDate makes fuel cards respond immediately like the other KPIs.
    return endDate;
  }, [businessType, startDate, endDate]);
  
  const fuelForecast = useMemo(() => {
    if (businessType !== 'convenience') return null;

    const start = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    const maxDays = Math.min(28, Math.max(1, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1));

    const forecasts: FuelDayForecast[] = [];

    for (let i = 0; i < maxDays; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Apply multipliers based on the same insight events used elsewhere.
      let weatherMult = 1.0;
      let eventMult = 1.0;

      for (const ev of INSIGHT_EVENTS) {
        const inRange = dateStr >= ev.dateRange[0] && dateStr <= ev.dateRange[1];
        if (!inRange) continue;

        if (ev.type === 'weather') {
          const label = ev.label.toLowerCase();
          if (label.includes('rain')) weatherMult *= 0.92;
          else if (label.includes('heat')) weatherMult *= 1.08;
          else weatherMult *= 0.98;
        } else if (ev.type === 'promo') {
          // Promos can increase forecourt traffic slightly.
          eventMult *= 1.03;
        } else {
          // Seasonality / local events.
          eventMult *= 1.08;
        }
      }

      forecasts.push(generateFuelDayForecast(dateStr, weatherMult, eventMult));
    }

    return forecasts;
  }, [businessType, startDate, endDate]);

  const todayFuelForecast = useMemo(() => {
    if (!fuelForecast || !fuelPrimaryDate) return null;
    return fuelForecast.find(d => d.date === fuelPrimaryDate) ?? fuelForecast[0] ?? null;
  }, [fuelForecast, fuelPrimaryDate]);
  
  const fuelInsights = useMemo(() => {
    if (!todayFuelForecast) return [];
    return generateFuelInsights(fuelTanks, todayFuelForecast);
  }, [fuelTanks, todayFuelForecast]);
  
  // Fuel KPIs
  const fuelKpis = useMemo(() => {
    if (!fuelForecast) return null;

    const rangeTotal = fuelForecast.reduce((sum, day) => sum + day.totalGallons, 0);
    const rangeRevenue = fuelForecast.reduce((sum, day) => sum + day.totalRevenue, 0);
    const avgConversion = fuelForecast.reduce((sum, day) => sum + day.conversionRate, 0) / fuelForecast.length;
    const lowTanks = fuelTanks.filter(t => t.currentLevel <= t.reorderThreshold).length;
    
    return {
      todayGallons: todayFuelForecast?.totalGallons ?? 0,
      todayRevenue: todayFuelForecast?.totalRevenue ?? 0,
      weekGallons: rangeTotal,
      weekRevenue: rangeRevenue,
      avgConversion: Math.round(avgConversion * 100),
      lowTankCount: lowTanks,
      peakHour: todayFuelForecast?.peakHour ?? 17,
      primaryDate: todayFuelForecast?.date ?? startDate,
      rangeDays: fuelForecast.length,
    };
  }, [fuelForecast, fuelTanks, todayFuelForecast, startDate]);

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

  // Combined multiplier (filters + scenario)
  const combinedMultiplier = useMemo(() => {
    return Number((filterMultiplier * scenarioMultiplier).toFixed(2));
  }, [filterMultiplier, scenarioMultiplier]);

  // Chart data transformation
  const chartData = useMemo(() => {
    return filteredForecastData.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: point.date,
      // Actual = past/current, Forecast = future. Keep them mutually exclusive so the
      // series do not overlap/intertwine.
      forecast: point.actualRevenue != null ? null : Math.round(point.forecastRevenue * combinedMultiplier),
      actual: point.actualRevenue != null ? Math.round(point.actualRevenue * filterMultiplier) : null, // Actuals don't get scenario
      forecastUnits: point.actualUnits != null ? null : Math.round(point.forecastUnits * combinedMultiplier),
      actualUnits: point.actualUnits != null ? Math.round(point.actualUnits * filterMultiplier) : null,
    }));
  }, [filteredForecastData, filterMultiplier, combinedMultiplier]);

  // KPI calculations (forecasts affected by scenario, actuals not)
  const kpiData = useMemo(() => {
    const revenueForecast = filteredForecastData.reduce((sum, p) => sum + (p.actualRevenue ?? p.forecastRevenue), 0);
    const unitsForecast = filteredForecastData.reduce((sum, p) => sum + (p.actualUnits ?? p.forecastUnits), 0);
    return {
      revenueForecast: Math.round(revenueForecast * combinedMultiplier),
      promoBoost: businessProfile.promoBoost + Math.round(scenarioInputs.promoLiftPct * 0.8),
      unitsForecast: Math.round(unitsForecast * combinedMultiplier),
      weatherImpact: businessProfile.weatherImpact + scenarioInputs.weatherImpactPct,
      todayVsTypical: businessProfile.todayVsTypical,
      dataHealthScore: businessProfile.dataHealthScore,
    };
  }, [filteredForecastData, businessProfile, combinedMultiplier, scenarioInputs]);

  const laborPlan: LaborPlanRow[] = useMemo(() => {
    const laborConfig = LABOR_CONFIG[businessType];
    const employees = EMPLOYEES[businessType];

    return filteredForecastData
      .slice(0, forecastWindow)
      .map((point) => {
        const dateObj = new Date(point.date);
        const dow = dateObj.getDay();
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const forecastUnits = Math.max(0, Math.round((point.actualUnits ?? point.forecastUnits) * combinedMultiplier));
        
        // For restaurants, use ~55% as covers; for retail, use full units as transactions
        const workloadUnits = businessType === 'restaurant' 
          ? Math.round(forecastUnits * 0.55) 
          : forecastUnits;
        
        const neededHours = Math.max(0, Math.round((workloadUnits * laborConfig.minutesPerUnit) / 60));
        const scheduledHours = laborConfig.baseSchedule[dow] ?? 40;
        const deltaHours = neededHours - scheduledHours;
        const recommendation: LaborPlanRow['recommendation'] = deltaHours > 4 ? 'Upstaff' : deltaHours < -4 ? 'Downstaff' : 'Hold';
        
        // Find relevant insight for this date
        const insightDriver = INSIGHT_EVENTS.find((evt) => point.date >= evt.dateRange[0] && point.date <= evt.dateRange[1]);
        const weekendLift = dow === 0 || dow === 6;
        const reason = insightDriver
          ? `Demand driver: ${insightDriver.label}`
          : weekendLift
            ? 'Weekend uplift vs weekday'
            : `Based on forecasted ${laborConfig.unitLabel} trend`;

        // Assign employees based on availability for this day
        const availableEmployees = employees.filter(emp => emp.availability.includes(dow));
        const assignedEmployees = availableEmployees.slice(0, Math.ceil(scheduledHours / 8)).map(e => e.name);
        
        // Suggest additional employees if upstaffing needed
        const suggestedEmployees: string[] = [];
        if (recommendation === 'Upstaff') {
          const additionalNeeded = Math.ceil(deltaHours / 6);
          const notAssigned = availableEmployees.filter(e => !assignedEmployees.includes(e.name));
          suggestedEmployees.push(...notAssigned.slice(0, additionalNeeded).map(e => e.name));
        }

        return {
          date: point.date,
          dayLabel,
          covers: workloadUnits,
          neededHours,
          scheduledHours,
          deltaHours,
          recommendation,
          reason,
          assignedEmployees,
          suggestedEmployees,
        };
      });
  }, [businessType, filteredForecastData, combinedMultiplier, forecastWindow]);

  const laborSummary = useMemo(() => {
    if (laborPlan.length === 0) return null;

    const upstaffDays = laborPlan.filter((row) => row.recommendation === 'Upstaff');
    const downstaffDays = laborPlan.filter((row) => row.recommendation === 'Downstaff');
    const peakDay = laborPlan.reduce((peak, row) => (peak && peak.deltaHours > row.deltaHours ? peak : row), laborPlan[0]);

    return {
      upstaffDays,
      downstaffDays,
      peakDay,
      avgDelta: Math.round(
        laborPlan.reduce((sum, row) => sum + row.deltaHours, 0) / laborPlan.length
      ),
    };
  }, [laborPlan]);

  // Forecast confidence calculation
  const forecastConfidence = useMemo(() => {
    const activeEventCount = INSIGHT_EVENTS.filter(evt => 
      evt.dateRange[0] <= endDate && evt.dateRange[1] >= startDate
    ).length;
    return calculateConfidence({
      dataHealthScore: kpiData.dataHealthScore,
      activeEventCount,
      historicalVariance: 25, // Mock value for demo
    });
  }, [kpiData.dataHealthScore, startDate, endDate]);

  // Generate actions based on current state
  useEffect(() => {
    const generatedActions = buildActions({
      businessType,
      laborPlan,
      insightEvents: INSIGHT_EVENTS,
      topItems: items.map(item => ({
        id: item.id,
        name: item.name,
        department: item.department,
        forecastRevenue: item.forecastRevenue,
        forecastUnits: item.forecastUnits,
        price: item.price,
        isPromoActive: item.isPromoActive,
      })),
      employees: EMPLOYEES[businessType],
      kpiData,
      scenarioInputs,
      currentDate: startDate,
      fuelInsights: businessType === 'convenience' ? fuelInsights : undefined,
      fuelPrimaryDate: businessType === 'convenience' ? (fuelKpis?.primaryDate ?? startDate) : undefined,
    });
    setActions(generatedActions);
  }, [businessType, laborPlan, items, kpiData, scenarioInputs, startDate, fuelInsights, fuelKpis?.primaryDate]);

  // Action stats
  const actionStats = useMemo(() => getActionStats(actions), [actions]);

  // Handle action status update
  const handleActionUpdate = (actionId: string, newStatus: ActionItem['status'], reason?: string) => {
    setActions(prev => updateActionStatus(prev, actionId, newStatus, reason ? { ignoredReason: reason } : undefined));
  };

  // Filtered actions based on current tab
  const filteredActions = useMemo(() => {
    if (actionFilter === 'all') return actions;
    return actions.filter(a => a.status === actionFilter);
  }, [actions, actionFilter]);

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
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none z-10" />
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="appearance-none bg-white/15 hover:bg-white/20 text-white px-3 pr-9 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 [&>option]:bg-[#1E3A5F] [&>option]:text-white"
                aria-label="Business type"
                style={{ colorScheme: 'dark' }}
              >
                <option value="convenience" className="bg-[#1E3A5F] text-white">Convenience</option>
                <option value="grocery" className="bg-[#1E3A5F] text-white">Grocery/Retail</option>
                <option value="liquor" className="bg-[#1E3A5F] text-white">Liquor</option>
                <option value="restaurant" className="bg-[#1E3A5F] text-white">Restaurant</option>
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
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('briefing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'briefing' 
                    ? 'bg-white text-[#1E3A5F]' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Simple
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'dashboard' 
                    ? 'bg-white text-[#1E3A5F]' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            </div>
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
          {viewMode === 'briefing' ? (
            /* ================ SIMPLE BRIEFING VIEW ================ */
            <div className="max-w-5xl mx-auto">
              {/* Good Morning Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Good morning! 👋
                </h1>
                <p className="text-lg text-gray-600">
                  Here's what's happening at your {businessProfile.label.toLowerCase()} this week.
                </p>
              </div>

              {/* Big Number Card */}
              <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl p-8 mb-8 text-white shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium mb-2">Expected this week</p>
                    <p className="text-5xl font-bold mb-3">${Math.round(kpiData.revenueForecast).toLocaleString()}</p>
                    <p className="text-white/80 text-lg">
                      {kpiData.todayVsTypical >= 0 ? (
                        <span className="text-emerald-300">↑ {Math.abs(kpiData.todayVsTypical)}% better than usual</span>
                      ) : (
                        <span className="text-amber-300">↓ {Math.abs(kpiData.todayVsTypical)}% slower than usual</span>
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsSunnyOpen(true)}
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <Image src="/sunny.png" alt="Sunny" width={20} height={20} />
                    Ask Sunny why
                  </button>
                </div>
              </div>

              {/* Fuel Snapshot (Convenience stores) */}
              {businessType === 'convenience' && fuelKpis && todayFuelForecast && (
                <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⛽</span>
                      <h2 className="text-xl font-bold text-gray-900">Fuel Snapshot</h2>
                      <span className="text-sm text-gray-500">
                        {new Date(fuelKpis.primaryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {fuelKpis.rangeDays} day range
                      </span>
                    </div>
                    <button
                      onClick={() => setViewMode('dashboard')}
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                    >
                      View details →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Fuel revenue (range)</p>
                      <p className="text-2xl font-bold text-gray-900">${fuelKpis.weekRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">Avg ${Math.round(fuelKpis.weekRevenue / Math.max(1, fuelKpis.rangeDays)).toLocaleString()}/day</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Selected day gallons</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {fuelKpis.todayGallons.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Peak {fuelKpis.peakHour > 12 ? fuelKpis.peakHour - 12 : fuelKpis.peakHour}:00 {fuelKpis.peakHour >= 12 ? 'PM' : 'AM'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">In-store conversion</p>
                      <p className="text-2xl font-bold text-gray-900">{fuelKpis.avgConversion}%</p>
                      <p className="text-xs text-gray-400 mt-1">fuel → inside</p>
                    </div>
                    <div className={`rounded-xl p-4 border ${fuelKpis.lowTankCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <p className="text-xs text-gray-500 mb-1">Tank alerts</p>
                      <p className={`text-2xl font-bold ${fuelKpis.lowTankCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {fuelKpis.lowTankCount > 0 ? `${fuelKpis.lowTankCount} low` : 'All good'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">reorder threshold</p>
                    </div>
                  </div>

                  {fuelInsights.length > 0 && (
                    <div className="flex items-center justify-between bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🚗</span>
                        <div>
                          <p className="font-bold text-gray-900">{fuelInsights[0].title}</p>
                          <p className="text-sm text-gray-600">{fuelInsights[0].description}</p>
                        </div>
                      </div>
                      {fuelInsights[0].actionLabel && (
                        <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors border border-amber-200">
                          {fuelInsights[0].actionLabel}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Week at a Glance */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Week at a Glance</h2>
                <div className="grid grid-cols-7 gap-3">
                  {laborPlan.slice(0, 7).map((day, i) => {
                    const isToday = i === 0;
                    const status = day.recommendation === 'Upstaff' ? 'busy' : day.recommendation === 'Downstaff' ? 'slow' : 'normal';
                    return (
                      <div 
                        key={day.date}
                        className={`relative rounded-xl p-4 text-center transition-all ${
                          isToday ? 'ring-2 ring-teal-500 ring-offset-2' : ''
                        } ${
                          status === 'busy' ? 'bg-emerald-50 border-2 border-emerald-200' :
                          status === 'slow' ? 'bg-amber-50 border-2 border-amber-200' :
                          'bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        {isToday && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded-full">TODAY</span>
                        )}
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-2xl font-bold mb-1">
                          {new Date(day.date).getDate()}
                        </p>
                        <div className={`inline-block w-3 h-3 rounded-full ${
                          status === 'busy' ? 'bg-emerald-500' :
                          status === 'slow' ? 'bg-amber-500' :
                          'bg-gray-400'
                        }`} />
                        <p className={`text-xs font-medium mt-1 ${
                          status === 'busy' ? 'text-emerald-700' :
                          status === 'slow' ? 'text-amber-700' :
                          'text-gray-600'
                        }`}>
                          {status === 'busy' ? 'Busy' : status === 'slow' ? 'Slow' : 'Normal'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-gray-600">Busy day - need extra help</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-gray-600">Slow day - can reduce staff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-gray-600">Normal day</span>
                  </div>
                </div>
              </div>

              {/* Needs Your Attention - Using Action Engine */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-900">Needs Your Attention</h2>
                  </div>
                  {actionStats.openCount > 0 && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      {actionStats.openCount} items
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {filteredActions.filter(a => a.status === 'open').slice(0, 4).map((action) => (
                    <div 
                      key={action.id} 
                      className={`flex items-center justify-between rounded-xl p-4 border ${
                        action.type === 'labor' ? 'bg-amber-50 border-amber-200' :
                        action.type === 'event' ? 'bg-sky-50 border-sky-200' :
                        action.type === 'promo' ? 'bg-purple-50 border-purple-200' :
                        action.type === 'fuel' ? 'bg-orange-50 border-orange-200' :
                        'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          action.type === 'labor' ? 'bg-amber-400' :
                          action.type === 'event' ? 'bg-sky-400' :
                          action.type === 'promo' ? 'bg-purple-400' :
                          action.type === 'fuel' ? 'bg-orange-400' :
                          'bg-emerald-400'
                        }`}>
                          <span className="text-2xl">
                            {action.type === 'labor' ? '👥' : 
                             action.type === 'event' ? '📅' : 
                             action.type === 'promo' ? '🏷️' :
                             action.type === 'fuel' ? '⛽' : '💰'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-600">{action.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{action.expectedValueLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.suggestedEmployee && (
                          <a 
                            href={`tel:${action.suggestedEmployee.phone}`}
                            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Call {action.suggestedEmployee.name.split(' ')[0]}
                          </a>
                        )}
                        <button
                          onClick={() => handleActionUpdate(action.id, 'accepted')}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  ))}

                  {actions.filter(a => a.status === 'open').length === 0 && (
                    <div className="flex items-center gap-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                      <p className="font-medium text-emerald-800">All good! Nothing urgent needs your attention.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Team This Week */}
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Team This Week</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {EMPLOYEES[businessType].map((employee) => {
                    const scheduledDays = laborPlan.filter(day => day.assignedEmployees.includes(employee.name)).length;
                    return (
                      <div key={employee.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{scheduledDays} days scheduled</span>
                          <a 
                            href={`tel:${employee.phone}`}
                            className="p-2 bg-white hover:bg-teal-50 rounded-lg border border-gray-200 transition-colors"
                            title={`Call ${employee.name}`}
                          >
                            <Phone className="w-4 h-4 text-teal-600" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sunny's Tip */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Image src="/sunny.png" alt="Sunny" width={40} height={40} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Sunny's Tip of the Day</h3>
                    <p className="text-gray-700 mb-4">
                      {businessType === 'restaurant' && "Valentine's Day is coming up! Consider taking reservations now - restaurants typically see 40% more traffic that week."}
                      {businessType === 'liquor' && "Super Bowl Sunday is around the corner! Stock up on beer, chips, and party supplies - it's one of the biggest sales days of the year."}
                      {businessType === 'convenience' && "Energy drinks and coffee sell 25% better on Monday mornings. Make sure they're stocked and visible at the front!"}
                      {businessType === 'grocery' && "Weekend shoppers buy 30% more than weekday shoppers. Schedule your best staff for Saturday and Sunday."}
                    </p>
                    <button 
                      onClick={() => setIsSunnyOpen(true)}
                      className="text-amber-700 hover:text-amber-800 font-medium text-sm"
                    >
                      Tell me more →
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Action: Switch to Dashboard */}
              <div className="mt-8 text-center">
                <button 
                  onClick={() => setViewMode('dashboard')}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Want more details? Switch to Dashboard view
                </button>
              </div>
            </div>
          ) : (
            /* ================ DETAILED DASHBOARD VIEW ================ */
            <>
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
              title="Expected Revenue"
              value={formatLargeNumber(kpiData.revenueForecast)}
              subtitle={`Next ${forecastWindow} days`}
              tooltip="Total sales we expect"
            />
            <KpiCard 
              title="Promo Boost"
              value={`+${kpiData.promoBoost}%`}
              subtitle="From active promotions"
            />
            <KpiCard 
              title="Items We'll Sell"
              value={`${kpiData.unitsForecast.toLocaleString()}`}
              subtitle={`Next ${forecastWindow} days`}
            />
            <KpiCard 
              title="Weather & Events"
              value={`+${kpiData.weatherImpact}%`}
              subtitle="Impact on sales"
            />
            <KpiCard 
              title="Today vs Normal"
              value={`${kpiData.todayVsTypical}%`}
              subtitle="Compared to a typical day"
            />
            <KpiCard 
              title="Data Issues"
              value={`${kpiData.dataHealthScore}`}
              subtitle="Items need review"
            />
          </div>

          {/* ===== ACTION CENTER + CONFIDENCE ===== */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Action Center Card */}
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Action Center</h3>
                    <p className="text-xs text-gray-500">Recommendations based on your forecast</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">${actionStats.totalExpectedValue.toLocaleString()} potential</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {(['all', 'open', 'accepted', 'done'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActionFilter(tab)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          actionFilter === tab 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'open' && actionStats.openCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">
                            {actionStats.openCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredActions.slice(0, 5).map((action) => (
                  <div 
                    key={action.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      action.status === 'done' ? 'bg-emerald-50 border-emerald-200' :
                      action.status === 'accepted' ? 'bg-blue-50 border-blue-200' :
                      action.status === 'ignored' ? 'bg-gray-50 border-gray-200 opacity-60' :
                      action.priority === 'high' ? 'bg-amber-50 border-amber-200' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        action.type === 'labor' ? 'bg-indigo-100 text-indigo-600' :
                        action.type === 'promo' ? 'bg-purple-100 text-purple-600' :
                        action.type === 'pricing' ? 'bg-emerald-100 text-emerald-600' :
                        action.type === 'fuel' ? 'bg-orange-100 text-orange-600' :
                        'bg-sky-100 text-sky-600'
                      }`}>
                        {action.type === 'labor' ? '👥' : action.type === 'promo' ? '🏷️' : action.type === 'pricing' ? '💰' : action.type === 'fuel' ? '⛽' : '📅'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.expectedValueLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.status === 'open' && (
                        <>
                          {action.suggestedEmployee && (
                            <a 
                              href={`tel:${action.suggestedEmployee.phone}`}
                              className="px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              Call
                            </a>
                          )}
                          <button
                            onClick={() => handleActionUpdate(action.id, 'accepted')}
                            className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleActionUpdate(action.id, 'ignored')}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                          >
                            Skip
                          </button>
                        </>
                      )}
                      {action.status === 'accepted' && (
                        <button
                          onClick={() => handleActionUpdate(action.id, 'done')}
                          className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg"
                        >
                          Mark Done
                        </button>
                      )}
                      {action.status === 'done' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredActions.length === 0 && (
                  <p className="text-center text-gray-400 py-4 text-sm">No actions in this category</p>
                )}
              </div>
            </div>

            {/* Confidence Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${
                  forecastConfidence.level === 'high' ? 'bg-emerald-100' :
                  forecastConfidence.level === 'medium' ? 'bg-amber-100' :
                  'bg-red-100'
                }`}>
                  <Info className={`w-5 h-5 ${
                    forecastConfidence.level === 'high' ? 'text-emerald-600' :
                    forecastConfidence.level === 'medium' ? 'text-amber-600' :
                    'text-red-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Forecast Confidence</h3>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-bold ${
                    forecastConfidence.level === 'high' ? 'text-emerald-600' :
                    forecastConfidence.level === 'medium' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {forecastConfidence.level.charAt(0).toUpperCase() + forecastConfidence.level.slice(1)}
                  </span>
                  <span className="text-sm text-gray-400">{forecastConfidence.score}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      forecastConfidence.level === 'high' ? 'bg-emerald-500' :
                      forecastConfidence.level === 'medium' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${forecastConfidence.score}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                {forecastConfidence.reasons.map((reason, i) => (
                  <p key={i} className="text-xs text-gray-500 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {reason}
                  </p>
                ))}
              </div>
              
              {isScenarioActive && (
                <div className="mt-4 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs text-indigo-700 font-medium">Scenario adjustments applied</p>
                </div>
              )}
            </div>
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
          {businessType === 'convenience' && fuelKpis && (
            <>
              {/* ===== FUEL / GAS STATION SECTION ===== */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⛽</span>
                  <h2 className="text-lg font-semibold text-gray-900">Fuel Station</h2>
                  <span className="text-xs text-gray-500">
                    {new Date(fuelKpis.primaryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {fuelKpis.rangeDays} day range
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    {fuelInsights.filter(i => i.priority === 'high').length > 0 ? `${fuelInsights.filter(i => i.priority === 'high').length} alert` : 'OK'}
                  </span>
                </div>
                
                {/* Fuel KPI Row */}
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Fuel Revenue (Range)</p>
                    <p className="text-2xl font-bold text-gray-900">${fuelKpis.weekRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Avg ${Math.round(fuelKpis.weekRevenue / Math.max(1, fuelKpis.rangeDays)).toLocaleString()}/day</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Fuel Gallons (Range)</p>
                    <p className="text-2xl font-bold text-gray-900">{fuelKpis.weekGallons.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Avg {Math.round(fuelKpis.weekGallons / Math.max(1, fuelKpis.rangeDays)).toLocaleString()} gal/day</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Peak Hour</p>
                    <p className="text-2xl font-bold text-gray-900">{fuelKpis.peakHour > 12 ? fuelKpis.peakHour - 12 : fuelKpis.peakHour}:00 {fuelKpis.peakHour >= 12 ? 'PM' : 'AM'}</p>
                    <p className="text-xs text-gray-400 mt-1">Selected day: {new Date(fuelKpis.primaryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">In-Store Conversion</p>
                    <p className="text-2xl font-bold text-gray-900">{fuelKpis.avgConversion}%</p>
                    <p className="text-xs text-gray-400 mt-1">of fuel customers</p>
                  </div>
                  <div className={`rounded-xl border p-4 shadow-sm ${fuelKpis.lowTankCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">Tank Status</p>
                    <p className={`text-2xl font-bold ${fuelKpis.lowTankCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {fuelKpis.lowTankCount > 0 ? `${fuelKpis.lowTankCount} Low` : 'All OK'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{fuelTanks.length} tanks total</p>
                  </div>
                </div>

                {/* Tank Levels + Insights Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Tank Level Gauges */}
                  <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Tank Levels</h3>
                      <button className="text-teal-600 text-sm font-medium hover:text-teal-700">Schedule Delivery →</button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {fuelTanks.map((tank) => {
                        const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
                        const daysLeft = tank.currentLevel / tank.dailyAvgSales;
                        const isLow = tank.currentLevel <= tank.reorderThreshold;
                        
                        return (
                          <div key={tank.grade} className="text-center">
                            <div className="relative w-20 h-28 mx-auto mb-2">
                              {/* Tank outline */}
                              <div className="absolute inset-0 rounded-lg border-2 border-gray-300 bg-gray-100 overflow-hidden">
                                {/* Fill level */}
                                <div 
                                  className={`absolute bottom-0 left-0 right-0 transition-all ${
                                    isLow ? 'bg-red-400' : pct < 50 ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ height: `${pct}%` }}
                                />
                                {/* Grade badge */}
                                <div 
                                  className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white"
                                  style={{ backgroundColor: FUEL_GRADE_COLORS[tank.grade] }}
                                />
                              </div>
                            </div>
                            <p className="font-medium text-gray-900 text-sm">{FUEL_GRADE_LABELS[tank.grade]}</p>
                            <p className="text-xs text-gray-500">{tank.currentLevel.toLocaleString()} / {tank.capacity.toLocaleString()} gal</p>
                            <p className={`text-xs mt-1 ${isLow ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              {daysLeft < 1 ? '< 1 day' : `~${daysLeft.toFixed(1)} days`}
                            </p>
                            <p className="text-sm font-semibold mt-1" style={{ color: FUEL_GRADE_COLORS[tank.grade] }}>${tank.pricePerGallon.toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fuel Insights */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3">Fuel Alerts</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {fuelInsights.slice(0, 4).map((insight) => (
                        <div 
                          key={insight.id} 
                          className={`p-3 rounded-lg border ${
                            insight.priority === 'high' ? 'bg-red-50 border-red-200' :
                            insight.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">
                              {insight.type === 'tank_low' ? '⚠️' :
                               insight.type === 'rush_hour' ? '🚗' :
                               insight.type === 'cross_sell' ? '🛒' :
                               insight.type === 'price_alert' ? '💰' : '📊'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm">{insight.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{insight.description}</p>
                              {insight.actionLabel && (
                                <button className="mt-2 px-2 py-1 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border">
                                  {insight.actionLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hourly Fuel Demand Chart */}
                {todayFuelForecast && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Today's Fuel Demand by Hour</h3>
                        <p className="text-xs text-gray-500">Rush hours highlighted • Adjust staffing accordingly</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400"></span> Rush Hour</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-400"></span> Normal</span>
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={todayFuelForecast.hourlyDemand.map(h => ({
                          ...h,
                          label: h.hour === 0 ? '12am' : h.hour < 12 ? `${h.hour}am` : h.hour === 12 ? '12pm' : `${h.hour - 12}pm`,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickFormatter={(v) => `${v}gal`}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'gallons' ? `${value} gallons` : `${value} transactions`,
                              name === 'gallons' ? 'Fuel Demand' : 'Transactions'
                            ]}
                          />
                          <Bar 
                            dataKey="gallons" 
                            radius={[4, 4, 0, 0]}
                            fill="#14b8a6"
                          >
                            {todayFuelForecast.hourlyDemand.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isRushHour ? '#f59e0b' : '#14b8a6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Cross-sell Opportunity Card */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🛒</span>
                      <h3 className="font-semibold text-gray-900">Cross-Sell Opportunity</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>{fuelKpis.avgConversion}%</strong> of fuel customers buy something inside. 
                      That's ~{Math.round(fuelKpis.todayGallons / 12 * fuelKpis.avgConversion / 100)} customers today.
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">💡 <strong>Top cross-sells:</strong> Coffee, Energy Drinks, Snacks</p>
                      <p className="text-gray-700">🎯 <strong>Target:</strong> Display at pump sightline + register</p>
                      <p className="text-emerald-600 font-medium">🚀 +5% conversion = +${Math.round(fuelKpis.todayGallons / 12 * 0.05 * 8)}/day extra</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Run Fuel Bundle</button>
                      <button className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium border">View Analytics</button>
                    </div>
                  </div>

                  {/* Fast-Mover Refill Widget (existing, adjusted) */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Fast-Mover Refill (Now → +6h)</h3>
                      <button className="text-teal-600 text-sm font-medium">Print list</button>
                    </div>
                    <div className="space-y-3">
                      {[{ name: 'Coffee Cups', expected: 85, onShelf: 20, backroom: 100, refillNow: 25 },
                        { name: 'Energy Drink', expected: 38, onShelf: 8, backroom: 15, refillNow: 15 },
                        { name: 'Bottled Water', expected: 45, onShelf: 12, backroom: 20, refillNow: 13 }].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-500">Need: <strong className="text-gray-900">{item.expected}</strong></span>
                            <span className="text-gray-500">Shelf: <strong className="text-gray-900">{item.onShelf}</strong></span>
                            <span className={`px-2 py-0.5 rounded font-medium ${item.refillNow > 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              +{item.refillNow}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
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

          {/* ===== LABOR VS DEMAND PLANNER (ALL BUSINESS TYPES) ===== */}
          <div className="mb-6 bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50 rounded-xl border border-indigo-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-indigo-500 font-semibold">Labor vs Demand</p>
                <h3 className="font-semibold text-gray-900 text-lg">Staffing plan for next {forecastWindow} days</h3>
                <p className="text-sm text-gray-600">Shows where we should upstaff or downstaff based on {LABOR_CONFIG[businessType].unitLabel} forecast and why.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{BUSINESS_PROFILES[businessType].label}</span>
                <span className="px-2 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200">Auto-recommended</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="col-span-2 h-52 bg-white/60 border border-indigo-100 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2 text-xs text-gray-500 font-semibold">
                  <span>Scheduled vs needed hours</span>
                  <span className="text-gray-400">Per day</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laborPlan} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} angle={-12} dy={10} height={50} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip content={({ active, payload, label }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      const row = payload[0].payload as LaborPlanRow;
                      return (
                        <div className="bg-white border border-indigo-100 rounded-lg p-3 shadow-lg text-xs min-w-[220px]">
                          <p className="font-semibold text-gray-900 mb-1">{label}</p>
                          <div className="flex items-center justify-between text-gray-600"><span>Needed</span><span className="font-mono text-gray-900">{row.neededHours}h</span></div>
                          <div className="flex items-center justify-between text-gray-600"><span>Scheduled</span><span className="font-mono text-gray-900">{row.scheduledHours}h</span></div>
                          <div className="flex items-center justify-between text-gray-600 mt-1"><span>Delta</span><span className={`font-semibold ${row.deltaHours > 0 ? 'text-emerald-700' : row.deltaHours < 0 ? 'text-slate-700' : 'text-gray-800'}`}>{row.deltaHours > 0 ? `+${row.deltaHours}h` : `${row.deltaHours}h`}</span></div>
                          <p className="mt-2 text-[11px] text-indigo-700 font-semibold">{row.recommendation}: {row.reason}</p>
                          {row.assignedEmployees.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] text-gray-500 font-semibold mb-1">ASSIGNED STAFF:</p>
                              <p className="text-[11px] text-gray-700">{row.assignedEmployees.join(', ')}</p>
                            </div>
                          )}
                          {row.suggestedEmployees.length > 0 && (
                            <div className="mt-1">
                              <p className="text-[10px] text-emerald-600 font-semibold mb-1">SUGGESTED TO ADD:</p>
                              <p className="text-[11px] text-emerald-700">{row.suggestedEmployees.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      );
                    }} />
                    <Bar dataKey="scheduledHours" name="Scheduled" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="neededHours" name="Needed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/70 border border-indigo-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Actions Summary</p>
                {laborSummary ? (
                  <>
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                      <span>Upstaff</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{laborSummary.upstaffDays.length} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                      <span>Downstaff</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{laborSummary.downstaffDays.length} days</span>
                    </div>
                    {laborSummary.peakDay && (
                      <div className="mt-2 p-2 rounded-md bg-indigo-50 border border-indigo-100 text-xs text-indigo-800 font-semibold">
                        Peak load: {laborSummary.peakDay.dayLabel} needs {laborSummary.peakDay.neededHours}h ({laborSummary.peakDay.deltaHours > 0 ? '+' : ''}{laborSummary.peakDay.deltaHours}h vs schedule)
                      </div>
                    )}
                    <div className="text-xs text-gray-600">
                      Avg delta: {laborSummary.avgDelta > 0 ? '+' : ''}{laborSummary.avgDelta}h/day
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-500 font-semibold mb-1">TEAM ({EMPLOYEES[businessType].length} employees)</p>
                      <div className="flex flex-wrap gap-1">
                        {EMPLOYEES[businessType].slice(0, 4).map(emp => (
                          <span key={emp.id} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{emp.name.split(' ')[0]}</span>
                        ))}
                        {EMPLOYEES[businessType].length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">+{EMPLOYEES[businessType].length - 4} more</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading labor data...</p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {laborPlan.slice(0, 6).map((row) => (
                <div key={row.date} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">{row.dayLabel}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] ${row.recommendation === 'Upstaff' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : row.recommendation === 'Downstaff' ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {row.recommendation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                    <span>Needed: <strong className="text-gray-900">{row.neededHours}h</strong></span>
                    <span>Sched: <strong className="text-gray-900">{row.scheduledHours}h</strong></span>
                  </div>
                  <p className="mt-2 text-[11px] text-indigo-700 font-semibold leading-relaxed">{row.reason}</p>
                  {row.assignedEmployees.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">Staff:</p>
                      <div className="flex flex-wrap gap-1">
                        {row.assignedEmployees.slice(0, 3).map((name, i) => (
                          <span key={i} className="text-[10px] px-1 py-0.5 bg-indigo-50 text-indigo-600 rounded">{name.split(' ')[0]}</span>
                        ))}
                        {row.assignedEmployees.length > 3 && (
                          <span className="text-[10px] px-1 py-0.5 bg-gray-50 text-gray-500 rounded">+{row.assignedEmployees.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {row.suggestedEmployees.length > 0 && (
                    <div className="mt-1">
                      <p className="text-[10px] text-emerald-500 font-medium">+ Add: {row.suggestedEmployees.map(n => n.split(' ')[0]).join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {INSIGHT_EVENTS.slice(0, 5).map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`p-3 rounded-lg text-sm font-medium cursor-pointer hover:shadow-md transition-shadow ${
                      insight.type === 'weather' ? 'bg-sky-50 text-sky-800 hover:bg-sky-100' :
                      insight.type === 'promo' ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' :
                      'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    {insight.label}
                  </div>
                ))}
                {INSIGHT_EVENTS.length > 5 && (
                  <button 
                    onClick={() => setIsSunnyOpen(true)}
                    className="w-full text-center text-xs text-teal-600 font-medium py-2 border border-dashed border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    View {INSIGHT_EVENTS.length - 5} more insights
                  </button>
                )}
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
                  {isScenarioActive && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
                      Scenario active
                    </span>
                  )}
                  <button 
                    onClick={() => setIsScenarioOpen(true)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Edit Scenario
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
            </> /* End of Dashboard View */
          )}
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

      {/* ===== SCENARIO COMPARE DRAWER ===== */}
      <ScenarioCompareDrawer
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
        currentInputs={scenarioInputs}
        onApply={setScenarioInputs}
        baselineRevenue={Math.round(filteredForecastData.reduce((sum, p) => sum + (p.actualRevenue ?? p.forecastRevenue), 0) * filterMultiplier)}
        baselineUnits={Math.round(filteredForecastData.reduce((sum, p) => sum + (p.actualUnits ?? p.forecastUnits), 0) * filterMultiplier)}
      />
    </div>
  );
}
