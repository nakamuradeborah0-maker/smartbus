const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Optional auth helper
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

// Normalizes Cameroon phone numbers to international format required by CamPay (2376XXXXXXXX)
function normalizeCameroonPhone(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('00237')) {
    cleaned = cleaned.substring(2);
  }
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
// @access  Public / Authenticated
router.post('/collect', optionalAuth, async (req, res) => {
  try {
    const { amount, phoneNumber, description, bookingReference } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'Amount and phone number are required' });
    }

    const formattedPhone = normalizeCameroonPhone(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 12 || !formattedPhone.startsWith('237')) {
      return res.status(400).json({
        error: 'Invalid phone number format. Please provide a 9-digit Cameroon number (e.g. 677949699) or international format (237677949699).'
      });
    }

    const externalReference = bookingReference || `GV-${Date.now()}`;
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
      const simRef = `SIM-${Date.now()}`;
      if (bookingReference) {
        await Booking.findOneAndUpdate(
          { bookingReference },
          { campayReference: simRef, campayOperator: 'MTN', campayUssdCode: '*126#' }
        );
      }
      return res.status(200).json({
        success: true,
        message: `[Simulated] Payment request of ${amount} FCFA approved for ${formattedPhone}.`,
        reference: simRef,
        operator: 'MTN',
        ussdCode: '*126#',
        externalReference,
        status: 'PENDING'
      });
    }
    
    // Create collection request with CamPay
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

    // If bookingReference was supplied, update the booking with campay reference
    if (bookingReference && data.reference) {
      await Booking.findOneAndUpdate(
        { bookingReference },
        {
          campayReference: data.reference,
          campayOperator: data.operator || '',
          campayUssdCode: data.ussd_code || ''
        }
      );
    }

    res.status(200).json({
      success: true,
      message: data.ussd_code 
        ? `Payment push sent to ${formattedPhone} (${data.operator || 'Mobile Money'}). Approve on your phone by dialing ${data.ussd_code}.`
        : `Payment push sent to ${formattedPhone}. Please check and approve the prompt on your mobile phone.`,
      reference: data.reference,
      operator: data.operator,
      ussdCode: data.ussd_code,
      externalReference,
      status: 'PENDING'
    });

  } catch (error) {
    console.error('CamPay Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during payment processing' });
  }
});

// @route   GET /api/payment/status/:reference
// @desc    Check transaction status from CamPay
// @access  Public
router.get('/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    // Check if it is a simulated reference
    if (reference.startsWith('SIM-')) {
      return res.json({
        reference,
        status: 'SUCCESSFUL',
        amount: '5000',
        currency: 'XAF',
        operator: 'MTN'
      });
    }

    let token = await getCamPayToken();
    const statusUrl = `${process.env.CAMPAY_BASE_URL}/api/transaction/${reference}/`;
    
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Failed to check transaction status with CamPay' });
    }

    // If status is SUCCESSFUL, automatically update matching booking to PAID
    if (data.status === 'SUCCESSFUL') {
      await Booking.findOneAndUpdate(
        { $or: [{ campayReference: reference }, { externalReference: data.external_reference }] },
        { paymentStatus: 'PAID', updatedAt: Date.now() }
      );
    }

    res.json({
      reference: data.reference,
      status: data.status, // 'SUCCESSFUL' | 'PENDING' | 'FAILED'
      operator: data.operator,
      amount: data.amount,
      externalReference: data.external_reference,
      reason: data.reason
    });

  } catch (error) {
    console.error('Check CamPay Status Error:', error);
    res.status(500).json({ error: error.message || 'Error checking payment status' });
  }
});

// @route   POST /api/payment/confirm-demo
// @desc    One-click confirmation for demo/testing mode when user validated on phone
// @access  Public
router.post('/confirm-demo', async (req, res) => {
  try {
    const { reference, bookingReference } = req.body;
    
    let booking = null;
    if (bookingReference) {
      booking = await Booking.findOne({ bookingReference });
    } else if (reference) {
      booking = await Booking.findOne({
        $or: [
          { campayReference: reference },
          { bookingReference: reference },
          { externalReference: reference }
        ]
      });
    }

    if (booking) {
      booking.paymentStatus = 'PAID';
      booking.updatedAt = Date.now();
      await booking.save();
    }

    res.json({
      success: true,
      status: 'SUCCESSFUL',
      message: 'Payment confirmed and ticket issued in database.',
      booking
    });
  } catch (error) {
    console.error('Confirm demo error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
