const mongoose = require('mongoose');

const activityRewardSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'login_streak',          // Daily login rewards
            'first_exchange',        // First currency exchange
            'exchange_volume',       // Based on exchange volume
            'referral',             // Referral rewards
            'profile_completion',    // Complete profile
            'verification_level',    // KYC verification
            'trading_activity',      // Regular trading
            'market_analysis',       // Contributing market analysis
            'community_engagement'   // Forum participation, etc.
        ],
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    amount: {
        type: Number,
        required: true
    },
    conditions: {
        minAmount: Number,          // Minimum amount for exchange volume
        streakDays: Number,         // Required days for streak
        activityCount: Number       // Required number of activities
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('ActivityReward', activityRewardSchema); 