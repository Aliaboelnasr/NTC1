const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    initializePayment,
    confirmPayment
} = require('../controllers/paymentController');

router.post('/initialize', protect, initializePayment);
router.post('/confirm', protect, confirmPayment);

module.exports = router; 