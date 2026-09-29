import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, Shield, Building2, Truck, Sparkles, AlertCircle, KeyRound, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { login, register, demoLogin } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState(initialTab);
  const [identifier, setIdentifier] = useState('debora');
  const [password, setPassword] = useState('Demodebora');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (tab === 'login') {
        await login(identifier.trim(), password);
      } else {
        await register({ name, email: identifier.trim(), password, phone });
      }
      onClose();
    } catch (err) {
      setError(err.message || (lang === 'fr' ? 'Échec d\'authentification. Vérifiez vos identifiants.' : 'Authentication failed. Please verify your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (roleKey) => {
    setLoading(true);
    setError('');
    try {
      await demoLogin(roleKey);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDebora = () => {
    setIdentifier('debora');
    setPassword('Demodebora');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition cursor-pointer ${
              tab === 'login'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('auth.titleLogin', 'Connexion Espace Membre')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition cursor-pointer ${
              tab === 'register'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('auth.titleRegister', 'Créer un Compte')}
          </button>
        </div>

        {/* Debora Credentials Callout */}
        {tab === 'login' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <KeyRound size={13} className="text-blue-700" />
                {t('auth.deboraHint', 'Compte Admin Configuré :')}
              </span>
              <div className="font-mono text-blue-800 text-[11px]">
                login: <strong className="font-bold text-slate-900">debora</strong> • pwd: <strong className="font-bold text-slate-900">Demodebora</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillDebora}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer shadow-2xs shrink-0 ml-2"
            >
              {lang === 'fr' ? 'Remplir' : 'Fill'}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('auth.fullName', 'Nom complet')}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder', 'ex: Jean Dupont')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {tab === 'login' ? t('auth.identifier', 'Identifiant ou E-mail') : 'Adresse e-mail'}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={tab === 'login' ? t('auth.identifierPlaceholder', 'ex: debora ou contact@example.com') : 'contact@example.com'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('auth.password', 'Mot de passe')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('auth.phone', 'Numéro de Téléphone (Facultatif)')}
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-sm transition disabled:opacity-50 mt-4 cursor-pointer"
          >
            {tab === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>
              {loading 
                ? t('auth.submitting', 'Authentification en cours...') 
                : tab === 'login' 
                  ? t('auth.btnLogin', 'Se connecter en toute sécurité') 
                  : t('auth.btnRegister', 'Créer mon compte')}
            </span>
          </button>
        </form>

        {/* 1-Click Fast Demo Login */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('auth.quickAccess', 'Accès rapide démo (1-clic)')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoClick('DEBORA')}
              className="col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-300 font-bold text-blue-950 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-700 shrink-0" />
                <span>{t('auth.deboraBtn', 'Connexion 1-clic debora')}</span>
              </div>
              <span className="font-mono text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                ADMIN
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('ADMIN')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-800 transition text-left cursor-pointer"
            >
              <Shield size={15} className="text-blue-700 shrink-0" />
              <span>{t('nav.adminPortal', 'Portail Admin')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('PARCEL_AGENT_DOUALA')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-800 transition text-left cursor-pointer"
            >
              <Building2 size={15} className="text-blue-600 shrink-0" />
              <span>{t('nav.agentDouala', 'Agent Douala')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('PARCEL_AGENT_YAOUNDE')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-800 transition text-left cursor-pointer"
            >
              <Building2 size={15} className="text-cyan-600 shrink-0" />
              <span>{t('nav.agentYaounde', 'Agent Yaoundé')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('DRIVER')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-800 transition text-left cursor-pointer"
            >
              <Truck size={15} className="text-amber-600 shrink-0" />
              <span>{t('nav.driver', 'Chauffeur Bus')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('CUSTOMER')}
              className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-800 transition cursor-pointer"
            >
              <User size={15} className="text-emerald-600 shrink-0" />
              <span>{t('nav.customer', 'Compte Client Test (Alice)')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
