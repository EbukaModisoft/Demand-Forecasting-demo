'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart, X, Plus, Minus, Printer, Send, Trash2, Search } from 'lucide-react';
import type { InventoryItem } from '../types';

export interface OrderLine {
  item: InventoryItem;
  qty: number;
  cases: number;
}

interface ItemOrderBuilderProps {
  items: InventoryItem[];
  initialOrders?: OrderLine[];
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function ItemOrderBuilder({ items, initialOrders = [], onClose, showToast }: ItemOrderBuilderProps) {
  const [orderLines, setOrderLines] = useState<OrderLine[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(initialOrders.length === 0);

  const addableItems = useMemo(() => {
    const idsInOrder = new Set(orderLines.map(l => l.item.id));
    let pool = items.filter(i => !idsInOrder.has(i.id));
    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter(i => i.name.toLowerCase().includes(q) || i.department.toLowerCase().includes(q));
    }
    return pool;
  }, [items, orderLines, search]);

  const addItem = (item: InventoryItem) => {
    const suggestedQty = Math.max(0, item.parLevel - item.onHand);
    const cases = item.caseSize ? Math.ceil(suggestedQty / item.caseSize) : 1;
    const qty = item.caseSize ? cases * item.caseSize : suggestedQty;
    setOrderLines(prev => [...prev, { item, qty, cases }]);
  };

  const updateQty = (idx: number, delta: number) => {
    setOrderLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      const caseSize = line.item.caseSize || 1;
      const newCases = Math.max(1, line.cases + delta);
      return { ...line, cases: newCases, qty: newCases * caseSize };
    }));
  };

  const setCases = (idx: number, casesStr: string) => {
    const cases = parseInt(casesStr, 10);
    if (isNaN(cases) || cases < 0) return;
    setOrderLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      const caseSize = line.item.caseSize || 1;
      return { ...line, cases, qty: cases * caseSize };
    }));
  };

  const removeLine = (idx: number) => setOrderLines(prev => prev.filter((_, i) => i !== idx));

  const totalCost = orderLines.reduce((sum, l) => sum + l.qty * l.item.cost, 0);
  const totalUnits = orderLines.reduce((sum, l) => sum + l.qty, 0);
  const totalCases = orderLines.reduce((sum, l) => sum + l.cases, 0);

  const handleSubmit = () => {
    showToast(`PO submitted: ${orderLines.length} items, ${totalCases} cases, $${totalCost.toFixed(2)} total`);
    onClose();
  };

  // Group order lines by vendor
  const linesByVendor = useMemo(() => {
    const map = new Map<string, OrderLine[]>();
    for (const line of orderLines) {
      const v = line.item.vendor || 'Unassigned';
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(line);
    }
    return map;
  }, [orderLines]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-modisoft-teal/5 to-modisoft-turquoise/5">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-modisoft-teal" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Purchase order builder</h2>
              <p className="text-xs text-gray-500">{orderLines.length} items &bull; {totalCases} cases &bull; ${totalCost.toFixed(2)} est. cost</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Order lines grouped by vendor */}
          {orderLines.length > 0 && (
            <div className="px-6 py-4">
              {Array.from(linesByVendor.entries()).map(([vendor, lines]) => (
                <div key={vendor} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{vendor}</p>
                  <div className="space-y-1">
                    {lines.map(line => {
                      const idx = orderLines.indexOf(line);
                      return (
                        <div key={line.item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-modisoft-blue truncate">{line.item.name}</p>
                            <p className="text-[10px] text-gray-400">{line.item.department} &bull; ${line.item.cost.toFixed(2)}/ea {line.item.caseSize ? `&bull; ${line.item.caseSize}/case` : ''}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(idx, -1)} className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors">
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={line.cases}
                              onChange={e => setCases(idx, e.target.value)}
                              className="w-12 text-center text-sm font-semibold border border-gray-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
                            />
                            <button onClick={() => updateQty(idx, 1)} className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors">
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                            <span className="text-[10px] text-gray-400 w-10">cases</span>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-xs font-semibold text-gray-900">{line.qty} units</p>
                            <p className="text-[10px] text-gray-400">${(line.qty * line.item.cost).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => removeLine(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add items panel */}
          {showAddPanel && (
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Add items</p>
                {orderLines.length > 0 && (
                  <button onClick={() => setShowAddPanel(false)} className="text-xs text-gray-400 hover:text-gray-600">Done adding</button>
                )}
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items to add..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {addableItems.slice(0, 20).map(item => {
                  const suggestedQty = Math.max(0, item.parLevel - item.onHand);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-modisoft-turquoise/5 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.department} &bull; On hand: {item.onHand} &bull; Par: {item.parLevel}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {suggestedQty > 0 && <span className="text-[10px] text-modisoft-teal font-semibold">need {suggestedQty}</span>}
                        <Plus className="w-4 h-4 text-modisoft-teal" />
                      </div>
                    </button>
                  );
                })}
                {addableItems.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">All items added or no matches</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-bold text-gray-900">{totalUnits} units</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="font-bold text-gray-900">{totalCases} cases</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="font-bold text-modisoft-teal">${totalCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!showAddPanel && (
              <button
                onClick={() => setShowAddPanel(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Add items
              </button>
            )}
            <button
              onClick={() => showToast('PO sent to printer')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <div className="flex-1" />
            <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={orderLines.length === 0}
              className="flex items-center gap-1.5 px-6 py-2 bg-modisoft-teal hover:bg-modisoft-blue text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Send className="w-4 h-4" /> Submit PO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
