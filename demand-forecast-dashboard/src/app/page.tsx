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
  Heart,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Leaf,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { ActionItem, FuelTank, FuelDayForecast, FuelGrade, FuelInsight, FUEL_GRADE_LABELS, FUEL_GRADE_COLORS } from '../types';
import { OperationsTodayView } from '../components/OperationsTodayView';
import {
  INVENTORY_KPI,
  INVENTORY_ITEMS,
  WHAT_YOU_CAN_SELL,
  AUTO_REPLENISHMENT,
  CYCLE_COUNT_ITEMS,
  WASTE_LEDGER,
  HEALTH_ACTIONS,
  AT_RISK_ITEMS,
  WEEKLY_WINS,
} from '../lib/inventoryData';
import { buildActions, calculateConfidence, updateActionStatus, getActionStats } from '../lib/actionEngine';
import { NewItemSimulator } from '../components/NewItemSimulator';
import { ActionNextStepModal } from '../components/ActionNextStepModal';
import { QuickOrderModal } from '../components/QuickOrderModal';
import { SubstituteModal } from '../components/SubstituteModal';
import { ItemDetailModal } from '../components/ItemDetailModal';
import type { ItemDetailData } from '../components/ItemDetailModal';
import { FullItemTable } from '../components/FullItemTable';
import { ItemOrderBuilder, OrderLine } from '../components/ItemOrderBuilder';
import { CountWorksheet } from '../components/CountWorksheet';
import type { InventoryItem } from '../types';

// ============== TYPES ==============
type BusinessType = 'admin' | 'convenience' | 'grocery' | 'liquor' | 'restaurant';

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
  admin: {
    label: 'All Stores (Admin)',
    baseRevenue: 1720,
    baseUnits: 5280,
    promoBoost: 7,
    weatherImpact: 3,
    todayVsTypical: -5,
    dataHealthScore: 30,
  },
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
  admin: {
    minutesPerUnit: 0.8,
    unitLabel: 'transactions',
    baseSchedule: { 0: 162, 1: 134, 2: 134, 3: 142, 4: 152, 5: 184, 6: 198 },
  },
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
  admin: [
    // Roll-up: show managers from each store type
    { id: 'a1', name: 'Marcus Johnson', phone: '555-0101', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 22 },
    { id: 'a2', name: 'Robert Taylor', phone: '555-0201', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 24 },
    { id: 'a3', name: 'James Walker', phone: '555-0301', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 25 },
    { id: 'a4', name: 'Maria Santos', phone: '555-0401', role: 'Manager', availability: [0,1,2,3,4,5,6], maxHoursPerWeek: 45, hourlyRate: 26 },
    { id: 'a5', name: 'Nicole Thomas', phone: '555-0208', role: 'Manager', availability: [1,2,3,4,5], maxHoursPerWeek: 40, hourlyRate: 23 },
  ],
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
  admin: [
    // Rolled-up top items across all store types
    { id: 'a1', name: 'Bottled Water', department: 'Beverages', forecastRevenue: 1760, forecastUnits: 380, price: 2.49, isPromoActive: true },
    { id: 'a2', name: 'Organic Milk', department: 'Dairy', forecastRevenue: 1250, forecastUnits: 320, price: 4.99, isPromoActive: true },
    { id: 'a3', name: 'Signature Burger', department: 'Entrees', forecastRevenue: 2180, forecastUnits: 185, price: 12.99, isPromoActive: true },
    { id: 'a4', name: "Tito's Vodka", department: 'Spirits', forecastRevenue: 2180, forecastUnits: 95, price: 24.99, isPromoActive: true },
    { id: 'a5', name: 'Chicken Breast', department: 'Meat', forecastRevenue: 1540, forecastUnits: 190, price: 8.99, isPromoActive: true },
    { id: 'a6', name: 'Modelo 12pk', department: 'Beer', forecastRevenue: 1540, forecastUnits: 110, price: 16.99, isPromoActive: true },
    { id: 'a7', name: 'Grilled Salmon', department: 'Entrees', forecastRevenue: 1980, forecastUnits: 112, price: 18.99, isPromoActive: false },
  ],
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

// Admin aggregates all store types
BUSINESS_TOP_ITEMS.admin = [
  ...BUSINESS_TOP_ITEMS.convenience,
  ...BUSINESS_TOP_ITEMS.grocery,
  ...BUSINESS_TOP_ITEMS.liquor,
  ...BUSINESS_TOP_ITEMS.restaurant,
].map((item, i) => ({ ...item, id: `admin-${i}` }));

EMPLOYEES.admin = [
  ...EMPLOYEES.convenience,
  ...EMPLOYEES.grocery,
  ...EMPLOYEES.liquor,
  ...EMPLOYEES.restaurant,
].map((emp, i) => ({ ...emp, id: `admin-${i}` }));

// ============== FUEL / GAS STATION CONFIG ==============
const FUEL_TANKS: FuelTank[] = [
  { grade: 'regular', label: 'Regular Unleaded 1', capacity: 100000, currentLevel: 59171, pricePerGallon: 3.29, profitPerGallon: 2.62, dailyAvgSales: 4931, averageSellingPrice: 2150, reorderThreshold: 15000, lastDeliveryDate: '2026-01-28' },
  { grade: 'diesel', label: 'Diesel', capacity: 10000, currentLevel: 5250, pricePerGallon: 3.79, profitPerGallon: 2.48, dailyAvgSales: 2625, averageSellingPrice: 1950, reorderThreshold: 3000, lastDeliveryDate: '2026-01-14' },
  { grade: 'regular2', label: 'Regular Unleaded 2', capacity: 20000, currentLevel: 12100, pricePerGallon: 3.29, profitPerGallon: 2.65, dailyAvgSales: 2017, averageSellingPrice: 950, reorderThreshold: 5000, lastDeliveryDate: '2026-01-14' },
  { grade: 'midgrade', label: 'Mid-grade Unleaded 2', capacity: 12000, currentLevel: 10000, pricePerGallon: 3.49, profitPerGallon: 2.12, dailyAvgSales: 500, averageSellingPrice: 1700, reorderThreshold: 2000, lastDeliveryDate: '2026-02-01' },
  { grade: 'diesel2', label: 'Diesel 2', capacity: 12000, currentLevel: 10000, pricePerGallon: 3.79, profitPerGallon: 2.56, dailyAvgSales: 500, averageSellingPrice: 2100, reorderThreshold: 2000, lastDeliveryDate: '2026-02-01' },
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
  
  // Distribution by grade
  const byGrade: Record<FuelGrade, number> = {
    regular: Math.round(totalGallons * 0.35), // 35% regular 1
    regular2: Math.round(totalGallons * 0.15), // 15% regular 2
    plus: 0,
    midgrade: Math.round(totalGallons * 0.10), // 10% midgrade
    premium: Math.round(totalGallons * 0.15), // 15% premium
    diesel: Math.round(totalGallons * 0.15),  // 15% diesel
    diesel2: Math.round(totalGallons * 0.10), // 10% diesel 2
  };
  
  const priceByGrade = FUEL_TANKS.reduce<Record<string, number>>((acc, tank) => {
    acc[tank.grade] = tank.pricePerGallon;
    return acc;
  }, {});

  // Calculate revenue
  const totalRevenue = 
    byGrade.regular * (priceByGrade.regular || 0) +
    byGrade.regular2 * (priceByGrade.regular2 || 0) +
    byGrade.plus * (priceByGrade.plus || 0) +
    byGrade.midgrade * (priceByGrade.midgrade || 0) +
    byGrade.premium * (priceByGrade.premium || 0) +
    byGrade.diesel * (priceByGrade.diesel || 0) +
    byGrade.diesel2 * (priceByGrade.diesel2 || 0);
  
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
        tips: [
          `You sell ~${tank.dailyAvgSales.toLocaleString()} gal/day of ${FUEL_GRADE_LABELS[tank.grade]} — at this rate you'll run out in ${daysUntilEmpty.toFixed(1)} days.`,
          `A stockout typically costs $800-$1,200/day in lost fuel + in-store revenue.`,
          `Schedule delivery for ${daysUntilEmpty < 2 ? 'today — emergency load' : 'tomorrow morning before rush hour'}.`,
          `Consider ordering extra: weekend demand is usually 15-20% higher.`,
        ],
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
      actionLabel: 'View Tips',
      expectedImpact: '+$120 in-store sales',
      tips: [
        `${morningTransactions} fuel customers between 7-9 AM — your #1 window for in-store conversion.`,
        `Open the 2nd register by 6:45 AM to avoid checkout lines that drive customers away.`,
        `Stock the grab-and-go cooler tonight: water, energy drinks, and breakfast sandwiches sell 3x during morning rush.`,
        `Place a pump-topper sign promoting today's coffee deal — 28% of morning fuel customers buy coffee when reminded.`,
      ],
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
      actionLabel: 'View Tips',
      expectedImpact: '+$95 cross-sell',
      tips: [
        `${eveningTransactions} evening transactions — commuters grab snacks, drinks, and tobacco on the way home.`,
        `Restock the beer cooler and single-serve chips before 3:30 PM.`,
        `Move the "2 for $3" snack display closer to the register — impulse buys spike 40% during PM rush.`,
        `If you have a roller grill, drop fresh items at 3:45 PM so they're ready by 4.`,
      ],
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
    tips: [
      `Only ${conversionPct}% of your fuel customers walk inside — industry top performers hit 45-50%.`,
      `Add a pump-side sign: "Fresh coffee $1.49" — visual cues at the pump increase walk-ins by 12%.`,
      `Place fountain drinks and snack endcaps within 10 feet of the entrance door.`,
      `Run a fuel loyalty tie-in: "Buy inside, save 5¢/gal next fill" — proven to lift walk-ins by 18%.`,
      `Estimated opportunity: ~$${Math.round(todayForecast.expectedTransactions * 0.05 * 8)}/day in extra in-store revenue.`,
    ],
  });
  
  return insights;
}

// ============== SIDEBAR ICONS ==============
const SidebarIcon = ({ icon: Icon, active = false, badge = false, onClick, tooltip }: { icon: any; active?: boolean; badge?: boolean; onClick?: () => void; tooltip?: string }) => (
  <button 
    onClick={onClick}
    title={tooltip}
    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
      active ? 'bg-modisoft-turquoise/25 text-white shadow-[0_0_8px_rgba(77,193,180,0.15)]' : 'text-white/50 hover:bg-white/10 hover:text-white/90'
    }`}
  >
    <Icon className="w-5 h-5" />
    {badge && (
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-modisoft-yellow rounded-full border-2 border-modisoft-blue" />
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
  <div className="kpi-card bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
    {/* Brand accent top bar */}
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-turquoise to-modisoft-green" />
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        {title}
        {tooltip && <Info className="w-3 h-3 text-gray-300" />}
      </span>
    </div>
    <p className="text-2xl font-bold text-modisoft-blue mb-0.5">{value}</p>
    <p className="text-xs text-gray-400">{subtitle}</p>
  </div>
);

// ============== MAIN COMPONENT ==============
export default function DemandForecastingPage() {
  // State
  const [activeView, setActiveView] = useState<'today' | 'forecasting'>('today');
  const [stockSnapshotOpen, setStockSnapshotOpen] = useState(true);
  const [healthScoreOpen, setHealthScoreOpen] = useState(false);
  const [savingsDetailOpen, setSavingsDetailOpen] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>('convenience');
  const businessProfile = BUSINESS_PROFILES[businessType];
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-20');
  const [forecastWindow, setForecastWindow] = useState<7 | 14 | 28>(14);
  const [itemSearch, setItemSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSunnyOpen, setIsSunnyOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [orderCategory, setOrderCategory] = useState<{category: string, expected: number, stock: number} | null>(null);
  const [substituteCategory, setSubstituteCategory] = useState<{category: string} | null>(null);
  const [items, setItems] = useState(BUSINESS_TOP_ITEMS[businessType]);
  
  // Filter state
  const [selectedStores, setSelectedStores] = useState<string[]>(['all']);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['all']);
  const [showFuel, setShowFuel] = useState(false);
  const [showLabor, setShowLabor] = useState(businessType !== 'convenience');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => setCollapsedSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Actions state
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [actionFilter, setActionFilter] = useState<'all' | 'open' | 'ignored' | 'done'>('all');
  const [nextStepAction, setNextStepAction] = useState<ActionItem | null>(null);
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [selectedLaborDay, setSelectedLaborDay] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Item detail modal state
  const [itemDetailData, setItemDetailData] = useState<ItemDetailData | null>(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);

  // Inventory items state (mutable for inline count edits)
  const [inventoryItems, setInventoryItems] = useState<Record<string, InventoryItem[]>>(() => ({ ...INVENTORY_ITEMS }));
  const currentItems = inventoryItems[businessType] ?? INVENTORY_ITEMS[businessType];

  // Tier 1: Order builder & Count worksheet modals
  const [isOrderBuilderOpen, setIsOrderBuilderOpen] = useState(false);
  const [orderBuilderInitial, setOrderBuilderInitial] = useState<OrderLine[]>([]);
  const [isCountWorksheetOpen, setIsCountWorksheetOpen] = useState(false);

  // Inventory count update handler
  const handleCountUpdate = (itemId: string, newOnHand: number) => {
    setInventoryItems(prev => ({
      ...prev,
      [businessType]: (prev[businessType] ?? INVENTORY_ITEMS[businessType]).map(item =>
        item.id === itemId ? { ...item, onHand: newOnHand, lastCountDate: new Date().toISOString().split('T')[0] } : item
      ),
    }));
  };

  const handleParUpdate = (itemId: string, newPar: number) => {
    setInventoryItems(prev => ({
      ...prev,
      [businessType]: (prev[businessType] ?? INVENTORY_ITEMS[businessType]).map(item =>
        item.id === itemId ? { ...item, parLevel: newPar } : item
      ),
    }));
  };

  // Add single item to order builder
  const handleAddToOrder = (item: InventoryItem) => {
    const suggestedQty = Math.max(0, item.parLevel - item.onHand);
    const cases = item.caseSize ? Math.ceil(suggestedQty / item.caseSize) : 1;
    const qty = item.caseSize ? cases * item.caseSize : suggestedQty;
    setOrderBuilderInitial([{ item, qty, cases }]);
    setIsOrderBuilderOpen(true);
  };

  // Count worksheet submit handler
  const handleCountsSubmitted = (updates: { itemId: string; newOnHand: number }[]) => {
    setInventoryItems(prev => {
      const updated = [...(prev[businessType] ?? INVENTORY_ITEMS[businessType])];
      for (const u of updates) {
        const idx = updated.findIndex(i => i.id === u.itemId);
        if (idx >= 0) updated[idx] = { ...updated[idx], onHand: u.newOnHand, lastCountDate: new Date().toISOString().split('T')[0] };
      }
      return { ...prev, [businessType]: updated };
    });
  };

  // Generate forecast data
  const forecastData = useMemo(() => {
    return generateForecastData(28, businessProfile.baseRevenue, businessProfile.baseUnits);
  }, [businessType]);

  // ===== FUEL STATION DATA (convenience store & admin) =====
  const fuelTanks = useMemo(() => FUEL_TANKS, []);

  const fuelPrimaryDate = useMemo(() => {
    if (businessType !== 'convenience' && businessType !== 'admin') return null;

    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr >= startDate && todayStr <= endDate) return todayStr;
    // When users change date ranges, they usually anchor on the range end.
    // Using endDate makes fuel cards respond immediately like the other KPIs.
    return endDate;
  }, [businessType, startDate, endDate]);
  
  const fuelForecast = useMemo(() => {
    if (businessType !== 'convenience' && businessType !== 'admin') return null;

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

  // Combined multiplier (filters only)
  const combinedMultiplier = useMemo(() => {
    return Number(filterMultiplier.toFixed(2));
  }, [filterMultiplier]);

  // Chart data transformation
  const chartData = useMemo(() => {
    return filteredForecastData.map(point => {
      // Find any active forecast drivers for this date
      const activeDrivers = INSIGHT_EVENTS.filter(
        (evt) => point.date >= evt.dateRange[0] && point.date <= evt.dateRange[1]
      );
      const annotation = activeDrivers.length > 0
        ? activeDrivers.map(d => d.label).join(' · ')
        : null;

      return {
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: point.date,
        // Actual = past/current, Forecast = future. Keep them mutually exclusive so the
        // series do not overlap/intertwine.
        forecast: point.actualRevenue != null ? null : Math.round(point.forecastRevenue * combinedMultiplier),
        actual: point.actualRevenue != null ? Math.round(point.actualRevenue * filterMultiplier) : null, // Actuals don't get scenario
        forecastUnits: point.actualUnits != null ? null : Math.round(point.forecastUnits * combinedMultiplier),
        actualUnits: point.actualUnits != null ? Math.round(point.actualUnits * filterMultiplier) : null,
        // Baseline = original forecast WITHOUT scenario adjustments (for comparison)
        baselineRevenue: point.actualRevenue != null ? null : Math.round(point.forecastRevenue * filterMultiplier),
        baselineUnits: point.actualUnits != null ? null : Math.round(point.forecastUnits * filterMultiplier),
        annotation,
      };
    });
  }, [filteredForecastData, filterMultiplier, combinedMultiplier]);

  // KPI calculations (forecasts affected by filters, actuals not)
  const kpiData = useMemo(() => {
    const revenueForecast = filteredForecastData.reduce((sum, p) => sum + (p.actualRevenue ?? p.forecastRevenue), 0);
    const unitsForecast = filteredForecastData.reduce((sum, p) => sum + (p.actualUnits ?? p.forecastUnits), 0);
    return {
      revenueForecast: Math.round(revenueForecast * combinedMultiplier),
      promoBoost: businessProfile.promoBoost,
      unitsForecast: Math.round(unitsForecast * combinedMultiplier),
      weatherImpact: businessProfile.weatherImpact,
      todayVsTypical: businessProfile.todayVsTypical,
      dataHealthScore: businessProfile.dataHealthScore,
    };
  }, [filteredForecastData, businessProfile, combinedMultiplier]);

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
      currentDate: startDate,
      fuelInsights: (businessType === 'convenience' || businessType === 'admin') ? fuelInsights : undefined,
      fuelPrimaryDate: (businessType === 'convenience' || businessType === 'admin') ? (fuelKpis?.primaryDate ?? startDate) : undefined,
    });
    setActions(generatedActions);
  }, [businessType, laborPlan, items, kpiData, startDate, fuelInsights, fuelKpis?.primaryDate]);

  // Action stats
  const actionStats = useMemo(() => getActionStats(actions), [actions]);

  // Handle action status update
  const handleActionUpdate = (actionId: string, newStatus: ActionItem['status'], reason?: string) => {
    setActions(prev => updateActionStatus(prev, actionId, newStatus, reason ? { ignoredReason: reason } : undefined));
  };

  // Filtered actions based on current tab
  const filteredActions = useMemo(() => {
    let filtered = actions;
    // Hide labor actions when labor planner is toggled off
    if (!showLabor) {
      filtered = filtered.filter(a => a.type !== 'labor');
    }
    if (actionFilter === 'all') {
      return filtered.filter(a => a.status !== 'done' && a.status !== 'ignored');
    }
    return filtered.filter(a => a.status === actionFilter);
  }, [actions, actionFilter, showLabor]);

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
      const annotation = payload?.[0]?.payload?.annotation;
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 backdrop-blur-sm" style={{ borderTop: '2px solid #4DC1B4' }}>
          <p className="font-semibold text-modisoft-blue text-sm mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
              {entry.name}: <strong>{entry.name.includes('Units') ? entry.value?.toLocaleString() : formatCurrency(entry.value || 0)}</strong>
            </p>
          ))}
          {annotation && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-modisoft-blue">
                <span className="font-semibold">Drivers:</span> {annotation}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex bg-[#E8ECF0]">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="w-16 bg-modisoft-blue flex flex-col items-center py-4 fixed left-0 top-0 bottom-0 z-50">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
          <Image src="/modisoft%20logo.png" alt="Modisoft" width={40} height={40} className="object-contain" />
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 flex-1">
          <SidebarIcon icon={Star} onClick={() => setActiveView('today')} active={activeView === 'today'} tooltip="Today" />
          <SidebarIcon icon={BarChart3} onClick={() => setActiveView('forecasting')} active={activeView === 'forecasting'} tooltip="Forecast" />
          <SidebarIcon icon={ShoppingCart} tooltip="Orders" />
          <SidebarIcon icon={FileText} tooltip="Reports" />
          <SidebarIcon icon={Users} tooltip="Team" />
          <SidebarIcon icon={Calendar} tooltip="Calendar" />
          <SidebarIcon icon={TrendingUp} tooltip="Analytics" />
          <SidebarIcon icon={Settings} tooltip="Settings" />
        </div>

        {/* Bottom icon */}
        <div className="mt-auto">
          <SidebarIcon icon={HelpCircle} />
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 ml-16">
        {/* ===== TOP NAV BAR ===== */}
        <nav className="bg-modisoft-blue px-6 py-3 sticky top-0 z-40 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Logo text */}
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-lg">Modisoft</span>
              <span className="text-white/40">•</span>
            </div>

            {/* Business Name Pill */}
            <div className="bg-modisoft-turquoise text-white px-3 py-1 rounded-full text-sm font-medium">
              Business Name
            </div>

            {/* Business Type Selector */}
            <div className="relative">
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none z-10" />
              <select
                value={businessType}
                onChange={(e) => { const bt = e.target.value as BusinessType; setBusinessType(bt); setShowLabor(bt !== 'convenience'); }}
                className="appearance-none bg-white/15 hover:bg-white/20 text-white px-3 pr-9 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise [&>option]:bg-modisoft-blue [&>option]:text-white"
                aria-label="Business type"
                style={{ colorScheme: 'dark' }}
              >
                <option value="admin" className="bg-modisoft-blue text-white">👑 Admin (All Stores)</option>
                <option value="convenience" className="bg-modisoft-blue text-white">Convenience</option>
                <option value="grocery" className="bg-modisoft-blue text-white">Grocery/Retail</option>
                <option value="liquor" className="bg-modisoft-blue text-white">Liquor</option>
                <option value="restaurant" className="bg-modisoft-blue text-white">Restaurant</option>
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
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="bg-modisoft-turquoise hover:bg-modisoft-teal text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              What's New
            </button>
            <button className="bg-modisoft-turquoise hover:bg-modisoft-teal text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Clock In/Out
            </button>
            <button 
              onClick={() => setIsSunnyOpen(true)}
              className="bg-modisoft-yellow hover:bg-amber-500 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-modisoft-teal">
                <span className="inline-block h-2 w-2 rounded-full bg-modisoft-turquoise" />
                Demand + Inventory
              </div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 bg-modisoft-turquoise rounded-full" />
                {/* View Toggle */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('today')}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      activeView === 'today'
                        ? 'bg-modisoft-blue text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setActiveView('forecasting')}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      activeView === 'forecasting'
                        ? 'bg-modisoft-blue text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Forecast
                  </button>
                </div>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-modisoft-blue">
                {activeView === 'today' ? 'What needs attention today' : 'Forecast, stock & demand drivers'}
              </h1>
              <p className="ml-3 mt-1 text-sm leading-6 text-gray-600">
                {activeView === 'today'
                  ? 'Start here first. This view combines forecast and stock to show the next best actions for the business.'
                  : "Revenue forecast, inventory health, reorder guidance, and what's driving demand."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeView === 'forecasting' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsNewItemOpen(true)}
                  className="bg-modisoft-turquoise hover:bg-modisoft-teal text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  Test New Item
                </button>
              </div>
              )}

              {/* Filter by item name */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeView === 'today' ? 'Search actions or items' : 'Filter by item name'}
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise focus:border-transparent"
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
                className="bg-modisoft-turquoise hover:bg-modisoft-teal text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                View Filter
              </button>
            </div>
          </div>

          {/* ===== TODAY VIEW ===== */}
          {activeView === 'today' && (
            <OperationsTodayView
              businessType={businessType}
              actions={actions}
              kpiData={kpiData}
              forecastWindow={forecastWindow}
              onHandleAction={(action) => setNextStepAction(action)}
              onDismissAction={(actionId) => handleActionUpdate(actionId, 'ignored')}
              onReviewOrder={(category, expected, stock) => setOrderCategory({ category, expected, stock })}
              onOpenSunny={() => setIsSunnyOpen(true)}
              onShowToast={showToast}
            />
          )}

          {/* ===== DEMAND FORECASTING VIEW ===== */}
          {activeView === 'forecasting' && (<>
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
                      ? 'bg-modisoft-blue text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {window} Days
                </button>
              ))}
            </div>
          </div>

          {/* ===== KPI CARDS ROW ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
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
            {/* Stock Health — original card style with click-to-expand */}
            {(() => {
              const score = INVENTORY_KPI[businessType].inventoryHealthScore;
              const status = score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Risk';
              const statusColor = score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
              const barColor = score >= 70 ? 'bg-modisoft-green' : score >= 50 ? 'bg-modisoft-yellow' : 'bg-red-500';
              return (
                <div
                  className="bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setHealthScoreOpen(!healthScoreOpen)}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-turquoise to-modisoft-green" />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-modisoft-blue">{score}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>{status}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Stock health</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                    <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-modisoft-turquoise" />
                    <span className="text-modisoft-turquoise font-medium">AI: {HEALTH_ACTIONS.filter(a => a.aiSource).length} suggestions</span>
                  </p>
                </div>
              );
            })()}
            {/* Forecasting Savings KPI Card */}
            {(() => {
              const wins = WEEKLY_WINS[businessType];
              const totalSaved = wins.stockoutsSavedRevenue + wins.wasteSavedDollars + wins.overstockSaved;
              return (
                <div
                  className="bg-white rounded-xl border border-gray-100/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSavingsDetailOpen(!savingsDetailOpen)}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-modisoft-green to-modisoft-turquoise" />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-modisoft-teal">${totalSaved.toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Forecasting savings</p>
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-600">+{wins.weekOverWeekChange}% vs last week</span>
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-modisoft-turquoise" />
                    <span className="text-modisoft-turquoise font-medium">{wins.wins.length} wins this week</span>
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Health Score Improvement Panel */}
          {healthScoreOpen && (
            <div className="mb-4 bg-white rounded-xl border-2 border-modisoft-turquoise/30 p-5 shadow-md animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-modisoft-turquoise" />
                  <h3 className="font-bold text-gray-900 text-base">How to improve your stock health score</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    INVENTORY_KPI[businessType].inventoryHealthScore >= 70 ? 'bg-green-100 text-green-700' :
                    INVENTORY_KPI[businessType].inventoryHealthScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    Currently {INVENTORY_KPI[businessType].inventoryHealthScore}/100
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                    <Sparkles className="w-3 h-3" />
                    AI-powered
                  </span>
                </div>
                <button onClick={() => setHealthScoreOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Based on stock risk, slow-moving items, and count accuracy. Each action below adds points.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HEALTH_ACTIONS.map((action, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${action.aiSource ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/60' : 'border-gray-100 bg-gray-50/50 hover:bg-modisoft-turquoise/5'}`}>
                    {action.aiSource ? (
                      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-modisoft-turquoise flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-modisoft-blue">{action.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-modisoft-teal font-medium">{action.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-modisoft-turquoise/30 bg-modisoft-turquoise/5">
                  <AlertTriangle className="w-4 h-4 text-modisoft-yellow flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-modisoft-blue">Run a quick cycle count</p>
                    <p className="text-xs text-modisoft-teal font-medium">+3 pts — fixes stale numbers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-modisoft-turquoise/30 bg-modisoft-turquoise/5">
                  <TrendingUp className="w-4 h-4 text-modisoft-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-modisoft-blue">Resolve {INVENTORY_KPI[businessType].itemsAtRisk} at-risk items</p>
                    <p className="text-xs text-modisoft-teal font-medium">+{INVENTORY_KPI[businessType].itemsAtRisk * 2} pts — order or substitute</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecasting Savings Detail Panel */}
          {savingsDetailOpen && (() => {
            const wins = WEEKLY_WINS[businessType];
            const totalSaved = wins.stockoutsSavedRevenue + wins.wasteSavedDollars + wins.overstockSaved;
            const bizLabel = businessType === 'admin' ? 'store' : businessType === 'convenience' ? 'convenience store' : businessType === 'grocery' ? 'grocery store' : businessType === 'liquor' ? 'liquor store' : 'restaurant';
            return (
              <div className="mb-4 bg-white rounded-xl border-2 border-modisoft-green/30 p-5 shadow-md animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-modisoft-teal" />
                    <h3 className="font-bold text-gray-900 text-base">How forecasting helped this week</h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                      <Sparkles className="w-3 h-3" /> AI-powered
                    </span>
                  </div>
                  <button onClick={() => setSavingsDetailOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Headline profit impact */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-modisoft-teal/5 to-modisoft-green/5 rounded-lg border border-modisoft-turquoise/20 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-modisoft-turquoise to-modisoft-green shadow-sm">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-modisoft-teal">${wins.profitImpact.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">estimated profit impact</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600">+{wins.weekOverWeekChange}% vs. last week</span>
                      <span className="text-xs text-gray-400 ml-2">Updated every Monday &bull; {bizLabel}</span>
                    </div>
                  </div>
                </div>

                {/* 3 metric cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-blue-50/50 rounded-lg border border-blue-100 px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Stockouts prevented</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{wins.stockoutsPrevented} <span className="text-xs font-normal text-gray-400">items</span></p>
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5">~${wins.stockoutsSavedRevenue.toLocaleString()} in saved sales</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Waste avoided</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{wins.wasteAvoided} <span className="text-xs font-normal text-gray-400">items</span></p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">~${wins.wasteSavedDollars.toLocaleString()} saved from spoilage</p>
                  </div>
                  <div className="bg-amber-50/50 rounded-lg border border-amber-100 px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Smarter reorders</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{wins.reorderOptimized} <span className="text-xs font-normal text-gray-400">adjusted</span></p>
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">~${wins.overstockSaved.toLocaleString()} less in overstock</p>
                  </div>
                </div>

                {/* Total saved bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-modisoft-teal/5 rounded-lg border border-modisoft-turquoise/10 mb-4">
                  <span className="text-xs text-gray-600">Total money saved this week from forecasting:</span>
                  <span className="text-sm font-extrabold text-modisoft-teal">${totalSaved.toLocaleString()}</span>
                </div>

                {/* Individual wins */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What forecasting caught this week</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wins.wins.map((win, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-modisoft-turquoise/5 transition-colors">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-modisoft-turquoise/15 flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-modisoft-teal">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-modisoft-blue">{win.label}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{win.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="mt-3 text-[10px] text-gray-400 text-center">
                  Estimates based on your sales patterns, seasonal trends, and real-time inventory data. Actual impact may vary.
                </p>
              </div>
            );
          })()}

          {/* ===== SUNNY'S TIP + WEEK AT A GLANCE ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            {/* Sunny's Tip Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm flex-shrink-0">
                <Image src="/sunny.png" alt="Sunny" width={28} height={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Sunny&apos;s Tip</h3>
                <p className="text-gray-700 text-xs leading-snug line-clamp-2">
                  {businessType === 'admin' && "Across all your stores, weekends drive 30% more revenue. Coordinate promotions across locations."}
                  {businessType === 'restaurant' && "Valentine's Day is coming up! Consider taking reservations now - 40% more traffic that week."}
                  {businessType === 'liquor' && "Super Bowl Sunday is near! Stock up on beer, chips, and party supplies."}
                  {businessType === 'convenience' && "Energy drinks and coffee sell 25% better on Monday mornings. Stock and display at front!"}
                  {businessType === 'grocery' && "Weekend shoppers buy 30% more. Schedule your best staff for Saturday and Sunday."}
                </p>
                <button 
                  onClick={() => setIsSunnyOpen(true)}
                  className="text-amber-700 hover:text-amber-800 font-medium text-xs mt-1"
                >
                  Tell me more →
                </button>
              </div>
            </div>

            {/* Week at a Glance — spans 3 cols */}
            <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">Your Week at a Glance</h2>
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-modisoft-green" />
                    <span className="text-gray-500">Busy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-modisoft-yellow" />
                    <span className="text-gray-500">Slow</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-500">Normal</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {laborPlan.slice(0, 7).map((day, i) => {
                  const isToday = i === 0;
                  const status = day.recommendation === 'Upstaff' ? 'busy' : day.recommendation === 'Downstaff' ? 'slow' : 'normal';
                  return (
                    <div 
                      key={day.date}
                      className={`relative rounded-lg px-2 py-2 text-center transition-all ${
                        isToday ? 'ring-2 ring-modisoft-turquoise ring-offset-1' : ''
                      } ${
                        status === 'busy' ? 'bg-modisoft-green/10 border border-modisoft-green/20' :
                        status === 'slow' ? 'bg-modisoft-yellow/10 border border-modisoft-yellow/30' :
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {isToday && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-modisoft-turquoise text-white px-1.5 py-0.5 rounded-full leading-none">TODAY</span>
                      )}
                      <p className="text-[11px] font-semibold text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold leading-tight">
                        {new Date(day.date).getDate()}
                      </p>
                      <div className={`inline-block w-2 h-2 rounded-full ${
                        status === 'busy' ? 'bg-modisoft-green' :
                        status === 'slow' ? 'bg-modisoft-yellow' :
                        'bg-gray-400'
                      }`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== ACTION CENTER ===== */}
          <div className="mb-6">
            {/* Action Center Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-modisoft-yellow" />
                  <h3 className="text-sm font-bold text-gray-900">Suggested Actions Based on Forecast</h3>
                  {filteredActions.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-modisoft-yellow/20 text-modisoft-blue rounded-full text-xs font-medium">
                      {filteredActions.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">${actionStats.totalExpectedValue.toLocaleString()} potential</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {(['all', 'open', 'ignored', 'done'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActionFilter(tab)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          actionFilter === tab 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab === 'ignored' ? 'Skipped' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              
              <div className="space-y-2 max-h-[144px] overflow-y-auto">
                {filteredActions.map((action) => (
                  <div 
                    key={action.id} 
                    className="flex items-center justify-between rounded-lg px-3 py-2 border bg-gray-50 border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-modisoft-blue/10">
                        <span className="text-sm">
                          {action.type === 'labor' ? '👥' : 
                           action.type === 'event' ? '📅' : 
                           action.type === 'promo' ? '🏷️' :
                           action.type === 'fuel' ? '⛽' : '💰'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500 truncate">{action.expectedValueLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {action.status === 'open' && (
                        <>
                          <button
                            onClick={() => setNextStepAction(action)}
                            className="px-3 py-1.5 bg-modisoft-turquoise hover:bg-modisoft-teal text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Take Action
                          </button>
                          <button
                            onClick={() => handleActionUpdate(action.id, 'ignored')}
                            className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-medium"
                          >
                            Skip
                          </button>
                        </>
                      )}
                      {action.status === 'accepted' && (
                        <button
                          onClick={() => handleActionUpdate(action.id, 'done')}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Mark Done
                        </button>
                      )}
                      {action.status === 'ignored' && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          Skipped
                        </span>
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
                  <div className="flex items-center gap-3 bg-modisoft-green/10 rounded-lg p-3 border border-modisoft-green/20">
                    <CheckCircle className="w-5 h-5 text-modisoft-green" />
                    <p className="font-medium text-modisoft-blue text-sm">All good! Nothing needs your attention.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== CHARTS ROW ===== */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Revenue Forecast Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Revenue forecast (before discounts)</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"
                    title="This chart shows forecasted revenue before discounts versus baseline and actuals."
                    aria-label="Revenue forecast chart help"
                  >
                    <Image src="/sunny.png" alt="Tip" width={12} height={12} className="w-3 h-3" />
                    Tip
                  </button>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-modisoft-turquoise"></div>
                  <span className="text-gray-600">Scenario Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-300 border border-dashed border-gray-400"></div>
                  <span className="text-gray-500 italic">Baseline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-modisoft-yellow"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4DC1B4" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4DC1B4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F8BC2E" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#F8BC2E" stopOpacity={0}/>
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
                    {/* Baseline (ghost line - original forecast without scenario) */}
                    <Area
                      type="monotone"
                      dataKey="baselineRevenue"
                      name="Baseline"
                      stroke="#94A3B8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="transparent"
                      connectNulls={false}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      name="Scenario Forecast"
                      stroke="#4DC1B4"
                      strokeWidth={2}
                      fill="url(#forecastGradient)"
                      connectNulls={false}
                      dot={{ r: 4, fill: '#4DC1B4', strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Actual"
                      stroke="#F8BC2E"
                      strokeWidth={2}
                      fill="url(#actualGradient)"
                      connectNulls={false}
                      dot={{ r: 4, fill: '#F8BC2E', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Units Forecast Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Units Forecast</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"
                    title="This chart shows forecasted units sold versus baseline and actuals for the selected window."
                    aria-label="Units forecast chart help"
                  >
                    <Image src="/sunny.png" alt="Tip" width={12} height={12} className="w-3 h-3" />
                    Tip
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-modisoft-turquoise"></div>
                  <span className="text-gray-600">Scenario Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-300 border border-dashed border-gray-400"></div>
                  <span className="text-gray-500 italic">Baseline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-modisoft-yellow"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
                    <Bar dataKey="forecastUnits" name="Scenario Forecast" fill="#4DC1B4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actualUnits" name="Actual Units" fill="#F8BC2E" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="baselineUnits" name="Baseline" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ===== STOCK SNAPSHOT (merged from inventory) ===== */}
          <div className="mb-6">
            <button
              onClick={() => setStockSnapshotOpen(!stockSnapshotOpen)}
              className="w-full flex items-center justify-between bg-gradient-to-r from-modisoft-teal/5 to-modisoft-turquoise/5 hover:from-modisoft-teal/10 hover:to-modisoft-turquoise/10 border border-modisoft-turquoise/20 rounded-xl px-5 py-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-modisoft-teal" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-base">Stock snapshot</h3>
                  <p className="text-xs text-gray-500">Inventory health, reorder drafts, and count checks</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {INVENTORY_KPI[businessType].itemsAtRisk > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{INVENTORY_KPI[businessType].itemsAtRisk} at risk</span>
                )}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${stockSnapshotOpen ? '' : '-rotate-90'}`} />
              </div>
            </button>

            {stockSnapshotOpen && (
              <div className="mt-4 space-y-4">

                {/* ===== ITEMS AT RISK — expandable list ===== */}
                {AT_RISK_ITEMS[businessType].length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-white px-5 py-3 border-b border-red-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <h2 className="text-base font-bold text-gray-900">{AT_RISK_ITEMS[businessType].length} items need attention</h2>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                            {AT_RISK_ITEMS[businessType].filter(i => i.risk === 'critical').length} critical
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Each row tells you what&apos;s wrong and how to fix it</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                      {AT_RISK_ITEMS[businessType].map((item, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 cursor-pointer transition-colors ${item.risk === 'critical' ? 'border-l-3 border-l-red-400' : 'border-l-3 border-l-yellow-400'}`}
                          onClick={() => { setItemDetailData({ name: item.name, department: item.department, onHand: item.onHand, forecastUnits: item.forecastNeed, status: item.risk === 'critical' ? 'used_up' : 'low_stock' } as ItemDetailData); setIsItemDetailOpen(true); }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${item.risk === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-modisoft-blue truncate">{item.name}</p>
                                <span className="text-[10px] text-gray-400">{item.department}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
                              {item.aiInsight && (
                                <p className="text-[11px] text-purple-600 mt-1 flex items-start gap-1">
                                  <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <span>{item.aiInsight}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">On hand: <span className="font-bold text-gray-900">{item.onHand}</span></p>
                              <p className="text-xs text-gray-500">Need: <span className="font-bold text-gray-900">{item.forecastNeed}</span></p>
                            </div>
                            <div className={`text-right px-2 py-0.5 rounded text-[10px] font-bold ${item.daysLeft < 1 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {item.daysLeft < 1 ? `${Math.round(item.daysLeft * 24)}h left` : `${item.daysLeft.toFixed(1)}d left`}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.fixAction === 'order') setOrderCategory({ category: item.name, expected: item.forecastNeed, stock: item.onHand });
                                else if (item.fixAction === 'substitute') setSubstituteCategory({ category: item.name });
                                else showToast(`${item.fix} — ${item.name}`);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 whitespace-nowrap ${
                                item.fixAction === 'order' ? 'bg-modisoft-turquoise hover:bg-modisoft-teal text-white' :
                                item.fixAction === 'substitute' ? 'bg-modisoft-blue text-white' :
                                item.fixAction === 'discount' ? 'bg-modisoft-yellow hover:bg-amber-400 text-gray-900' :
                                item.fixAction === 'count' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' :
                                'bg-modisoft-green text-white'
                              }`}
                            >
                              {item.fix}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ===== INVENTORY ACTION BAR ===== */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => { setOrderBuilderInitial([]); setIsOrderBuilderOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-modisoft-teal hover:bg-modisoft-blue text-white rounded-lg text-xs font-semibold transition-colors active:scale-95"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Build purchase order
                  </button>
                  <button
                    onClick={() => setIsCountWorksheetOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-modisoft-yellow hover:bg-amber-400 text-gray-900 rounded-lg text-xs font-semibold transition-colors active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" /> Start count
                  </button>
                </div>

                {/* ===== FULL ITEM INVENTORY TABLE ===== */}
                <FullItemTable
                  items={currentItems}
                  onItemClick={(item) => {
                    setItemDetailData({ name: item.name, department: item.department, onHand: item.onHand, forecastUnits: item.forecastNeed, status: item.coverageStatus === 'covered' ? 'covered' : item.coverageStatus === 'low_stock' ? 'low_stock' : 'used_up' } as ItemDetailData);
                    setIsItemDetailOpen(true);
                  }}
                  onCountUpdate={handleCountUpdate}
                  onParUpdate={handleParUpdate}
                  onAddToOrder={handleAddToOrder}
                  showToast={showToast}
                />

                {/* Stock on Hand Chart */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Stock on hand</h2>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentItems.map(item => ({ name: item.name, onHand: item.onHand }))} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100" style={{ borderTop: '2px solid #4DC1B4' }}>
                                  <p className="font-semibold text-modisoft-blue text-sm mb-1">{label}</p>
                                  <p className="text-sm text-gray-600">On hand: <strong>{payload[0].value}</strong></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="onHand" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {currentItems.map((_, index) => (
                            <Cell key={index} fill="#2E595A" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="w-3 h-3 rounded-sm bg-modisoft-teal" />
                    <span className="text-xs text-gray-500">On hand</span>
                  </div>
                </div>

                {/* Ready to sell today — horizontal scroll cards */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-bold text-gray-900">Ready to sell today</h2>
                    <p className="text-xs text-gray-500">Spot what is fine, running low, or needs shelf refill first.</p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 mt-3">
                    {WHAT_YOU_CAN_SELL[businessType].map((item, i) => {
                      const statusConfig = {
                        covered: { label: 'Enough', bg: 'bg-modisoft-turquoise/10', border: 'border-modisoft-turquoise/30', text: 'text-modisoft-teal', dot: 'bg-modisoft-turquoise' },
                        low_stock: { label: 'Running low', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
                        used_up: { label: 'Empty soon', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', dot: 'bg-red-500' },
                      };
                      const cfg = statusConfig[item.status];
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 min-w-[210px] cursor-pointer transition-all hover:shadow-md`}
                          onClick={() => { setItemDetailData({ name: item.name, onHand: item.onHand, parLevel: item.parLevel, forecastUnits: item.forecast, status: item.status } as ItemDetailData); setIsItemDetailOpen(true); }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                          </div>
                          <p className="font-semibold text-modisoft-blue text-sm mb-1">{item.name}</p>
                          <p className="text-xs text-gray-500">Forecast: {item.forecast} &bull; On-Hand: {item.onHand}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); showToast(`Stock check: bring ${item.name} up to ${item.parLevel}`); }}
                            className="mt-3 w-full bg-modisoft-yellow hover:bg-amber-400 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95"
                          >
                            Check stock: bring up to {item.parLevel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suggested Order Draft + Counts to Check */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Suggested Order Draft */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-gray-900">Suggested order draft</h2>
                      <p className="text-xs text-gray-500">Case-friendly quantities</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On Hand</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On Order</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Lead Time</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Case</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {AUTO_REPLENISHMENT[businessType].map((item, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => { setItemDetailData({ name: item.item, onHand: item.onHand } as ItemDetailData); setIsItemDetailOpen(true); }}>
                            <td className="py-2.5 text-xs text-modisoft-blue font-medium">{item.item}</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{item.onHand}</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{item.onOrder}</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{item.leadTimeDays}d</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{item.caseSize}</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{item.orderQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Counts to Check */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-gray-900">Counts to check</h2>
                      <p className="text-xs text-gray-500">Numbers look stale or suspicious</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">On Hand</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Suggested</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Last Count</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CYCLE_COUNT_ITEMS.map((item, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => { setItemDetailData({ name: item.item, onHand: item.onHand } as ItemDetailData); setIsItemDetailOpen(true); }}>
                            <td className="py-2.5 text-xs text-modisoft-blue font-medium">{item.item}</td>
                            <td className={`py-2.5 text-xs text-right font-medium ${item.onHand < 0 ? 'text-red-600' : 'text-gray-600'}`}>{item.onHand}</td>
                            <td className={`py-2.5 text-xs text-right font-medium ${item.suggestedOnHand > item.onHand ? 'text-modisoft-turquoise' : 'text-orange-500'}`}>{item.suggestedOnHand}</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{item.lastCount}</td>
                            <td className="py-2.5 text-xs text-gray-500 text-right">{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Waste Ledger — restaurant only */}
                {businessType === 'restaurant' && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-gray-900">Waste Ledger (Last 5)</h2>
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="Item name" className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs w-24 focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise" />
                        <input type="text" placeholder="Qty" className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs w-12 focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise" />
                        <select className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise">
                          <option>Expired</option><option>Spilled</option><option>Dropped</option><option>Overcooked</option>
                        </select>
                        <button onClick={() => showToast('Waste entry added to ledger')} className="bg-modisoft-green text-white px-3 py-1 rounded text-[10px] font-semibold active:scale-95">Add</button>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">When</th>
                          <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Qty</th>
                          <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WASTE_LEDGER.map((entry, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-2.5 text-xs text-gray-600">{entry.when}</td>
                            <td className="py-2.5 text-xs text-modisoft-blue font-medium">{entry.item}</td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{entry.qty}</td>
                            <td className="py-2.5 text-xs text-gray-500 text-right">{entry.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== BUSINESS-TYPE WIDGETS ===== */}
          {showFuel && (businessType === 'convenience' || businessType === 'admin') && fuelKpis && (
            <>
              {/* ===== FUEL / GAS STATION SECTION ===== */}
              {businessType === 'admin' && (
                <div
                  className="mb-4 bg-gradient-to-r from-modisoft-yellow/20 to-amber-50 rounded-xl border border-modisoft-yellow/30 p-4 cursor-pointer select-none"
                  onClick={() => toggleSection('fuel')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⛽</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Convenience Store — Fuel Station</h3>
                        <p className="text-sm text-gray-600">Gas pump operations, tank levels, and forecourt traffic</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${collapsedSections.has('fuel') ? '-rotate-90' : ''}`} />
                  </div>
                </div>
              )}
              {(!collapsedSections.has('fuel') || businessType !== 'admin') && (
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

                {/* Fuel Inventory + Alerts — side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 mb-4">
                  {/* Fuel Inventory Card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 pt-5 pb-6">
                    <h3 className="text-[17px] font-semibold text-gray-900 mb-6">Fuel Inventory</h3>
                    <div className="grid grid-cols-5 gap-0">
                      {fuelTanks.map((tank, idx) => {
                        const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
                        const daysLeft = Math.round(tank.currentLevel / tank.dailyAvgSales);
                        const fillColor = FUEL_GRADE_COLORS[tank.grade];
                        const deliveryDate = new Date(tank.lastDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                        // Vertical cylinder SVG
                        const svgW = 28;
                        const svgH = 200;
                        const tX = 2;
                        const tW = 24;
                        const tY = 4;
                        const tH = 192;
                        const tR = 12;
                        const fillH = (tH * pct) / 100;
                        const fillY = tY + tH - fillH;

                        return (
                          <div
                            key={tank.grade}
                            className={`flex flex-col items-start${idx < fuelTanks.length - 1 ? ' border-r border-gray-100' : ''}`}
                            style={{ paddingLeft: idx === 0 ? 0 : 16, paddingRight: idx === fuelTanks.length - 1 ? 0 : 16 }}
                          >
                            {/* Grade name */}
                            <h4 className="font-bold text-[#0B1932] text-[13px] leading-tight mb-4">{tank.label}</h4>

                            {/* Tank + stats side by side */}
                            <div className="flex items-stretch gap-3">
                              {/* Vertical cylinder */}
                              <div className="flex-shrink-0 flex items-end">
                                <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
                                  <defs>
                                    <clipPath id={`fi-clip-${tank.grade}`}>
                                      <rect x={tX} y={tY} width={tW} height={tH} rx={tR} ry={tR} />
                                    </clipPath>
                                    <linearGradient id={`fi-grad-${tank.grade}`} x1="0" y1="0" x2="1" y2="0">
                                      <stop offset="0%" stopColor={fillColor} stopOpacity="0.85" />
                                      <stop offset="40%" stopColor={fillColor} stopOpacity="1" />
                                      <stop offset="100%" stopColor={fillColor} stopOpacity="0.75" />
                                    </linearGradient>
                                    <linearGradient id={`fi-shine-${tank.grade}`} x1="0" y1="0" x2="1" y2="0">
                                      <stop offset="0%" stopColor="white" stopOpacity="0.30" />
                                      <stop offset="30%" stopColor="white" stopOpacity="0.10" />
                                      <stop offset="100%" stopColor="black" stopOpacity="0.04" />
                                    </linearGradient>
                                  </defs>
                                  {/* Shell */}
                                  <rect x={tX} y={tY} width={tW} height={tH} rx={tR} ry={tR} fill="#E8ECF1" stroke="#D1D5DB" strokeWidth={0.8} />
                                  {/* Liquid */}
                                  <g clipPath={`url(#fi-clip-${tank.grade})`}>
                                    <rect x={tX} y={fillY} width={tW} height={fillH + 1} fill={`url(#fi-grad-${tank.grade})`} />
                                  </g>
                                  {/* Shine */}
                                  <rect x={tX} y={tY} width={tW} height={tH} rx={tR} ry={tR} fill={`url(#fi-shine-${tank.grade})`} />
                                </svg>
                              </div>

                              {/* Stats */}
                              <div className="flex flex-col justify-between py-0.5 min-w-0" style={{ gap: 14 }}>
                                <div className="flex items-start gap-1.5">
                                  <span className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0" style={{ backgroundColor: fillColor }} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] text-gray-400 leading-none">Current Level</p>
                                    <p className="text-[14px] font-bold text-[#0B1932] leading-snug">{tank.currentLevel.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0" style={{ backgroundColor: fillColor }} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] text-gray-400 leading-none">Average Selling</p>
                                    <p className="text-[14px] font-bold leading-snug" style={{ color: fillColor }}>${tank.averageSellingPrice.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0" style={{ backgroundColor: fillColor }} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] text-gray-400 leading-none">Days to Empty</p>
                                    <p className="text-[14px] font-bold text-[#0B1932] leading-snug">{daysLeft < 1 ? '< 1' : daysLeft}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0" style={{ backgroundColor: fillColor }} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] text-gray-400 leading-none">Recent Deliveries</p>
                                    <p className="text-[14px] font-bold text-[#0B1932] leading-snug">{deliveryDate}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0" style={{ backgroundColor: fillColor }} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] text-gray-400 leading-none">Profit per Gallons</p>
                                    <p className="text-[14px] font-bold leading-snug" style={{ color: fillColor }}>${tank.profitPerGallon.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fuel Alerts — sidebar column */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2.5 h-full">
                    <h4 className="font-bold text-gray-900 text-sm">Fuel Alerts</h4>
                    {fuelInsights.slice(0, 4).map((insight) => (
                      <div
                        key={insight.id}
                        className={`p-2.5 rounded-lg border text-xs ${
                          insight.priority === 'high' ? 'bg-red-50 border-red-200' :
                          insight.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="text-sm leading-none mt-0.5">
                            {insight.type === 'tank_low' ? '⚠️' :
                             insight.type === 'rush_hour' ? '🚗' :
                             insight.type === 'cross_sell' ? '🛒' :
                             insight.type === 'price_alert' ? '💰' : '📊'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 leading-tight">{insight.title}</p>
                            <p className="text-gray-500 mt-0.5 line-clamp-2 leading-snug">{insight.description}</p>
                            {insight.actionLabel && (
                              <button
                                onClick={() => setExpandedTipId(expandedTipId === insight.id ? null : insight.id)}
                                className="mt-1.5 px-2 py-0.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded border text-[11px]"
                              >
                                {expandedTipId === insight.id ? 'Hide' : insight.actionLabel}
                              </button>
                            )}
                            {expandedTipId === insight.id && insight.tips && (
                              <ul className="mt-2 space-y-1">
                                {insight.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-1 text-[11px] text-gray-600 leading-snug">
                                    <span className="text-modisoft-turquoise font-bold">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly Fuel Demand Chart */}
                {todayFuelForecast && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Fuel Demand by Hour – {new Date(fuelKpis.primaryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
                        <p className="text-xs text-gray-500">Rush hours highlighted • Adjust staffing accordingly</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-modisoft-yellow"></span> Rush Hour</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-modisoft-turquoise"></span> Normal</span>
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
                            fill="#4DC1B4"
                          >
                            {todayFuelForecast.hourlyDemand.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isRushHour ? '#F8BC2E' : '#4DC1B4'} 
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
                  <div className="bg-gradient-to-br from-modisoft-turquoise/10 to-modisoft-blue/5 rounded-xl border border-modisoft-turquoise/20 p-5 shadow-sm">
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
                      <p className="text-modisoft-teal font-medium">🚀 +5% conversion = +${Math.round(fuelKpis.todayGallons / 12 * 0.05 * 8)}/day extra</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="bg-modisoft-teal hover:bg-modisoft-blue text-white px-3 py-1.5 rounded-lg text-xs font-medium">Run Fuel Bundle</button>
                      <button className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium border">View Analytics</button>
                    </div>
                  </div>

                  {/* Fast-Mover Refill Widget (existing, adjusted) */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Fast-Mover Refill (Now → +6h)</h3>
                      <button className="text-modisoft-turquoise text-sm font-medium">Print list</button>
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
              )}
            </>
          )}

          {(businessType === 'grocery' || businessType === 'admin') && (
            <>
              {businessType === 'admin' && (
                <div
                  className="mb-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4 cursor-pointer select-none"
                  onClick={() => toggleSection('grocery')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛒</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Grocery Store</h3>
                        <p className="text-sm text-gray-600">Inventory alerts, category risk, and stock management</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${collapsedSections.has('grocery') ? '-rotate-90' : ''}`} />
                  </div>
                </div>
              )}
              {(!collapsedSections.has('grocery') || businessType !== 'admin') && (

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
                      <span className={`px-2 py-0.5 rounded text-xs ${item.badge === 'Velocity-based' ? 'bg-modisoft-turquoise/15 text-modisoft-teal' : 'bg-modisoft-blue/10 text-modisoft-blue'}`}>{item.badge}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-500">Expected (48h): <strong className="text-gray-900">{item.expected}</strong></span>
                      <span className="text-gray-500">Stock: <strong className="text-gray-900">{item.stockCanSell}</strong></span>
                      <span className={`font-medium ${item.hoursLeft < 12 ? 'text-red-600' : 'text-amber-600'}`}>{item.hoursLeft}h left</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setOrderCategory({ category: item.category, expected: item.expected, stock: item.stockCanSell })}
                          className="bg-modisoft-turquoise hover:bg-modisoft-teal transition-colors text-white px-2 py-1 rounded text-xs"
                        >
                          Order
                        </button>
                        <button 
                          onClick={() => setSubstituteCategory({ category: item.category })}
                          className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          Substitute
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              )}
            </>
          )}

          {(businessType === 'liquor' || businessType === 'admin') && (
            <>
              {businessType === 'admin' && (
                <div
                  className="mb-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-4 cursor-pointer select-none"
                  onClick={() => toggleSection('liquor')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍷</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Liquor Store</h3>
                        <p className="text-sm text-gray-600">Weekend prep, bundle opportunities, and reorder tracking</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${collapsedSections.has('liquor') ? '-rotate-90' : ''}`} />
                  </div>
                </div>
              )}
              {(!collapsedSections.has('liquor') || businessType !== 'admin') && (
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
                    <button className="mt-2 text-modisoft-turquoise text-xs font-medium">Print shelf tag</button>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="font-medium">Wine Night Pack</p>
                    <p className="text-gray-500 text-xs">2 Reds + Cheese Crackers</p>
                    <button className="mt-2 text-modisoft-turquoise text-xs font-medium">Print shelf tag</button>
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
                      <button className="text-modisoft-turquoise text-xs font-medium">+ Add to PO</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              )}
            </>
          )}

          {(businessType === 'restaurant' || businessType === 'admin') && (
            <>
              {businessType === 'admin' && (
                <div
                  className="mb-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-4 cursor-pointer select-none"
                  onClick={() => toggleSection('restaurant')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Restaurant</h3>
                        <p className="text-sm text-gray-600">Spoilage monitoring, prep tasks, and kitchen operations</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${collapsedSections.has('restaurant') ? '-rotate-90' : ''}`} />
                  </div>
                </div>
              )}
              {(!collapsedSections.has('restaurant') || businessType !== 'admin') && (
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
                        <button className="text-modisoft-turquoise text-xs">Prioritize</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Prep Now Widget */}
              <div className="bg-gradient-to-br from-modisoft-green/10 to-modisoft-turquoise/5 rounded-xl border border-modisoft-green/20 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">👨‍🍳 Prep Now (Lunch)</h3>
                <div className="space-y-2 text-sm">
                  {[{ item: 'Burger Patties', qty: 24 }, { item: 'Caesar Dressing', qty: '2 gal' }, { item: 'Fries (blanched)', qty: '15 lb' }].map((row, i) => (
                    <div key={i} className="flex justify-between items-center bg-white rounded-lg p-2 border border-modisoft-green/20">
                      <span className="font-medium">{row.item}</span>
                      <span className="text-gray-600">{row.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="bg-modisoft-turquoise text-white px-3 py-1.5 rounded-lg text-xs font-medium">Print prep list</button>
                  <button className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium border">Defer to later</button>
                </div>
              </div>
            </div>
              )}
            </>
          )}

          {/* ===== LABOR VS DEMAND PLANNER ===== */}
          {showLabor && (
          <div className="mb-6 bg-gradient-to-br from-modisoft-turquoise/5 via-slate-50 to-modisoft-green/5 rounded-xl border border-modisoft-turquoise/15 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-modisoft-teal font-semibold">Labor vs Demand</p>
                <h3 className="font-semibold text-gray-900 text-lg">Staffing plan for next {forecastWindow} days</h3>
                <p className="text-sm text-gray-600">Shows where we should upstaff or downstaff based on {LABOR_CONFIG[businessType].unitLabel} forecast and why.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{BUSINESS_PROFILES[businessType].label}</span>
                <span className="px-2 py-1 rounded-full bg-white text-modisoft-teal border border-modisoft-turquoise/20">Auto-recommended</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-stretch">
              <div className="col-span-2 min-h-52 bg-white/60 border border-modisoft-turquoise/15 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2 text-xs text-gray-500 font-semibold">
                  <span>Scheduled vs needed hours <span className="text-modisoft-turquoise">(click a bar to expand details)</span></span>
                  <span className="text-gray-400">Per day</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laborPlan} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}
                    onClick={(data: any) => {
                      if (data?.activePayload?.[0]?.payload) {
                        const row = data.activePayload[0].payload as LaborPlanRow;
                        setSelectedLaborDay(prev => prev === row.date ? null : row.date);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} angle={-12} dy={10} height={50} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip content={({ active, payload, label }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      const row = payload[0].payload as LaborPlanRow;
                      return (
                        <div className="bg-white border border-modisoft-turquoise/15 rounded-lg p-3 shadow-lg text-xs min-w-[220px]">
                          <p className="font-semibold text-gray-900 mb-1">{label}</p>
                          <div className="flex items-center justify-between text-gray-600"><span>Needed</span><span className="font-mono text-gray-900">{row.neededHours}h</span></div>
                          <div className="flex items-center justify-between text-gray-600"><span>Scheduled</span><span className="font-mono text-gray-900">{row.scheduledHours}h</span></div>
                          <div className="flex items-center justify-between text-gray-600 mt-1"><span>Delta</span><span className={`font-semibold ${row.deltaHours > 0 ? 'text-emerald-700' : row.deltaHours < 0 ? 'text-slate-700' : 'text-gray-800'}`}>{row.deltaHours > 0 ? `+${row.deltaHours}h` : `${row.deltaHours}h`}</span></div>
                          <p className="mt-2 text-[11px] text-modisoft-teal font-semibold">{row.recommendation}: {row.reason}</p>
                          <p className="mt-1 text-[10px] text-gray-400 italic">Click to expand details</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="scheduledHours" name="Scheduled" fill="#cbd5e1" radius={[4, 4, 0, 0]}
                      onClick={(data: any) => {
                        if (data?.payload) {
                          const row = data.payload as LaborPlanRow;
                          setSelectedLaborDay(prev => prev === row.date ? null : row.date);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <Bar dataKey="neededHours" name="Needed" fill="#2E595A" radius={[4, 4, 0, 0]}
                      onClick={(data: any) => {
                        if (data?.payload) {
                          const row = data.payload as LaborPlanRow;
                          setSelectedLaborDay(prev => prev === row.date ? null : row.date);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/70 border border-modisoft-turquoise/15 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
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
                      <div className="mt-2 p-2 rounded-md bg-modisoft-turquoise/10 border border-modisoft-turquoise/15 text-xs text-modisoft-blue font-semibold">
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

            {/* Expandable Day Detail Panel (appears when a bar is clicked) */}
            {selectedLaborDay && (() => {
              const row = laborPlan.find(r => r.date === selectedLaborDay);
              if (!row) return null;
              return (
                <div className="mt-4 bg-white rounded-lg border-2 border-modisoft-turquoise/30 p-4 shadow-md animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 text-base">{row.dayLabel} — Staffing Details</h4>
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${
                        row.recommendation === 'Upstaff' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.recommendation === 'Downstaff' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {row.recommendation}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedLaborDay(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Needed Hours</p>
                      <p className="text-xl font-bold text-gray-900">{row.neededHours}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Scheduled Hours</p>
                      <p className="text-xl font-bold text-gray-900">{row.scheduledHours}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Delta</p>
                      <p className={`text-xl font-bold ${row.deltaHours > 0 ? 'text-emerald-600' : row.deltaHours < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {row.deltaHours > 0 ? '+' : ''}{row.deltaHours}h
                      </p>
                    </div>
                    <div className="bg-modisoft-turquoise/5 rounded-lg p-3 border border-modisoft-turquoise/15">
                      <p className="text-[10px] uppercase text-modisoft-teal font-semibold mb-1">Recommendation</p>
                      <p className="text-sm font-semibold text-modisoft-blue">{row.reason}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {row.assignedEmployees.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-semibold mb-2">Assigned Staff</p>
                        <div className="flex flex-wrap gap-2">
                          {row.assignedEmployees.map((name, i) => (
                            <span key={i} className="flex items-center gap-2 px-2 py-1 bg-modisoft-turquoise/10 text-modisoft-teal rounded-lg text-xs font-medium">
                              <span className="w-6 h-6 rounded-full bg-modisoft-teal text-white flex items-center justify-center text-[10px] font-bold">
                                {name.split(' ').map(n => n[0]).join('')}
                              </span>
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {row.suggestedEmployees.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-emerald-600 font-semibold mb-2">Suggested to Add</p>
                        <div className="flex flex-wrap gap-2">
                          {row.suggestedEmployees.map((name, i) => (
                            <span key={i} className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                                {name.split(' ').map(n => n[0]).join('')}
                              </span>
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
                  className="flex items-center gap-1 text-modisoft-turquoise hover:text-modisoft-teal text-sm font-medium"
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
                    className="w-full text-center text-xs text-modisoft-teal font-medium py-2 border border-dashed border-modisoft-turquoise/30 rounded-lg hover:bg-modisoft-turquoise/5 transition-colors"
                  >
                    View {INSIGHT_EVENTS.length - 5} more insights
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs text-gray-400">
                Sunny reads the same filters (stores, department, items) you're using here.
              </p>
            </div>

            {/* Top Items Table — simplified for store owners */}
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-semibold text-gray-900 text-sm">Your Top Sellers — Next 14 Days</h3>
                  <span className="text-[10px] font-bold text-white bg-modisoft-turquoise px-2 py-0.5 rounded-full">{filteredItems.length} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise/20 focus:border-modisoft-turquoise transition-all font-medium text-gray-600"
                    />
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Download CSV">
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="pl-5 pr-2 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-8">#</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Forecast Revenue</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Units to Sell</th>
                      <th className="px-5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedItems.map((item, idx) => {
                      const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                      const isTop3 = globalIdx < 3;
                      // Determine a smart status tag per item
                      const statusTag = item.isPromoActive 
                        ? { label: 'Promo On', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                        : item.forecastRevenue >= 1500 
                          ? { label: 'High Demand', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                          : item.forecastUnits >= 250
                            ? { label: 'Stock Up', color: 'bg-sky-50 text-sky-700 border-sky-200' }
                            : { label: 'Steady', color: 'bg-gray-50 text-gray-500 border-gray-200' };
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${isTop3 ? 'bg-modisoft-turquoise/[0.03]' : ''}`}
                          onClick={() => {
                            setItemDetailData({
                              name: item.name,
                              department: item.department,
                              onHand: Math.round(item.forecastUnits * 0.8),
                              parLevel: Math.round(item.forecastUnits * 1.2),
                              price: item.price,
                              forecastUnits: item.forecastUnits,
                              status: item.forecastUnits >= 250 ? 'low_stock' : 'covered',
                            });
                            setIsItemDetailOpen(true);
                          }}
                        >                          {/* Rank */}
                          <td className="pl-5 pr-2 py-2.5">
                            {isTop3 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-modisoft-turquoise text-white text-[10px] font-bold">
                                {globalIdx + 1}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium pl-1">{globalIdx + 1}</span>
                            )}
                          </td>
                          {/* Item name + department */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col">
                              <span className={`text-sm font-semibold hover:underline ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>{item.name}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{item.department}</span>
                            </div>
                          </td>
                          {/* Revenue */}
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-sm tabular-nums ${isTop3 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {formatCurrency(item.forecastRevenue)}
                            </span>
                          </td>
                          {/* Units */}
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-sm text-gray-600 tabular-nums font-medium">{item.forecastUnits.toLocaleString()}</span>
                          </td>
                          {/* Status tag */}
                          <td className="px-5 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusTag.color}`}>
                              {statusTag.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No items match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer with pagination */}
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
                <span className="text-[11px] text-gray-500">
                  Page <span className="font-semibold text-gray-700">{currentPage}</span> of <span className="font-semibold text-gray-700">{totalPages || 1}</span>
                </span>
                <div className="flex gap-1.5">
                  <button 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>)}
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
            <div className="p-4 bg-modisoft-blue flex items-center justify-between">
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
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise focus:bg-white transition-all"
                />
                <button className="absolute right-2 top-2 p-1.5 bg-modisoft-turquoise hover:bg-modisoft-teal rounded-lg text-white transition-colors">
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
            <div className="p-5 bg-modisoft-blue flex items-center justify-between">
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
                        className="w-4 h-4 rounded border-gray-300 text-modisoft-turquoise focus:ring-modisoft-turquoise"
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
                        className="w-4 h-4 rounded border-gray-300 text-modisoft-turquoise focus:ring-modisoft-turquoise"
                      />
                      <span className="text-sm text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Views Toggles */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Data Views</label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLabor}
                    onChange={(e) => setShowLabor(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-modisoft-turquoise focus:ring-modisoft-turquoise"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="text-sm text-gray-700">Staffing Planner</span>
                  </div>
                </label>
                {(businessType === 'convenience' || businessType === 'admin') && (
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFuel}
                      onChange={(e) => setShowFuel(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-modisoft-turquoise focus:ring-modisoft-turquoise"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⛽</span>
                      <span className="text-sm text-gray-700">Fuel Station</span>
                    </div>
                  </label>
                )}
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise"
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
                      className="px-3 py-1.5 bg-gray-100 hover:bg-modisoft-turquoise/10 hover:text-modisoft-teal text-gray-600 text-xs font-medium rounded-lg transition-colors"
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
                  setShowFuel(false);
                  setShowLabor(businessType !== 'convenience');
                  setStartDate('2026-09-10');
                  setEndDate('2026-09-20');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 px-4 py-2.5 bg-modisoft-turquoise hover:bg-modisoft-teal text-white rounded-lg text-sm font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== NEW ITEM SIMULATOR ===== */}
      <NewItemSimulator
        isOpen={isNewItemOpen}
        onClose={() => setIsNewItemOpen(false)}
        businessType={businessType}
        baselineRevenue={Math.round(kpiData.revenueForecast / (forecastWindow || 14))}
        baselineUnits={Math.round(kpiData.unitsForecast / (forecastWindow || 14))}
      />

      {/* ===== ACTION NEXT-STEP MODAL ===== */}
      {nextStepAction && (
        <ActionNextStepModal
          action={nextStepAction}
          onClose={() => setNextStepAction(null)}
          onComplete={(actionId, status) => {
            handleActionUpdate(actionId, status);
            setNextStepAction(null);
          }}
          employees={EMPLOYEES[businessType].map(emp => ({
            id: emp.id,
            name: emp.name,
            phone: emp.phone,
            role: emp.role,
          }))}
        />
      )}

      {/* ===== INVENTORY MODALS ===== */}
      <QuickOrderModal
        isOpen={!!orderCategory}
        onClose={() => setOrderCategory(null)}
        categoryData={orderCategory}
      />
      <SubstituteModal
        isOpen={!!substituteCategory}
        onClose={() => setSubstituteCategory(null)}
        categoryData={substituteCategory}
      />

      {/* ===== ITEM DETAIL MODAL ===== */}
      <ItemDetailModal
        isOpen={isItemDetailOpen}
        onClose={() => { setIsItemDetailOpen(false); setItemDetailData(null); }}
        item={itemDetailData}
        onOrder={(item) => {
          setIsItemDetailOpen(false);
          setOrderCategory({ category: item.name, expected: item.forecastUnits || 50, stock: item.onHand });
        }}
        onShowToast={showToast}
      />

      {/* ===== PURCHASE ORDER BUILDER MODAL ===== */}
      {isOrderBuilderOpen && (
        <ItemOrderBuilder
          items={currentItems}
          initialOrders={orderBuilderInitial}
          onClose={() => setIsOrderBuilderOpen(false)}
          showToast={showToast}
        />
      )}

      {/* ===== COUNT WORKSHEET MODAL ===== */}
      {isCountWorksheetOpen && (
        <CountWorksheet
          items={currentItems}
          onClose={() => setIsCountWorksheetOpen(false)}
          onCountsSubmitted={handleCountsSubmitted}
          showToast={showToast}
        />
      )}

      {/* ===== TOAST NOTIFICATION ===== */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-modisoft-blue text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 text-modisoft-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
