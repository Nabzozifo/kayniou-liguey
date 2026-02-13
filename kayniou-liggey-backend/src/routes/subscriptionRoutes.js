const express = require('express');
const router = express.Router();
const {
    getPlans,
    subscribe,
    cancelSubscription,
    getSubscriptionStatus
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

router.get('/plans', getPlans);
router.post('/subscribe', protect, subscribe);
router.post('/cancel', protect, cancelSubscription);
router.get('/status', protect, getSubscriptionStatus);

module.exports = router;
