// API Configuration
const API_CONFIG = {
    development: 'http://127.0.0.1:5000',  // Reverted back to port 5000
    production: window.location.origin
};

// Determine environment based on hostname
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction ? API_CONFIG.production : API_CONFIG.development;

// API endpoints
export const API = {
    auth: {
        login: `${API_BASE_URL}/api/auth/login`,
        signup: `${API_BASE_URL}/api/auth/signup`,
        refresh: `${API_BASE_URL}/api/auth/refresh`
    },
    wallet: {
        balance: `${API_BASE_URL}/api/wallet/balance`,
        deposit: `${API_BASE_URL}/api/wallet/deposit`,
        withdraw: `${API_BASE_URL}/api/wallet/withdraw`,
        transfer: `${API_BASE_URL}/api/wallet/transfer`,
        transactions: `${API_BASE_URL}/api/wallet/transactions`
    },
    exchange: {
        rates: `${API_BASE_URL}/api/exchange/rates`,
        convert: `${API_BASE_URL}/api/exchange/convert`
    }
};

// API request helper
export async function apiRequest(endpoint, options = {}) {
    try {
        // Add default headers and CORS settings
        options = {
            ...options,
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        // Set timeout for request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        options.signal = controller.signal;

        try {
            const response = await fetch(endpoint, options);
            clearTimeout(timeout);

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                throw new Error('Connection timed out. Please check if the server is running.');
            }
            // Check if it's a connection error
            if (!window.navigator.onLine || fetchError.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please check if:\n1. The server is running\n2. You have an internet connection\n3. The server URL is correct');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('API request error:', error.message);
        throw error;
    }
}

// API endpoints configuration
const API_CONFIG = {
    baseUrl: 'http://localhost:3000/api', // Change this to your actual API base URL
    endpoints: {
        login: '/auth/login',
        signup: '/auth/signup',
        logout: '/auth/logout',
        validateToken: '/auth/validate-token'
    }
};

class ApiService {
    constructor() {
        this.baseUrl = 'https://api.exchangerate.host/latest'; // Free and reliable exchange rate API
    }

    // Authentication endpoints
    async login(credentials) {
        try {
            // Simulate API call (replace with your actual backend endpoint)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === credentials.email);
            
            if (!user || user.password !== credentials.password) {
                throw new Error('Invalid email or password');
            }

            const token = 'dummy-token-' + Date.now();
            return { user: { ...user, password: undefined }, token };
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async signup(userData) {
        try {
            // Simulate API call (replace with your actual backend endpoint)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            if (users.some(u => u.email === userData.email)) {
                throw new Error('Email already registered');
            }

            const newUser = { ...userData, id: Date.now() };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            const token = 'dummy-token-' + Date.now();
            return { user: { ...newUser, password: undefined }, token };
        } catch (error) {
            throw new Error(error.message || 'Signup failed');
        }
    }

    // Exchange rate endpoints
    async getExchangeRates(baseCurrency = 'USD') {
        try {
            const response = await fetch(`${this.baseUrl}?base=${baseCurrency}`);
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();
            if (!data.success) throw new Error('Failed to fetch exchange rates');
            return {
                rates: data.rates,
                timestamp: data.date
            };
        } catch (error) {
            console.error('Exchange rate error:', error);
            throw new Error('Failed to fetch exchange rates. Please try again later.');
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            if (!amount || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            const rates = await this.getExchangeRates(fromCurrency);
            const rate = rates.rates[toCurrency];
            
            if (!rate) {
                throw new Error('Invalid currency pair');
            }

            const convertedAmount = amount * rate;
            
            return {
                amount: convertedAmount,
                rate: rate,
                timestamp: rates.timestamp
            };
        } catch (error) {
            console.error('Conversion error:', error);
            throw new Error(error.message || 'Currency conversion failed. Please try again.');
        }
    }
}

export const apiService = new ApiService(); 