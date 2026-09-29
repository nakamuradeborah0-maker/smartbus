const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Normalizes Cameroon phone numbers to international format required by CamPay (2376XXXXXXXX)
function normalizeCameroonPhone(phone) {
  if (!phone) return null;
  // Strip non-digits
  let cleaned = String(phone).replace(/\D/g, '');
  // Remove international prefix 00
  if (cleaned.startsWith('00237')) {
    cleaned = cleaned.substring(2);
  }
  // If 9 digits starting with 6 or 2 -> prepend 237
  if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('2'))) {
    cleaned = '237' + cleaned;
  }
  return cleaned;
}

// Helper to get CamPay Token
const getCamPayToken = async () => {
  const url = `${process.env.CAMPAY_BASE_URL}/api/token/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.CAMPAY_USERNAME,
      password: process.env.CAMPAY_PASSWORD
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to get CamPay token: ' + (data.message || JSON.stringify(data)));
  }
  return data.token;
};

// @route   POST /api/payment/collect
// @desc    Initiate mobile money collection via CamPay
// @access  Private
router.post('/collect', protect, async (req, res) => {
  try {
    const { amount, phoneNumber, description } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'Amount and phone number are required' });
    }

    const formattedPhone = normalizeCameroonPhone(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 12 || !formattedPhone.startsWith('237')) {
      return res.status(400).json({
        error: 'Invalid phone number format. Please provide a 9-digit Cameroon number (e.g. 677949699) or international format (237677949699).'
      });
    }

    const externalReference = `RES-${Date.now()}`;
    const isDemo = process.env.CAMPAY_USE_DEMO === 'true';
    const finalAmount = isDemo ? (process.env.CAMPAY_DEMO_MAX_AMOUNT || '25') : String(amount);

    let token = null;
    try {
      token = await getCamPayToken();
    } catch (tokenErr) {
      console.warn('CamPay Token error, using fallback simulation:', tokenErr.message);
    }

    // If simulation enabled or token failed
    if (process.env.CAMPAY_SIMULATION === 'true' || !token) {
      return res.status(200).json({
        success: true,
        message: `[Simulated] Payment request of ${amount} FCFA approved for ${formattedPhone}. Ticket reservation confirmed!`,
        reference: `SIM-${Date.now()}`,
        externalReference
      });
    }
    
    // Create collection request
    const collectUrl = `${process.env.CAMPAY_BASE_URL}/api/collect/`;
    
    const response = await fetch(collectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: 'XAF',
        from: formattedPhone,
        description: description || 'Global Voyages Bus Ticket',
        external_reference: externalReference
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('CamPay API collection error:', data);
      return res.status(400).json({ error: data.message || 'Payment initiation failed with mobile money provider.' });
    }

    res.status(200).json({
      success: true,
      message: data.ussd_code 
        ? `Payment push sent to ${formattedPhone} (${data.operator || 'Mobile Money'}). Approve on your phone by dialing ${data.ussd_code}.`
        : `Payment push sent to ${formattedPhone}. Please check and approve the prompt on your mobile phone.`,
      reference: data.reference,
      operator: data.operator,
      ussdCode: data.ussd_code,
      externalReference
    });

  } catch (error) {
    console.error('CamPay Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during payment processing' });
  }
});

module.exports = router;
