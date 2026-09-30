# Global Voyages (SmartBus) - PHP Application

Application web complete de reservation de billets VIP, telemetrie IoT et logistique de colis pour autocars interurbains (Axe Lourd Douala <-> Yaounde <-> Bafoussam), developpee en PHP 8.2 moderne avec SQLite PDO, Carto Voyager HD et integration CamPay Mobile Money.

---

## Demarrage Rapide

### Prérequis
- **PHP >= 8.1** (avec extensions `pdo_sqlite`, `curl`, `mbstring`, `openssl`).
- Disponible via XAMPP : `C:\xampp\php\php.exe`.

### 1. Initialiser / Reinitialiser la Base de Donnees
```bash
cd PHP-App
php database/migrate.php
```
*Cree et peuple automatiquement la base persistante `database/smartbus.sqlite` avec les gares, trajets N3, chauffeurs, balises IoT, comptes utilisateurs et reservations de test.*

### 2. Demarrer le Serveur Web
```bash
php -S 127.0.0.1:8000 -t public
```
Puis ouvrez votre navigateur sur : [http://localhost:8000](http://localhost:8000)

---

## Identifiants d'Acces Pre-configures

| Role | Nom d'utilisateur | Mot de Passe | Tableau de Bord |
|---|---|---|---|
| **Administrateur** | `debora` | `Demodebora` | `/admin/index.php` |
| **Chauffeur** | `paul_driver` | `password123` | `/driver/index.php` |
| **Agent Guichet** | `agent_douala` | `password123` | `/agent/index.php` |
| **Client Voyageur** | `alice_customer` | `password123` | `/customer/index.php` |

---

## Fonctionnalites Implementees

### 1. Reservation et Choix du Siege
- Plan de cabine interactif VIP (32 sieges avec statut libre / occupe).
- Formulaire passager complet (Nom, CNI, Email, Telephone Mobile Money).
- Calcul dynamique du tarif et selection de la date de depart.

### 2. Paiement CamPay Mobile Money Securise
- Connexion cURL en direct avec `https://demo.campay.net`.
- Detection et support des operateurs MTN Mobile Money (`*126#`) et Orange Money (`#150*50#`).
- Ecran d'attente USSD avec affichage du code de validation operateur.
- Sondage automatique (polling) du statut de la transaction.
- **Regle stricte de securite** : Aucun bouton d'impression n'apparait avant le paiement, et le telechargement du billet est verrouille tant que le paiement n'est pas valide.
- Generation d'un titre de transport / Boarding Pass HTML elegant et imprimable avec code-barres et QR code de verification.

### 3. Cartographie Flotte Carto Voyager HD
- Integration de la cle API Carto : `cb1_43oe_1_75bd64c2f244c194ee1bc360`.
- 4 couches de cartes au choix : **Carto Voyager HD**, **Carto Dark Matter**, **Carto Positron**, et **OpenStreetMap**.
- Tracage du corridor autoroutier N3 Douala <-> Yaounde avec balises kilometriques et villes etapes (Edea, Boumnyebel, Pouma).
- Simulation de telemetrie IoT GPS en direct avec vitesse, cap et coordonnees.

### 4. Bilinguisme Integral (Francais & Anglais)
- Bascule instantanee de la langue via le selecteur d'en-tete (`?lang=fr` ou `?lang=en`).
- Persistance en session PHP (`$_SESSION['lang']`).
- Dictionnaire complet de traduction (`src/Language.php`).
- Langue par defaut : **Anglais (EN)**.

### 5. Suivi des Colis & Fret Express
- Recherche instantanee par numero d'expedition (ex: `PAR-2026-00125`).
- Historique d'acheminement aux checkpoints (Depot gare, Chargement en soute, En transit, Arrive).
- Telemetrie de la balise IoT associee (batterie, vitesse, geolocalisation).