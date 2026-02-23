'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Target,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  Trophy,
  ThumbsUp,
  FileText,
  Users,
  Calendar,
  Zap,
  ChevronRight
} from 'lucide-react';
import { 
  ApprovedPlan, 
  PacingDay, 
  WeeklyReviewSummary, 
  ActionItem, 
  PlanStatus,
  DEFAULT_SCENARIO_INPUTS
} from '../types';

// ============== PROPS ==============
interface ExecutionBoardProps {
  isOpen: boolean;
  onClose: () => void;
  // Plan data
  activePlan: ApprovedPlan | null;
  onApprovePlan: (plan: Omit<ApprovedPlan, 'id' | 'approvedAt' | 'actualRevenue' | 'actualUnits'>) => void;
  onUpdatePlanStatus: (planId: string, status: PlanStatus) => void;
  // Action data
  actions: ActionItem[];
  onActionUpdate: (actionId: string, status: ActionItem['status']) => void;
  // Context
  forecastedRevenue: number;
  forecastedUnits: number;
  pacingData: PacingDay[];
  weeklyReview: WeeklyReviewSummary | null;
}

type Tab = 'approve' | 'execute' | 'pacing' | 'review';

// ============== COMPONENT ==============
export const ExecutionBoard: React.FC<ExecutionBoardProps> = ({
  isOpen,
  onClose,
  activePlan,
  onApprovePlan,
  onUpdatePlanStatus,
  actions,
  onActionUpdate,
  forecastedRevenue,
  forecastedUnits,
  pacingData,
  weeklyReview,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(activePlan ? 'execute' : 'approve');
  const [planNotes, setPlanNotes] = useState('');
  const [planName, setPlanName] = useState('');

  // Derived data
  const openActions = useMemo(() => actions.filter(a => a.status === 'open'), [actions]);
  const acceptedActions = useMemo(() => actions.filter(a => a.status === 'accepted'), [actions]);
  const doneActions = useMemo(() => actions.filter(a => a.status === 'done'), [actions]);
  const totalValue = useMemo(() => actions.reduce((sum, a) => sum + a.expectedValue, 0), [actions]);
  const completedValue = useMemo(() => doneActions.reduce((sum, a) => sum + a.expectedValue, 0), [doneActions]);

  // Pacing summary
  const pacingSummary = useMemo(() => {
    const completedDays = pacingData.filter(d => d.actualRevenue !== null);
    if (completedDays.length === 0) return null;
    
    const totalForecast = completedDays.reduce((sum, d) => sum + d.forecastRevenue, 0);
    const totalActual = completedDays.reduce((sum, d) => sum + (d.actualRevenue ?? 0), 0);
    const variance = totalForecast > 0 ? ((totalActual - totalForecast) / totalForecast) * 100 : 0;
    
    return {
      daysComplete: completedDays.length,
      totalDays: pacingData.length,
      totalForecast,
      totalActual,
      variance: Math.round(variance * 10) / 10,
      status: variance >= -2 ? 'on_track' as const : variance >= -8 ? 'behind' as const : 'behind' as const,
    };
  }, [pacingData]);

  if (!isOpen) return null;

  const handleApprovePlan = () => {
    onApprovePlan({
      name: planName || `Plan ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      status: 'approved',
      dateRange: { from: pacingData[0]?.date || '', to: pacingData[pacingData.length - 1]?.date || '' },
      scenarioInputs: DEFAULT_SCENARIO_INPUTS,
      approvedBy: 'Store Manager',
      notes: planNotes,
      forecastedRevenue,
      forecastedUnits,
      actionIds: actions.map(a => a.id),
    });
    setActiveTab('execute');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { 
      id: 'approve', 
      label: 'Approve Plan', 
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    { 
      id: 'execute', 
      label: 'Execute', 
      icon: <Zap className="w-4 h-4" />,
      badge: openActions.length + acceptedActions.length,
    },
    { 
      id: 'pacing', 
      label: 'Pacing', 
      icon: <Target className="w-4 h-4" />,
    },
    { 
      id: 'review', 
      label: 'Review', 
      icon: <Trophy className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer — wider for execution board */}
      <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-modisoft-blue/10 to-modisoft-turquoise/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-modisoft-turquoise/20 rounded-lg">
              <Target className="w-5 h-5 text-modisoft-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Execution Board</h2>
              <p className="text-xs text-gray-500">
                {activePlan 
                  ? `Plan: ${activePlan.name} • ${activePlan.status.replace('_', ' ')}`
                  : 'Forecast → Plan → Execute → Review'
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-modisoft-blue border-modisoft-blue'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-modisoft-yellow/20 text-yellow-700 rounded-full text-[10px] font-semibold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ===== TAB 1: APPROVE PLAN ===== */}
          {activeTab === 'approve' && (
            <div className="space-y-6">
              {activePlan ? (
                // Plan already approved
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-modisoft-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-modisoft-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Plan Approved</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    &ldquo;{activePlan.name}&rdquo; is locked and being executed.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    <div className="p-3 bg-modisoft-blue/10 rounded-lg text-center">
                      <p className="text-xs text-modisoft-blue">Forecasted Revenue</p>
                      <p className="text-lg font-bold text-modisoft-blue">${activePlan.forecastedRevenue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-modisoft-turquoise/10 rounded-lg text-center">
                      <p className="text-xs text-modisoft-teal">Forecasted Units</p>
                      <p className="text-lg font-bold text-modisoft-teal">{activePlan.forecastedUnits.toLocaleString()}</p>
                    </div>
                  </div>
                  {activePlan.notes && (
                    <p className="mt-4 text-xs text-gray-500 italic">&ldquo;{activePlan.notes}&rdquo;</p>
                  )}
                </div>
              ) : (
                // Approve new plan
                <>
                  {/* Current Forecast Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-modisoft-blue" />
                      Forecast Summary to Lock In
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-gradient-to-br from-modisoft-blue/10 to-modisoft-blue/5 rounded-xl border border-modisoft-blue/20">
                        <p className="text-xs text-modisoft-blue font-medium">Revenue Forecast</p>
                        <p className="text-2xl font-bold text-modisoft-blue">${forecastedRevenue.toLocaleString()}</p>
                        <p className="text-xs text-modisoft-blue/70 mt-1">Baseline forecast</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-modisoft-turquoise/10 to-modisoft-turquoise/5 rounded-xl border border-modisoft-turquoise/20">
                        <p className="text-xs text-modisoft-teal font-medium">Units Forecast</p>
                        <p className="text-2xl font-bold text-modisoft-teal">{forecastedUnits.toLocaleString()}</p>
                        <p className="text-xs text-modisoft-teal/70 mt-1">For the planning period</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions to commit */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">
                      {actions.length} Actions Linked ({openActions.length} pending)
                    </h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {actions.slice(0, 5).map((action) => (
                        <div key={action.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                          <div className="flex items-center gap-2">
                            <span>{action.type === 'labor' ? '👥' : action.type === 'promo' ? '🏷️' : action.type === 'pricing' ? '💰' : action.type === 'fuel' ? '⛽' : '📅'}</span>
                            <span className="text-gray-700 font-medium">{action.title}</span>
                          </div>
                          <span className="text-gray-500">{action.expectedValueLabel}</span>
                        </div>
                      ))}
                      {actions.length > 5 && (
                        <p className="text-xs text-gray-400 text-center">+{actions.length - 5} more actions</p>
                      )}
                    </div>
                  </div>

                  {/* Plan Name & Notes */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Plan Name</label>
                      <input
                        type="text"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder={`Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-modisoft-blue/20 focus:border-modisoft-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes / Assumptions</label>
                      <textarea
                        value={planNotes}
                        onChange={(e) => setPlanNotes(e.target.value)}
                        placeholder="e.g., Expecting rain midweek, running coffee promo Fri-Sun..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-modisoft-blue/20 focus:border-modisoft-blue resize-none"
                      />
                    </div>
                  </div>

                  {/* Approve Button */}
                  <button
                    onClick={handleApprovePlan}
                    className="w-full py-3 bg-modisoft-blue hover:bg-modisoft-blue/90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-modisoft-blue/20"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Lock In This Plan
                  </button>
                </>
              )}
            </div>
          )}

          {/* ===== TAB 2: EXECUTE ===== */}
          {activeTab === 'execute' && (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Action Progress</h4>
                  <span className="text-xs text-gray-500">
                    {doneActions.length}/{actions.length} complete
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-modisoft-green transition-all"
                    style={{ width: `${actions.length > 0 ? (doneActions.length / actions.length) * 100 : 0}%` }}
                  />
                  <div 
                    className="h-full bg-modisoft-turquoise transition-all"
                    style={{ width: `${actions.length > 0 ? (acceptedActions.length / actions.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-modisoft-green rounded-full" /> Done ({doneActions.length})</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-modisoft-turquoise rounded-full" /> In Progress ({acceptedActions.length})</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-200 rounded-full" /> Pending ({openActions.length})</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Value captured</span>
                  <span className="font-semibold text-modisoft-green">${completedValue.toLocaleString()} / ${totalValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Action sections by priority */}
              {openActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock className="w-3.5 h-3.5" />
                    Needs Your Action ({openActions.length})
                  </h4>
                  <div className="space-y-2">
                    {openActions.map((action) => (
                      <ActionCard key={action.id} action={action} onUpdate={onActionUpdate} mode="execute" />
                    ))}
                  </div>
                </div>
              )}

              {acceptedActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-modisoft-turquoise mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <ArrowRight className="w-3.5 h-3.5" />
                    In Progress ({acceptedActions.length})
                  </h4>
                  <div className="space-y-2">
                    {acceptedActions.map((action) => (
                      <ActionCard key={action.id} action={action} onUpdate={onActionUpdate} mode="execute" />
                    ))}
                  </div>
                </div>
              )}

              {doneActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-modisoft-green mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed ({doneActions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {doneActions.map((action) => (
                      <div key={action.id} className="flex items-center justify-between px-3 py-2 bg-modisoft-green/10 border border-modisoft-green/20 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-modisoft-green" />
                          <span className="text-gray-700">{action.title}</span>
                        </div>
                        <span className="text-modisoft-green font-medium">{action.expectedValueLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {actions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No actions yet. Approve a plan first.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB 3: PACING ===== */}
          {activeTab === 'pacing' && (
            <div className="space-y-6">
              {/* Pacing Summary */}
              {pacingSummary && (
                <div className={`p-4 rounded-xl border ${
                  pacingSummary.variance >= -2 ? 'bg-modisoft-green/10 border-modisoft-green/20' :
                  pacingSummary.variance >= -8 ? 'bg-modisoft-yellow/10 border-modisoft-yellow/20' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {pacingSummary.variance >= -2 ? (
                        <TrendingUp className="w-4 h-4 text-modisoft-green" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-modisoft-yellow" />
                      )}
                      {pacingSummary.variance >= -2 ? 'On Track' : pacingSummary.variance >= -8 ? 'Slightly Behind' : 'Behind Plan'}
                    </h4>
                    <span className="text-xs text-gray-500">
                      Day {pacingSummary.daysComplete} of {pacingSummary.totalDays}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Planned</p>
                      <p className="text-sm font-semibold text-gray-900">${pacingSummary.totalForecast.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Actual</p>
                      <p className="text-sm font-semibold text-gray-900">${pacingSummary.totalActual.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Variance</p>
                      <p className={`text-sm font-semibold ${pacingSummary.variance >= 0 ? 'text-modisoft-green' : 'text-red-600'}`}>
                        {pacingSummary.variance >= 0 ? '+' : ''}{pacingSummary.variance}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Day-by-day pacing */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Daily Pacing</h4>
                <div className="space-y-1.5">
                  {pacingData.map((day) => {
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const hasPast = day.actualRevenue !== null;
                    
                    return (
                      <div 
                        key={day.date}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isToday ? 'bg-modisoft-blue/5 border-modisoft-blue/20 ring-1 ring-modisoft-blue/30' :
                          hasPast && day.status === 'ahead' ? 'bg-modisoft-green/5 border-modisoft-green/20' :
                          hasPast && day.status === 'behind' ? 'bg-red-50 border-red-100' :
                          hasPast ? 'bg-gray-50 border-gray-100' :
                          'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            hasPast && day.status === 'ahead' ? 'bg-modisoft-green/10 text-modisoft-green' :
                            hasPast && day.status === 'behind' ? 'bg-red-100 text-red-700' :
                            hasPast ? 'bg-gray-100 text-gray-600' :
                            isToday ? 'bg-modisoft-blue/10 text-modisoft-blue' :
                            'bg-gray-50 text-gray-400'
                          }`}>
                            {hasPast ? (day.status === 'ahead' ? '↑' : day.status === 'behind' ? '↓' : '—') : 
                             isToday ? '◉' : '○'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isToday ? 'text-modisoft-blue' : 'text-gray-900'}`}>
                              {day.dayLabel} {isToday && <span className="text-xs text-modisoft-blue/70">(Today)</span>}
                            </p>
                            <p className="text-xs text-gray-500">Plan: ${day.forecastRevenue.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {hasPast ? (
                            <>
                              <p className="text-sm font-semibold text-gray-900">${(day.actualRevenue ?? 0).toLocaleString()}</p>
                              <p className={`text-xs font-medium ${
                                (day.variance ?? 0) >= 0 ? 'text-modisoft-green' : 'text-red-600'
                              }`}>
                                {(day.variance ?? 0) >= 0 ? '+' : ''}{day.variance}%
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400">Pending</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB 4: REVIEW ===== */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              {weeklyReview ? (
                <>
                  {/* Report card */}
                  <div className="p-5 bg-gradient-to-br from-modisoft-blue/5 to-modisoft-turquoise/5 rounded-xl border border-modisoft-blue/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-5 h-5 text-modisoft-yellow" />
                      <h3 className="text-sm font-semibold text-gray-900">Weekly Report Card</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Revenue</p>
                        <p className="text-xl font-bold text-gray-900">${weeklyReview.actualRevenue.toLocaleString()}</p>
                        <p className={`text-xs font-medium ${weeklyReview.revenueVariance >= 0 ? 'text-modisoft-green' : 'text-red-600'}`}>
                          {weeklyReview.revenueVariance >= 0 ? '+' : ''}{weeklyReview.revenueVariance}% vs plan
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Units</p>
                        <p className="text-xl font-bold text-gray-900">{weeklyReview.actualUnits.toLocaleString()}</p>
                        <p className={`text-xs font-medium ${weeklyReview.unitsVariance >= 0 ? 'text-modisoft-green' : 'text-red-600'}`}>
                          {weeklyReview.unitsVariance >= 0 ? '+' : ''}{weeklyReview.unitsVariance}% vs plan
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600 border-t border-gray-100 pt-3">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-modisoft-green" />
                        {weeklyReview.actionsCompleted}/{weeklyReview.actionsTotal} actions done
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-modisoft-blue" />
                        ${weeklyReview.completedValue.toLocaleString()} value captured
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  {weeklyReview.highlights.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-modisoft-green mb-2 flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        What Worked
                      </h4>
                      <div className="space-y-1.5">
                        {weeklyReview.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 bg-modisoft-green/10 rounded-lg">
                            <ChevronRight className="w-3.5 h-3.5 text-modisoft-green mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-modisoft-green/80">{h}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lessons Learned */}
                  {weeklyReview.lessonsLearned.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Lessons / Adjustments
                      </h4>
                      <div className="space-y-1.5">
                        {weeklyReview.lessonsLearned.map((l, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 bg-modisoft-yellow/10 rounded-lg">
                            <ChevronRight className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-800">{l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No review available yet</p>
                  <p className="text-xs mt-1">Complete a planning period to see your report card.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {activePlan ? `Approved ${activePlan.approvedAt}` : 'No plan approved yet'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-modisoft-blue text-white text-sm font-medium rounded-lg hover:bg-modisoft-blue/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

// ============== ACTION CARD SUB-COMPONENT ==============
const ActionCard: React.FC<{
  action: ActionItem;
  onUpdate: (id: string, status: ActionItem['status']) => void;
  mode: 'execute' | 'review';
}> = ({ action, onUpdate, mode }) => {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      action.status === 'accepted' ? 'bg-modisoft-turquoise/5 border-modisoft-turquoise/20' :
      action.priority === 'high' ? 'bg-modisoft-yellow/10 border-modisoft-yellow/20' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
            action.type === 'labor' ? 'bg-modisoft-blue/10 text-modisoft-blue' :
            action.type === 'promo' ? 'bg-modisoft-turquoise/10 text-modisoft-turquoise' :
            action.type === 'pricing' ? 'bg-modisoft-green/10 text-modisoft-green' :
            action.type === 'fuel' ? 'bg-orange-100 text-orange-600' :
            'bg-modisoft-blue/10 text-modisoft-blue'
          }`}>
            {action.type === 'labor' ? '👥' : action.type === 'promo' ? '🏷️' : action.type === 'pricing' ? '💰' : action.type === 'fuel' ? '⛽' : '📅'}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{action.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {action.ownerRole}
              </span>
              <span className="font-medium text-modisoft-green">{action.expectedValueLabel}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      {mode === 'execute' && (
        <div className="flex items-center gap-2 mt-3 ml-12">
          {action.status === 'open' && (
            <>
              <button
                onClick={() => onUpdate(action.id, 'accepted')}
                className="px-3 py-1.5 bg-modisoft-turquoise hover:bg-modisoft-turquoise/90 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                Start
              </button>
              <button
                onClick={() => onUpdate(action.id, 'ignored')}
                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xs rounded-lg transition-colors"
              >
                Skip
              </button>
            </>
          )}
          {action.status === 'accepted' && (
            <button
              onClick={() => onUpdate(action.id, 'done')}
              className="px-3 py-1.5 bg-modisoft-green hover:bg-modisoft-green/90 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              Mark Done
            </button>
          )}
        </div>
      )}
    </div>
  );
};
