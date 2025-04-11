const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get user wallet info
exports.getWalletInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('balances')
            .lean();

        res.json({
            success: true,
            balances: user.balances
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
    try {
        const { type, amount, fromCurrency, toCurrency, paymentMethod } = req.body;
        const userId = req.user.id;

        // Start session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await User.findById(userId).session(session);

            // Validate balance for withdrawals and transfers
            if (type !== 'deposit') {
                if (user.balances[fromCurrency] < amount) {
                    throw new Error('Insufficient balance');
                }
            }

            // Create transaction record
            const transaction = await Transaction.create([{
                user: userId,
                type,
                amount,
                fromCurrency,
                toCurrency,
                paymentMethod,
                status: 'completed'
            }], { session });

            // Update user balance
            if (type === 'deposit') {
                user.balances[toCurrency] += amount;
            } else if (type === 'withdrawal') {
                user.balances[fromCurrency] -= amount;
            } else if (type === 'transfer') {
                const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
                user.balances[fromCurrency] -= amount;
                user.balances[toCurrency] += amount * exchangeRate;
            }

            await user.save({ session });
            await session.commitTransaction();

            res.json({
                success: true,
                transaction: transaction[0],
                newBalances: user.balances
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
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