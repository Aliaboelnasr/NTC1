import { API, apiRequest } from './api.js';
import { auth } from './auth.js';
import { showToast } from './utils.js';

// Initialize auth state
let isAuthenticated = false;
let currentUser = null;

// Function to update UI based on auth state
function updateAuthUI() {
    const authLinks = document.querySelectorAll('[data-auth-required]');
    const guestLinks = document.querySelectorAll('[data-guest-only]');
    
    if (auth && auth.isAuthenticated) {
        authLinks.forEach(link => link.style.display = 'block');
        guestLinks.forEach(link => link.style.display = 'none');
        if (auth.userName) {
            document.querySelectorAll('.user-name').forEach(el => el.textContent = auth.userName);
        }
    } else {
        authLinks.forEach(link => link.style.display = 'none');
        guestLinks.forEach(link => link.style.display = 'block');
    }
}

// Function to fetch exchange rates
async function fetchExchangeRates() {
    try {
        const response = await apiRequest(API.exchange.rates);
        if (response && response.rates) {
            updateExchangeRates(response.rates);
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        showToast('Unable to fetch exchange rates. Please try again later.', 'error');
    }
}

// Function to update exchange rates display
function updateExchangeRates(rates) {
    const ratesContainer = document.getElementById('exchangeRates');
    if (!ratesContainer) return;

    const currencies = ['EUR', 'GBP', 'JPY', 'CAD'];
    let html = '';

    currencies.forEach(currency => {
        if (rates[currency]) {
            html += `
                <div class="rate-item">
                    <span class="currency">${currency}</span>
                    <span class="value">${rates[currency].toFixed(4)}</span>
                </div>
            `;
        }
    });

    ratesContainer.innerHTML = html;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Update UI based on auth state
        updateAuthUI();

        // Initialize exchange rates
        await fetchExchangeRates();
        
        // Set up periodic updates
        setInterval(fetchExchangeRates, 60000); // Update every minute
        
        // Initialize Bootstrap components
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Initialize carousel if it exists
        const carousel = document.querySelector('.carousel');
        if (carousel) {
            new bootstrap.Carousel(carousel, {
                interval: 5000,
                touch: true
            });
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('An error occurred while initializing the page.', 'error');
    }
}); 