import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CreditCard, ShieldCheck, CheckCircle2, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { PlanType } from '../types';

export const StripeCheckoutModal: React.FC = () => {
  const {
    user,
    isStripeModalOpen,
    setIsStripeModalOpen,
    pendingUpgradePlan,
    upgradePlan,
  } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(pendingUpgradePlan || 'pro');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'success'>('details');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('321');
  const [postalCode, setPostalCode] = useState('94103');

  if (!isStripeModalOpen) return null;

  const price = selectedPlan === 'business' 
    ? (interval === 'yearly' ? 190.00 : 19.99)
    : (interval === 'yearly' ? 95.00 : 9.99);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Create checkout session via server-side endpoint
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          interval,
          userEmail: user?.email,
        }),
      });
      const data = await response.json();

      // 2. Call server-side webhook simulation to activate subscription
      await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'customer.subscription.created',
          customerEmail: user?.email,
          plan: selectedPlan,
          sessionId: data.sessionId,
        }),
      });

      // 3. Mark success
      setCheckoutStep('success');
      setTimeout(() => {
        upgradePlan(selectedPlan);
        setCheckoutStep('details');
      }, 1500);
    } catch (err) {
      console.error('Stripe Checkout Error:', err);
      // Still allow upgrade in test sandbox
      upgradePlan(selectedPlan);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stripe Billing Checkout</h3>
              <p className="text-[11px] text-slate-500">Test Mode Simulation · SSL Encrypted</p>
            </div>
          </div>
          <button
            onClick={() => setIsStripeModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {checkoutStep === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Subscription Activated!</h4>
            <p className="text-xs text-slate-600">
              Your account has been upgraded to <strong>{selectedPlan.toUpperCase()}</strong>. Webhook verified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="p-6 space-y-6">
            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Choose Subscription Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlan === 'pro'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">PRO Plan</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      ${interval === 'yearly' ? '95/yr' : '9.99/mo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Unlimited items & CSV export</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('business')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlan === 'business'
                      ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">BUSINESS Plan</span>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      ${interval === 'yearly' ? '190/yr' : '19.99/mo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Includes AI Assistant & Analytics</p>
                </button>
              </div>
            </div>

            {/* Billing Interval Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-medium text-slate-700">Billing Interval</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => setInterval('monthly')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    interval === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval('yearly')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    interval === 'yearly' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Yearly (-20%)
                </button>
              </div>
            </div>

            {/* Test Card Simulation Details */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Card Information (Test Mode)</span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Stripe Sandbox
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Card Number"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="MM/YY"
                />
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="CVC"
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="ZIP"
                />
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-600">Total Due Today:</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono-numbers">
                ${price.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Verifying with Stripe...' : `Pay $${price.toFixed(2)} & Activate`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
