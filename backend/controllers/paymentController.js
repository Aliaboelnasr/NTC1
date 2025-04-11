const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');

// Initialize payment methods
exports.initializePayment = async (req, res) => {
    try {
        const { amount, currency, method } = req.body;
        const userId = req.user.id;

        let paymentIntent;
        let response;

        switch (method) {
            case 'stripe':
                // Create Stripe Payment Intent
                paymentIntent = await stripe.paymentIntents.create({
                    amount: amount * 100, // Stripe uses cents
                    currency: currency.toLowerCase(),
                    metadata: { userId }
                });

                response = {
                    clientSecret: paymentIntent.client_secret,
                    paymentId: paymentIntent.id
                };
                break;

            case 'instapay':
                // Initialize Instapay payment (implement according to Instapay API)
                response = {
                    paymentUrl: `${process.env.INSTAPAY_URL}/pay`,
                    referenceNumber: generateReferenceNumber()
                };
                break;

            case 'fawry':
                // Initialize Fawry payment
                response = {
                    paymentUrl: `${process.env.FAWRY_URL}/pay`,
                    referenceNumber: generateReferenceNumber()
                };
                break;

            default:
                return res.status(400).json({ message: 'Invalid payment method' });
        }

        // Create payment record
        const payment = await Payment.create({
            user: userId,
            amount,
            currency,
            method,
            paymentId: response.paymentId || response.referenceNumber,
            paymentDetails: response
        });

        res.json({
            message: 'Payment initialized',
            payment,
            ...response
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Confirm payment and update user balance
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentId, paymentMethod } = req.body;
        const userId = req.user.id;

        const payment = await Payment.findOne({ paymentId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update payment status and user balance
        payment.status = 'completed';
        user.balance[payment.currency] += payment.amount;

        await Promise.all([payment.save(), user.save()]);

        res.json({
            message: 'Payment confirmed successfully',
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to generate reference number
function generateReferenceNumber() {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 