document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const authUser = JSON.parse(localStorage.getItem('authUser') || sessionStorage.getItem('authUser') || 'null');
    if (!authUser) {
        window.location.href = 'exchange.html';
        return;
    }

    // Set user name
    document.getElementById('userName').textContent = authUser.name;

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Load mock transactions
    loadRecentTransactions();

    // Handle quick exchange form
    const quickExchangeForm = document.getElementById('quickExchangeForm');
    quickExchangeForm.addEventListener('submit', handleQuickExchange);

    // Dashboard Navigation Handlers
    const navButtons = {
        'overview-btn': showOverview,
        'wallet-btn': showWallet,
        'exchange-btn': showExchange,
        'transfer-btn': showTransfer,
        'profile-btn': showProfile,
        'settings-btn': showSettings
    };

    // Add click handlers to all navigation buttons
    Object.keys(navButtons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all buttons
                Object.keys(navButtons).forEach(id => 
                    document.getElementById(id)?.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                // Call corresponding function
                navButtons[btnId]();
            });
        }
    });

    // Initialize dashboard with overview
    showOverview();
});

// Mock transaction data
const mockTransactions = [
    { date: '2024-03-10', type: 'Buy', amount: '$1,000', status: 'Completed' },
    { date: '2024-03-09', type: 'Sell', amount: '$750', status: 'Pending' },
    { date: '2024-03-08', type: 'Exchange', amount: '$2,500', status: 'Completed' },
    { date: '2024-03-07', type: 'Buy', amount: '$500', status: 'Completed' },
];

function loadRecentTransactions() {
    const tbody = document.getElementById('recentTransactions');
    tbody.innerHTML = mockTransactions.map(transaction => `
        <tr>
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>${transaction.amount}</td>
            <td><span class="badge bg-${transaction.status === 'Completed' ? 'success' : 'warning'}">${transaction.status}</span></td>
        </tr>
    `).join('');
}

function handleQuickExchange(event) {
    event.preventDefault();
    // Add your exchange logic here
    alert('Exchange feature will be implemented soon!');
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authUser');
    sessionStorage.removeItem('authUser');
    window.location.href = 'exchange.html';
}

let selectedPaymentMethod = null;

function selectPaymentMethod(method) {
    // Remove selected class from all cards
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Hide all payment forms
    document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
    });

    // Add selected class to clicked card
    const selectedCard = document.querySelector(`.payment-method-card[onclick*="${method}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Show selected payment form
    const selectedForm = document.getElementById(`${method}PaymentForm`);
    if (selectedForm) {
        selectedForm.style.display = 'block';
    }

    selectedPaymentMethod = method;
}

function processPayment() {
    const amount = document.getElementById('depositAmount').value;
    const currency = document.getElementById('depositCurrency').value;

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    if (!selectedPaymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }

    // Show loading state
    const button = document.querySelector('button.btn-primary');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    button.disabled = true;

    // Simulate payment processing
    setTimeout(() => {
        // Reset button state
        button.innerHTML = originalText;
        button.disabled = false;

        // Show success message
        showPaymentSuccess(amount, currency);
    }, 2000);
}

function showPaymentSuccess(amount, currency) {
    const successHtml = `
        <div class="payment-success text-center">
            <i class="fas fa-check-circle"></i>
            <h3>Payment Successful!</h3>
            <p>You have successfully added ${currency} ${amount} to your account.</p>
            <button class="btn btn-primary mt-3" onclick="location.reload()">
                Back to Dashboard
            </button>
        </div>
    `;

    document.getElementById('add-money').innerHTML = successHtml;
}

function copyFawryCode() {
    const code = document.getElementById('fawryCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied to clipboard!', 'success');
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Navigation Functions
function showOverview() {
    loadSection('overview');
    fetchDashboardStats();
}

function showWallet() {
    loadSection('wallet');
    initializeWallet();
}

function showExchange() {
    loadSection('exchange');
    initializeExchange();
}

function showTransfer() {
    loadSection('transfer');
    initializeTransfer();
}

function showProfile() {
    loadSection('profile');
    loadUserProfile();
}

function showSettings() {
    loadSection('settings');
    loadUserSettings();
}

// Helper function to load sections
function loadSection(sectionId) {
    const sections = ['overview', 'wallet', 'exchange', 'transfer', 'profile', 'settings'];
    sections.forEach(id => {
        const section = document.getElementById(`${id}-section`);
        if (section) {
            section.style.display = id === sectionId ? 'block' : 'none';
        }
    });
} 