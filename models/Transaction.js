const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'transfer', 'exchange'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'wallet'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    reference: {
        type: String,
        unique: true
    },
    // For exchange transactions
    exchangeDetails: {
        fromCurrency: String,
        toCurrency: String,
        exchangeRate: Number,
        convertedAmount: Number
    },
    // For transfer transactions
    transferDetails: {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        recipientName: String
    },
    // For payment processing
    paymentDetails: {
        transactionId: String,
        paymentProvider: String,
        paymentStatus: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ reference: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 