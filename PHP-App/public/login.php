<?php
// PHP-App/public/login.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Language.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $roleQuick = $_POST['role_login'] ?? null;
    if ($roleQuick) {
        if (Auth::loginAsRole($roleQuick)) {
            redirectToRole(Auth::role());
        } else {
            $error = 'Rôle introuvable en base.';
        }
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if (Auth::login($username, $password)) {
            redirectToRole(Auth::role());
        } else {
            $error = Language::isEn() ? 'Invalid credentials. Use debora / Demodebora' : 'Identifiants invalides. Utilisez debora / Demodebora';
        }
    }
}

function redirectToRole(?string $role) {
    if ($role === 'ADMIN') header('Location: ' . BASE_URL . '/admin/index.php');
    elseif ($role === 'DRIVER') header('Location: ' . BASE_URL . '/driver/index.php');
    elseif ($role === 'PARCEL_AGENT') header('Location: ' . BASE_URL . '/agent/index.php');
    else header('Location: ' . BASE_URL . '/customer/index.php');
    exit;
}

include __DIR__ . '/includes/header.php';
?>

<div class="max-w-md mx-auto px-4 py-16 animate-fadeIn">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
    <!-- Header -->
    <div class="bg-[#0B1E36] text-white p-6 border-b-2 border-blue-600 text-center">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md border-2 border-white/20 object-cover">
      <h2 class="text-xl font-black tracking-tight text-white"><?= t('nav.login', 'Connexion Sécurisée') ?></h2>
      <p class="text-xs text-slate-300 mt-1">Accédez à votre espace Global Voyages</p>
    </div>

    <div class="p-6 space-y-6">
      <?php if ($error): ?>
        <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
          <span><?= htmlspecialchars($error) ?></span>
        </div>
      <?php endif; ?>

      <!-- 1-Click Role Switcher for Demo -->
      <div class="space-y-2">
        <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
          Accès Démo Instantané (1 Clic)
        </label>
        <form method="POST" class="grid grid-cols-2 gap-2 text-xs">
          <button type="submit" name="role_login" value="ADMIN" class="p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Admin (debora)</span>
          </button>
          <button type="submit" name="role_login" value="DRIVER" class="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Chauffeur</span>
          </button>
          <button type="submit" name="role_login" value="PARCEL_AGENT" class="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Agent Colis</span>
          </button>
          <button type="submit" name="role_login" value="CUSTOMER" class="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Client Voyageur</span>
          </button>
        </form>
      </div>

      <div class="relative flex items-center justify-center">
        <div class="border-t border-slate-200 w-full"></div>
        <span class="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">ou par identifiant</span>
      </div>

      <!-- Credentials Form -->
      <form method="POST" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Identifiant ou Email</label>
          <input type="text" name="username" required value="debora"
            class="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
            placeholder="debora">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
          <input type="password" name="password" required value="Demodebora"
            class="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition"
            placeholder="Demodebora">
        </div>

        <button type="submit" class="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer">
          Se Connecter
        </button>
      </form>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
