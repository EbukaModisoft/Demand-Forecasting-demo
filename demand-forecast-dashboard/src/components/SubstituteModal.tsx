import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, CheckCircle2, Package } from 'lucide-react';

interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryData: { category: string } | null;
}

const SUBSTITUTES: Record<string, { id: string; name: string; stock: number; matchScore: number }[]> = {
  'Dairy': [
    { id: 'd1', name: 'Standard Whole Milk (Store Brand)', stock: 145, matchScore: 92 },
    { id: 'd2', name: 'Oat Milk / Almond Milk', stock: 88, matchScore: 75 }
  ],
  'Produce': [
    { id: 'p1', name: 'Frozen Mixed Vegetables', stock: 210, matchScore: 85 },
    { id: 'p2', name: 'Canned Fruit Assortment', stock: 150, matchScore: 60 }
  ],
  'Bakery': [
    { id: 'b1', name: 'Packaged Sliced Bread', stock: 120, matchScore: 88 },
    { id: 'b2', name: 'Tortillas & Crackers', stock: 300, matchScore: 65 }
  ]
};

export const SubstituteModal: React.FC<SubstituteModalProps> = ({ isOpen, onClose, categoryData }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryData && SUBSTITUTES[categoryData.category]) {
      setSelectedId(SUBSTITUTES[categoryData.category][0].id);
    }
  }, [categoryData]);

  if (!isOpen || !categoryData) return null;

  const options = SUBSTITUTES[categoryData.category] || SUBSTITUTES['Dairy'];

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
            <div className="w-8 h-8 rounded-full bg-modisoft-blue/10 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-modisoft-blue" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Substitute: {categoryData.category}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Select an in-stock alternative to promote while waiting for the next {categoryData.category} delivery.
          </p>

          <div className="space-y-3">
            {options.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedId === option.id
                    ? 'border-modisoft-blue bg-modisoft-blue/5 ring-1 ring-modisoft-blue'
                    : 'border-gray-200 hover:border-modisoft-blue/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{option.name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Package className="w-3.5 h-3.5" />
                        {option.stock} in stock
                      </span>
                      <span className="text-modisoft-blue font-medium">
                        {option.matchScore}% match
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedId === option.id ? 'border-modisoft-blue bg-modisoft-blue' : 'border-gray-300'
                  }`}>
                    {selectedId === option.id && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            ))}
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
            disabled={isSubmitting || !selectedId}
            className="px-4 py-2 text-sm font-medium text-white bg-modisoft-blue hover:bg-modisoft-blue/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? 'Processing...' : 'Promote Substitute'}
          </button>
        </div>
      </div>
    </div>
  );
};
