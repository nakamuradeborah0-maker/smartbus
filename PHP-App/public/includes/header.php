<?php
// PHP-App/public/includes/header.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Auth.php';

$currLang = Language::current();
$user = Auth::user();
?>
<!DOCTYPE html>
<html lang="<?= $currLang ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= APP_NAME ?> - <?= APP_TAGLINE ?></title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Leaflet CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Custom Styles -->
  <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/style.css">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              dark: '#0B1E36',
              primary: '#1d4ed8',
              accent: '#38bdf8',
              emerald: '#059669',
              amber: '#d97706'
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col antialiased">

  <!-- TOP BRAND NAV (VIA RAIL MINIMALIST INSPIRATION) -->
  <header class="bg-[#0B1E36] text-white sticky top-0 z-40 shadow-md border-b-2 border-blue-600">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      
      <!-- Logo -->
      <a href="<?= BASE_URL ?>/index.php" class="flex items-center gap-2.5 text-white hover:opacity-90 transition">
        <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-xs">
          GV
        </div>
        <div>
          <span class="text-base sm:text-lg font-black tracking-tight block leading-tight">
            GLOBAL <span class="text-sky-400">VOYAGES</span>
          </span>
          <span class="text-[9px] text-slate-300 font-mono tracking-widest block uppercase">
            VIP Intercity & Cargo
          </span>
        </div>
      </a>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-6 text-xs font-bold text-slate-200">
        <a href="<?= BASE_URL ?>/index.php#departures" class="hover:text-sky-400 transition"><?= t('nav.routes', 'Lignes & Horaires') ?></a>
        <a href="<?= BASE_URL ?>/index.php#tracking" class="hover:text-sky-400 transition"><?= t('nav.tracking', 'Suivi Colis & IoT') ?></a>
        <a href="<?= BASE_URL ?>/index.php#live-map" class="hover:text-sky-400 transition flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span><?= t('hero.tabMap', 'Carte Flotte') ?></span>
        </a>
      </nav>

      <!-- Right Controls: Language Switcher & Auth Profile -->
      <div class="flex items-center gap-3">
        <!-- Language Switcher -->
        <div class="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/20 text-xs font-bold font-mono">
          <a href="?lang=fr" class="px-2 py-1 rounded <?= $currLang === 'fr' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white' ?>">FR</a>
          <a href="?lang=en" class="px-2 py-1 rounded <?= $currLang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white' ?>">EN</a>
        </div>

        <?php if ($user): ?>
          <!-- Logged In User Dropdown -->
          <div class="relative group">
            <button type="button" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="max-w-[120px] truncate"><?= htmlspecialchars($user['name']) ?></span>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
            </button>
            <div class="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-800 hidden group-hover:block z-50 animate-fadeIn">
              <div class="px-3 py-2 border-b border-slate-100">
                <span class="text-[10px] text-slate-400 uppercase font-bold block"><?= t('role.' . strtolower($user['role']), $user['role']) ?></span>
                <span class="font-bold text-slate-900"><?= htmlspecialchars($user['username']) ?></span>
              </div>
              <?php
                $dashUrl = BASE_URL . '/customer/index.php';
                if ($user['role'] === 'ADMIN') $dashUrl = BASE_URL . '/admin/index.php';
                elseif ($user['role'] === 'DRIVER') $dashUrl = BASE_URL . '/driver/index.php';
                elseif ($user['role'] === 'PARCEL_AGENT') $dashUrl = BASE_URL . '/agent/index.php';
              ?>
              <a href="<?= $dashUrl ?>" class="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-blue-700">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                <span><?= t('nav.myAccount', 'Tableau de Bord') ?></span>
              </a>
              <a href="<?= BASE_URL ?>/logout.php" class="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span><?= t('nav.logout', 'Déconnexion') ?></span>
              </a>
            </div>
          </div>
        <?php else: ?>
          <!-- Login Button -->
          <a href="<?= BASE_URL ?>/login.php" class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5">
            <i data-lucide="user" class="w-3.5 h-3.5"></i>
            <span><?= t('nav.login', 'Connexion') ?></span>
          </a>
        <?php endif; ?>
      </div>
    </div>
  </header>
  <main class="flex-grow">
