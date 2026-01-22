import { API, apiRequest } from './api.js';
import { showToast } from './utils.js';
import CurrencyManager from './currency.js';

// Initialize Currency Manager
const currencyManager = new CurrencyManager();

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

// Function to update exchange rates display
function updateExchangeRates(rates) {
    const ratesContainer = document.getElementById('exchange-rates-body');
    if (!ratesContainer) {
        console.warn('Exchange rates container not found');
        return;
    }

    const currencies = ['EUR', 'GBP', 'JPY', 'CAD'];
    let html = '';

    currencies.forEach(currency => {
        if (rates[currency]) {
            const change = (Math.random() * 2 - 1).toFixed(2); // Simulated 24h change
            const changeClass = change >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            html += `
                <tr>
                    <td>
                        <img src="./imgs/flags/${currency.toLowerCase()}.png" alt="${currency} flag" 
                             style="width: 20px; height: 15px; margin-right: 8px;">
                        ${currency}/USD
                    </td>
                    <td>${rates[currency].toFixed(4)}</td>
                    <td class="${changeClass}">
                        <i class="fas ${changeIcon}"></i> ${Math.abs(change)}%
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="window.location.href='exchange.html?from=USD&to=${currency}'">
                            <i class="fas fa-exchange-alt"></i> Exchange
                        </button>
                    </td>
                </tr>
            `;
        }
    });

    ratesContainer.innerHTML = html;
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
        const ratesContainer = document.getElementById('exchange-rates-body');
        if (ratesContainer) {
            ratesContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to fetch exchange rates. Please try again later.
                    </td>
                </tr>
            `;
        }
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
    // Initialize Currency Manager
    currencyManager.init();

    // Make sure TradingView library is loaded
    if (typeof LightweightCharts === 'undefined') {
        console.error('TradingView Lightweight Charts library not loaded');
        return;
    }

    // Initial fetch
    fetchExchangeRates();

    // Update rates every minute
    setInterval(fetchExchangeRates, 60000);

    // Simulate updates every 2 seconds
    setInterval(simulateRealTimeUpdates, 2000);

    // Your rates table rendering code here
    renderRatesTable();
});

// Example chart data for each currency
const chartData = {
  eur: [0.88, 0.87, 0.875, 0.872, 0.877, 0.876, 0.87736],
  gbp: [0.75, 0.752, 0.751, 0.753, 0.751, 0.750, 0.75133],
  jpy: [143.2, 143.5, 143.6, 143.8, 143.7, 143.65, 143.71],
  cad: [1.38, 1.385, 1.386, 1.388, 1.387, 1.3875, 1.3879],
  aud: [1.51, 1.512, 1.513, 1.514, 1.513, 1.5125, 1.5123]
};

function drawSparkline(canvas, data, color = "#28a745") {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  data.forEach((val, i) => {
    const x = i * step;
    const y = h - ((val - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

// Draw all sparklines after DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll("canvas[data-chart]").forEach(canvas => {
    const key = canvas.getAttribute("data-chart");
    if (chartData[key]) {
      // Use green for positive, red for negative, or customize as needed
      const color = key === "eur" ? "#dc3545" : "#28a745";
      drawSparkline(canvas, chartData[key], color);
    }
  });
}); 