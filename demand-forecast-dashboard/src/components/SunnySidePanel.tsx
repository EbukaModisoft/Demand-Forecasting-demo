import React, { useRef, useEffect } from 'react';
import { Sparkles, X, ArrowUp, Zap } from 'lucide-react';

interface SunnySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SunnySidePanel: React.FC<SunnySidePanelProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-[400px] bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-300 flex flex-col border-r border-amber-100/50">
        {/* Header */}
        <div className="p-5 border-b border-amber-100/50 flex items-center justify-between bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-base">Sunny AI</h3>
                    <p className="text-xs text-amber-600 font-bold tracking-wide uppercase">Demand Assistant</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full transition-colors group">
                <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-50/50">
            {/* Bot Message */}
            <div className="flex flex-col space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="self-start bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-amber-100 text-gray-700 text-sm leading-relaxed max-w-[90%]">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                         <Sparkles className="w-3 h-3" />
                         <span>Insight</span>
                    </div>
                    <p>Hi! I noticed a <span className="font-bold text-orange-600">heat wave</span> incoming this weekend (90°F+). Should I mimic the sales pattern from July 2024?</p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium ml-2">10:42 AM</span>
            </div>
            
             {/* User Message */}
             <div className="flex flex-col space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <div className="self-end bg-gray-900 p-4 rounded-2xl rounded-tr-none shadow-md max-w-[90%] text-white text-sm leading-relaxed">
                    <p>Yes, apply that pattern to Beverages and Ice Cream categories.</p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium mr-2 self-end">10:43 AM</span>
            </div>

            {/* Bot Message (Action) */}
            <div className="flex flex-col space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                <div className="self-start bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-amber-100 text-gray-700 text-sm leading-relaxed max-w-[90%]">
                     <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                         <Zap className="w-3 h-3" />
                         <span>Updated</span>
                    </div>
                    <p className="mb-3">Done. I've updated the forecast models.</p>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-emerald-800">Beverages</span>
                            <span className="text-xs font-bold text-emerald-600">+12%</span>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-1.5 mb-2">
                             <div className="bg-emerald-500 h-1.5 rounded-full w-[12%]"></div>
                        </div>
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-emerald-800">Ice Cream</span>
                            <span className="text-xs font-bold text-emerald-600">+8.5%</span>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-1.5">
                             <div className="bg-emerald-500 h-1.5 rounded-full w-[8.5%]"></div>
                        </div>
                    </div>
                </div>
                 <span className="text-[10px] text-gray-400 font-medium ml-2">10:43 AM</span>
            </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
            <div className="relative group">
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Ask Sunny a question..." 
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all shadow-inner group-hover:bg-white"
                />
                <button className="absolute right-2 top-2 p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white shadow-md shadow-orange-200 hover:shadow-lg hover:scale-105 transition-all active:scale-95">
                    <ArrowUp className="w-4 h-4" />
                </button>
            </div>
            <div className="mt-3 text-center">
                 <p className="text-[10px] text-gray-400">Sunny can make mistakes. Please check important info.</p>
            </div>
        </div>
    </div>
  );
};
