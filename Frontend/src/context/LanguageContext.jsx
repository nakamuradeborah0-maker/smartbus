import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  fr: {
    // Navigation
    'nav.track': 'Suivi & Réservation',
    'nav.fleet': 'Notre Flotte',
    'nav.portal': 'Espace Voyageur',
    'nav.reportIssue': 'Réclamation',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    'nav.role': 'Changer de profil',
    'nav.notifications': 'Notifications',
    'nav.switchRole': 'Accès rapide démo',
    'nav.deboraAdmin': 'Admin Débora',
    'nav.adminPortal': 'Portail Admin',
    'nav.agentDouala': 'Agent Douala',
    'nav.agentYaounde': 'Agent Yaoundé',
    'nav.driver': 'Conducteur Bus',
    'nav.customer': 'Client (Alice)',

    // Auth Modal
    'auth.titleLogin': 'Connexion Espace Membre',
    'auth.titleRegister': 'Créer un Compte',
    'auth.identifier': 'Identifiant ou E-mail',
    'auth.identifierPlaceholder': 'ex: debora ou adresse@email.com',
    'auth.password': 'Mot de passe',
    'auth.passwordPlaceholder': '••••••••',
    'auth.fullName': 'Nom complet',
    'auth.fullNamePlaceholder': 'ex: Jean Dupont',
    'auth.phone': 'Numéro de Téléphone (Facultatif)',
    'auth.btnLogin': 'Se connecter en toute sécurité',
    'auth.btnRegister': 'Créer mon compte',
    'auth.submitting': 'Authentification en cours...',
    'auth.quickAccess': 'Accès rapide démo (1-clic)',
    'auth.deboraHint': 'Compte Admin configuré :',
    'auth.deboraBtn': 'Connexion 1-clic debora',

    // Hero & Search
    'hero.badge': 'Réseau National Interurbain',
    'hero.title': 'Voyagez et expédiez en toute sérénité',
    'hero.subtitle': 'Liaisons quotidiennes Douala ↔ Yaoundé et messagerie express sous géolocalisation GPS directe.',
    'tab.track': 'Suivre un Colis',
    'tab.book': 'Rechercher un Trajet',
    'track.placeholder': 'Entrez votre N° de suivi (ex: GV-2026-9042)',
    'track.btn': 'Localiser le colis',
    'track.quickDemo': 'Exemples récents :',
    'track.searching': 'Recherche du colis...',
    'book.origin': 'Gare de Départ',
    'book.destination': 'Gare d\'Arrivée',
    'book.date': 'Date de voyage',
    'book.btn': 'Trouver les départs',
    'book.price': 'FCFA',
    'book.reserve': 'Réserver',
    'book.seats': 'places',
    'book.noTrips': 'Aucun départ programmé sur cette ligne pour le moment.',
    'book.availableTrips': 'Départs disponibles :',

    // Tracking Board
    'status.origin': 'Gare Départ',
    'status.transit': 'En Transit (Bus)',
    'status.destination': 'Gare Arrivée',
    'status.speed': 'Vitesse',
    'status.battery': 'Batterie balise',
    'status.sender': 'Expéditeur',
    'status.recipient': 'Destinataire',
    'status.weight': 'Poids',
    'status.lastPing': 'Mis à jour',
    'status.incidentReported': 'Incident / perturbation signalé :',
    'status.reportIssue': 'Signaler un problème sur ce colis',

    // Fleet Showcase
    'fleet.title': 'L\'Excellence du Transport Interurbain',
    'fleet.subtitle': 'Des autocars récents de standing international et des gares modernes conçues pour votre confort.',
    'fleet.vipTitle': 'Confort VIP Première Classe',
    'fleet.vipDesc': 'Fauteuils en cuir inclinables, climatisation régulée, prises de recharge et suspension pneumatique pour un repos total.',
    'fleet.terminalsTitle': 'Gares Routières & Quais Sécurisés',
    'fleet.terminalsDesc': 'Nos terminaux de Douala Akwa et Yaoundé Mvan offrent un accueil professionnel, des salles d\'attente confortables et des départs ponctuels.',

    // Footer
    'footer.brand': 'GLOBAL VOYAGES',
    'footer.desc': 'Société de transport interurbain et de logistique express au Cameroun. Fiabilité, ponctualité et confort au standard international.',
    'footer.stations': 'Gares & Terminaux',
    'footer.commitments': 'Nos Engagements',
    'footer.assistance': 'Service Client',
    'footer.punctuality': 'Départs à heures fixes garantis',
    'footer.safety': 'Sécurité et suivi GPS 24/7',
    'footer.comfort': 'Flotte VIP climatisée',
    'footer.parcels': 'Messagerie colis express sécurisée',
    'footer.phone': 'Douala: (+237) 670 00 00 01 | Yaoundé: (+237) 690 00 00 02',
    'footer.hours': 'Guichets ouverts 7j/7 de 05h30 à 21h30',
    'footer.legal': 'Tous droits réservés. Transport & Logistique Cameroun.',

    // Customer Portal
    'customer.badge': 'Portail Voyageur & Expéditeur',
    'customer.welcome': 'Bienvenue,',
    'customer.subtitle': 'Gérez vos réservations de tickets de bus et suivez l\'acheminement de vos colis en gare.',
    'customer.reportIssue': 'Signaler un Problème',
    'customer.tabParcels': 'Mes Colis Expédiés / Reçus',
    'customer.tabBookings': 'Mes Réservations & Billets',
    'customer.searchPlaceholder': 'Rechercher par bordereau...',
    'customer.loadingParcels': 'Chargement de vos colis...',
    'customer.noParcels': 'Aucun colis enregistré sous votre compte pour l\'instant.',
    'customer.trip': 'Trajet :',
    'customer.device': 'Dispositif :',
    'customer.iotActive': 'Balise IoT GPS Active',
    'customer.stationCheck': 'Contrôle en Gare',
    'customer.registeredOn': 'Enregistré le',
    'customer.publicView': 'Vue Suivi Public',
    'customer.originStation': 'Gare de Départ',
    'customer.destStation': 'Gare d\'Arrivée',
    'customer.gpsSignal': 'Signal GPS Télétransmis',
    'customer.battery': 'Batterie :',
    'customer.noIotDesc': 'Ce colis est acheminé avec validation physique à chaque checkpoint de gare.',
    'customer.selectParcelPrompt': 'Sélectionnez un colis dans la liste pour consulter les détails d\'acheminement.',
    'customer.tripsTitle': 'Mes Billets & Départs Disponibles',
    'customer.bookNewTicket': 'Réserver un Billet',
    'customer.confirmedTicket': 'Billet Confirmé & Payé',
    'customer.buyNewPrompt': 'Acheter un nouveau billet',
    'customer.buyNewDesc': 'Voyagez confortablement sur les lignes Global Voyages',
    'customer.availableTrips': 'Liaisons Programmées en Temps Réel',
    'customer.departure': 'Départ :',
    'customer.busNumber': 'Autocar N°',
    'customer.seatsLeft': 'places dispo',
    'customer.securePayment': 'Paiement Sécurisé CamPay',
    'customer.ticketAmount': 'Montant du titre de transport :',
    'customer.mobileMoneyLabel': 'Numéro Mobile Money (ex: 2376XXXXXXXX)',
    'customer.payValidate': 'Valider & Débiter',
    'customer.payProcessing': 'Initialisation...',
    'customer.paySuccess': 'Demande de paiement envoyée ! Veuillez confirmer sur votre mobile.'
  },
  en: {
    // Navigation
    'nav.track': 'Tracking & Booking',
    'nav.fleet': 'Our Fleet',
    'nav.portal': 'Passenger Portal',
    'nav.reportIssue': 'Claims',
    'nav.login': 'Sign In',
    'nav.logout': 'Sign Out',
    'nav.role': 'Switch Profile',
    'nav.notifications': 'Notifications',
    'nav.switchRole': '1-Click Demo Access',
    'nav.deboraAdmin': 'Admin Debora',
    'nav.adminPortal': 'Admin Portal',
    'nav.agentDouala': 'Douala Agent',
    'nav.agentYaounde': 'Yaoundé Agent',
    'nav.driver': 'Bus Driver',
    'nav.customer': 'Customer (Alice)',

    // Auth Modal
    'auth.titleLogin': 'Member Sign In',
    'auth.titleRegister': 'Create an Account',
    'auth.identifier': 'Username or Email',
    'auth.identifierPlaceholder': 'e.g. debora or user@email.com',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': '••••••••',
    'auth.fullName': 'Full Name',
    'auth.fullNamePlaceholder': 'e.g. John Doe',
    'auth.phone': 'Phone Number (Optional)',
    'auth.btnLogin': 'Sign In Securely',
    'auth.btnRegister': 'Create Account',
    'auth.submitting': 'Authenticating...',
    'auth.quickAccess': '1-Click Demo Access',
    'auth.deboraHint': 'Configured Admin Account:',
    'auth.deboraBtn': '1-Click Sign In (debora)',

    // Hero & Search
    'hero.badge': 'National Transit Network',
    'hero.title': 'Travel and ship with complete peace of mind',
    'hero.subtitle': 'Daily express connections Douala ↔ Yaoundé and courier logistics monitored via direct GPS telemetry.',
    'tab.track': 'Track a Parcel',
    'tab.book': 'Search for Trips',
    'track.placeholder': 'Enter tracking number (e.g. GV-2026-9042)',
    'track.btn': 'Locate Parcel',
    'track.quickDemo': 'Recent examples:',
    'track.searching': 'Searching for parcel...',
    'book.origin': 'Origin Terminal',
    'book.destination': 'Destination Terminal',
    'book.date': 'Travel Date',
    'book.btn': 'Find Departures',
    'book.price': 'XAF',
    'book.reserve': 'Book Ticket',
    'book.seats': 'seats',
    'book.noTrips': 'No departures currently scheduled on this route.',
    'book.availableTrips': 'Available departures:',

    // Tracking Board
    'status.origin': 'Origin Station',
    'status.transit': 'In Transit (Bus)',
    'status.destination': 'Destination Station',
    'status.speed': 'Speed',
    'status.battery': 'Tracker Battery',
    'status.sender': 'Sender',
    'status.recipient': 'Recipient',
    'status.weight': 'Weight',
    'status.lastPing': 'Updated',
    'status.incidentReported': 'Reported incident / delay:',
    'status.reportIssue': 'Report an issue with this parcel',

    // Fleet Showcase
    'fleet.title': 'Excellence in Intercity Travel',
    'fleet.subtitle': 'Modern luxury coaches meeting international standards and welcoming passenger terminals.',
    'fleet.vipTitle': 'First Class VIP Comfort',
    'fleet.vipDesc': 'Reclining leather armchairs, climate control, personal device charging, and air suspension for maximum rest.',
    'fleet.terminalsTitle': 'Modern Terminals & Secure Platforms',
    'fleet.terminalsDesc': 'Our Douala Akwa and Yaoundé Mvan hubs feature professional service, comfortable lounges, and strictly punctual departures.',

    // Footer
    'footer.brand': 'GLOBAL VOYAGES',
    'footer.desc': 'Premier intercity transit and express logistics company in Cameroon. Reliability, safety, and international comfort.',
    'footer.stations': 'Terminals & Hubs',
    'footer.commitments': 'Our Commitments',
    'footer.assistance': 'Customer Service',
    'footer.punctuality': 'Strictly punctual departure schedules',
    'footer.safety': 'Enhanced safety & 24/7 GPS tracking',
    'footer.comfort': 'Fully air-conditioned VIP coaches',
    'footer.parcels': 'Secure express parcel courier',
    'footer.phone': 'Douala: (+237) 670 00 00 01 | Yaoundé: (+237) 690 00 00 02',
    'footer.hours': 'Ticketing open daily from 5:30 AM to 9:30 PM',
    'footer.legal': 'All rights reserved. Cameroon Transit & Logistics.',

    // Customer Portal
    'customer.badge': 'Passenger & Shipper Portal',
    'customer.welcome': 'Welcome,',
    'customer.subtitle': 'Manage your bus ticket bookings and track your station-to-station parcels in real time.',
    'customer.reportIssue': 'Report an Issue',
    'customer.tabParcels': 'My Shipped / Received Parcels',
    'customer.tabBookings': 'My Bookings & Tickets',
    'customer.searchPlaceholder': 'Search by tracking number...',
    'customer.loadingParcels': 'Loading your parcels...',
    'customer.noParcels': 'No parcels registered under your account yet.',
    'customer.trip': 'Route:',
    'customer.device': 'Tracking Device:',
    'customer.iotActive': 'Active IoT GPS Tracker',
    'customer.stationCheck': 'Station Physical Check',
    'customer.registeredOn': 'Registered on',
    'customer.publicView': 'Public Tracking View',
    'customer.originStation': 'Origin Station',
    'customer.destStation': 'Destination Station',
    'customer.gpsSignal': 'Live GPS Signal Transmitted',
    'customer.battery': 'Battery:',
    'customer.noIotDesc': 'This parcel is routed with physical inspection checkpoints at each station.',
    'customer.selectParcelPrompt': 'Select a parcel from the list to view live tracking details.',
    'customer.tripsTitle': 'My Tickets & Available Departures',
    'customer.bookNewTicket': 'Book a Ticket',
    'customer.confirmedTicket': 'Ticket Confirmed & Paid',
    'customer.buyNewPrompt': 'Book a new departure',
    'customer.buyNewDesc': 'Travel in first-class comfort across Cameroon with Global Voyages',
    'customer.availableTrips': 'Live Scheduled Departures',
    'customer.departure': 'Departure:',
    'customer.busNumber': 'Coach No.',
    'customer.seatsLeft': 'seats left',
    'customer.securePayment': 'Secure CamPay Payment',
    'customer.ticketAmount': 'Ticket amount:',
    'customer.mobileMoneyLabel': 'Mobile Money Number (e.g. 2376XXXXXXXX)',
    'customer.payValidate': 'Confirm & Charge',
    'customer.payProcessing': 'Processing...',
    'customer.paySuccess': 'Payment request sent! Please approve the push prompt on your mobile.'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('gv_lang_v3');
    if (saved) return saved;
    // Default primary language is English
    localStorage.setItem('gv_lang_v3', 'en');
    localStorage.setItem('gv_lang', 'en');
    return 'en';
  });

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('gv_lang_v3', newLang);
    localStorage.setItem('gv_lang', newLang);
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'fr' : 'en';
    setLanguage(nextLang);
  };

  const t = (key, fallback = '') => {
    const dict = translations[lang] || translations.en;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
