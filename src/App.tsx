import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { DashboardLayout } from './components/DashboardLayout';
import { AuthModal } from './components/AuthModal';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { OfflineIndicator } from './components/OfflineIndicator';

function AppContent() {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {activeTab === 'landing' ? (
        <>
          <Navbar />
          <LandingPage />
        </>
      ) : (
        <DashboardLayout />
      )}

      {/* Global Modals & Indicators */}
      <AuthModal />
      <StripeCheckoutModal />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
