const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
    baseCurrency: {
        type: String,
        required: true,
        uppercase: true
    },
    targetCurrency: {
        type: String,
        required: true,
        uppercase: true
    },
    rate: {
        type: Number,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        required: true,
        default: 'system'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for faster currency pair lookups
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1 }, { unique: true });
exchangeRateSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema); 