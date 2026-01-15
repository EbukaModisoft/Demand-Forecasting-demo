import React from 'react';
import { Search, Bell, Clock, Sun, ChevronDown, Menu, LayoutGrid } from 'lucide-react';

export const TopNav = () => {
  return (
    <nav className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        {/* Modisoft Logo Area */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm bg-gradient-to-tr from-blue-700 to-blue-500">M</div>
          <span className="text-gray-900 font-bold text-lg tracking-tight hidden md:block">Modisoft</span>
        </div>
        
        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

        {/* Business Dropdown */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-all border border-transparent hover:border-gray-200">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">D</div>
          <span className="text-sm font-medium text-gray-700">Downtown Market</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Global Search */}
        <div className="relative hidden lg:block group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search modules..." 
            className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="text-sm font-medium text-gray-500 hover:text-gray-900 px-2 py-1 transition-colors">What's New</button>
        
        {/* Clock In Pill */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>Clock In</span>
        </button>

        {/* Sunny Button */}
        <button className="p-2 text-amber-500 hover:bg-amber-50 rounded-full transition-colors relative group">
          <Sun className="w-5 h-5 fill-amber-100" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </button>

        {/* User Profile */}
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 cursor-pointer hover:ring-gray-200 transition-all">
          JD
        </div>
      </div>
    </nav>
  );
};
