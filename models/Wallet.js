const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balances: [{
        currency: {
            type: String,
            required: true,
            uppercase: true
        },
        amount: {
            type: Number,
            required: true,
            default: 0
        }
    }],
    defaultCurrency: {
        type: String,
        required: true,
        default: 'USD',
        uppercase: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'closed'],
        default: 'active'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
walletSchema.index({ userId: 1 });
walletSchema.index({ 'balances.currency': 1 });

module.exports = mongoose.model('Wallet', walletSchema); 