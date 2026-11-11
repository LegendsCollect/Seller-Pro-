import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { X, Mail, Lock, User, Store, ArrowRight, ShieldCheck, Check, KeyRound, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    signup,
    loginAsDemoUser,
    loginAsAdmin,
    authModalMode,
    setAuthModalMode,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'admin'>(authModalMode || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
      setErrorMsg('');
      setAdminPassword('');
    }
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'admin') {
        if (!adminPassword) throw new Error('Please enter the admin password');
        const success = loginAsAdmin(adminPassword.trim());
        if (!success) throw new Error('Incorrect admin password. Please try again.');
      } else if (mode === 'signin') {
        if (!email) throw new Error('Please enter your email address');
        const success = await login(email, password);
        if (!success) throw new Error('Invalid email or password');
      } else if (mode === 'signup') {
        if (!email) throw new Error('Please enter an email address');
        if (!name) throw new Error('Please enter your name');
        const success = await signup(email, name, storeName);
        if (!success) throw new Error('Could not create account');
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Please enter your email address');
        // Simulate password reset email sent
        setResetSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <Logo size="sm" />
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'signin' && 'Sign in to SellerPro'}
              {mode === 'signup' && 'Create your reseller account'}
              {mode === 'forgot' && 'Reset your password'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'signin' && 'Manage your inventory, profit margins, and sales.'}
              {mode === 'signup' && 'Start with our free tier or upgrade anytime.'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {mode === 'admin' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block leading-tight">Master Admin Access</span>
                    <span className="text-[10px] text-emerald-400 font-medium">VIP Business Tier • 100% Free Lifetime</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enter the master administrator password to unlock the full SellerPro Business suite (AI Collectibles Scanner, 24/7 AI Appraiser Chat, Multi-App Cross-Lister, Unlimited Inventory) completely for free.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isLoading ? 'Verifying Admin...' : 'Unlock Everything For Free'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  ← Back to standard sign in
                </button>
              </div>
            </form>
          ) : resetSuccess && mode === 'forgot' ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Password Reset Link Sent</span>
              </div>
              <p>
                We've sent recovery instructions to <strong>{email}</strong>. Check your inbox to set a new password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResetSuccess(false);
                  setMode('signin');
                }}
                className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Chen"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Store / Reseller Brand Name (Optional)
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Grail Vault Collectibles"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reseller@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] text-emerald-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>
                  {isLoading
                    ? 'Processing...'
                    : mode === 'signin'
                    ? 'Sign In to Workspace'
                    : mode === 'signup'
                    ? 'Create Free Account'
                    : 'Send Reset Instructions'}
                </span>
                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}

          {/* Quick Demo Login Option & Bottom Navigation */}
          {mode !== 'admin' && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={loginAsDemoUser}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant Test Login (Pre-Loaded Demo Store)</span>
              </button>

              {/* Toggle Modes */}
              <div className="text-center text-xs text-slate-500">
                {mode === 'signin' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg('');
                      }}
                      className="font-bold text-slate-900 hover:underline"
                    >
                      Sign up free
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setMode('signin');
                        setErrorMsg('');
                      }}
                      className="font-bold text-slate-900 hover:underline"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>

              {/* Word 'admin' at the bottom before you sign in */}
              <div className="pt-3 border-t border-slate-100/80 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin');
                    setErrorMsg('');
                    setAdminPassword('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer font-mono tracking-wider flex items-center gap-1 group"
                >
                  <KeyRound className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  <span>admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
