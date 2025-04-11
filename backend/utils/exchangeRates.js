const axios = require('axios');

async function getExchangeRate(fromCurrency, toCurrency) {
    try {
        const response = await axios.get(
            `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
        );
        return response.data.rates[toCurrency];
    } catch (error) {
        throw new Error('Failed to fetch exchange rate');
    }
}

module.exports = { getExchangeRate }; 