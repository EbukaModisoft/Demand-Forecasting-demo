import React, { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, TrendingUp, MoreHorizontal } from 'lucide-react';
import { ItemRow, Department } from '../types';

interface TopItemsTableProps {
  items: ItemRow[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (p: number) => void;
  onEditScenario: (item: ItemRow) => void;
  onTogglePromo: (id: string) => void;
}

export const TopItemsTable: React.FC<TopItemsTableProps> = ({ 
  items, total, loading, page, setPage, onEditScenario, onTogglePromo 
}) => {
  const itemsPerPage = 8;
  const totalPages = Math.ceil(total / itemsPerPage);

  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatNum = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-gray-950/5">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
             <h3 className="font-bold text-gray-900 text-sm tracking-tight">Top Items Forecast</h3>
             <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">Next 14 Days</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-600"
                />
            </div>
            <button className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 relative bg-white">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-[1px]">
             <div className="flex flex-col items-center gap-2">
                 <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-xs font-medium text-gray-500">Updating forecasts...</span>
             </div>
          </div>
        )}
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider">Item Name</th>
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider">Dept</th>
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider text-right">Fcst Revenue</th>
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider text-right">Fcst Units</th>
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider text-center">Promo</th>
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider text-right">Price</th>
              <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/80">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-5 py-3 text-sm font-semibold text-gray-900 max-w-[180px] truncate" title={item.name}>
                    {item.name}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border
                    ${item.department === 'Grocery' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                      item.department === 'Snacks' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      item.department === 'Beverages' ? 'bg-sky-50 text-sky-700 border-sky-100' : 
                      'bg-gray-50 text-gray-700 border-gray-100'}`}>
                    {item.department}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{formatMoney(item.forecastRevenue)}</span>
                        {/* Fake trend for visual fidelity */}
                        <div className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                             <TrendingUp className="w-2.5 h-2.5" />
                             <span>{Math.floor(Math.random() * 5) + 2}%</span>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-3 text-right">
                    <span className="text-sm font-medium text-gray-600 tabular-nums">{formatNum(item.forecastUnits)}</span>
                </td>
                <td className="px-5 py-3 text-center">
                    <button 
                      onClick={() => onTogglePromo(item.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none shadow-sm ${item.isPromoActive ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${item.isPromoActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                </td>
                <td className="px-5 py-3 text-right text-xs font-mono font-medium text-gray-500">${item.price.toFixed(2)}</td>
                <td className="px-5 py-3 text-center">
                  <button 
                    onClick={() => onEditScenario(item)}
                    className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 hover:shadow-sm text-gray-400 hover:text-indigo-600 transition-all"
                    title="Edit Scenario"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
                 <tr>
                 <td colSpan={7} className="px-6 py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <span className="text-sm font-medium">No items found</span>
                 </td>
                 </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/50 text-xs">
         <span className="text-gray-500 font-medium">
             Showing page <span className="text-gray-900">{page}</span> of <span className="text-gray-900">{totalPages || 1}</span>
         </span>
         <div className="flex space-x-2">
            <button 
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded shadow-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:border-gray-300"
            >
                Previous
            </button>
             <button 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded shadow-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:border-gray-300"
            >
                Next
            </button>
         </div>
      </div>
    </div>
  );
};

