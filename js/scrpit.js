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

    updateCurrencyOptions();

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    updateAuthUI(!!user);
});

// Currency converter function
function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const rate = document.getElementById('currency').value;
    const result = (amount * rate).toFixed(2);
    document.getElementById('result').textContent = result;
}

const currencyPairs = {
    'USD-EUR': 0.91,
    'USD-GBP': 0.79,
    'USD-JPY': 148.45,
    'EUR-USD': 1.10,
    'GBP-USD': 1.27,
    'JPY-USD': 0.0067
};

function updateCurrencyOptions() {
    const select = document.getElementById('currency');
    select.innerHTML = '';
    
    for (let pair in currencyPairs) {
        const option = document.createElement('option');
        option.value = currencyPairs[pair];
        option.textContent = `${pair.split('-')[0]} to ${pair.split('-')[1]}`;
        select.appendChild(option);
    }
}

// Function to show toast notifications
function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const toastContent = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toast.innerHTML = toastContent;
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}

// Function to validate password
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase || !hasLowerCase) {
        return "Password must contain both uppercase and lowercase letters";
    }
    if (!hasNumbers) {
        return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
        return "Password must contain at least one special character";
    }
    return "valid";
}

// Modified handleSignup function
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Password validation
    const passwordValidation = validatePassword(password);
    if (passwordValidation !== "valid") {
        showToast(passwordValidation, 'danger');
        return false;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'danger');
        return false;
    }
    
    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.some(user => user.email === email)) {
        showToast('Email already registered! Please login.', 'warning');
        
        // Close signup modal and open login modal
        setTimeout(() => {
            const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
            signupModal.hide();
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        }, 1500);
        
        return false;
    }
    
    // Store user data
    const newUser = {
        name,
        email,
        password: btoa(password) // Basic encoding (not secure for production)
    };
    
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Close modal
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    signupModal.hide();
    
    // Show success message
    showToast('Account created successfully! Please login.', 'success');
    
    // Clear form
    document.getElementById('signupForm').reset();
    
    // Open login modal after a brief delay
    setTimeout(() => {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }, 1500);
    
    return false;
}

// Modified handleLogin function
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && btoa(password) === u.password);
    
    if (user) {
        // Store auth state
        const authData = {
            name: user.name,
            email: user.email,
            isLoggedIn: true,
            timestamp: new Date().getTime()
        };
        
        if (rememberMe) {
            localStorage.setItem('authUser', JSON.stringify(authData));
        } else {
            sessionStorage.setItem('authUser', JSON.stringify(authData));
        }
        
        // Close modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        
        // Show success message
        showToast(`Welcome back, ${user.name}!`, 'success');
        
        // Update UI
        updateAuthUI(true);
        
        // Clear form
        document.getElementById('loginForm').reset();
    } else {
        showToast('Invalid email or password!', 'danger');
    }
    
    return false;
}

// Modified updateAuthUI function
function updateAuthUI(isLoggedIn) {
    const authUser = JSON.parse(localStorage.getItem('authUser') || sessionStorage.getItem('authUser') || 'null');
    const authLinks = document.querySelectorAll('.nav-item .nav-link[data-bs-toggle="modal"]');
    
    if (isLoggedIn && authUser) {
        // Hide login/signup links
        authLinks.forEach(link => link.style.display = 'none');
        
        // Add user menu if it doesn't exist
        if (!document.getElementById('userMenu')) {
            const userMenu = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userMenu" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle"></i> ${authUser.name}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="dashboard.html">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a></li>
                    </ul>
                </li>
            `;
            document.querySelector('.navbar-nav').insertAdjacentHTML('beforeend', userMenu);
        }
    } else {
        // Show login/signup links
        authLinks.forEach(link => link.style.display = 'block');
        
        // Remove user menu if it exists
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.closest('.nav-item').remove();
        }
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    updateAuthUI(false);
    showToast('Successfully logged out!', 'success');
}
