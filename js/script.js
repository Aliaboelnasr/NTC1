// Store historical data for each currency
let historicalData = {
    EUR: [],
    GBP: [],
    JPY: [],
    CAD: []
};

// Store chart instances
let charts = {};

// Initialize the lightweight charts
function initializeChart(containerId, currency) {
    try {
        // Create the chart container if it doesn't exist
        const chartContainer = document.getElementById(containerId);
        if (!chartContainer) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Create chart instance using TradingView's lightweight charts
        const chart = LightweightCharts.createChart(chartContainer, {
            width: 200,
            height: 100,
            layout: {
                background: { color: '#ffffff' },
                textColor: '#333',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            rightPriceScale: {
                visible: false,
            },
            timeScale: {
                visible: false,
            },
        });

        // Create the line series
        const lineSeries = chart.addAreaSeries({
            topColor: 'rgba(33, 150, 243, 0.56)',
            bottomColor: 'rgba(33, 150, 243, 0.04)',
            lineColor: 'rgba(33, 150, 243, 1)',
            lineWidth: 2,
        });

        // Store both chart and series
        charts[currency] = {
            chart: chart,
            series: lineSeries
        };

        return lineSeries;
    } catch (error) {
        console.error('Error initializing chart:', error);
        return null;
    }
}

// Update chart with new data
function updateChart(currency, price) {
    try {
        if (!charts[currency] || !charts[currency].series) {
            console.error(`Chart for ${currency} not initialized`);
            return;
        }

        const time = new Date().getTime() / 1000;
        historicalData[currency].push({
            time: time,
            value: price
        });

        // Keep only last 100 data points
        if (historicalData[currency].length > 100) {
            historicalData[currency] = historicalData[currency].slice(-100);
        }

        charts[currency].series.setData(historicalData[currency]);
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Calculate price change percentage
function calculateChange(currentPrice, currency) {
    if (historicalData[currency].length < 2) return '0.00';
    const oldPrice = historicalData[currency][0].value;
    const change = ((currentPrice - oldPrice) / oldPrice) * 100;
    return change.toFixed(2);
}

// Fetch exchange rates from API
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data.rates) {
            const currencies = ['EUR', 'GBP', 'JPY', 'CAD'];
            const tableBody = document.querySelector('#exchangeRatesTable tbody');
            tableBody.innerHTML = ''; // Clear existing rows

            currencies.forEach(currency => {
                const rate = data.rates[currency];
                const change = calculateChange(rate, currency);
                const row = `
                    <tr>
                        <td>
                            <img src="images/flags/${currency.toLowerCase()}.png" alt="${currency} flag" class="currency-flag">
                            ${currency}
                        </td>
                        <td>${rate.toFixed(4)}</td>
                        <td class="${parseFloat(change) >= 0 ? 'text-success' : 'text-danger'}">
                            ${change}%
                        </td>
                        <td>
                            <div id="chart-${currency}" class="mini-chart"></div>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm">Exchange</button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
                
                // Initialize chart after row is added
                initializeChart(`chart-${currency}`, currency);
                updateChart(currency, rate);
            });
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
    }
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    Object.keys(charts).forEach(currency => {
        if (!charts[currency] || !historicalData[currency].length) return;
        
        const lastPrice = historicalData[currency][historicalData[currency].length - 1].value;
        const change = (Math.random() - 0.5) * 0.001; // Small random change
        const newPrice = lastPrice * (1 + change);
        
        updateChart(currency, newPrice);
        
        // Update the price in the table
        const row = document.querySelector(`#exchangeRatesTable tr:contains('${currency}')`);
        if (row) {
            const priceCell = row.querySelector('td:nth-child(2)');
            const changeCell = row.querySelector('td:nth-child(3)');
            if (priceCell && changeCell) {
                priceCell.textContent = newPrice.toFixed(4);
                const changePercent = calculateChange(newPrice, currency);
                changeCell.textContent = `${changePercent}%`;
                changeCell.className = parseFloat(changePercent) >= 0 ? 'text-success' : 'text-danger';
            }
        }
    });
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Make sure TradingView library is loaded
    if (typeof LightweightCharts === 'undefined') {
        console.error('TradingView Lightweight Charts library not loaded');
        return;
    }

    // Initial fetch
    fetchExchangeRates();

    // Update real rates every minute
    setInterval(fetchExchangeRates, 60000);

    // Simulate updates every 2 seconds
    setInterval(simulateRealTimeUpdates, 2000);
}); 