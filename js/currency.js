import { apiService } from './api.js';
import { formatCurrency, formatDate } from './utils.js';

class CurrencyManager {
    constructor() {
        this.rates = {};
        this.lastUpdate = null;
        this.updateInterval = 60000; // Update every minute
    }

    async init() {
        try {
            await this.setupEventListeners();
            await this.updateRates();
            this.startAutoUpdate();
            console.log('Currency Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Currency Manager:', error);
        }
    }

    setupEventListeners() {
        // Currency converter form
        const converterForm = document.getElementById('converterForm');
        if (converterForm) {
            converterForm.addEventListener('submit', (e) => this.handleConversion(e));
        }

        // Currency swap button
        const swapButton = document.getElementById('swapCurrencies');
        if (swapButton) {
            swapButton.addEventListener('click', () => this.swapCurrencies());
        }

        // Amount input live update
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => this.handleLiveUpdate());
        }

        // New Conversion button
        const newConversionBtn = document.getElementById('newConversion');
        if (newConversionBtn) {
            newConversionBtn.addEventListener('click', () => this.resetConverter());
        }

        // Save Result button
        const saveResultBtn = document.getElementById('saveConversion');
        if (saveResultBtn) {
            saveResultBtn.addEventListener('click', () => this.saveConversion());
        }

        // Copy Amount button
        const copyAmountBtn = document.getElementById('copyAmount');
        if (copyAmountBtn) {
            copyAmountBtn.addEventListener('click', () => this.copyConvertedAmount());
        }

        // Edit Amount button
        const editAmountBtn = document.getElementById('editAmount');
        if (editAmountBtn) {
            editAmountBtn.addEventListener('click', () => this.toggleEditAmount());
        }

        // Converted Amount Input
        const convertedAmountInput = document.getElementById('convertedAmountInput');
        if (convertedAmountInput) {
            convertedAmountInput.addEventListener('change', () => this.handleAmountEdit());
        }
    }

    async updateRates() {
        try {
            const data = await apiService.getExchangeRates();
            this.rates = data.rates;
            this.lastUpdate = new Date();
            this.updateRatesDisplay();
        } catch (error) {
            console.error('Failed to update rates:', error);
        }
    }

    startAutoUpdate() {
        setInterval(() => this.updateRates(), this.updateInterval);
    }

    updateRatesDisplay() {
        const ratesTable = document.getElementById('exchange-rates-body');
        if (!ratesTable) return;

        const mainCurrencies = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];
        ratesTable.innerHTML = mainCurrencies.map(currency => `
            <tr>
                <td>
                    <img src="./imgs/flags/${currency.toLowerCase()}.png" alt="${currency}" class="currency-flag">
                    ${currency}
                </td>
                <td>${formatCurrency(this.rates[currency], currency)}</td>
                <td class="text-${this.getRateChange(currency) >= 0 ? 'success' : 'danger'}">
                    ${this.getRateChange(currency)}%
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.location.href='#converter'">
                        Convert
                    </button>
                </td>
            </tr>
        `).join('');

        // Update last update time
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Last updated: ${formatDate(this.lastUpdate)}`;
        }
    }

    async handleConversion(event) {
        event.preventDefault();

        const amount = parseFloat(document.getElementById('amount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;

        // Show loading state
        const convertButton = document.querySelector('#converterForm button[type="submit"]');
        const originalButtonText = convertButton.innerHTML;
        convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        convertButton.disabled = true;

        // Hide any previous errors
        const errorElement = document.getElementById('conversionError');
        errorElement.classList.add('d-none');

        try {
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            const result = await apiService.convertCurrency(amount, fromCurrency, toCurrency);
            
            // Show the conversion result
            const resultDisplay = document.getElementById('conversionResult');
            resultDisplay.classList.remove('d-none');

            // Update the amounts
            document.getElementById('displayOriginalAmount').textContent = formatCurrency(amount, fromCurrency);
            document.getElementById('displayFromCurrency').textContent = fromCurrency;
            document.getElementById('displayConvertedAmount').textContent = formatCurrency(result.amount, toCurrency);
            document.getElementById('displayToCurrency').textContent = toCurrency;

            // Update the converted amount input
            const convertedAmountInput = document.getElementById('convertedAmountInput');
            if (convertedAmountInput) {
                convertedAmountInput.value = formatCurrency(result.amount, toCurrency);
            }

            // Update the exchange rate and last updated
            document.getElementById('displayExchangeRate').textContent = 
                `1 ${fromCurrency} = ${formatCurrency(result.rate, toCurrency)}`;
            document.getElementById('displayLastUpdated').textContent = 
                `Last updated: ${formatDate(result.timestamp)}`;

            // Scroll to the result
            resultDisplay.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Conversion error:', error);
            errorElement.textContent = error.message;
            errorElement.classList.remove('d-none');
        } finally {
            // Reset button state
            convertButton.innerHTML = originalButtonText;
            convertButton.disabled = false;
        }
    }

    resetConverter() {
        // Reset the form
        document.getElementById('converterForm').reset();
        
        // Hide the result display
        const resultDisplay = document.getElementById('conversionResult');
        if (resultDisplay) {
            resultDisplay.classList.add('d-none');
        }

        // Reset the converted amount input
        const convertedAmountInput = document.getElementById('convertedAmountInput');
        if (convertedAmountInput) {
            convertedAmountInput.value = '';
            convertedAmountInput.readOnly = true;
        }

        // Focus on the amount input
        document.getElementById('amount').focus();
    }

    saveConversion() {
        // Implement save functionality
        const amount = document.getElementById('displayOriginalAmount').textContent;
        const fromCurrency = document.getElementById('displayFromCurrency').textContent;
        const convertedAmount = document.getElementById('convertedAmountInput').value;
        const toCurrency = document.getElementById('displayToCurrency').textContent;
        const rate = document.getElementById('displayExchangeRate').textContent;

        // Create a save object
        const saveData = {
            amount,
            fromCurrency,
            convertedAmount,
            toCurrency,
            rate,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage
        const savedConversions = JSON.parse(localStorage.getItem('savedConversions') || '[]');
        savedConversions.push(saveData);
        localStorage.setItem('savedConversions', JSON.stringify(savedConversions));

        // Show success message
        alert('Conversion saved successfully!');
    }

    copyConvertedAmount() {
        const convertedAmountInput = document.getElementById('convertedAmountInput');
        if (convertedAmountInput) {
            convertedAmountInput.select();
            document.execCommand('copy');
            alert('Amount copied to clipboard!');
        }
    }

    toggleEditAmount() {
        const convertedAmountInput = document.getElementById('convertedAmountInput');
        const editButton = document.getElementById('editAmount');
        
        if (convertedAmountInput) {
            convertedAmountInput.readOnly = !convertedAmountInput.readOnly;
            if (!convertedAmountInput.readOnly) {
                editButton.innerHTML = '<i class="fas fa-check"></i> Save';
                convertedAmountInput.focus();
            } else {
                editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
                this.handleAmountEdit();
            }
        }
    }

    handleAmountEdit() {
        const convertedAmountInput = document.getElementById('convertedAmountInput');
        const displayConvertedAmount = document.getElementById('displayConvertedAmount');
        
        if (convertedAmountInput && displayConvertedAmount) {
            displayConvertedAmount.textContent = convertedAmountInput.value;
        }
    }

    swapCurrencies() {
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        const temp = fromSelect.value;
        
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        
        this.handleLiveUpdate();
    }

    async handleLiveUpdate() {
        const amount = parseFloat(document.getElementById('amount').value);
        if (!isNaN(amount) && amount > 0) {
            await this.handleConversion(new Event('submit'));
        }
    }

    getRateChange(currency) {
        // Simulate rate change (replace with actual historical data comparison)
        return ((Math.random() * 2 - 1) * 0.5).toFixed(2);
    }

    showError(message) {
        const errorElement = document.getElementById('conversionError');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
}

// Export the CurrencyManager class
export default CurrencyManager; 