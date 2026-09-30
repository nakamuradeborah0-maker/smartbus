<?php
// PHP-App/src/Language.php
require_once __DIR__ . '/../config/config.php';

class Language {
    private static array $translations = [
        'fr' => [
            // Nav & Brand
            'brand.name' => 'GLOBAL VOYAGES',
            'brand.tagline' => 'Autocars VIP & Messagerie Express',
            'nav.routes' => 'Lignes & Horaires',
            'nav.tracking' => 'Suivi Colis & IoT',
            'nav.fleet' => 'Flotte VIP',
            'nav.book' => 'Réserver',
            'nav.login' => 'Connexion',
            'nav.myAccount' => 'Mon Espace',
            'nav.logout' => 'Déconnexion',

            // Hero
            'hero.badge' => 'RÉSEAU INTERURBAIN CAMEROUN • AXE LOURD N3',
            'hero.title' => 'Voyagez & Expédiez en Toute Sérénité',
            'hero.subtitle' => 'Liaisons quotidiennes VIP directes entre Douala et Yaoundé sur l\'Axe Lourd N3. Télémétrie IoT 4G et paiement sécurisé.',
            'hero.tabTrack' => 'Suivi de Colis',
            'hero.tabBook' => 'Acheter un Billet',
            'hero.tabMap' => 'Carte Flotte & Arrêts',

            // Search
            'search.origin' => 'Gare de Départ',
            'search.destination' => 'Gare de Destination',
            'search.date' => 'Date de Voyage',
            'search.today' => "Aujourd'hui",
            'search.tomorrow' => 'Demain',
            'search.btn' => 'Rechercher Départs',
            'search.departuresTitle' => 'Départs Programmés en Temps Réel',
            'search.seatsLeft' => 'places disponibles',
            'search.reserve' => 'Réserver Siège VIP',
            'search.price' => 'FCFA',

            // Tracking
            'track.placeholder' => 'N° d\'expédition (ex: PAR-2026-00125)',
            'track.btn' => 'Localiser Colis',
            'track.status' => 'Statut de l\'Acheminement',
            'track.history' => 'Historique des Checkpoints',

            // Booking Modal
            'booking.title' => 'Réservation de Billet VIP',
            'booking.step1' => '1. Horaires & Départs',
            'booking.step2' => '2. Choix du Siège',
            'booking.step3' => '3. Coordonnées & Paiement',
            'booking.step4' => '4. Validation Mobile USSD',
            'booking.step5' => '✓ Titre Émis',
            'booking.passengerName' => 'Nom et Prénom du Passager',
            'booking.passengerId' => 'N° CNI ou Passeport',
            'booking.phone' => 'Numéro Mobile Money (ex: 677 94 96 99)',
            'booking.email' => 'Adresse Email (Optionnel)',
            'booking.momo' => 'MTN Mobile Money (*126#)',
            'booking.om' => 'Orange Money (#150*50#)',
            'booking.payBtn' => 'Payer avec CamPay',
            'booking.pendingTitle' => 'Demande de Débit Transmise à CamPay !',
            'booking.pendingDesc' => 'Un message de confirmation a été envoyé sur votre téléphone. Validez avec votre code PIN secret.',
            'booking.checkStatus' => 'Vérifier le Statut du Paiement',
            'booking.demoConfirm' => "J'ai validé sur mon téléphone (Mode Test)",
            'booking.downloadTicket' => 'Télécharger Billet (HTML / PDF)',
            'booking.close' => 'Terminer & Voir mes Billets',

            // Roles & Dashboards
            'role.admin' => 'Administrateur',
            'role.driver' => 'Chauffeur',
            'role.agent' => 'Agent Guichet Colis',
            'role.customer' => 'Client Voyageur',
        ],
        'en' => [
            // Nav & Brand
            'brand.name' => 'GLOBAL VOYAGES',
            'brand.tagline' => 'VIP Coaches & Express Parcel Logistics',
            'nav.routes' => 'Routes & Schedules',
            'nav.tracking' => 'Parcel & IoT Tracking',
            'nav.fleet' => 'VIP Fleet',
            'nav.book' => 'Book Ticket',
            'nav.login' => 'Sign In',
            'nav.myAccount' => 'My Dashboard',
            'nav.logout' => 'Log Out',

            // Hero
            'hero.badge' => 'CAMEROON INTERCITY NETWORK • HIGHWAY N3',
            'hero.title' => 'Travel & Ship with Complete Peace of Mind',
            'hero.subtitle' => 'Daily first-class intercity connections directly between Douala and Yaounde along Highway N3. Live 4G IoT telemetry and secure mobile pay.',
            'hero.tabTrack' => 'Track Parcel',
            'hero.tabBook' => 'Book Bus Ticket',
            'hero.tabMap' => 'Live Fleet & Places Map',

            // Search
            'search.origin' => 'Departure Station',
            'search.destination' => 'Arrival Station',
            'search.date' => 'Travel Date',
            'search.today' => 'Today',
            'search.tomorrow' => 'Tomorrow',
            'search.btn' => 'Find Departures',
            'search.departuresTitle' => 'Live Scheduled Departures',
            'search.seatsLeft' => 'seats available',
            'search.reserve' => 'Reserve VIP Seat',
            'search.price' => 'XAF',

            // Tracking
            'track.placeholder' => 'Tracking number (e.g. PAR-2026-00125)',
            'track.btn' => 'Locate Parcel',
            'track.status' => 'Shipment Status',
            'track.history' => 'Checkpoint History',

            // Booking Modal
            'booking.title' => 'VIP Ticket Booking',
            'booking.step1' => '1. Schedules & Departures',
            'booking.step2' => '2. Seat Selection',
            'booking.step3' => '3. Passenger & Payment',
            'booking.step4' => '4. Mobile PIN Authorization',
            'booking.step5' => '✓ Ticket Issued',
            'booking.passengerName' => 'Full Passenger Name',
            'booking.passengerId' => 'National ID or Passport Number',
            'booking.phone' => 'Mobile Money Number (e.g. 677 94 96 99)',
            'booking.email' => 'Email Address (Optional)',
            'booking.momo' => 'MTN Mobile Money (*126#)',
            'booking.om' => 'Orange Money (#150*50#)',
            'booking.payBtn' => 'Pay with CamPay',
            'booking.pendingTitle' => 'Debit Request Transmitted to CamPay!',
            'booking.pendingDesc' => 'A payment prompt was sent to your phone. Please authorize with your secret PIN.',
            'booking.checkStatus' => 'Check Payment Status',
            'booking.demoConfirm' => 'I Confirmed on My Phone (Test Mode)',
            'booking.downloadTicket' => 'Download Boarding Pass (HTML / PDF)',
            'booking.close' => 'Done & View My Bookings',

            // Roles & Dashboards
            'role.admin' => 'Administrator',
            'role.driver' => 'Driver',
            'role.agent' => 'Parcel Agent',
            'role.customer' => 'Customer',
        ]
    ];

    public static function get(string $key, ?string $fallback = null): string {
        $lang = $_SESSION['lang'] ?? 'fr';
        if (!in_array($lang, ['fr', 'en'])) {
            $lang = 'fr';
        }
        return self::$translations[$lang][$key] ?? ($fallback ?? $key);
    }

    public static function current(): string {
        return $_SESSION['lang'] ?? 'fr';
    }

    public static function isEn(): bool {
        return self::current() === 'en';
    }
}

function t(string $key, ?string $fallback = null): string {
    return Language::get($key, $fallback);
}
