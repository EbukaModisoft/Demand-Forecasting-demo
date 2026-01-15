import React, { useState } from 'react';
import { Filter, Calendar, Search } from 'lucide-react';

interface TopControlsProps {
  showExplain: boolean;
  setShowExplain: (val: boolean) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onOpenFilters: () => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
}

export const TopControls: React.FC<TopControlsProps> = ({ 
  showExplain, setShowExplain, searchTerm, setSearchTerm, onOpenFilters, dateRange, setDateRange
}) => {
  // Mock lightweight date picker trigger
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-6 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-20 border-b border-gray-200/50 -mx-6 px-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range - Mock implementation */}
        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:border-gray-300 transition-colors group">
          <Calendar className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
          <span className="text-sm text-gray-700 font-medium font-mono">
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </span>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* Toggle Switch */}
        <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => setShowExplain(!showExplain)}>
           <span className="text-sm font-medium text-gray-700 select-none">Explain changes</span>
           <button 
             className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none ${showExplain ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-gray-300'}`}
           >
             <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${showExplain ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
           </button>
        </div>

        {/* Search Input */}
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filter by item name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 shadow-sm transition-all"
          />
        </div>
      </div>

      <div>
        <button 
          onClick={onOpenFilters}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-[0.98]"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
};
