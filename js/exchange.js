class ExchangeManager {
    constructor() {
        this.exchangeRates = {};
        this.userBalances = {
            USD: 1000.00, // Default values for testing
            EUR: 850.00,
            GBP: 750.00
        };
        this.feePercentage = 0.5; // 0.5% exchange fee
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadExchangeRates();
        this.updateUserBalances();
        // Update rates every minute
        setInterval(() => this.loadExchangeRates(), 60000);
    }

    setupEventListeners() {
        // Exchange form
        const exchangeForm = document.getElementById('exchangeForm');
        exchangeForm?.addEventListener('submit', (e) => this.handleExchange(e));

        // Amount input handler
        const fromAmount = document.getElementById('fromAmount');
        fromAmount?.addEventListener('input', () => this.updateToAmount());

        // Currency select handlers
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        fromCurrency?.addEventListener('change', () => {
            this.updateAvailableBalance();
            this.updateToAmount();
        });
        toCurrency?.addEventListener('change', () => this.updateToAmount());

        // Swap button
        const swapBtn = document.getElementById('swapBtn');
        swapBtn?.addEventListener('click', () => this.swapCurrencies());

        // Max amount button
        const maxAmountBtn = document.getElementById('maxAmountBtn');
        maxAmountBtn?.addEventListener('click', () => this.setMaxAmount());

        // Confirm exchange button
        const confirmExchangeBtn = document.getElementById('confirmExchangeBtn');
        confirmExchangeBtn?.addEventListener('click', () => this.processExchange());
    }

    async loadExchangeRates() {
        try {
            // In a real application, you would fetch this from an API
            // For demo purposes, we'll use static rates
            this.exchangeRates = {
                USD: 1.0,
                EUR: 0.85,
                GBP: 0.73,
            };

            this.updateRatesDisplay();
            this.updateToAmount();
            this.updateLastUpdated();
        } catch (error) {
            this.showNotification('Failed to load exchange rates', 'danger');
        }
    }

    updateRatesDisplay() {
        const liveRates = document.getElementById('liveRates');
        if (!liveRates) return;

        liveRates.innerHTML = '';
        const baseCurrency = 'USD';

        Object.entries(this.exchangeRates).forEach(([currency, rate]) => {
            if (currency !== baseCurrency) {
                const rateItem = document.createElement('div');
                rateItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                rateItem.innerHTML = `
                    <span>1 ${baseCurrency} = </span>
                    <strong>${rate.toFixed(4)} ${currency}</strong>
                `;
                liveRates.appendChild(rateItem);
            }
        });
    }

    updateUserBalances() {
        // Update balance displays
        Object.entries(this.userBalances).forEach(([currency, balance]) => {
            const balanceElement = document.getElementById(`${currency.toLowerCase()}Balance`);
            if (balanceElement) {
                balanceElement.textContent = balance.toFixed(2);
            }
        });

        // Update available balance for selected currency
        this.updateAvailableBalance();
    }

    updateAvailableBalance() {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const availableBalance = document.getElementById('availableBalance');
        if (availableBalance) {
            const balance = this.userBalances[fromCurrency] || 0;
            availableBalance.textContent = `${balance.toFixed(2)} ${fromCurrency}`;
        }
    }

    updateToAmount() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        
        const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency);
        const fee = this.calculateFee(fromAmount);
        const toAmount = (fromAmount - fee) * exchangeRate;

        // Update to amount
        document.getElementById('toAmount').value = toAmount.toFixed(2);

        // Update exchange rate display
        document.getElementById('exchangeRate').textContent = 
            `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`;

        // Update fee display
        document.getElementById('exchangeFee').textContent = 
            `${fee.toFixed(2)} ${fromCurrency} (${this.feePercentage}%)`;
    }

    getExchangeRate(fromCurrency, toCurrency) {
        const fromRate = this.exchangeRates[fromCurrency];
        const toRate = this.exchangeRates[toCurrency];
        return toRate / fromRate;
    }

    calculateFee(amount) {
        return amount * (this.feePercentage / 100);
    }

    swapCurrencies() {
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');

        // Swap currencies
        [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value];
        
        // Swap amounts
        fromAmount.value = toAmount.value;

        // Update displays
        this.updateAvailableBalance();
        this.updateToAmount();
    }

    setMaxAmount() {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const fromAmount = document.getElementById('fromAmount');
        fromAmount.value = this.userBalances[fromCurrency].toFixed(2);
        this.updateToAmount();
    }

    handleExchange(event) {
        event.preventDefault();
        
        const fromAmount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const toAmount = parseFloat(document.getElementById('toAmount').value);

        // Validate amount
        if (fromAmount <= 0) {
            this.showNotification('Please enter a valid amount', 'danger');
            return;
        }

        // Check balance
        if (fromAmount > this.userBalances[fromCurrency]) {
            this.showNotification('Insufficient balance', 'danger');
            return;
        }

        // Show confirmation modal
        this.showConfirmation(fromAmount, fromCurrency, toAmount, toCurrency);
    }

    showConfirmation(fromAmount, fromCurrency, toAmount, toCurrency) {
        const fee = this.calculateFee(fromAmount);
        const rate = this.getExchangeRate(fromCurrency, toCurrency);

        // Update confirmation modal
        document.getElementById('confirmFromAmount').textContent = 
            `${fromAmount.toFixed(2)} ${fromCurrency}`;
        document.getElementById('confirmToAmount').textContent = 
            `${toAmount.toFixed(2)} ${toCurrency}`;
        document.getElementById('confirmRate').textContent = 
            `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        document.getElementById('confirmFee').textContent = 
            `${fee.toFixed(2)} ${fromCurrency}`;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
    }

    processExchange() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const toAmount = parseFloat(document.getElementById('toAmount').value);

        // Update balances
        this.userBalances[fromCurrency] -= fromAmount;
        this.userBalances[toCurrency] += toAmount;

        // Update UI
        this.updateUserBalances();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();

        // Show success message
        this.showNotification('Exchange completed successfully!', 'success');

        // Reset form
        document.getElementById('exchangeForm').reset();
        document.getElementById('toAmount').value = '';
    }

    updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleTimeString();
        }
    }

    showNotification(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Initialize exchange manager
const exchangeManager = new ExchangeManager();

// Add this to the bottom of each page's script section
document.addEventListener('DOMContentLoaded', () => {
    // Set active state for current page
    const currentPage = window.location.pathname.split('/').pop();
    const navigationButtons = document.querySelectorAll('.navigation-buttons .btn');
    
    navigationButtons.forEach(button => {
        const href = button.getAttribute('href');
        if (href === currentPage) {
            button.classList.add('active');
        }
    });
});
