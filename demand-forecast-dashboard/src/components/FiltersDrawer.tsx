import React, { useState } from 'react';
import { X, Check, Filter } from 'lucide-react';
import { Department } from '../types';

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (depts: Department[]) => void;
}

const DEPARTMENTS: Department[] = ['Grocery', 'Snacks', 'Beverages', 'Household', 'Personal Care'];

export const FiltersDrawer: React.FC<FiltersDrawerProps> = ({ isOpen, onClose, onApply }) => {
  const [selectedDepts, setSelectedDepts] = useState<Department[]>([]);

  const toggleDept = (d: Department) => {
    if (selectedDepts.includes(d)) {
      setSelectedDepts(selectedDepts.filter(x => x !== d));
    } else {
      setSelectedDepts([...selectedDepts, d]);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 ring-1 ring-gray-950/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            Display Filters
         </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Department</h4>
            <div className="space-y-3">
              {DEPARTMENTS.map(dept => (
                <label key={dept} className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-lg -mx-2 transition-colors">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${selectedDepts.includes(dept) ? 'bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200' : 'border-gray-300 group-hover:border-indigo-300 bg-white'}`}>
                    {selectedDepts.includes(dept) && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={selectedDepts.includes(dept)}
                    onChange={() => toggleDept(dept)} 
                  />
                  <span className={`text-sm font-medium transition-colors ${selectedDepts.includes(dept) ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{dept}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-6 opacity-60">
             <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Region</h4>
             <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <span className="text-xs font-medium text-gray-400">All Regions (Default)</span>
             </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex space-x-3 bg-gray-50/50">
          <button onClick={() => { setSelectedDepts([]); onApply([]); onClose(); }} className="flex-1 py-2.5 text-sm font-bold text-gray-600 hover:bg-white hover:text-gray-800 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            Reset
          </button>
          <button onClick={() => { onApply(selectedDepts); onClose(); }} className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
