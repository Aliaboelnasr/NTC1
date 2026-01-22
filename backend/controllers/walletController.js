const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const ActivityService = require('../services/activityService');

// Get wallet info with real-time balances
exports.getWalletInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const transactions = await Transaction.find({ 
            user: req.user.id 
        })
        .sort({ createdAt: -1 })
        .limit(10);

        res.json({
            success: true,
            data: {
                balance: user.balance,
                pendingBalance: user.pendingBalance,
                transactions: transactions,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user transactions
exports.getTransactions = async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.query;
        
        let query = { user: req.user.id };
        if (type && type !== 'all') {
            query.type = type;
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { type, amount, currency, description, toCurrency } = req.body;
        const user = await User.findById(req.user.id).session(session);

        // Validate amount
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        // Create transaction
        const transaction = new Transaction({
            user: user._id,
            type,
            amount,
            currency,
            description,
            toCurrency,
            status: 'pending'
        });

        // Handle different transaction types
        switch (type) {
            case 'deposit':
                await user.updateBalance(currency, amount, true);
                break;

            case 'withdrawal':
                // Check available balance
                if (user.balances.get(currency) < amount) {
                    throw new Error('Insufficient balance');
                }
                await user.updateBalance(currency, -amount);
                break;

            case 'exchange':
                if (!toCurrency) {
                    throw new Error('Target currency is required for exchange');
                }
                // Get exchange rate (implement your own exchange rate service)
                const rate = await getExchangeRate(currency, toCurrency);
                const convertedAmount = amount * rate;
                
                // Check if user has sufficient balance
                if (user.balances.get(currency) < amount) {
                    throw new Error('Insufficient balance');
                }
                
                // Update balances
                await user.updateBalance(currency, -amount);
                await user.updateBalance(toCurrency, convertedAmount);
                
                // Update transaction with conversion details
                transaction.metadata = {
                    exchangeRate: rate,
                    convertedAmount
                };
                break;
        }

        // Save transaction
        await transaction.save({ session });

        // Update user's transaction count and last transaction date
        user.transactionCount += 1;
        user.lastTransactionDate = new Date();
        await user.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.json({
            success: true,
            data: {
                transaction,
                newBalances: Object.fromEntries(user.balances),
                newPendingBalances: Object.fromEntries(user.pendingBalances)
            }
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

// Process pending transactions (should be called by admin or automated system)
exports.processPendingTransaction = async (req, res) => {
    const { transactionId, approved } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transaction = await Transaction.findById(transactionId).session(session);
        const user = await User.findById(transaction.user).session(session);

        if (transaction.status !== 'pending') {
            throw new Error('Transaction is not pending');
        }

        if (approved) {
            // Move amount from pending to actual balance for deposits
            if (transaction.type === 'deposit') {
                await user.updateBalance(transaction.currency, -transaction.amount, true); // Remove from pending
                await user.updateBalance(transaction.currency, transaction.amount); // Add to actual balance
            }
            transaction.status = 'completed';
        } else {
            // Reverse the transaction
            if (transaction.type === 'deposit') {
                await user.updateBalance(transaction.currency, -transaction.amount, true);
            } else if (transaction.type === 'withdrawal') {
                await user.updateBalance(transaction.currency, transaction.amount);
            }
            transaction.status = 'cancelled';
        }

        await transaction.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            data: {
                transaction,
                newBalances: Object.fromEntries(user.balances),
                newPendingBalances: Object.fromEntries(user.pendingBalances)
            }
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.getWalletData = async (req, res) => {
    try {
        // Get user data with populated transactions
        const user = await User.findById(req.user.id)
            .populate({
                path: 'transactions',
                options: { sort: { createdAt: -1 }, limit: 10 }
            });

        // Get latest exchange rates
        const exchangeRates = await getExchangeRates();

        // Format the response
        const response = {
            success: true,
            balances: user.balances,
            transactions: user.transactions.map(t => ({
                id: t._id,
                type: t.type,
                amount: t.amount,
                currency: t.currency,
                status: t.status,
                description: t.description,
                date: t.createdAt
            })),
            exchangeRates: exchangeRates,
            lastUpdated: new Date()
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet data',
            error: error.message
        });
    }
};

// Helper function to get exchange rates
async function getExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return {
            EUR: 1.1,
            GBP: 1.3,
            USD: 1
        };
    }
}

exports.createExchange = async (req, res) => {
    try {
        // ... existing exchange logic ...
        
        // Process exchange activity rewards
        await ActivityService.processExchangeActivity(
            req.user.id,
            amount,
            fromCurrency,
            toCurrency
        );
        
        res.json({
            success: true,
            transaction,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Handle deposit
exports.deposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, currency, paymentMethod } = req.body;
        const user = await User.findById(req.user.id).session(session);

        // Validate amount
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        // Create deposit transaction
        const transaction = new Transaction({
            user: user._id,
            type: 'deposit',
            amount: amount,
            currency: currency,
            paymentMethod: paymentMethod,
            balanceAfter: user.balance + amount,
            status: 'pending',
            description: `Deposit via ${paymentMethod}`
        });

        // Update user's pending balance
        user.pendingBalance += amount;
        
        await transaction.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            data: {
                transaction: transaction,
                newBalance: user.balance,
                pendingBalance: user.pendingBalance
            }
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

// Handle withdrawal
exports.withdraw = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, currency, paymentMethod, bankAccount } = req.body;
        const user = await User.findById(req.user.id).session(session);

        // Validate amount and balance
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        if (user.balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Create withdrawal transaction
        const transaction = new Transaction({
            user: user._id,
            type: 'withdrawal',
            amount: -amount, // Negative amount for withdrawal
            currency: currency,
            paymentMethod: paymentMethod,
            balanceAfter: user.balance - amount,
            status: 'pending',
            description: `Withdrawal to ${bankAccount}`,
            metadata: { bankAccount }
        });

        // Update user's balance immediately for withdrawals
        user.balance -= amount;
        
        await transaction.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            data: {
                transaction: transaction,
                newBalance: user.balance
            }
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

// Process pending transactions (admin only)
exports.processTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { transactionId, approved } = req.body;
        const transaction = await Transaction.findById(transactionId).session(session);
        const user = await User.findById(transaction.user).session(session);

        if (transaction.status !== 'pending') {
            throw new Error('Transaction is not pending');
        }

        if (approved) {
            if (transaction.type === 'deposit') {
                // Move amount from pending to actual balance
                user.pendingBalance -= transaction.amount;
                user.balance += transaction.amount;
                transaction.status = 'completed';
            }
        } else {
            if (transaction.type === 'deposit') {
                // Cancel pending deposit
                user.pendingBalance -= transaction.amount;
            } else if (transaction.type === 'withdrawal') {
                // Refund failed withdrawal
                user.balance += Math.abs(transaction.amount);
            }
            transaction.status = 'cancelled';
        }

        await transaction.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            data: {
                transaction: transaction,
                newBalance: user.balance,
                pendingBalance: user.pendingBalance
            }
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('balance');

        res.json({
            success: true,
            balance: user.balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.addMoney = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount } = req.body;
        
        // Validate amount
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }

        const user = await User.findById(req.user.id).session(session);
        
        // Update user's balance
        const newBalance = await user.updateBalance(amount);

        // Create transaction record
        const transaction = new Transaction({
            user: user._id,
            type: 'deposit',
            amount: amount,
            balanceAfter: newBalance,
            status: 'completed',
            description: 'Deposit to wallet'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Money added successfully',
            newBalance: newBalance,
            transaction: transaction
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.withdrawMoney = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount } = req.body;
        
        // Validate amount
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }

        const user = await User.findById(req.user.id).session(session);
        
        // Check if user has sufficient balance
        if (user.balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Update user's balance (negative amount for withdrawal)
        const newBalance = await user.updateBalance(-amount);

        // Create transaction record
        const transaction = new Transaction({
            user: user._id,
            type: 'withdrawal',
            amount: -amount,
            balanceAfter: newBalance,
            status: 'completed',
            description: 'Withdrawal from wallet'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Money withdrawn successfully',
            newBalance: newBalance,
            transaction: transaction
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.getTransactionHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ timestamp: -1 })
            .limit(10);

        res.json({
            success: true,
            transactions: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 