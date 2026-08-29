import React from 'react';
import { Navigation, Shield, Phone, Mail, MapPin, Radio, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white">
              <Navigation size={18} className="transform -rotate-45" />
            </div>
            <span className="font-black text-base tracking-tight">GLOBAL VOYAGE</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Leading intercity bus parcel management and real-time IoT tracking infrastructure across Cameroon.
          </p>
        </div>

        {/* Stations */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3">Key Station Hubs</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-sky-400" />
              <span>Douala Central Station (Akwa)</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-sky-400" />
              <span>Yaoundé Mvan Terminal</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-sky-400" />
              <span>Bafoussam City Station</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-sky-400" />
              <span>Bamenda Up-Station Hub</span>
            </li>
          </ul>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3">System Features</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Radio size={14} className="text-cyan-400" />
              <span>4G IoT GPS Parcel Telemetry</span>
            </li>
            <li className="flex items-center gap-2">
              <Shield size={14} className="text-cyan-400" />
              <span>Station-Restricted Dispatch</span>
            </li>
            <li className="flex items-center gap-2">
              <Navigation size={14} className="text-cyan-400" />
              <span>Public Unauthenticated Tracking</span>
            </li>
          </ul>
        </div>

        {/* Contact & Support */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3">Station Support</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-emerald-400" />
              <span>+237 233 42 11 00 (Douala)</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-emerald-400" />
              <span>+237 222 30 45 67 (Yaoundé)</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-emerald-400" />
              <span>support@globalvoyage.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <div>&copy; {new Date().getFullYear()} Global Voyage Express. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Terms of Carriage</span>
          <span>•</span>
          <span>Privacy Policy</span>
          <span>•</span>
          <span>IoT Security Specs</span>
        </div>
      </div>
    </footer>
  );
};
