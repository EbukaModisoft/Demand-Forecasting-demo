'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, Box, CheckCircle2, Clock3, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import type { ActionItem, BusinessType, KpiData } from '../types';
import {
  BUNDLE_SUGGESTIONS,
  FAST_MOVERS,
  INVENTORY_AI_INSIGHTS,
  INVENTORY_KPI,
  PREP_ITEMS,
  SPOILAGE_ITEMS,
  TOP_REORDER_ITEMS,
} from '../lib/inventoryData';

interface OperationsTodayViewProps {
  businessType: BusinessType;
  actions: ActionItem[];
  kpiData: KpiData;
  forecastWindow: 7 | 14 | 28;
  onHandleAction: (action: ActionItem) => void;
  onDismissAction: (actionId: string) => void;
  onReviewOrder: (category: string, expected: number, stock: number) => void;
  onOpenSunny: () => void;
  onShowToast: (message: string) => void;
}

const businessFocusCopy: Record<BusinessType, { title: string; description: string }> = {
  admin: {
    title: 'Across stores today',
    description: 'Focus on the highest-risk locations first, then clear slow stock and count issues.',
  },
  convenience: {
    title: 'Order tonight',
    description: 'Cold drinks, snacks, and grab-and-go items matter most when traffic picks up fast.',
  },
  grocery: {
    title: 'Move slow stock',
    description: 'Protect cash by clearing overstocks before they turn into stale inventory.',
  },
  liquor: {
    title: 'Weekend prep',
    description: 'Use the forecast to load up for the next spike and bundle slow items into easy offers.',
  },
  restaurant: {
    title: 'Prep and use first',
    description: 'The best daily flow is prep what will sell, then move anything getting close to expiry.',
  },
};

const actionTone = {
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
} as const;

export function OperationsTodayView({ businessType, actions, kpiData, forecastWindow, onHandleAction, onDismissAction, onReviewOrder, onOpenSunny, onShowToast }: OperationsTodayViewProps) {
  const inventoryKpi = INVENTORY_KPI[businessType];
  const openActions = actions.filter((action) => action.status === 'open').slice(0, 4);
  const reorderItems = TOP_REORDER_ITEMS.slice(0, 3);
  const suggestions = INVENTORY_AI_INSIGHTS[businessType].slice(0, 2);
  const fastMovers = FAST_MOVERS[businessType].slice(0, 3);
  const focus = businessFocusCopy[businessType];

  const businessSpecificRows = (() => {
    if (businessType === 'restaurant') {
      return PREP_ITEMS.slice(0, 3).map((item) => ({
        label: item.item,
        meta: `${item.meal} prep`,
        action: `Prep ${item.suggestedBatch}`,
      }));
    }

    if (businessType === 'liquor') {
      return BUNDLE_SUGGESTIONS.slice(0, 3).map((item) => ({
        label: item.items,
        meta: item.placement || 'Front-of-store idea',
        action: 'Set display',
      }));
    }

    if (businessType === 'grocery') {
      return fastMovers.map((item) => ({
        label: item.category || item.item,
        meta: `${item.hoursLeft || 0} hours of stock left`,
        action: 'Move from backroom',
      }));
    }

    return fastMovers.map((item) => ({
      label: item.item,
      meta: `Should sell ${item.expected6h} in the next 6 hours`,
      action: `Order ${item.refillNow || 0}`,
    }));
  })();

  const expiringSoon = businessType === 'restaurant' ? SPOILAGE_ITEMS.filter((item) => item.risk !== 'low').length : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-modisoft-turquoise/20 bg-gradient-to-br from-white via-[#F0FAF8] to-[#E5F5F1] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-modisoft-turquoise/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-modisoft-green/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-modisoft-turquoise/10 px-3 py-1 text-xs font-semibold text-modisoft-teal">
              <Sparkles className="h-3.5 w-3.5" />
              Today uses forecast + stock together
            </div>
            <h2 className="text-2xl font-bold text-modisoft-blue">What needs attention today</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              This view turns your forecast into clear inventory actions. Instead of jumping between charts and stock tables,
              start here to see what to order, what could run out, and what you can safely push to later.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-600">Need action today</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{inventoryKpi.itemsAtRisk}</p>
              <p className="mt-1 text-sm text-gray-500">Items that could miss demand soon</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-600">Sales expected</p>
              <p className="mt-2 text-3xl font-bold text-modisoft-blue">${kpiData.revenueForecast.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">Forecast across the next {forecastWindow} days</p>
            </div>
            <div className="rounded-xl border border-modisoft-turquoise/30 bg-gradient-to-br from-modisoft-turquoise/10 to-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-600">Stock status</p>
              <p className="mt-2 text-3xl font-bold text-modisoft-teal">{inventoryKpi.inventoryHealthScore}</p>
              <p className="mt-1 text-sm text-gray-500">Higher means fewer stock and count issues</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-modisoft-blue">Urgent today</h3>
              <p className="text-sm text-gray-600">Start with the actions most likely to protect sales or prevent waste.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {openActions.length} open actions
            </div>
          </div>

          <div className="space-y-3">
            {openActions.map((action) => (
              <div key={action.id} className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                action.priority === 'high' ? 'border-l-4 border-l-red-400 border-t-gray-200 border-r-gray-200 border-b-gray-200 bg-red-50/30' :
                action.priority === 'medium' ? 'border-l-4 border-l-amber-400 border-t-gray-200 border-r-gray-200 border-b-gray-200 bg-amber-50/20' :
                'border-gray-200'
              }`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone[action.priority]}`}>
                        {action.priority === 'high' ? 'Do now' : action.priority === 'medium' ? 'Do soon' : 'Keep an eye on this'}
                      </span>
                      <span className="text-xs font-medium text-gray-500">{action.type}</span>
                    </div>
                    <p className="text-base font-semibold text-modisoft-blue">{action.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Why this matters: {action.expectedValueLabel}. Due {new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => onHandleAction(action)}
                      className="rounded-lg bg-modisoft-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-modisoft-blue-light active:scale-95"
                    >
                      Handle now
                    </button>
                    <button
                      onClick={() => onDismissAction(action.id)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:scale-95"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-modisoft-blue">Why today looks different</h3>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="rounded-xl bg-gray-50 p-4 border-l-4 border-l-modisoft-turquoise">
              <div className="flex items-center gap-2 font-semibold text-modisoft-blue">
                <TrendingUp className="h-4 w-4 text-modisoft-turquoise" />
                Demand signal
              </div>
              <p className="mt-2">You are forecast to sell {kpiData.unitsForecast.toLocaleString()} items in the next {forecastWindow} days.</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 border-l-4 border-l-amber-400">
              <div className="flex items-center gap-2 font-semibold text-modisoft-blue">
                <Box className="h-4 w-4 text-modisoft-turquoise" />
                Stock pressure
              </div>
              <p className="mt-2">{inventoryKpi.itemsAtRisk} items already look short against expected demand.</p>
            </div>
            {businessType === 'restaurant' && (
              <div className="rounded-xl bg-gray-50 p-4 border-l-4 border-l-red-400">
                <div className="flex items-center gap-2 font-semibold text-modisoft-blue">
                  <Clock3 className="h-4 w-4 text-modisoft-turquoise" />
                  Use-first pressure
                </div>
                <p className="mt-2">{expiringSoon} prep items should be sold or discounted before they turn into waste.</p>
              </div>
            )}
            <div className="rounded-xl bg-modisoft-blue p-4 text-white">
              <p className="text-sm font-semibold">Simple rule</p>
              <p className="mt-2 text-sm text-white/85">Forecast tells you what is coming. Stock tells you what to do next.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-modisoft-blue">Order today</h3>
              <p className="text-sm text-gray-600">One simple order list based on forecast and current stock.</p>
            </div>
            <button
              onClick={() => onReviewOrder(reorderItems[0]?.item || 'General', 100, 40)}
              className="rounded-lg bg-modisoft-turquoise px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-modisoft-teal active:scale-95"
            >
              Review order
            </button>
          </div>

          <div className="space-y-3">
            {reorderItems.map((item) => (
              <div key={item.item} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="text-base font-semibold text-modisoft-blue">{item.item}</p>
                  <p className="mt-1 text-sm text-gray-600">Estimated cost ${item.estCost} and likely needed soon.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-600">Order {item.orderQty}</p>
                  <button
                    onClick={() => onShowToast(`Added ${item.item} (${item.orderQty} units) to draft order`)}
                    className="mt-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-95"
                  >
                    Add to draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-modisoft-blue">Sunny&apos;s suggestions</h3>
              <p className="text-sm text-gray-600">A few practical ideas worth checking today.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-modisoft-yellow/15 px-3 py-1 text-sm font-semibold text-amber-700 cursor-pointer hover:bg-modisoft-yellow/25 transition-colors" onClick={onOpenSunny}>
              <Sparkles className="h-4 w-4" />
              2 best ideas
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 p-4">
                <p className="text-base font-semibold text-modisoft-blue">{item.title}</p>
                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                <p className="mt-2 text-sm text-gray-500">Why this matters: helps protect sales or reduce waste with one simple next step.</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-modisoft-blue">{focus.title}</h3>
            <p className="text-sm text-gray-600">{focus.description}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            <DollarSign className="h-4 w-4 text-modisoft-turquoise" />
            Business-specific focus
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {businessSpecificRows.map((row) => (
            <div key={row.label} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-modisoft-blue">
                <CheckCircle2 className="h-4 w-4 text-modisoft-turquoise" />
                {row.label}
              </div>
              <p className="text-sm text-gray-600">{row.meta}</p>
              <button
                onClick={() => onShowToast(`Started: ${row.action} for ${row.label}`)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-95"
              >
                {row.action}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}