<?php
// PHP-App/public/includes/footer.php
?>
  </main>

  <!-- FOOTER -->
  <footer class="bg-[#0B1E36] text-white border-t-2 border-blue-600 pt-10 pb-8 mt-16 text-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <!-- Col 1 -->
        <div class="space-y-3">
          <div class="flex items-center gap-2.5">
            <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-8 h-8 rounded-lg object-cover border border-white/20">
            <span class="font-black text-base tracking-tight">GLOBAL <span class="text-sky-400">VOYAGES</span></span>
          </div>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            <?= t('footer.tagline') ?>
          </p>
        </div>

        <!-- Col 2 -->
        <div>
          <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-3"><?= t('footer.mainRoutes') ?></h4>
          <ul class="space-y-1.5 text-slate-300 text-[11px]">
            <li>• <?= t('footer.routeDlaYao') ?></li>
            <li>• <?= t('footer.routeYaoDla') ?></li>
            <li>• <?= t('footer.departuresFreq') ?></li>
            <li>• <?= t('footer.escaleBoum') ?></li>
          </ul>
        </div>

        <!-- Col 3 -->
        <div>
          <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-3"><?= t('footer.securePayment') ?></h4>
          <div class="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div class="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>CamPay Mobile Money API</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">
              <?= t('footer.campayDesc') ?>
            </p>
          </div>
        </div>

        <!-- Col 4 -->
        <div>
          <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-3"><?= t('footer.support') ?></h4>
          <p class="text-slate-300 text-[11px] mb-2"><?= t('footer.customerService') ?></p>
          <p class="font-mono font-bold text-sky-400 text-sm mb-1">+237 233 42 11 00</p>
          <p class="text-[10px] text-slate-400">support@globalvoyage.com</p>
        </div>
      </div>

      <div class="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
        <span>© <?= date('Y') ?> Global Voyages VIP Cameroon. <?= t('footer.copyright') ?></span>
        <span>Cartographie Carto Voyager HD • Powered by PHP 8.2 & CamPay</span>
      </div>
    </div>
  </footer>

  <!-- Lucide Icons Replacement Script -->
  <script>
    if (window.lucide) {
      lucide.createIcons();
    }
  </script>
</body>
</html>
