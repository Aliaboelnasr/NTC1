// Store historical data for each currency
const historicalData = {
    EUR: [],
    GBP: [],
    JPY: [],
    CAD: []
};

// Store chart instances
const charts = {};

// Initialize charts for each currency
function initializeChart(currency, containerId) {
    const container = document.getElementById(containerId);
    const chart = LightweightCharts.createChart(container, {
        width: 180,
        height: 60,
        layout: {
            background: { color: 'transparent' },
            textColor: '#333',
        },
        grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
        },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        crosshair: { visible: false },
    });

    const lineSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
    });

    charts[currency] = lineSeries;
    return chart;
}

// Update chart data
function updateChart(currency, price) {
    const now = new Date();
    historicalData[currency].push({
        time: now.getTime() / 1000,
        value: price
    });

    // Keep last 100 data points
    if (historicalData[currency].length > 100) {
        historicalData[currency].shift();
    }

    if (charts[currency]) {
        charts[currency].setData(historicalData[currency]);
    }
}

// Calculate price change percentage
function calculateChange(currentPrice, currency) {
    if (historicalData[currency].length > 0) {
        const oldPrice = historicalData[currency][0].value;
        const change = ((currentPrice - oldPrice) / oldPrice) * 100;
        return change.toFixed(2);
    }
    return '0.00';
}

// Fetch exchange rates and update UI
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        const rates = {
            "EUR": data.rates.EUR,
            "GBP": data.rates.GBP,
            "JPY": data.rates.JPY,
            "CAD": data.rates.CAD,
            "USD": 1
        };

        const currencies = {
            "USD": {
                flag: "./imgs/istockphoto-1160777145-612x612.jpg",
                name: "US Dollar"
            },
            "EUR": {
                flag: "./imgs/images.png",
                name: "Euro"
            },
            "GBP": {
                flag: "./imgs/download.jpeg",
                name: "British Pound"
            },
            "JPY": {
                flag: "./imgs/download.png",
                name: "Japanese Yen"
            },
            "CAD": {
                flag: "./imgs/download (1).png",
                name: "Canadian Dollar"
            }
        };

        const tableBody = document.getElementById("exchange-rates-body");
        tableBody.innerHTML = '';

        for (let currency in rates) {
            if (currency === 'USD') continue; // Skip USD as base currency
            const chartId = `chart-${currency}`;
            const change = calculateChange(rates[currency], currency);
            const changeClass = parseFloat(change) >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = parseFloat(change) >= 0 ? '↑' : '↓';

            let row = `<tr>
                <td>
                    <img src="${currencies[currency].flag}" class="currency-flag" alt="${currency} flag">
                    <span class="currency-name ms-2">${currencies[currency].name}</span>
                </td>
                <td>${rates[currency].toFixed(4)}</td>
                <td class="${changeClass}">${changeIcon} ${Math.abs(change)}%</td>
                <td><div id="${chartId}" style="height: 60px;"></div></td>
                <td><button class="btn btn-primary btn-sm">Convert</button></td>
            </tr>`;
            tableBody.innerHTML += row;

            // Initialize chart after row is added to DOM
            setTimeout(() => {
                initializeChart(currency, chartId);
                updateChart(currency, rates[currency]);
            }, 0);
        }
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
    }
}

// Add some random fluctuation to simulate real-time changes
function simulateRealTimeUpdates() {
    const tableBody = document.getElementById("exchange-rates-body");
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const rateCell = row.cells[1];
        const currentRate = parseFloat(rateCell.textContent);
        const fluctuation = (Math.random() - 0.5) * 0.001;
        const newRate = currentRate + fluctuation;
        rateCell.textContent = newRate.toFixed(4);
        
        // Update chart
        const currency = row.cells[0].textContent.split(' ')[1].toUpperCase();
        if (charts[currency]) {
            updateChart(currency, newRate);
        }
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the carousel
    const carousel = new bootstrap.Carousel(document.getElementById('moneyNewsCarousel'), {
        interval: 5000,
        wrap: true,
        touch: true
    });

    // Initialize slider
    $(".slider").slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        arrows: false,
        dots: false,
    });

    // Start exchange rates updates
    fetchExchangeRates();
    
    // Update rates every minute
    setInterval(fetchExchangeRates, 60000);
    
    // Simulate real-time updates every 2 seconds
    setInterval(simulateRealTimeUpdates, 2000);
});

// Currency converter function
function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const rate = document.getElementById('currency').value;
    const result = (amount * rate).toFixed(2);
    document.getElementById('result').textContent = result;
}
