'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList, X, Check, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import type { InventoryItem } from '../types';

interface CountWorksheetProps {
  items: InventoryItem[];
  onClose: () => void;
  onCountsSubmitted: (updates: { itemId: string; newOnHand: number }[]) => void;
  showToast: (msg: string) => void;
}

interface CountEntry {
  item: InventoryItem;
  counted: string; // string for input state
  confirmed: boolean;
}

export function CountWorksheet({ items, onClose, onCountsSubmitted, showToast }: CountWorksheetProps) {
  const [step, setStep] = useState<'select' | 'count' | 'review'>('select');
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<CountEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const departments = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.department, (map.get(item.department) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const toggleDept = (dept: string) => {
    setSelectedDepts(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept); else next.add(dept);
      return next;
    });
  };

  const startCounting = () => {
    const toCount = items
      .filter(i => selectedDepts.has(i.department))
      .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
    setEntries(toCount.map(item => ({ item, counted: '', confirmed: false })));
    setCurrentIdx(0);
    setStep('count');
  };

  const updateCounted = (idx: number, val: string) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, counted: val } : e));
  };

  const confirmEntry = (idx: number) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, confirmed: true } : e));
    if (idx < entries.length - 1) {
      setCurrentIdx(idx + 1);
    }
  };

  const gotoReview = () => setStep('review');

  const submitCounts = () => {
    const updates = entries
      .filter(e => e.confirmed && e.counted !== '')
      .map(e => ({ itemId: e.item.id, newOnHand: parseInt(e.counted, 10) }))
      .filter(u => !isNaN(u.newOnHand));
    onCountsSubmitted(updates);
    showToast(`Counts submitted: ${updates.length} items updated`);
    onClose();
  };

  const confirmedCount = entries.filter(e => e.confirmed).length;
  const varianceItems = entries.filter(e => {
    const c = parseInt(e.counted, 10);
    return e.confirmed && !isNaN(c) && Math.abs(c - e.item.onHand) > 0;
  });

  // Group entries by department for the count view
  const entriesByDept = useMemo(() => {
    const map = new Map<string, { entry: CountEntry; idx: number }[]>();
    entries.forEach((entry, idx) => {
      const dept = entry.item.department;
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push({ entry, idx });
    });
    return map;
  }, [entries]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Count worksheet</h2>
              <p className="text-xs text-gray-500">
                {step === 'select' && 'Select departments to count'}
                {step === 'count' && `${confirmedCount} of ${entries.length} counted`}
                {step === 'review' && `${varianceItems.length} variance${varianceItems.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Select departments */}
          {step === 'select' && (
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">Pick the departments you want to count. Items will be grouped by aisle for an easy walk-through.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {departments.map(([dept, count]) => {
                  const selected = selectedDepts.has(dept);
                  return (
                    <button
                      key={dept}
                      onClick={() => toggleDept(dept)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                        selected ? 'border-modisoft-turquoise bg-modisoft-turquoise/5 ring-1 ring-modisoft-turquoise' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${selected ? 'text-modisoft-teal' : 'text-gray-700'}`}>{dept}</p>
                        <p className="text-[10px] text-gray-400">{count} item{count !== 1 ? 's' : ''}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-modisoft-teal" />}
                    </button>
                  );
                })}
              </div>
              {selectedDepts.size > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  {items.filter(i => selectedDepts.has(i.department)).length} items to count across {selectedDepts.size} department{selectedDepts.size !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Count items — walk-through */}
          {step === 'count' && (
            <div className="px-6 py-4">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-semibold text-gray-700">{confirmedCount}/{entries.length}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-modisoft-turquoise rounded-full transition-all"
                    style={{ width: `${(confirmedCount / entries.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Grouped list */}
              {Array.from(entriesByDept.entries()).map(([dept, items]) => (
                <div key={dept} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 sticky top-0 bg-white py-1">{dept}</p>
                  <div className="space-y-1">
                    {items.map(({ entry, idx }) => {
                      const isCurrent = idx === currentIdx;
                      const countedVal = parseInt(entry.counted, 10);
                      const hasVariance = entry.confirmed && !isNaN(countedVal) && countedVal !== entry.item.onHand;
                      const variance = !isNaN(countedVal) ? countedVal - entry.item.onHand : 0;
                      return (
                        <div
                          key={entry.item.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isCurrent ? 'bg-modisoft-turquoise/10 ring-1 ring-modisoft-turquoise' :
                            entry.confirmed ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => setCurrentIdx(idx)}
                        >
                          {/* Status indicator */}
                          <div className="flex-shrink-0">
                            {entry.confirmed ? (
                              hasVariance ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              )
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 ${isCurrent ? 'border-modisoft-turquoise' : 'border-gray-300'}`} />
                            )}
                          </div>

                          {/* Item info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${entry.confirmed ? 'text-gray-500' : 'text-modisoft-blue'}`}>{entry.item.name}</p>
                            <p className="text-[10px] text-gray-400">Expected: {entry.item.onHand}</p>
                          </div>

                          {/* Count input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              placeholder="Count"
                              value={entry.counted}
                              onChange={e => updateCounted(idx, e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && entry.counted !== '') confirmEntry(idx);
                              }}
                              className={`w-20 px-2 py-1 text-sm text-right border rounded-lg focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise ${
                                entry.confirmed ? 'bg-gray-50 border-gray-200' : 'border-gray-300'
                              }`}
                            />
                            {!entry.confirmed ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); confirmEntry(idx); }}
                                disabled={entry.counted === ''}
                                className="p-1.5 bg-modisoft-turquoise hover:bg-modisoft-teal text-white rounded-lg disabled:opacity-30 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            ) : hasVariance ? (
                              <span className={`text-xs font-bold min-w-[40px] text-right ${variance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {variance > 0 ? '+' : ''}{variance}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-500 min-w-[40px] text-right">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Review variances */}
          {step === 'review' && (
            <div className="px-6 py-5">
              {varianceItems.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-lg font-bold text-gray-900">All counts match!</p>
                  <p className="text-sm text-gray-500 mt-1">No variances detected. Your inventory is accurate.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">Review the differences below before submitting.</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Item</th>
                        <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Expected</th>
                        <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Counted</th>
                        <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Variance</th>
                        <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Cost Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {varianceItems.map(entry => {
                        const counted = parseInt(entry.counted, 10);
                        const diff = counted - entry.item.onHand;
                        const costImpact = diff * entry.item.cost;
                        return (
                          <tr key={entry.item.id} className="border-b border-gray-50">
                            <td className="py-2.5">
                              <p className="text-xs font-medium text-modisoft-blue">{entry.item.name}</p>
                              <p className="text-[10px] text-gray-400">{entry.item.department}</p>
                            </td>
                            <td className="py-2.5 text-xs text-gray-600 text-right">{entry.item.onHand}</td>
                            <td className="py-2.5 text-xs font-semibold text-gray-900 text-right">{counted}</td>
                            <td className={`py-2.5 text-xs font-bold text-right ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </td>
                            <td className={`py-2.5 text-xs font-semibold text-right ${costImpact > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="py-2.5 text-xs font-semibold text-gray-700">Total impact</td>
                        <td className="py-2.5 text-xs font-bold text-right">
                          {(() => {
                            const total = varianceItems.reduce((s, e) => s + parseInt(e.counted, 10) - e.item.onHand, 0);
                            return <span className={total >= 0 ? 'text-emerald-600' : 'text-red-600'}>{total > 0 ? '+' : ''}{total} units</span>;
                          })()}
                        </td>
                        <td className="py-2.5 text-xs font-bold text-right">
                          {(() => {
                            const total = varianceItems.reduce((s, e) => s + (parseInt(e.counted, 10) - e.item.onHand) * e.item.cost, 0);
                            return <span className={total >= 0 ? 'text-emerald-600' : 'text-red-600'}>{total > 0 ? '+' : ''}${Math.abs(total).toFixed(2)}</span>;
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          {step === 'select' && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-gray-500 text-sm font-semibold hover:text-gray-700 transition-colors">Cancel</button>
              <button
                onClick={startCounting}
                disabled={selectedDepts.size === 0}
                className="flex items-center gap-1.5 px-6 py-2 bg-modisoft-teal hover:bg-modisoft-blue text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                Start counting <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 'count' && (
            <>
              <button onClick={() => setStep('select')} className="px-4 py-2 text-gray-500 text-sm font-semibold hover:text-gray-700 transition-colors">Back</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{confirmedCount} of {entries.length} counted</span>
                <button
                  onClick={gotoReview}
                  disabled={confirmedCount === 0}
                  className="flex items-center gap-1.5 px-6 py-2 bg-modisoft-teal hover:bg-modisoft-blue text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  Review <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          {step === 'review' && (
            <>
              <button onClick={() => setStep('count')} className="px-4 py-2 text-gray-500 text-sm font-semibold hover:text-gray-700 transition-colors">Back to count</button>
              <button
                onClick={submitCounts}
                className="flex items-center gap-1.5 px-6 py-2 bg-modisoft-green hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors active:scale-95"
              >
                <Check className="w-4 h-4" /> Submit counts
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
