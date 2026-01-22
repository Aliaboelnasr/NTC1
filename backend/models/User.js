const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    balances: {
        type: Map,
        of: Number,
        default: {
            USD: 0,
            EUR: 0,
            GBP: 0
        }
    },
    pendingBalances: {
        type: Map,
        of: Number,
        default: {
            USD: 0,
            EUR: 0,
            GBP: 0
        }
    },
    transactionCount: {
        type: Number,
        default: 0
    },
    lastTransactionDate: Date,
    accountLevel: {
        type: String,
        enum: ['basic', 'silver', 'gold', 'platinum'],
        default: 'basic'
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    activityMetrics: {
        loginStreak: {
            currentStreak: { type: Number, default: 0 },
            lastLoginDate: Date,
            maxStreak: { type: Number, default: 0 }
        },
        exchangeMetrics: {
            totalVolume: { type: Number, default: 0 },
            monthlyVolume: { type: Number, default: 0 },
            totalTrades: { type: Number, default: 0 },
            lastTradeDate: Date
        },
        referralMetrics: {
            referralCount: { type: Number, default: 0 },
            activeReferrals: { type: Number, default: 0 },
            totalReferralEarnings: { type: Number, default: 0 }
        },
        profileCompletion: {
            type: Number,  // Percentage of profile completed
            default: 0
        },
        verificationLevel: {
            type: Number,  // 0: None, 1: Basic, 2: Advanced, 3: Full
            default: 0
        },
        communityPoints: {
            type: Number,
            default: 0
        },
        lastActivityDate: Date
    },
    earnedRewards: [{
        type: { type: String },
        amount: Number,
        currency: String,
        date: { type: Date, default: Date.now },
        description: String
    }],
    balance: {
        type: Number,
        default: 0,
        min: 0
    }
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to update balance
userSchema.methods.updateBalance = async function(amount) {
    const newBalance = this.balance + amount;
    if (newBalance < 0) {
        throw new Error('Insufficient balance');
    }
    this.balance = newBalance;
    await this.save();
    return this.balance;
};

// Add methods to track and update activities
userSchema.methods.updateLoginStreak = async function() {
    const today = new Date();
    const lastLogin = this.activityMetrics.loginStreak.lastLoginDate;
    
    if (lastLogin) {
        const daysSinceLastLogin = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastLogin === 1) {
            // Continue streak
            this.activityMetrics.loginStreak.currentStreak += 1;
        } else if (daysSinceLastLogin > 1) {
            // Reset streak
            this.activityMetrics.loginStreak.currentStreak = 1;
        }
    } else {
        // First login
        this.activityMetrics.loginStreak.currentStreak = 1;
    }
    
    // Update max streak if current is higher
    if (this.activityMetrics.loginStreak.currentStreak > this.activityMetrics.loginStreak.maxStreak) {
        this.activityMetrics.loginStreak.maxStreak = this.activityMetrics.loginStreak.currentStreak;
    }
    
    this.activityMetrics.loginStreak.lastLoginDate = today;
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
