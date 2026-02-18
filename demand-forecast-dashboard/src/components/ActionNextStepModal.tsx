'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Send,
  CheckCircle,
  Tag,
  Users,
  Calendar,
  Fuel,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  Percent,
  ChevronRight,
} from 'lucide-react';
import { ActionItem } from '../types';

// ============== TYPES ==============
interface ActionNextStepModalProps {
  action: ActionItem;
  onClose: () => void;
  onComplete: (actionId: string, status: 'accepted' | 'done') => void;
  employees?: { id: string; name: string; phone: string; role: string }[];
}

type ModalStep = 'action' | 'sending' | 'waiting' | 'confirmed';

// ============== COMPONENT ==============
export const ActionNextStepModal: React.FC<ActionNextStepModalProps> = ({
  action,
  onClose,
  onComplete,
  employees = [],
}) => {
  // Common state
  const [step, setStep] = useState<ModalStep>('action');
  const [employeeReply, setEmployeeReply] = useState<string | null>(null);

  // Labor-specific state
  const [selectedEmployee, setSelectedEmployee] = useState(
    action.suggestedEmployee || (employees.length > 0 ? employees[0] : null)
  );
  const [message, setMessage] = useState('');
  const [customMessage, setCustomMessage] = useState(false);

  // Detect downstaff vs upstaff for labor actions
  const isDownstaff = action.type === 'labor' && (
    action.title.toLowerCase().includes('reduce') || 
    action.title.toLowerCase().includes('downstaff') ||
    action.title.toLowerCase().includes('cut hours')
  );

  // Promo/event-specific state
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoType, setPromoType] = useState<'percent_off' | 'bogo' | 'bundle'>('percent_off');
  const [promoDuration, setPromoDuration] = useState<'1_day' | '3_days' | '1_week'>('3_days');
  const [promoItems, setPromoItems] = useState<string>(action.relatedItem || action.relatedCategory || '');

  // Pricing-specific state
  const [priceAdjustment, setPriceAdjustment] = useState(5);

  // Default messages for labor actions (upstaff vs downstaff)
  const defaultMessages = useMemo(() => {
    const name = selectedEmployee?.name?.split(' ')[0] || 'there';
    const date = action.dueDate 
      ? new Date(action.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : 'this upcoming shift';
    
    if (isDownstaff) {
      return [
        `Hi ${name}, we're expecting lower demand on ${date} so we won't need you for that shift. Enjoy the day off!`,
        `Hey ${name}! Heads up — we're overstaffed on ${date}. No need to come in, we've got it covered.`,
        `${name}, forecast is showing a slow day on ${date}. We're going to cut that shift — hope you enjoy the time off!`,
      ];
    }
    return [
      `Hi ${name}, we're expecting higher demand on ${date}. Are you available to pick up a shift?`,
      `Hey ${name}! We could use extra help on ${date}. Let me know if you can come in.`,
      `${name}, would you be able to cover an extra shift on ${date}? We're forecasting a busy day.`,
    ];
  }, [selectedEmployee, action.dueDate, isDownstaff]);

  // Set initial message
  React.useEffect(() => {
    if (action.type === 'labor' && !message) {
      setMessage(defaultMessages[0]);
    }
  }, [action.type, defaultMessages, message]);

  // Possible auto-reply messages (upstaff vs downstaff)
  const replyMessages = useMemo(() => {
    if (isDownstaff) {
      return [
        `Okay, thanks for letting me know! I'll enjoy the day off.`,
        `No worries, appreciate the heads up! See you next shift.`,
        `Got it, thanks! Let me know if anything changes.`,
        `Understood! Have a good one.`,
      ];
    }
    return [
      `Sure thing! I'll be there. Thanks for the heads up!`,
      `Got it, count me in! See you then.`,
      `Yep, I can make it. What time do you need me?`,
      `Sounds good! I'll come in for that shift.`,
    ];
  }, [isDownstaff]);

  // Simulate sending message and getting a response
  const handleSendMessage = () => {
    setEmployeeReply(null);
    setStep('sending');
    setTimeout(() => {
      setStep('waiting');
    }, 1200);
  };

  // Auto-reply after entering 'waiting' step
  React.useEffect(() => {
    if (step !== 'waiting' || employeeReply) return;
    const timer = setTimeout(() => {
      const reply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
      setEmployeeReply(reply);
    }, 2500);
    return () => clearTimeout(timer);
  }, [step, employeeReply, replyMessages]);

  // Auto-advance to confirmed shortly after reply appears
  React.useEffect(() => {
    if (step !== 'waiting' || !employeeReply) return;
    const timer = setTimeout(() => {
      setStep('confirmed');
      setTimeout(() => {
        onComplete(action.id, 'accepted');
      }, 1500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [step, employeeReply, action.id, onComplete]);

  // Simulate employee confirming (manual fallback)
  const handleEmployeeConfirmed = () => {
    setStep('confirmed');
    setTimeout(() => {
      onComplete(action.id, 'accepted');
    }, 1500);
  };

  // Handle promo/event action completion
  const handleApplyPromo = () => {
    setStep('sending');
    setTimeout(() => {
      setStep('confirmed');
      setTimeout(() => {
        onComplete(action.id, 'accepted');
      }, 1500);
    }, 1000);
  };

  // Handle pricing action completion
  const handleApplyPricing = () => {
    setStep('sending');
    setTimeout(() => {
      setStep('confirmed');
      setTimeout(() => {
        onComplete(action.id, 'accepted');
      }, 1500);
    }, 1000);
  };

  // Handle fuel action completion  
  const handleFuelAction = () => {
    setStep('sending');
    setTimeout(() => {
      setStep('confirmed');
      setTimeout(() => {
        onComplete(action.id, 'accepted');
      }, 1500);
    }, 1000);
  };

  // ============== RENDER HELPERS ==============

  const renderLaborModal = () => (
    <div className="space-y-5">
      {step === 'action' && (
        <>
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Employee
            </label>
            {action.suggestedEmployee ? (
              <div className="flex items-center gap-3 p-3 bg-modisoft-blue/10 border border-modisoft-blue/20 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-modisoft-blue flex items-center justify-center text-white font-bold text-sm">
                  {action.suggestedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{action.suggestedEmployee.name}</p>
                  <p className="text-xs text-gray-500">{action.suggestedEmployee.role} • {action.suggestedEmployee.phone}</p>
                </div>
                <span className="px-2 py-1 bg-modisoft-blue/10 text-modisoft-blue text-[10px] font-bold rounded-full uppercase">Suggested</span>
              </div>
            ) : employees.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedEmployee?.name === emp.name 
                        ? 'bg-modisoft-blue/10 border-modisoft-blue/40' 
                        : 'bg-white border-gray-200 hover:border-modisoft-blue/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-xs">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No employees available for this shift.</p>
            )}
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Message
              </label>
              <button 
                onClick={() => setCustomMessage(!customMessage)}
                className="text-xs text-modisoft-blue hover:text-modisoft-blue/80 font-medium"
              >
                {customMessage ? 'Use template' : 'Custom message'}
              </button>
            </div>
            
            {!customMessage ? (
              <div className="space-y-2">
                {defaultMessages.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(msg)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                      message === msg 
                        ? 'bg-modisoft-blue/10 border-modisoft-blue/40 text-gray-900' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-modisoft-blue/20'
                    }`}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-modisoft-blue/20 focus:border-modisoft-blue outline-none resize-none"
                rows={3}
                placeholder="Type your message..."
              />
            )}
          </div>

          {/* Send Options */}
          <div className="flex gap-3">
            <button
              onClick={handleSendMessage}
              disabled={!selectedEmployee || !message}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-modisoft-blue hover:bg-modisoft-blue/90 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Send Text Message
            </button>
          </div>
        </>
      )}

      {step === 'sending' && (
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-modisoft-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Send className="w-6 h-6 text-modisoft-blue" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Sending message...</p>
          <p className="text-sm text-gray-500">
            Texting {selectedEmployee?.name || 'employee'}
          </p>
        </div>
      )}

      {step === 'waiting' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-modisoft-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-modisoft-yellow" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Message Sent!</p>
          <p className="text-sm text-gray-500 mb-6">
            Waiting for {selectedEmployee?.name?.split(' ')[0] || 'employee'} to confirm...
          </p>

          {/* Simulated chat bubble */}
          <div className="mx-auto max-w-sm bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left space-y-3">
            <div className="flex justify-end">
              <div className="bg-modisoft-teal text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm max-w-[80%]">
                {message}
              </div>
            </div>
            {!employeeReply ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>{selectedEmployee?.name?.split(' ')[0]} is typing...</span>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm text-gray-900 px-4 py-2 rounded-2xl rounded-bl-sm text-sm max-w-[80%]">
                  {employeeReply}
                </div>
              </div>
            )}
          </div>

          {!employeeReply && (
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={handleEmployeeConfirmed}
                className="flex items-center gap-2 px-5 py-2.5 bg-modisoft-green hover:bg-modisoft-green/90 text-white rounded-xl font-semibold transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                They Confirmed
              </button>
              <button
                onClick={() => { setEmployeeReply(null); setStep('action'); }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl text-sm font-medium transition-colors"
              >
                Try another employee
              </button>
            </div>
          )}

          {employeeReply && (
            <div className="mt-4 flex items-center justify-center gap-2 text-modisoft-green">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {isDownstaff ? 'Acknowledged — shift cancelled.' : 'Confirmed — marking as accepted...'}
              </span>
            </div>
          )}
        </div>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-modisoft-green/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-modisoft-green" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {isDownstaff ? 'Shift Cancelled' : 'Shift Confirmed!'}
          </p>
          <p className="text-sm text-gray-500">
            {isDownstaff 
              ? `${selectedEmployee?.name} has been notified. Hours saved.`
              : `${selectedEmployee?.name} is coming in. Action marked as accepted.`
            }
          </p>
        </div>
      )}
    </div>
  );

  const renderPromoEventModal = () => (
    <div className="space-y-5">
      {step === 'action' && (
        <>
          {/* Context banner */}
          <div className="p-3 bg-modisoft-turquoise/10 border border-modisoft-turquoise/20 rounded-xl">
            <p className="text-sm text-modisoft-blue">
              <span className="font-semibold">Why: </span>{action.description}
            </p>
          </div>

          {/* Promo Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Promotion Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'percent_off' as const, label: '% Off', icon: <Percent className="w-4 h-4" /> },
                { value: 'bogo' as const, label: 'BOGO', icon: <Tag className="w-4 h-4" /> },
                { value: 'bundle' as const, label: 'Bundle Deal', icon: <Sparkles className="w-4 h-4" /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPromoType(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                    promoType === opt.value 
                      ? 'bg-modisoft-turquoise/10 border-modisoft-turquoise/50 text-modisoft-teal' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-modisoft-turquoise/30'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Amount (for percent_off) */}
          {promoType === 'percent_off' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount: {promoDiscount}%
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={promoDiscount}
                onChange={(e) => setPromoDiscount(Number(e.target.value))}
                className="w-full accent-modisoft-turquoise"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
          )}

          {/* Applicable Items */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Apply To</label>
            <input
              type="text"
              value={promoItems}
              onChange={(e) => setPromoItems(e.target.value)}
              placeholder="e.g., Cold Drinks, Ice Cream, Snacks"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-modisoft-turquoise/20 focus:border-modisoft-turquoise outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
            <div className="flex gap-2">
              {[
                { value: '1_day' as const, label: '1 Day' },
                { value: '3_days' as const, label: '3 Days' },
                { value: '1_week' as const, label: '1 Week' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPromoDuration(opt.value)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                    promoDuration === opt.value 
                      ? 'bg-modisoft-turquoise/10 border-modisoft-turquoise/50 text-modisoft-teal' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-modisoft-turquoise/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expected Impact */}
          <div className="p-3 bg-modisoft-green/10 border border-modisoft-green/20 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-modisoft-green flex-shrink-0" />
            <p className="text-sm text-modisoft-blue">
              Expected impact: <span className="font-bold">{action.expectedValueLabel}</span>
            </p>
          </div>

          <button
            onClick={handleApplyPromo}
            className="w-full flex items-center justify-center gap-2 py-3 bg-modisoft-turquoise hover:bg-modisoft-turquoise/90 text-white rounded-xl font-semibold transition-all"
          >
            <Tag className="w-4 h-4" />
            Apply Promotion
          </button>
        </>
      )}

      {step === 'sending' && (
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-modisoft-turquoise/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Tag className="w-6 h-6 text-modisoft-teal" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Applying promotion...</p>
          <p className="text-sm text-gray-500">Setting up your promo across the system</p>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-modisoft-green/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-modisoft-green" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">Promotion Applied!</p>
          <p className="text-sm text-gray-500">
            {promoType === 'percent_off' ? `${promoDiscount}% off` : promoType === 'bogo' ? 'BOGO deal' : 'Bundle deal'} on {promoItems || 'selected items'} is now active.
          </p>
        </div>
      )}
    </div>
  );

  const renderPricingModal = () => (
    <div className="space-y-5">
      {step === 'action' && (
        <>
          <div className="p-3 bg-modisoft-green/10 border border-modisoft-green/20 rounded-xl">
            <p className="text-sm text-modisoft-green">
              <span className="font-semibold">Recommendation: </span>{action.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Adjustment: {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
            </label>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={priceAdjustment}
              onChange={(e) => setPriceAdjustment(Number(e.target.value))}
              className="w-full accent-modisoft-green"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-20%</span>
              <span>0%</span>
              <span>+20%</span>
            </div>
          </div>

          {action.relatedItem && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Item: </span>{action.relatedItem}
              </p>
            </div>
          )}

          <div className="p-3 bg-modisoft-yellow/10 border border-modisoft-yellow/20 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-modisoft-yellow flex-shrink-0" />
            <p className="text-sm text-modisoft-blue">
              Expected impact: <span className="font-bold">{action.expectedValueLabel}</span>
            </p>
          </div>

          <button
            onClick={handleApplyPricing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-modisoft-green hover:bg-modisoft-green/90 text-white rounded-xl font-semibold transition-all"
          >
            <DollarSign className="w-4 h-4" />
            Update Pricing
          </button>
        </>
      )}

      {step === 'sending' && (
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-modisoft-green/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <DollarSign className="w-6 h-6 text-modisoft-green" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Updating price...</p>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-modisoft-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-modisoft-green" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">Price Updated!</p>
          <p className="text-sm text-gray-500">
            {action.relatedItem || 'Item'} price adjusted by {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%.
          </p>
        </div>
      )}
    </div>
  );

  const renderFuelModal = () => (
    <div className="space-y-5">
      {step === 'action' && (
        <>
          <div className="p-3 bg-modisoft-yellow/10 border border-modisoft-yellow/30 rounded-xl">
            <p className="text-sm text-modisoft-blue/80">
              <span className="font-semibold text-modisoft-blue">Action needed: </span>{action.description}
            </p>
          </div>

          <div className="p-3 bg-modisoft-yellow/10 border border-modisoft-yellow/30 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-modisoft-yellow flex-shrink-0" />
            <p className="text-sm text-modisoft-blue/80">
              Expected impact: <span className="font-bold text-modisoft-blue">{action.expectedValueLabel}</span>
            </p>
          </div>

          <button
            onClick={handleFuelAction}
            className="w-full flex items-center justify-center gap-2 py-3 bg-modisoft-yellow hover:bg-modisoft-yellow/90 text-modisoft-blue rounded-xl font-semibold transition-all"
          >
            <Fuel className="w-4 h-4" />
            Take Action
          </button>
        </>
      )}

      {step === 'sending' && (
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-modisoft-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Fuel className="w-6 h-6 text-modisoft-yellow" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Processing...</p>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-modisoft-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-modisoft-green" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">Done!</p>
          <p className="text-sm text-gray-500">Fuel action has been completed.</p>
        </div>
      )}
    </div>
  );

  // Modal heading config per action type
  const modalConfig = {
    labor: { 
      title: isDownstaff ? 'Reduce Hours' : 'Staff Up', 
      subtitle: isDownstaff ? 'Notify an employee about shift changes' : 'Contact an employee for this shift',
      icon: <Users className="w-5 h-5 text-modisoft-blue" />,
      iconBg: 'bg-modisoft-blue/10',
      color: 'indigo',
    },
    promo: { 
      title: 'Apply Promotion', 
      subtitle: 'Set up a promotional offer',
      icon: <Tag className="w-5 h-5 text-modisoft-turquoise" />,
      iconBg: 'bg-modisoft-turquoise/10',
      color: 'purple',
    },
    event: { 
      title: 'Prepare for Event', 
      subtitle: 'Run a promo or prepare inventory',
      icon: <Calendar className="w-5 h-5 text-modisoft-blue" />,
      iconBg: 'bg-modisoft-blue/10',
      color: 'sky',
    },
    pricing: { 
      title: 'Adjust Pricing', 
      subtitle: 'Update item pricing',
      icon: <DollarSign className="w-5 h-5 text-modisoft-green" />,
      iconBg: 'bg-modisoft-green/10',
      color: 'emerald',
    },
    fuel: { 
      title: 'Fuel Action', 
      subtitle: 'Take action on fuel recommendation',
      icon: <Fuel className="w-5 h-5 text-modisoft-yellow" />,
      iconBg: 'bg-modisoft-yellow/10',
      color: 'orange',
    },
  };

  const config = modalConfig[action.type];

  const renderContent = () => {
    switch (action.type) {
      case 'labor': return renderLaborModal();
      case 'promo': return renderPromoEventModal();
      case 'event': return renderPromoEventModal(); // events also get promo flow
      case 'pricing': return renderPricingModal();
      case 'fuel': return renderFuelModal();
      default: return renderPromoEventModal();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={step === 'action' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${config.iconBg} rounded-lg`}>
                {config.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
                <p className="text-xs text-gray-500">{config.subtitle}</p>
              </div>
            </div>
            {step === 'action' && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Action context */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{action.title}</span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-500">{action.expectedValueLabel}</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {renderContent()}
          </div>

          {/* Footer - only show Skip when on action step */}
          {step === 'action' && (
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button 
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
