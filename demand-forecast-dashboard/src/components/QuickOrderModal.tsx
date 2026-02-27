import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, AlertCircle, TrendingUp } from 'lucide-react';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryData: { category: string; expected: number; stock: number } | null;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({ isOpen, onClose, categoryData }) => {
  const [orderQty, setOrderQty] = useState(0);
  const [supplier, setSupplier] = useState('primary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryData) {
      const shortfall = Math.max(0, categoryData.expected - categoryData.stock);
      const safetyStock = Math.round(categoryData.expected * 0.2); // 20% safety margin
      setOrderQty(shortfall + safetyStock);
    }
  }, [categoryData]);

  if (!isOpen || !categoryData) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-modisoft-turquoise/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-modisoft-teal" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Order: {categoryData.category}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Context Alert */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Stockout Risk Detected</h4>
              <p className="text-sm text-amber-700 mt-1">
                Expected demand ({categoryData.expected} units) exceeds current stock ({categoryData.stock} units) for the next 48 hours.
              </p>
            </div>
          </div>

          {/* Order Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Quantity</label>
              <div className="relative">
                <input
                  type="number"
                  value={orderQty}
                  onChange={(e) => setOrderQty(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Includes 20% safety stock
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-modisoft-turquoise focus:border-transparent"
              >
                <option value="primary">Primary Distributor (Next Day Delivery)</option>
                <option value="secondary">Local Wholesaler (Same Day, +15% cost)</option>
                <option value="warehouse">Central Warehouse (2-Day Delivery)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-modisoft-turquoise hover:bg-modisoft-teal rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
