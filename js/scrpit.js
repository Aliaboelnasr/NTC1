import { API, apiRequest } from './api.js';
import { showToast } from './utils.js';

// Initialize historical data for charts
const historicalData = {
    EUR: [],
    GBP: [],
    JPY: [],
    CAD: []
};

let chartInstances = {};

// Initialize charts for each currency
function initializeChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const chart = LightweightCharts.createChart(container, {
        width: 200,
        height: 60,
        layout: {
            background: { color: 'transparent' },
            textColor: '#333',
        },
        grid: {
            vertLines: { visible: false },
            horzLines: { visible: false }
        },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        handleScroll: false,
        handleScale: false
    });

    const lineSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
    });

    lineSeries.setData(data);
    return { chart, lineSeries };
}

// Update chart with new data
function updateChart(currency, price) {
    if (!chartInstances[currency]) return;

    const time = new Date().getTime() / 1000;
    historicalData[currency].push({ time, value: price });

    // Keep only last 100 data points
    if (historicalData[currency].length > 100) {
        historicalData[currency].shift();
    }

    chartInstances[currency].lineSeries.setData(historicalData[currency]);
}

// Calculate price change percentage
function calculateChange(currentPrice, previousPrice) {
    return ((currentPrice - previousPrice) / previousPrice) * 100;
}

// Fetch exchange rates and update UI
async function fetchExchangeRates() {
    try {
        const response = await apiRequest(API.exchange.rates);
        const rates = response.rates;

        const currencies = {
            EUR: { name: 'Euro', flag: './images/flags/eu.png' },
            GBP: { name: 'British Pound', flag: './images/flags/gb.png' },
            JPY: { name: 'Japanese Yen', flag: './images/flags/jp.png' },
            CAD: { name: 'Canadian Dollar', flag: './images/flags/ca.png' }
        };

        const tableBody = document.querySelector('#live-rates tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        for (const [currency, info] of Object.entries(currencies)) {
            if (!rates[currency]) continue;

            const rate = rates[currency];
            const previousRate = historicalData[currency].length > 0 
                ? historicalData[currency][historicalData[currency].length - 1].value 
                : rate;
            const change = calculateChange(rate, previousRate);

            // Initialize chart if not exists
            if (!chartInstances[currency]) {
                chartInstances[currency] = initializeChart(`${currency}Chart`, historicalData[currency]);
            }

            // Update chart data
            updateChart(currency, rate);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${info.flag}" alt="${currency} flag" class="currency-flag">
                    ${currency}
                </td>
                <td class="rate" data-rate="${rate}">${rate.toFixed(4)}</td>
                <td class="change ${change >= 0 ? 'positive' : 'negative'}">
                    ${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
                </td>
                <td>
                    <div id="${currency}Chart" class="mini-chart"></div>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="window.location.href='exchange.html?from=USD&to=${currency}'">
                        Exchange
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        showToast('Error fetching exchange rates. Please try again later.', 'error');
    }
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    const rates = document.querySelectorAll('.rate');
    rates.forEach(rateElement => {
        const currentRate = parseFloat(rateElement.dataset.rate);
        const change = (Math.random() - 0.5) * 0.001; // Small random change
        const newRate = currentRate + change;
        
        rateElement.dataset.rate = newRate.toString();
        rateElement.textContent = newRate.toFixed(4);
        
        const changeCell = rateElement.nextElementSibling;
        const changeValue = ((newRate - currentRate) / currentRate) * 100;
        
        changeCell.className = `change ${changeValue >= 0 ? 'positive' : 'negative'}`;
        changeCell.innerHTML = `${changeValue >= 0 ? '▲' : '▼'} ${Math.abs(changeValue).toFixed(2)}%`;
        
        // Update chart
        const currency = rateElement.parentElement.firstElementChild.textContent.trim();
        updateChart(currency, newRate);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize carousel
    const carousel = new bootstrap.Carousel(document.getElementById('moneyNewsCarousel'), {
        interval: 5000,
        wrap: true,
        touch: true
    });

    // Initialize exchange rates
    await fetchExchangeRates();
    
    // Fetch real rates every minute
    setInterval(fetchExchangeRates, 60000);
    
    // Simulate updates every 2 seconds
    setInterval(simulateRealTimeUpdates, 2000);

    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            try {
                await window.auth.login(email, password);
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();
                showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                showToast('Invalid email or password!', 'error');
            }
        });
    }

    // Initialize signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validate password match
            if (password !== confirmPassword) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            // Validate password strength
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                showToast('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character!', 'error');
                return;
            }

            try {
                await window.auth.signup(name, email, password);
                const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                signupModal.hide();
                showToast('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                showToast('Error creating account. Please try again.', 'error');
            }
        });
    }

    // Initialize logout buttons
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.auth.logout();
            showToast('Logged out successfully!', 'success');
        });
    });

    // Update UI based on auth state
    updateAuthUI();
});

// Update UI based on authentication state
function updateAuthUI() {
    const isAuthenticated = window.auth.isAuthenticated;
    const authButtons = document.querySelectorAll('[data-auth-required]');
    const guestButtons = document.querySelectorAll('[data-guest-only]');
    const userNameElements = document.querySelectorAll('.user-name');

    if (isAuthenticated) {
        authButtons.forEach(btn => btn.style.display = 'block');
        guestButtons.forEach(btn => btn.style.display = 'none');
        userNameElements.forEach(el => el.textContent = window.auth.userName);
    } else {
        authButtons.forEach(btn => btn.style.display = 'none');
        guestButtons.forEach(btn => btn.style.display = 'block');
        userNameElements.forEach(el => el.textContent = '');
    }
}

// Export functions for use in other modules
export {
    fetchExchangeRates,
    calculateChange,
    updateChart,
    initializeChart,
    updateAuthUI
};
