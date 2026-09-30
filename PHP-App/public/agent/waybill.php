<?php
// PHP-App/public/agent/waybill.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Services/ParcelService.php';
require_once __DIR__ . '/../../src/Language.php';

$num = trim($_GET['num'] ?? '');
if (empty($num)) {
    die(Language::isEn() ? "Tracking reference missing." : "Numéro d'expédition manquant.");
}

$parcel = ParcelService::track($num);
if (!$parcel) {
    die(Language::isEn() ? "Consignment waybill not found for this parcel." : "Bordereau introuvable pour ce colis.");
}

$price = max(2500, (int)($parcel['weight_kg'] * 500));
$isEn = Language::isEn();
$currency = $isEn ? 'XAF' : 'FCFA';
?>
<!DOCTYPE html>
<html lang="<?= $isEn ? 'en' : 'fr' ?>">
<head>
  <meta charset="UTF-8">
  <title><?= t('waybill.title', "Bordereau d'Expédition Colis") ?> - <?= htmlspecialchars($parcel['tracking_number']) ?></title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; background: #f8fafc; color: #0f172a; }
    .waybill-card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #cbd5e1; }
    .header { background: #0B1E36; color: #ffffff; padding: 20px 28px; border-bottom: 4px solid #1d4ed8; display: flex; justify-content: space-between; align-items: center; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .logo-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 2px solid rgba(255,255,255,0.3); }
    .logo-text { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
    .logo-text span { color: #38bdf8; }
    .badge { background: #1d4ed8; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; font-family: monospace; }
    .body { padding: 26px; }
    .route-banner { display: flex; justify-content: space-between; align-items: center; background: #eff6ff; padding: 14px 20px; border-radius: 12px; border: 1px solid #bfdbfe; margin-bottom: 20px; }
    .station h4 { margin: 0; font-size: 15px; font-weight: 800; color: #1e3a8a; }
    .station p { margin: 2px 0 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
    .arrow { font-size: 20px; color: #1d4ed8; font-weight: bold; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px; }
    .item { padding: 12px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .item-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .item-val { font-size: 14px; font-weight: 800; color: #0f172a; }
    .barcode-section { border-top: 2px dashed #cbd5e1; padding-top: 18px; display: flex; justify-content: space-between; align-items: center; }
    .barcode { font-family: monospace; letter-spacing: 4px; font-size: 17px; font-weight: bold; color: #334155; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; }
    .sig-box { height: 60px; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 6px; background: #fafafa; }
    .footer { background: #f8fafc; padding: 12px 26px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; }
    @media print { body { background: none; padding: 0; } .waybill-card { box-shadow: none; border: 1px solid #000; } button { display: none; } }
  </style>
</head>
<body>
  <div class="waybill-card">
    <div class="header">
      <div class="logo-box">
        <img src="/assets/images/global_voyages_logo.jpg" alt="Logo" class="logo-img">
        <div class="logo-text">GLOBAL <span>VOYAGES</span> CARGO</div>
      </div>
      <div class="badge"><?= t('waybill.badge', "BORDEREAU D'EXPÉDITION") ?></div>
    </div>

    <div class="body">
      <div class="route-banner">
        <div class="station">
          <p><?= t('waybill.origin', 'Gare de Dépôt') ?></p>
          <h4><?= htmlspecialchars($parcel['origin_station']) ?></h4>
        </div>
        <div class="arrow">➔</div>
        <div class="station" style="text-align: right;">
          <p><?= t('waybill.dest', 'Gare de Destination') ?></p>
          <h4><?= htmlspecialchars($parcel['dest_station']) ?></h4>
        </div>
      </div>

      <div class="grid">
        <div class="item">
          <div class="item-label"><?= t('waybill.sender', 'Expéditeur') ?></div>
          <div class="item-val"><?= htmlspecialchars($parcel['sender_name']) ?></div>
          <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;"><?= htmlspecialchars($parcel['sender_phone']) ?></div>
        </div>

        <div class="item">
          <div class="item-label"><?= t('waybill.recipient', 'Destinataire') ?></div>
          <div class="item-val"><?= htmlspecialchars($parcel['recipient_name']) ?></div>
          <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;"><?= htmlspecialchars($parcel['recipient_phone']) ?></div>
        </div>

        <div class="item">
          <div class="item-label"><?= t('waybill.weight', 'Poids & Volume') ?></div>
          <div class="item-val"><?= $parcel['weight_kg'] ?> kg</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;"><?= t('waybill.fees', 'Frais :') ?> <strong><?= number_format($price, 0, ',', ' ') ?> <?= $currency ?></strong></div>
        </div>

        <div class="item">
          <div class="item-label"><?= t('waybill.declaredValue', 'Valeur Déclarée') ?></div>
          <div class="item-val" style="color:#059669;"><?= number_format($parcel['declared_value'], 0, ',', ' ') ?> <?= $currency ?></div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;"><?= t('waybill.insurance', 'Assurance Fret VIP incluse') ?></div>
        </div>

        <div class="item">
          <div class="item-label"><?= t('waybill.content', 'Contenu / Description') ?></div>
          <div class="item-val" style="font-size:12px;"><?= htmlspecialchars($parcel['description'] ?: t('waybill.standardParcel', 'Colis standard')) ?></div>
        </div>

        <div class="item">
          <div class="item-label"><?= t('waybill.tracker', 'Traceur IoT GPS') ?></div>
          <div class="item-val" style="font-family:monospace; color:#1d4ed8;"><?= htmlspecialchars($parcel['tracker_code'] ?: t('waybill.unassigned', 'Non assigné')) ?></div>
        </div>
      </div>

      <div class="barcode-section">
        <div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;"><?= t('waybill.trackingNum', 'Numéro de Suivi Colis') ?></div>
          <div class="barcode">*<?= htmlspecialchars($parcel['tracking_number']) ?>*</div>
        </div>
        <div style="text-align: right;">
          <span style="display:inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 11px; font-weight: bold;">
            <?= t('waybill.status', 'Statut :') ?> <?= htmlspecialchars($parcel['status']) ?>
          </span>
        </div>
      </div>

      <div class="signatures">
        <div>
          <strong><?= t('waybill.senderSig', 'Signature Expéditeur :') ?></strong>
          <div class="sig-box"></div>
        </div>
        <div>
          <strong><?= t('waybill.agentSig', 'Visa & Cachet Agent Guichet :') ?></strong>
          <div class="sig-box"></div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span><?= t('waybill.notice', 'Présentez ce bordereau ou le numéro de suivi pour le retrait du colis.') ?></span>
      <span>Global Voyages Cargo • Douala ↔ Yaoundé Express N3</span>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #0B1E36; color: #ffffff; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
      <?= t('waybill.print', "🖨️ Imprimer le Bordereau d'Expédition") ?>
    </button>
  </div>
</body>
</html>
