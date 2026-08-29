const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user/staff in-app notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'CUSTOMER') {
      query.$or = [{ userId: req.user._id }, { userId: null }];
    } else if (req.user.role === 'PARCEL_AGENT') {
      query.$or = [
        { userId: req.user._id },
        { stationId: req.user.stationId ? (req.user.stationId._id || req.user.stationId) : null },
        { role: 'PARCEL_AGENT' },
        { userId: null },
      ];
    } else {
      // ADMIN or DRIVER
      query.$or = [{ userId: req.user._id }, { role: req.user.role }, { userId: null }];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
