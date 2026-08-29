import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Bell,
  User,
  LogOut,
  LogIn,
  Shield,
  Building2,
  Truck,
  Sparkles,
  ChevronDown,
  CheckCheck,
  Package,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';

export const Navbar = ({ activeView, setActiveView, onOpenAuth }) => {
  const { user, role, logout, demoLogin, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleSwitch = async (roleKey) => {
    await demoLogin(roleKey);
    setShowRoleMenu(false);
    if (roleKey === 'ADMIN') setActiveView('admin');
    else if (roleKey.startsWith('PARCEL_AGENT')) setActiveView('parcel_agent');
    else if (roleKey === 'DRIVER') setActiveView('driver');
    else if (roleKey === 'CUSTOMER') setActiveView('customer');
  };

  const roleLabels = {
    ADMIN: { label: 'Administrator', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Shield },
    PARCEL_AGENT: {
      label: user?.stationId ? `${user.stationId.city || 'Station'} Agent` : 'Parcel Agent',
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: Building2,
    },
    DRIVER: { label: 'Bus Driver', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Truck },
    CUSTOMER: { label: 'Customer', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: User },
  };

  const currentRoleInfo = role ? roleLabels[role] || { label: role, bg: 'bg-slate-800 text-slate-300', icon: User } : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('public')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition">
              <Navigation size={22} className="transform -rotate-45" />
            </div>
            <div>
              <div className="font-black tracking-tight text-base sm:text-lg flex items-center gap-1 text-white">
                <span>GLOBAL VOYAGE</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold block">
                Parcel & IoT Transit
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveView('public')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeView === 'public'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Public Tracking
            </button>

            {isAuthenticated && role === 'CUSTOMER' && (
              <button
                onClick={() => setActiveView('customer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeView === 'customer'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                My Parcels
              </button>
            )}

            {isAuthenticated && (role === 'PARCEL_AGENT' || role === 'ADMIN') && (
              <button
                onClick={() => setActiveView('parcel_agent')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeView === 'parcel_agent'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Station Workspace
              </button>
            )}

            {isAuthenticated && (role === 'DRIVER' || role === 'ADMIN') && (
              <button
                onClick={() => setActiveView('driver')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeView === 'driver'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Driver Trips
              </button>
            )}

            {isAuthenticated && role === 'ADMIN' && (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeView === 'admin'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Admin Center
              </button>
            )}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="hidden sm:inline">Role Switcher:</span>
              <span className="font-bold text-white">
                {currentRoleInfo ? currentRoleInfo.label : 'Public Guest'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-fadeIn">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 mb-1">
                  Switch Active Role (Demo)
                </div>
                <button
                  onClick={() => handleRoleSwitch('ADMIN')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-left transition"
                >
                  <Shield size={16} className="text-indigo-400" />
                  <div>
                    <strong className="block text-white">Administrator</strong>
                    <span className="text-[10px] text-slate-400">Global system & monitoring</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSwitch('PARCEL_AGENT_DOUALA')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-left transition"
                >
                  <Building2 size={16} className="text-sky-400" />
                  <div>
                    <strong className="block text-white">Douala Station Agent</strong>
                    <span className="text-[10px] text-slate-400">Intake & Douala dispatch</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSwitch('PARCEL_AGENT_YAOUNDE')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-left transition"
                >
                  <Building2 size={16} className="text-cyan-400" />
                  <div>
                    <strong className="block text-white">Yaoundé Station Agent</strong>
                    <span className="text-[10px] text-slate-400">Arrival & Yaoundé dispatch</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSwitch('DRIVER')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-left transition"
                >
                  <Truck size={16} className="text-amber-400" />
                  <div>
                    <strong className="block text-white">Bus Driver (Paul)</strong>
                    <span className="text-[10px] text-slate-400">Departures & trip incidents</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSwitch('CUSTOMER')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-left transition"
                >
                  <User size={16} className="text-emerald-400" />
                  <div>
                    <strong className="block text-white">Customer (Alice)</strong>
                    <span className="text-[10px] text-slate-400">Personal parcels & issues</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-cyan-400" />
                      <h4 className="font-bold text-sm text-white">In-App Notifications</h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-medium text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck size={14} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3 rounded-xl border text-xs transition ${
                            n.isRead
                              ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                              : 'bg-slate-800/60 border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="font-bold text-white">{n.title}</strong>
                            <span className="text-[10px] text-slate-500">
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

          {/* User Sign In / Profile Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                title="Sign Out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 transition"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
