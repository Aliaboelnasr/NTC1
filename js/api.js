const API_URL = 'http://localhost:5000/api';

// Authentication API calls
export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    return response.json();
};

export const register = async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });
    return response.json();
};

// Exchange API calls
export const performExchange = async (exchangeData, token) => {
    const response = await fetch(`${API_URL}/exchange`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(exchangeData)
    });
    return response.json();
};

// Transaction API calls
export const getTransactions = async (token) => {
    const response = await fetch(`${API_URL}/transactions`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}; 