const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Perform Currency Exchange
exports.exchange = async (req, res) => {
    try {
        const { fromCurrency, toCurrency, amount } = req.body;
        const userId = req.user.id;

        // Get current exchange rate (you might want to fetch this from an external API)
        const rate = await getCurrentRate(fromCurrency, toCurrency);

        // Calculate converted amount
        const convertedAmount = amount * rate;

        // Check if user has sufficient balance
        const user = await User.findById(userId);
        if (user.balance[fromCurrency] < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Create transaction
        const transaction = new Transaction({
            user: userId,
            type: 'exchange',
            fromCurrency,
            toCurrency,
            fromAmount: amount,
            toAmount: convertedAmount,
            rate
        });

        // Update user balance
        user.balance[fromCurrency] -= amount;
        user.balance[toCurrency] += convertedAmount;

        await Promise.all([transaction.save(), user.save()]);

        res.json({
            message: 'Exchange successful',
            transaction,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get exchange rates
exports.getRates = async (req, res) => {
    try {
        // Fetch rates from external API
        const rates = await fetchExternalRates();
        res.json(rates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
