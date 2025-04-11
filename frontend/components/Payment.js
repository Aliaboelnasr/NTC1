import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    CardElement,
    Elements,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('your_publishable_key');

const PaymentForm = () => {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Initialize payment
            const response = await fetch('/api/payment/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    currency,
                    method: paymentMethod
                })
            });

            const data = await response.json();

            if (paymentMethod === 'stripe') {
                // Handle Stripe payment
                const result = await stripe.confirmCardPayment(data.clientSecret, {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    }
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }

                // Confirm payment with backend
                await confirmPayment(data.paymentId);
            } else {
                // Handle other payment methods
                window.location.href = data.paymentUrl;
            }

            // Show success message
            alert('Payment successful!');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-form">
            <h2>Add Funds to Your Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="form-control"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Currency</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="form-control"
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Payment Method</label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="form-control"
                    >
                        <option value="stripe">Credit/Debit Card</option>
                        <option value="instapay">InstaPay</option>
                        <option value="fawry">Fawry</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>

                {paymentMethod === 'stripe' && (
                    <div className="form-group">
                        <label>Card Details</label>
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                            color: '#aab7c4'
                                        }
                                    },
                                    invalid: {
                                        color: '#9e2146'
                                    }
                                }
                            }}
                        />
                    </div>
                )}

                {error && <div className="alert alert-danger">{error}</div>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Pay Now'}
                </button>
            </form>
        </div>
    );
};

const Payment = () => (
    <Elements stripe={stripePromise}>
        <PaymentForm />
    </Elements>
);

export default Payment; 