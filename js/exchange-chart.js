class ExchangeRateChart {
    constructor() {
        this.chart = null;
        this.currentPair = 'EUR/USD';
        this.currentRange = '1M';
        this.init();
    }

    init() {
        this.initializeChart();
        this.setupEventListeners();
        this.loadChartData();
    }

    initializeChart() {
        const ctx = document.getElementById('exchangeRateChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: this.currentPair,
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 1,
                    pointHoverRadius: 5,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM D',
                                week: 'MMM D',
                                month: 'MMM YYYY'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Exchange Rate'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        }
                    }
                }
            }
        });
    }

    setupEventListeners() {
        // Time range buttons
        document.querySelectorAll('[data-range]').forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('[data-range]').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Add active class to clicked button
                e.target.classList.add('active');
                
                this.currentRange = e.target.dataset.range;
                this.loadChartData();
            });
        });

        // Currency pair selection from the table
        document.getElementById('exchange-rates-body').addEventListener('click', (e) => {
            const chartButton = e.target.closest('[data-currency-pair]');
            if (chartButton) {
                this.currentPair = chartButton.dataset.currencyPair;
                this.loadChartData();
            }
        });
    }

    async loadChartData() {
        try {
            // Show loading state
            this.chart.data.datasets[0].data = [];
            this.chart.update('none');

            // Calculate date range
            const endDate = new Date();
            const startDate = this.calculateStartDate(this.currentRange);

            // Fetch historical data
            const data = await this.fetchHistoricalData(startDate, endDate);
            
            // Update chart
            this.updateChartData(data);
            
        } catch (error) {
            console.error('Error loading chart data:', error);
            // Show error message to user
            this.showError('Failed to load chart data');
        }
    }

    calculateStartDate(range) {
        const now = new Date();
        switch (range) {
            case '1D':
                return new Date(now.setDate(now.getDate() - 1));
            case '1W':
                return new Date(now.setDate(now.getDate() - 7));
            case '1M':
                return new Date(now.setMonth(now.getMonth() - 1));
            case '3M':
                return new Date(now.setMonth(now.getMonth() - 3));
            case '1Y':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            default:
                return new Date(now.setMonth(now.getMonth() - 1));
        }
    }

    async fetchHistoricalData(startDate, endDate) {
        // This is sample data - replace with actual API call
        const sampleData = this.generateSampleData(startDate, endDate);
        return sampleData;
    }

    generateSampleData(startDate, endDate) {
        const data = [];
        let currentDate = new Date(startDate);
        const baseRate = 1.1000; // Base rate for EUR/USD

        while (currentDate <= endDate) {
            // Generate a random fluctuation between -0.5% and +0.5%
            const fluctuation = (Math.random() - 0.5) * 0.01;
            const rate = baseRate + baseRate * fluctuation;

            data.push({
                x: new Date(currentDate),
                y: rate
            });

            // Increment by 1 day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return data;
    }

    updateChartData(data) {
        this.chart.data.datasets[0].label = this.currentPair;
        this.chart.data.datasets[0].data = data;

        // Update time unit based on range
        const timeUnit = this.getTimeUnit();
        this.chart.options.scales.x.time.unit = timeUnit;

        this.chart.update();
    }

    getTimeUnit() {
        switch (this.currentRange) {
            case '1D':
                return 'hour';
            case '1W':
                return 'day';
            case '1M':
                return 'day';
            case '3M':
                return 'week';
            case '1Y':
                return 'month';
            default:
                return 'day';
        }
    }

    showError(message) {
        // Create and show an error toast
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-danger border-0';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        const container = document.querySelector('.toast-container');
        if (container) {
            container.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }
}

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.exchangeRateChart = new ExchangeRateChart();
}); 