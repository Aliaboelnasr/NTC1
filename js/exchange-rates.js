class ExchangeRatesManager {
    constructor() {
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
        this.updateInterval = 60; // seconds
        this.countdown = this.updateInterval;
        this.rates = {};
        this.previousRates = {};
        this.selectedCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
        this.charts = new Map();
        this.isInverse = false;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.fetchRates();
        this.startUpdateCycle();
        this.initCharts();
    }

    setupEventListeners() {
        // Add Currency button
        document.getElementById('addCurrencyBtn').addEventListener('click', () => {
            this.showAddCurrencyModal();
        });

        // Inverse toggle
        document.getElementById('inverseRates').addEventListener('change', (e) => {
            this.isInverse = e.target.checked;
            this.updateRatesDisplay();
        });

        // Currency search
        document.getElementById('currencySearch').addEventListener('input', (e) => {
            this.filterCurrencyList(e.target.value);
        });
    }

    async fetchRates() {
        try {
            const response = await fetch(this.baseUrl);
            const data = await response.json();
            
            // Store previous rates for change calculation
            this.previousRates = { ...this.rates };
            this.rates = data.rates;
            
            this.updateRatesDisplay();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Error fetching rates:', error);
            this.showError('Failed to fetch latest rates');
        }
    }

    updateRatesDisplay() {
        const tbody = document.getElementById('ratesTableBody');
        tbody.innerHTML = '';

        this.selectedCurrencies.forEach(currency => {
            const rate = this.isInverse ? 1 / this.rates[currency] : this.rates[currency];
            const previousRate = this.isInverse ? 
                1 / this.previousRates[currency] : this.previousRates[currency];
            const change = this.calculateChange(rate, previousRate);

            const row = this.createRateRow(currency, rate, change);
            tbody.appendChild(row);
            
            // Update chart
            this.updateChart(currency, rate);
        });
    }

    createRateRow(currency, rate, change) {
        const row = document.createElement('tr');
        row.className = 'currency-row';
        
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeSign = change >= 0 ? '+' : '';

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="../imgs/flags/${currency.toLowerCase()}.png" 
                         class="currency-flag" alt="${currency}">
                    <span>${currency}</span>
                </div>
            </td>
            <td class="rate-value">${rate.toFixed(5)}</td>
            <td>
                <span class="rate-change ${changeClass}">
                    ${changeSign}${change.toFixed(2)}%
                </span>
            </td>
            <td>
                <canvas id="chart-${currency}" class="mini-chart"></canvas>
            </td>
            <td>
                <button class="btn btn-primary btn-sm">
                    <i class="fas fa-exchange-alt me-1"></i>Convert
                </button>
            </td>
        `;

        return row;
    }

    calculateChange(currentRate, previousRate) {
        if (!previousRate) return 0;
        return ((currentRate - previousRate) / previousRate) * 100;
    }

    initCharts() {
        this.selectedCurrencies.forEach(currency => {
            const ctx = document.getElementById(`chart-${currency}`).getContext('2d');
            this.charts.set(currency, new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    animation: false
                }
            }));
        });
    }

    updateChart(currency, rate) {
        const chart = this.charts.get(currency);
        if (!chart) return;

        const data = chart.data.datasets[0].data;
        data.push(rate);
        if (data.length > 24) data.shift();

        chart.data.labels = Array(data.length).fill('');
        chart.update();
    }

    startUpdateCycle() {
        setInterval(() => {
            this.countdown--;
            document.getElementById('updateCountdown').textContent = this.countdown;
            
            if (this.countdown <= 0) {
                this.countdown = this.updateInterval;
                this.fetchRates();
            }
        }, 1000);
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = 
            `Last updated: ${now.toLocaleTimeString()}`;
    }

    showAddCurrencyModal() {
        // Implementation for adding new currencies
        const modal = new bootstrap.Modal(document.getElementById('addCurrencyModal'));
        modal.show();
    }

    filterCurrencyList(search) {
        // Implementation for currency search
        const searchTerm = search.toLowerCase();
        // Filter and display matching currencies
    }

    showError(message) {
        // Implementation for error display
        console.error(message);
    }
}

// Initialize the exchange rates manager
const exchangeRatesManager = new ExchangeRatesManager(); 