const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        try {
            const payment = await Payment.findOne({
                paymentId: paymentIntent.id
            });

            if (payment) {
                payment.status = 'completed';
                await payment.save();

                const user = await User.findById(payment.user);
                user.balance[payment.currency] += payment.amount;
                await user.save();
            }
        } catch (error) {
            console.error('Error processing payment success:', error);
        }
    }

    res.json({ received: true });
}; 