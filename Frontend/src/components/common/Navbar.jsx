import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Bell,
  User,
  LogOut,
  LogIn,
  Shield,
  Building2,
  Truck,
  ChevronDown,
  CheckCheck,
  Package,
  Globe,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/api';

export const Navbar = ({ activeView, setActiveView, onOpenAuth }) => {
  const { user, role, logout, demoLogin, isAuthenticated } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminSwitchView = async (targetRole, targetView) => {
    setShowUserMenu(false);
    if (targetRole && targetRole !== role) {
      await demoLogin(targetRole);
    }
    setActiveView(targetView);
  };

  const roleLabels = {
    ADMIN: { 
      label: 'Administrator', 
      bg: 'bg-blue-100 text-blue-900 border-blue-200', 
      icon: Shield 
    },
    PARCEL_AGENT: {
      label: user?.stationId ? `${user.stationId.city || 'Station'} Agent` : 'Parcel Agent',
      bg: 'bg-sky-100 text-sky-900 border-sky-200',
      icon: Building2,
    },
    DRIVER: { 
      label: 'Bus Driver', 
      bg: 'bg-amber-100 text-amber-900 border-amber-200', 
      icon: Truck 
    },
    CUSTOMER: { 
      label: 'Passenger', 
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-200', 
      icon: User 
    },
  };

  const currentRoleInfo = role ? roleLabels[role] || { label: role, bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: User } : null;

  const userInitial = (user?.name || user?.username || 'U')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => { setActiveView('public'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-white">
              <img
                src="/images/global_voyages_logo.jpg"
                alt="Global Voyages"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div>
              <div className="font-black tracking-tight text-lg sm:text-xl flex items-center gap-1.5 text-slate-900 leading-none">
                <span className="text-blue-700">GLOBAL</span>
                <span>VOYAGES</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mt-1">
                {lang === 'fr' ? 'Transport Interurbain & Messagerie' : 'Intercity Travel & Courier'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveView('public')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'public'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              <Navigation size={14} />
              <span>{t('nav.track', 'Suivi & Réservation')}</span>
            </button>

            {isAuthenticated && role === 'CUSTOMER' && (
              <button
                onClick={() => setActiveView('customer')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'customer'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                <Package size={14} />
                <span>{t('nav.portal', 'Espace Voyageur')}</span>
              </button>
            )}

            {isAuthenticated && role === 'PARCEL_AGENT' && (
              <button
                onClick={() => setActiveView('parcel_agent')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'parcel_agent'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                <Building2 size={14} />
                <span>{lang === 'fr' ? 'Poste Gare' : 'Station Hub'}</span>
              </button>
            )}

            {isAuthenticated && role === 'DRIVER' && (
              <button
                onClick={() => setActiveView('driver')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'driver'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                <Truck size={14} />
                <span>{lang === 'fr' ? 'Voyages Chauffeur' : 'Driver Trips'}</span>
              </button>
            )}

            {isAuthenticated && role === 'ADMIN' && (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                <Shield size={14} />
                <span>{t('nav.adminPortal', 'Portail Admin')}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Side Header Actions */}
        <div className="flex items-center gap-3">
          {/* Language Toggle (EN | FR) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:border-blue-600 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer"
            title={lang === 'en' ? 'Passer en Français' : 'Switch to English'}
          >
            <Globe size={14} className="text-blue-700" />
            <span className="font-mono tracking-wider">{lang === 'en' ? 'FR' : 'EN'}</span>
          </button>

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition cursor-pointer"
                title={t('nav.notifications')}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-300 shadow-2xl p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-2">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-blue-700" />
                      <h4 className="font-bold text-sm text-slate-900">{t('nav.notifications')}</h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={14} />
                        <span>{lang === 'fr' ? 'Tout marquer lu' : 'Mark all read'}</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        {lang === 'fr' ? 'Aucune notification.' : 'No notifications.'}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3 rounded-lg border text-xs transition ${
                            n.isRead
                              ? 'bg-slate-50 border-slate-200 text-slate-600'
                              : 'bg-blue-50 border-blue-200 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="font-bold text-slate-900">{n.title}</strong>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Menu or Sign In Button */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.name || user?.username || 'User'}
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider">
                    {currentRoleInfo?.label || role}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-300 shadow-2xl p-2 z-50 animate-fadeIn">
                  {/* User Profile Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {userInitial}
                      </div>
                      <div className="overflow-hidden">
                        <strong className="block text-xs font-bold text-slate-900 truncate">
                          {user?.name || user?.username || 'User'}
                        </strong>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {user?.email || (user?.username ? `@${user.username}` : '')}
                        </span>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${currentRoleInfo?.bg || 'bg-slate-200 text-slate-800'}`}>
                          {currentRoleInfo?.label || role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Views Navigation */}
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => { setActiveView('public'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-left transition cursor-pointer"
                    >
                      <Navigation size={15} className="text-blue-600" />
                      <span>{t('nav.track', 'Suivi & Réservation')}</span>
                    </button>

                    {role === 'ADMIN' && (
                      <button
                        onClick={() => { setActiveView('admin'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-left transition cursor-pointer font-bold"
                      >
                        <Shield size={15} className="text-blue-700" />
                        <span>{t('nav.adminPortal', 'Panneau d\'Administration')}</span>
                      </button>
                    )}

                    {role === 'CUSTOMER' && (
                      <button
                        onClick={() => { setActiveView('customer'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-left transition cursor-pointer font-bold"
                      >
                        <Package size={15} className="text-blue-700" />
                        <span>{t('nav.portal', 'Espace Voyageur')}</span>
                      </button>
                    )}

                    {role === 'PARCEL_AGENT' && (
                      <button
                        onClick={() => { setActiveView('parcel_agent'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-left transition cursor-pointer font-bold"
                      >
                        <Building2 size={15} className="text-blue-700" />
                        <span>{lang === 'fr' ? 'Guichet de Gare' : 'Station Counter'}</span>
                      </button>
                    )}

                    {role === 'DRIVER' && (
                      <button
                        onClick={() => { setActiveView('driver'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-left transition cursor-pointer font-bold"
                      >
                        <Truck size={15} className="text-blue-700" />
                        <span>{lang === 'fr' ? 'Missions Chauffeur' : 'Driver Trips'}</span>
                      </button>
                    )}

                    {/* Admin Switch Role Simulation (Subtle inside profile menu) */}
                    {role === 'ADMIN' && (
                      <div className="pt-2 border-t border-slate-200 mt-1">
                        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          {lang === 'fr' ? 'Accès consoles spécialisées' : 'Specialized Consoles'}
                        </span>
                        <button
                          onClick={() => handleAdminSwitchView(null, 'customer')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-left transition cursor-pointer text-[11px]"
                        >
                          <span className="flex items-center gap-2">
                            <User size={13} className="text-emerald-600" />
                            <span>{lang === 'fr' ? 'Vue Voyageur' : 'Passenger View'}</span>
                          </span>
                          <ArrowRight size={12} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleAdminSwitchView(null, 'parcel_agent')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-left transition cursor-pointer text-[11px]"
                        >
                          <span className="flex items-center gap-2">
                            <Building2 size={13} className="text-sky-600" />
                            <span>{lang === 'fr' ? 'Vue Agent Gare' : 'Station Agent View'}</span>
                          </span>
                          <ArrowRight size={12} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleAdminSwitchView(null, 'driver')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-left transition cursor-pointer text-[11px]"
                        >
                          <span className="flex items-center gap-2">
                            <Truck size={13} className="text-amber-600" />
                            <span>{lang === 'fr' ? 'Vue Conducteur' : 'Driver View'}</span>
                          </span>
                          <ArrowRight size={12} className="text-slate-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-700 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>{t('nav.logout', 'Déconnexion')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <LogIn size={15} />
              <span>{t('nav.login', 'Sign In')}</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-fadeIn">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => { setActiveView('public'); setMobileMenuOpen(false); }}
              className={`p-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeView === 'public' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Navigation size={16} />
              <span>{t('nav.track', 'Suivi & Réservation')}</span>
            </button>

            {isAuthenticated && role === 'CUSTOMER' && (
              <button
                onClick={() => { setActiveView('customer'); setMobileMenuOpen(false); }}
                className={`p-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                  activeView === 'customer' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package size={16} />
                <span>{t('nav.portal', 'Espace Voyageur')}</span>
              </button>
            )}

            {isAuthenticated && role === 'ADMIN' && (
              <button
                onClick={() => { setActiveView('admin'); setMobileMenuOpen(false); }}
                className={`p-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                  activeView === 'admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Shield size={16} />
                <span>{t('nav.adminPortal', 'Portail Admin')}</span>
              </button>
            )}

            {isAuthenticated && role === 'PARCEL_AGENT' && (
              <button
                onClick={() => { setActiveView('parcel_agent'); setMobileMenuOpen(false); }}
                className={`p-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                  activeView === 'parcel_agent' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 size={16} />
                <span>{lang === 'fr' ? 'Poste Gare' : 'Station Hub'}</span>
              </button>
            )}

            {isAuthenticated && role === 'DRIVER' && (
              <button
                onClick={() => { setActiveView('driver'); setMobileMenuOpen(false); }}
                className={`p-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                  activeView === 'driver' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Truck size={16} />
                <span>{lang === 'fr' ? 'Voyages Chauffeur' : 'Driver Trips'}</span>
              </button>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
            >
              <Globe size={14} className="text-blue-700" />
              <span>{lang === 'en' ? 'Passer en Français (FR)' : 'Switch to English (EN)'}</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold text-xs"
              >
                <LogOut size={14} />
                <span>{t('nav.logout', 'Déconnexion')}</span>
              </button>
            ) : (
              <button
                onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white font-bold text-xs"
              >
                <LogIn size={14} />
                <span>{t('nav.login', 'Sign In')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
