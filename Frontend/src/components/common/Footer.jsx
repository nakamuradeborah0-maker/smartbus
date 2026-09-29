import React from 'react';
import { Shield, Phone, Mail, MapPin, Radio, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#0B1E36] text-slate-300 border-t-4 border-blue-600 text-xs py-14 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand & Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img 
              src="/images/global_voyages_logo.jpg" 
              alt="Global Voyages Emblem" 
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-md bg-white shrink-0" 
            />
            <div>
              <span className="font-black text-lg tracking-tight text-white block">GLOBAL VOYAGES</span>
              <span className="text-[10px] text-blue-300 font-semibold tracking-wider uppercase">Lignes Interurbaines & Fret</span>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed text-xs">
            {t('footer.desc', 'Société de transport interurbain et de logistique express au Cameroun. Fiabilité, ponctualité et confort au standard international.')}
          </p>
        </div>

        {/* Stations Hubs */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-slate-700/60 pb-2">
            {t('footer.stations', 'Gares & Terminaux')}
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2 text-slate-300 hover:text-white transition">
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <span>Gare Centrale Douala (Akwa)</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300 hover:text-white transition">
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <span>Terminal Yaoundé (Mvan)</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300 hover:text-white transition">
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <span>Gare Régionale Bafoussam</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300 hover:text-white transition">
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <span>Station Interurbaine Bamenda</span>
            </li>
          </ul>
        </div>

        {/* System Features & Commitments */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-slate-700/60 pb-2">
            {t('footer.commitments', 'Nos Engagements')}
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2 text-slate-300">
              <CheckCircle size={14} className="text-blue-400 shrink-0" />
              <span>{t('footer.punctuality', 'Départs à heures fixes garantis')}</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Radio size={14} className="text-blue-400 shrink-0" />
              <span>{t('footer.safety', 'Sécurité et suivi GPS 24/7')}</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Shield size={14} className="text-blue-400 shrink-0" />
              <span>{t('footer.comfort', 'Flotte VIP climatisée')}</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Clock size={14} className="text-blue-400 shrink-0" />
              <span>{t('footer.parcels', 'Messagerie colis express sécurisée')}</span>
            </li>
          </ul>
        </div>

        {/* Contact & Support */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-slate-700/60 pb-2">
            {t('footer.assistance', 'Service Client')}
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2 text-slate-300">
              <Phone size={14} className="text-blue-400 shrink-0" />
              <span>+237 233 42 11 00 (Douala)</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Phone size={14} className="text-blue-400 shrink-0" />
              <span>+237 222 30 45 67 (Yaoundé)</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Mail size={14} className="text-blue-400 shrink-0" />
              <span>contact@globalvoyages-cm.com</span>
            </li>
            <li className="flex items-start gap-2 text-slate-400 pt-1">
              <Clock size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <span>{t('footer.hours', 'Guichets ouverts 7j/7 de 05h30 à 21h30')}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
        <div>&copy; {new Date().getFullYear()} GLOBAL VOYAGES • {t('footer.legal', 'Tous droits réservés. Transport & Logistique Cameroun.')}</div>
        <div className="flex items-center gap-5">
          <span className="hover:text-white cursor-pointer transition">Conditions Générales de Vente</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer transition">Politique de Confidentialité</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer transition">Sécurité & Flotte</span>
        </div>
      </div>
    </footer>
  );
};
