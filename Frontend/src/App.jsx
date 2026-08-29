import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { PublicTrackPortal } from './components/public/PublicTrackPortal';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { ParcelAgentDashboard } from './components/parcelAgent/ParcelAgentDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';

function AppContent() {
  const { role, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState('public');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  // Sync view when user role changes
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'ADMIN') setActiveView('admin');
      else if (role === 'PARCEL_AGENT') setActiveView('parcel_agent');
      else if (role === 'DRIVER') setActiveView('driver');
      else if (role === 'CUSTOMER') setActiveView('customer');
    }
  }, [role, isAuthenticated]);

  const handleOpenAuth = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleNavigateToPublicTrack = (trackingNum) => {
    setActiveView('public');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full">
        {activeView === 'public' && <PublicTrackPortal onOpenAuth={handleOpenAuth} />}
        {activeView === 'customer' && <CustomerDashboard onNavigateTrack={handleNavigateToPublicTrack} />}
        {activeView === 'parcel_agent' && <ParcelAgentDashboard />}
        {activeView === 'driver' && <DriverDashboard />}
        {activeView === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}