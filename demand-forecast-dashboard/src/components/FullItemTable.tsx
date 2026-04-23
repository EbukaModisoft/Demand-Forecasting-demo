'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Edit3, Check, X, Filter, Sparkles, ScanBarcode, AlertTriangle, Printer } from 'lucide-react';
import type { InventoryItem } from '../types';

interface FullItemTableProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onCountUpdate: (itemId: string, newOnHand: number) => void;
  onParUpdate: (itemId: string, newPar: number) => void;
  onAddToOrder: (item: InventoryItem) => void;
  showToast: (msg: string) => void;
}

type SortField = 'name' | 'department' | 'onHand' | 'parLevel' | 'reorderPoint' | 'daysOfSupply' | 'lastCountDate' | 'vendor' | 'coverageStatus' | 'cost';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG = {
  covered: { label: 'OK', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  low_stock: { label: 'Low', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  used_up: { label: 'Out', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function FullItemTable({ items, onItemClick, onCountUpdate, onParUpdate, onAddToOrder, showToast }: FullItemTableProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingParId, setEditingParId] = useState<string | null>(null);
  const [editParValue, setEditParValue] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const departments = useMemo(() => {
    const depts = new Set(items.map(i => i.department));
    return Array.from(depts).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.department.toLowerCase().includes(q) ||
        (i.vendor && i.vendor.toLowerCase().includes(q)) ||
        (i.upc && i.upc.includes(q))
      );
    }
    if (deptFilter !== 'all') {
      result = result.filter(i => i.department === deptFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.coverageStatus === statusFilter);
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === 'string' && typeof bv === 'string') cmp = av.localeCompare(bv);
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [items, search, deptFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-modisoft-teal ml-1" /> : <ChevronDown className="w-3 h-3 text-modisoft-teal ml-1" />;
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValue(String(item.onHand));
  };

  const commitEdit = (item: InventoryItem) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= 0) {
      onCountUpdate(item.id, val);
      showToast(`${item.name} on-hand updated to ${val}`);
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const startParEdit = (item: InventoryItem) => {
    setEditingParId(item.id);
    setEditParValue(String(item.parLevel));
  };

  const commitParEdit = (item: InventoryItem) => {
    const val = parseInt(editParValue, 10);
    if (!isNaN(val) && val >= 0) {
      onParUpdate(item.id, val);
      showToast(`${item.name} par level updated to ${val}`);
    }
    setEditingParId(null);
  };

  const cancelParEdit = () => setEditingParId(null);

  const lowStockCount = items.filter(i => i.coverageStatus !== 'covered').length;

  // Barcode lookup: detect exact UPC match
  const upcMatch = useMemo(() => {
    if (!search) return null;
    const q = search.trim();
    return items.find(i => i.upc && i.upc === q) ?? null;
  }, [items, search]);

  // Variance: days since last count
  const daysSinceCount = (dateStr: string): number => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Print label handler
  const handlePrintLabel = (item: InventoryItem) => {
    const win = window.open('', '_blank', 'width=400,height=300');
    if (!win) { showToast('Pop-up blocked — please allow pop-ups to print labels'); return; }
    win.document.write(`
      <html><head><title>Label — ${item.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; text-align: center; }
        .name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .dept { font-size: 12px; color: #666; margin-bottom: 12px; }
        .price { font-size: 28px; font-weight: bold; margin: 12px 0; }
        .upc { font-size: 14px; letter-spacing: 3px; font-family: monospace; margin: 8px 0; }
        .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 48px; margin: 8px 0; }
        @media print { body { padding: 12px; } }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
      </head><body>
        <div class="name">${item.name}</div>
        <div class="dept">${item.department}${item.vendor ? ' • ' + item.vendor : ''}</div>
        <div class="price">$${item.price.toFixed(2)}</div>
        ${item.upc ? `<div class="barcode">${item.upc}</div><div class="upc">${item.upc}</div>` : '<div style="color:#999;font-size:12px">No UPC</div>'}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  // ABC classification: A = top 20% revenue, B = next 30%, C = bottom 50%
  const abcMap = useMemo(() => {
    const sorted = [...items]
      .map(i => ({ id: i.id, revenue: i.price * i.forecastNeed }))
      .sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = sorted.reduce((sum, i) => sum + i.revenue, 0);
    const map: Record<string, 'A' | 'B' | 'C'> = {};
    let cumulative = 0;
    for (const item of sorted) {
      cumulative += item.revenue;
      const pct = cumulative / totalRevenue;
      if (pct <= 0.8) map[item.id] = 'A'; // top items contributing to 80% of revenue
      else if (pct <= 0.95) map[item.id] = 'B';
      else map[item.id] = 'C';
    }
    return map;
  }, [items]);

  const ABC_CONFIG = {
    A: { label: 'A', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', title: 'Top revenue driver' },
    B: { label: 'B', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', title: 'Moderate revenue' },
    C: { label: 'C', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', title: 'Low revenue — review stocking' },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Full item inventory</h2>
            <p className="text-xs text-gray-500">{items.length} items &bull; {lowStockCount} need attention &bull; <span className="inline-flex items-center gap-0.5"><span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">A</span><span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-300">B</span><span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold bg-gray-100 text-gray-500 border border-gray-300">C</span></span> = revenue rank</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showFilters ? 'bg-modisoft-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {(deptFilter !== 'all' || statusFilter !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-modisoft-yellow" />
            )}
          </button>
        </div>

        {/* Search with barcode lookup */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items, departments, vendors, or scan/type UPC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-10 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise/40 focus:border-modisoft-turquoise ${upcMatch ? 'border-modisoft-turquoise bg-modisoft-turquoise/5' : 'border-gray-200'}`}
          />
          <ScanBarcode className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${upcMatch ? 'text-modisoft-teal' : 'text-gray-300'}`} />
        </div>
        {upcMatch && (
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-modisoft-turquoise/10 border border-modisoft-turquoise/30 rounded-lg">
            <ScanBarcode className="w-3.5 h-3.5 text-modisoft-teal flex-shrink-0" />
            <span className="text-xs text-modisoft-blue font-semibold">UPC match:</span>
            <span className="text-xs text-gray-700">{upcMatch.name}</span>
            <span className="text-[10px] text-gray-400">({upcMatch.department})</span>
            <span className="text-[10px] text-gray-400 ml-auto">On hand: {upcMatch.onHand}</span>
          </div>
        )}

        {/* Filter chips */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
            >
              <option value="all">All departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
            >
              <option value="all">All statuses</option>
              <option value="covered">OK</option>
              <option value="low_stock">Low stock</option>
              <option value="used_up">Out / Used up</option>
            </select>
            {(deptFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setDeptFilter('all'); setStatusFilter('all'); }}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left pl-5 pr-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <span className="flex items-center">Item <SortIcon field="name" /></span>
              </th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('department')}>
                <span className="flex items-center">Dept <SortIcon field="department" /></span>
              </th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('onHand')}>
                <span className="flex items-center justify-end">On Hand <SortIcon field="onHand" /></span>
              </th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('parLevel')}>
                <span className="flex items-center justify-end">Par <SortIcon field="parLevel" /></span>
              </th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('reorderPoint')}>
                <span className="flex items-center justify-end">Reorder <SortIcon field="reorderPoint" /></span>
              </th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('daysOfSupply')}>
                <span className="flex items-center justify-end">Days <SortIcon field="daysOfSupply" /></span>
              </th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('cost')}>
                <span className="flex items-center justify-end">Cost <SortIcon field="cost" /></span>
              </th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('vendor')}>
                <span className="flex items-center">Vendor <SortIcon field="vendor" /></span>
              </th>
              <th className="text-center px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('lastCountDate')}>
                <span className="flex items-center justify-center">Last Count <SortIcon field="lastCountDate" /></span>
              </th>
              <th className="text-center px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase cursor-pointer select-none" onClick={() => toggleSort('coverageStatus')}>
                <span className="flex items-center justify-center">Status <SortIcon field="coverageStatus" /></span>
              </th>
              <th className="text-right pr-5 pl-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="text-center py-8 text-sm text-gray-400">No items match your search</td></tr>
            )}
            {filtered.map(item => {
              const cfg = STATUS_CONFIG[item.coverageStatus];
              const isEditing = editingId === item.id;
              const fillPct = Math.min(100, Math.round((item.onHand / item.parLevel) * 100));
              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                >
                  <td
                    className="pl-5 pr-2 py-2.5 cursor-pointer"
                    onClick={() => onItemClick(item)}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-modisoft-blue truncate max-w-[160px]">{item.name}</p>
                      {(() => {
                        const abc = abcMap[item.id];
                        const cfg2 = abc ? ABC_CONFIG[abc] : null;
                        return cfg2 ? (
                          <span title={cfg2.title} className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${cfg2.bg} ${cfg2.text} border ${cfg2.border} flex-shrink-0 cursor-help`}>
                            {cfg2.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {item.upc && <p className="text-[10px] text-gray-400">{item.upc}</p>}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-500">{item.department}</td>
                  <td className="px-2 py-2.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(item);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-16 px-2 py-0.5 text-xs text-right border border-modisoft-turquoise rounded focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
                          autoFocus
                        />
                        <button onClick={() => commitEdit(item)} className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="p-0.5 text-red-500 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12">
                          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${fillPct >= 60 ? 'bg-modisoft-turquoise' : fillPct >= 30 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 min-w-[28px] text-right">{item.onHand}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-modisoft-teal hover:bg-modisoft-turquoise/10 rounded transition-all"
                          title="Adjust count"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    {editingParId === item.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editParValue}
                          onChange={e => setEditParValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitParEdit(item);
                            if (e.key === 'Escape') cancelParEdit();
                          }}
                          className="w-16 px-2 py-0.5 text-xs text-right border border-modisoft-turquoise rounded focus:outline-none focus:ring-1 focus:ring-modisoft-turquoise"
                          autoFocus
                        />
                        <button onClick={() => commitParEdit(item)} className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelParEdit} className="p-0.5 text-red-500 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-gray-500">{item.parLevel}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); startParEdit(item); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-modisoft-teal hover:bg-modisoft-turquoise/10 rounded transition-all"
                          title="Adjust par level"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-right">
                    <span className="flex items-center justify-end gap-1">
                      <span className="text-gray-500">{item.reorderPoint}</span>
                      {item.mlAdjusted && (
                        <span title="ML-adjusted reorder point based on demand patterns" className="cursor-help">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-right">
                    <span className={`font-medium ${item.daysOfSupply <= 1 ? 'text-red-600' : item.daysOfSupply <= 2 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {item.daysOfSupply}d
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-500 text-right">${item.cost.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-xs text-gray-500 truncate max-w-[110px] hidden lg:table-cell">{item.vendor ?? '—'}</td>
                  {/* Last Count + Variance Alert */}
                  <td className="px-2 py-2.5 text-center">
                    {(() => {
                      const days = daysSinceCount(item.lastCountDate);
                      const dateLabel = new Date(item.lastCountDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-gray-500">{dateLabel}</span>
                          {days >= 14 && (
                            <span title={`Last counted ${days} days ago — overdue`} className="cursor-help">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            </span>
                          )}
                          {days >= 7 && days < 14 && (
                            <span title={`Last counted ${days} days ago — getting stale`} className="cursor-help">
                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="pr-5 pl-2 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.coverageStatus !== 'covered' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddToOrder(item); }}
                          className="px-2.5 py-1 bg-modisoft-turquoise hover:bg-modisoft-teal text-white rounded-lg text-[10px] font-semibold transition-colors active:scale-95"
                        >
                          + Order
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrintLabel(item); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-modisoft-teal hover:bg-modisoft-turquoise/10 rounded transition-all"
                        title="Print shelf label"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Showing {filtered.length} of {items.length} items</span>
        <span>Total inventory value: <strong className="text-gray-900">${items.reduce((sum, i) => sum + i.cost * i.onHand, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
      </div>
    </div>
  );
}
