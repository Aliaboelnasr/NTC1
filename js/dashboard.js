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

    // Initialize transactions manager
    window.transactionsManager = new TransactionsManager();

    // Initialize Wallet manager
    window.walletManager = new WalletManager();

    // Initialize Exchange manager (assuming walletManager exists)
    window.exchangeManager = new ExchangeManager(window.walletManager);

    // Add event listener for the Exchange sidebar link
    const exchangeLink = document.querySelector('.sidebar-menu a[href="#exchange"]');
    if (exchangeLink) {
        exchangeLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection('exchange');
            // Activate the manager when the section is shown
            window.exchangeManager?.activate();
             // Deactivate other managers if necessary (e.g., stop rate fetching in transactions)
        });
    }

     // Deactivate exchange manager when navigating away (optional but good practice)
     document.querySelectorAll('.sidebar-menu a:not([href="#exchange"])').forEach(link => {
         link.addEventListener('click', () => {
             window.exchangeManager?.deactivate();
         });
     });

    // Make sure the Wallet section is shown if its link is clicked
    const walletLink = document.querySelector('.sidebar-menu a[href="#wallet"]');
    if (walletLink) {
        walletLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection('wallet');
             // Optionally refresh wallet data when navigating to it
             // window.walletManager.loadWalletData();
        });
    }

    // ----- Section Navigation Setup -----
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
             // Allow external links (like transactions.html) to work normally
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return; // Let the browser handle the navigation
            }

            e.preventDefault(); // Prevent default only for internal section links

            // Remove active class from all links
            menuLinks.forEach(menuLink => {
                menuLink.parentElement.classList.remove('active');
            });

            // Add active class to clicked link
            this.parentElement.classList.add('active');

            // Navigate to the section
            navigateToSection(href.substring(1));
        });
    });

     // Initialize Managers (Order might matter if they depend on each other)
    window.walletManager = new WalletManager();
    window.transactionsManager = new TransactionsManager(); // If you have this
    window.exchangeManager = new ExchangeManager(window.walletManager); // If you have this

    // Initialize dashboard with overview by default
    navigateToSection('overview'); // Use navigate function to set initial state

    // Add event listeners to update modal balances when modals are shown
    const withdrawModalEl = document.getElementById('withdrawModal');
    if (withdrawModalEl) {
        withdrawModalEl.addEventListener('show.bs.modal', () => {
             window.walletManager?.updateWithdrawModalBalance();
        });
    }
    const transferModalEl = document.getElementById('transferModal');
     if (transferModalEl) {
         transferModalEl.addEventListener('show.bs.modal', () => {
             window.walletManager?.updateTransferModalBalance();
             window.walletManager?.updateTransferModalRateInfo(); // Update rate too
         });
     }

    // Initialize managers
    window.walletManager = new WalletManager();
    
    // Add click event listeners to sidebar links
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.substring(1);
                navigateToSection(sectionId);
            }
        });
    });

    // Show overview section by default
    navigateToSection('overview');
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

// Transactions Manager
class TransactionsManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            startDate: '',
            endDate: '',
            type: 'all',
            status: 'all',
            currency: 'all',
            minAmount: '',
            maxAmount: ''
        };
        this.initializeEventListeners();
        this.loadTransactions();
        this.loadStatistics();
    }

    initializeEventListeners() {
        // Filter form submission
        document.getElementById('transactionFilterForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFilters();
            this.loadTransactions();
        });

        // Refresh button
        document.getElementById('refreshTransactionsBtn')?.addEventListener('click', () => {
            this.loadTransactions();
            this.loadStatistics();
        });

        // Export button
        document.getElementById('exportTransactionsBtn')?.addEventListener('click', () => {
            this.exportTransactions();
        });

        // Download receipt button
        document.getElementById('downloadReceiptBtn')?.addEventListener('click', () => {
            const transactionId = document.getElementById('downloadReceiptBtn').dataset.transactionId;
            this.downloadReceipt(transactionId);
        });
    }

    updateFilters() {
        this.filters = {
            startDate: document.getElementById('startDate')?.value || '',
            endDate: document.getElementById('endDate')?.value || '',
            type: document.getElementById('filterTransactionType')?.value || 'all',
            status: document.getElementById('transactionStatus')?.value || 'all',
            currency: document.getElementById('transactionCurrency')?.value || 'all',
            minAmount: document.getElementById('minAmount')?.value || '',
            maxAmount: document.getElementById('maxAmount')?.value || ''
        };
    }

    async loadTransactions() {
        try {
            // In a real app, this would be an API call
            // For demo purposes, we'll generate mock data
            const transactions = this.getMockTransactions();
            this.renderTransactions(transactions);
            this.updatePagination(5, 47); // Mock: 5 pages, 47 total entries
        } catch (error) {
            this.showToast('Error loading transactions', 'error');
        }
    }

    async loadStatistics() {
        try {
            // In a real app, this would be an API call
            // For demo purposes, we'll use mock data
            const statistics = {
                total: 47,
                volume: 25680.50,
                pending: 3,
                successRate: 94
            };
            this.updateStatistics(statistics);
        } catch (error) {
            this.showToast('Error loading statistics', 'error');
        }
    }

    updateStatistics(statistics) {
        document.getElementById('totalTransactions').textContent = statistics.total;
        document.getElementById('totalVolume').textContent = this.formatAmount(statistics.volume, 'USD');
        document.getElementById('pendingTransactions').textContent = statistics.pending;
        document.getElementById('successRate').textContent = `${statistics.successRate}%`;
    }

    renderTransactions(transactions) {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDateTime(transaction.date)}</td>
                <td>${transaction.transactionId}</td>
                <td><span class="badge bg-${this.getTypeBadgeColor(transaction.type)}">${transaction.type}</span></td>
                <td>${this.formatAmount(transaction.amount, transaction.currency)}</td>
                <td>${transaction.currency}</td>
                <td><span class="badge bg-${this.getStatusBadgeColor(transaction.status)}">${transaction.status}</span></td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="transactionsManager.viewDetails('${transaction.transactionId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update showing entries
        document.getElementById('showing-start').textContent = '1';
        document.getElementById('showing-end').textContent = transactions.length;
        document.getElementById('total-entries').textContent = '47'; // Mock total
    }

    viewDetails(transactionId) {
        // In a real app, this would fetch details from an API
        // For demo purposes, we'll use mock data
        const transaction = this.getMockTransactionDetails(transactionId);
        this.showTransactionModal(transaction);
    }

    showTransactionModal(transaction) {
        const detailsBody = document.getElementById('transactionDetailsBody');
        if (!detailsBody) return;

        detailsBody.innerHTML = `
            <div class="transaction-details">
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Transaction ID</div>
                    <div class="col-md-8">${transaction.transactionId}</div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Date & Time</div>
                    <div class="col-md-8">${this.formatDateTime(transaction.date)}</div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Type</div>
                    <div class="col-md-8">
                        <span class="badge bg-${this.getTypeBadgeColor(transaction.type)}">${transaction.type}</span>
                    </div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Amount</div>
                    <div class="col-md-8">${this.formatAmount(transaction.amount, transaction.currency)}</div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Status</div>
                    <div class="col-md-8">
                        <span class="badge bg-${this.getStatusBadgeColor(transaction.status)}">${transaction.status}</span>
                    </div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Description</div>
                    <div class="col-md-8">${transaction.description || 'N/A'}</div>
                </div>
                ${this.getAdditionalDetails(transaction)}
            </div>
        `;

        // Set transaction ID for receipt download
        document.getElementById('downloadReceiptBtn').dataset.transactionId = transaction.transactionId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
        modal.show();
    }

    getAdditionalDetails(transaction) {
        let details = '';
        
        if (transaction.type === 'transfer') {
            details += `
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Recipient</div>
                    <div class="col-md-8">${transaction.recipient || 'N/A'}</div>
                </div>
            `;
        } else if (transaction.type === 'exchange') {
            details += `
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">From Currency</div>
                    <div class="col-md-8">${transaction.fromCurrency}</div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">To Currency</div>
                    <div class="col-md-8">${transaction.toCurrency}</div>
                </div>
                <div class="row mb-3 pb-2 border-bottom">
                    <div class="col-md-4 fw-bold">Exchange Rate</div>
                    <div class="col-md-8">${transaction.exchangeRate}</div>
                </div>
            `;
        }

        return details;
    }

    updatePagination(totalPages, totalItems) {
        const pagination = document.getElementById('transactionPagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.textContent = 'Previous';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadTransactions();
            }
        });
        prevLi.appendChild(prevLink);
        pagination.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = i;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = i;
                this.loadTransactions();
            });
            li.appendChild(a);
            pagination.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.textContent = 'Next';
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadTransactions();
            }
        });
        nextLi.appendChild(nextLink);
        pagination.appendChild(nextLi);
    }

    exportTransactions() {
        this.showToast('Exporting transactions...', 'info');
        // In a real app, this would call an API to generate a CSV
        setTimeout(() => {
            this.showToast('Transactions exported successfully!', 'success');
        }, 1500);
    }

    downloadReceipt(transactionId) {
        this.showToast('Downloading receipt...', 'info');
        // In a real app, this would call an API to generate a PDF
        setTimeout(() => {
            this.showToast('Receipt downloaded successfully!', 'success');
        }, 1500);
    }

    // Helper Methods
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    formatAmount(amount, currency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    }

    getTypeBadgeColor(type) {
        const colors = {
            'deposit': 'success',
            'withdrawal': 'danger',
            'transfer': 'primary',
            'exchange': 'info'
        };
        return colors[type.toLowerCase()] || 'secondary';
    }

    getStatusBadgeColor(status) {
        const colors = {
            'completed': 'success',
            'pending': 'warning',
            'failed': 'danger'
        };
        return colors[status.toLowerCase()] || 'secondary';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

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

    // Mock Data (For Demo Only)
    getMockTransactions() {
        const types = ['deposit', 'withdrawal', 'transfer', 'exchange'];
        const statuses = ['completed', 'pending', 'failed'];
        const currencies = ['USD', 'EUR', 'GBP'];
        
        const transactions = [];
        
        for (let i = 0; i < 10; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const currency = currencies[Math.floor(Math.random() * currencies.length)];
            const amount = Math.floor(Math.random() * 10000) / 100;
            
            transactions.push({
                transactionId: `TX${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
                type: type,
                amount: amount,
                currency: currency,
                status: status,
                description: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
                fromCurrency: type === 'exchange' ? currency : null,
                toCurrency: type === 'exchange' ? currencies.filter(c => c !== currency)[0] : null,
                exchangeRate: type === 'exchange' ? (Math.random() * 2).toFixed(4) : null
            });
        }
        
        return transactions;
    }

    getMockTransactionDetails(transactionId) {
        // In a real app, this would fetch from an API based on the ID
        // For demo purposes, we'll create a detailed mock
        const transaction = this.getMockTransactions()[0];
        transaction.transactionId = transactionId;
        
        if (transaction.type === 'transfer') {
            transaction.recipient = 'user@example.com';
        }
        
        return transaction;
    }
}

// Wallet Manager
class WalletManager {
    constructor() {
        this.balances = { USD: 0, EUR: 0, GBP: 0 };
        this.exchangeRates = {};
        this.recentActivity = [];
        
        this.initializeEventListeners();
        this.loadWalletData();
        this.fetchExchangeRates();
        this.initializeCharts();
    }

    initializeEventListeners() {
        // Form submissions
        document.getElementById('depositForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDeposit();
        });

        document.getElementById('withdrawForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWithdrawal();
        });

        document.getElementById('transferForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransfer();
        });

        // Currency changes
        document.getElementById('depositCurrency')?.addEventListener('change', (e) => {
            this.updateCurrencySymbol('deposit', e.target.value);
        });

        document.getElementById('withdrawCurrency')?.addEventListener('change', (e) => {
            this.updateCurrencySymbol('withdraw', e.target.value);
            this.updateWithdrawAvailableBalance();
        });

        document.getElementById('transferFromCurrency')?.addEventListener('change', (e) => {
            this.updateCurrencySymbol('transfer', e.target.value);
            this.updateTransferAvailableBalance();
            this.updateTransferRate();
        });

        // Update transfer calculations
        document.getElementById('transferAmount')?.addEventListener('input', () => this.updateTransferRate());
        document.getElementById('transferToCurrency')?.addEventListener('change', () => this.updateTransferRate());
    }

    async loadWalletData() {
        try {
            // In a real application, this would be an API call
            // const response = await fetch('/api/wallet/data');
            // const data = await response.json();
            
            // Mock data for demonstration
            const data = {
                balances: {
                    USD: 25000.75,
                    EUR: 21250.50,
                    GBP: 18750.20
                },
                recentActivity: [
                    {
                        date: new Date(Date.now() - 1000 * 60 * 60),
                        type: 'deposit',
                        amount: 1000,
                        currency: 'USD',
                        status: 'completed'
                    },
                    {
                        date: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        type: 'withdrawal',
                        amount: -500,
                        currency: 'EUR',
                        status: 'pending'
                    },
                    {
                        date: new Date(Date.now() - 1000 * 60 * 60 * 3),
                        type: 'transfer',
                        amount: -750,
                        currency: 'GBP',
                        status: 'completed'
                    }
                ]
            };

            this.balances = data.balances;
            this.recentActivity = data.recentActivity;
            
            this.updateBalanceDisplays();
            this.renderRecentActivity();
            this.updateWithdrawAvailableBalance();
            this.updateTransferAvailableBalance();
            this.updateCharts();
        } catch (error) {
            this.showToast('Error loading wallet data', 'error');
        }
    }

    updateBalanceDisplays() {
        Object.entries(this.balances).forEach(([currency, amount]) => {
            const element = document.getElementById(`wallet-${currency.toLowerCase()}Balance`);
            if (element) {
                element.textContent = this.formatAmount(amount);
            }
        });
    }

    renderRecentActivity() {
        const tbody = document.getElementById('recentWalletActivity');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.recentActivity.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent activity</td></tr>';
            return;
        }

        this.recentActivity.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDateTime(activity.date)}</td>
                <td><span class="badge bg-${this.getTypeBadgeColor(activity.type)}">${activity.type}</span></td>
                <td class="${activity.amount >= 0 ? 'text-success' : 'text-danger'}">${this.formatAmount(Math.abs(activity.amount))}</td>
                <td>${activity.currency}</td>
                <td><span class="badge bg-${this.getStatusBadgeColor(activity.status)}">${activity.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    initializeCharts() {
        // Monthly Transactions Chart
        const monthlyCtx = document.getElementById('monthlyTransactionsChart')?.getContext('2d');
        if (monthlyCtx) {
            new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Deposits',
                        data: [1200, 1900, 1500, 2100, 1800, 2300],
                        backgroundColor: 'rgba(75, 192, 192, 0.5)'
                    }, {
                        label: 'Withdrawals',
                        data: [800, 1200, 1100, 1500, 1300, 1700],
                        backgroundColor: 'rgba(255, 99, 132, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Currency Distribution Chart
        const distributionCtx = document.getElementById('currencyDistributionChart')?.getContext('2d');
        if (distributionCtx) {
            new Chart(distributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['USD', 'EUR', 'GBP'],
                    datasets: [{
                        data: [25000, 21250, 18750],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // Helper functions
    formatAmount(amount) {
        return amount.toFixed(2);
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString();
    }

    getTypeBadgeColor(type) {
        const colors = {
            deposit: 'success',
            withdrawal: 'danger',
            transfer: 'primary'
        };
        return colors[type] || 'secondary';
    }

    getStatusBadgeColor(status) {
        const colors = {
            completed: 'success',
            pending: 'warning',
            failed: 'danger'
        };
        return colors[status] || 'secondary';
    }

    updateCurrencySymbol(type, currency) {
        const symbols = { USD: '$', EUR: '€', GBP: '£' };
        const element = document.getElementById(`${type}CurrencySymbol`);
        if (element) {
            element.textContent = symbols[currency] || '$';
        }
    }

    showToast(message, type = 'success') {
        // Implementation depends on your toast notification system
        alert(message);
    }
}

// Function to navigate between dashboard sections (if not already present)
function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active-section');
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
        const link = li.querySelector(`a[href="#${sectionId}"]`);
        if (link) {
            li.classList.add('active');
        }
    });
}

// Add this class to your js/dashboard.js
class ExchangeManager {
    constructor(walletManager) {
        this.walletManager = walletManager; // Access wallet balances
        this.exchangeRates = {}; // Store fetched rates
        this.rateFetchInterval = null; // Interval ID for rate fetching

        this.initializeEventListeners();
        this.startRateFetching(); // Start fetching rates periodically
    }

    initializeEventListeners() {
        const form = document.getElementById('exchangeForm');
        const fromCurrencySelect = document.getElementById('exchangeFromCurrency');
        const toCurrencySelect = document.getElementById('exchangeToCurrency');
        const fromAmountInput = document.getElementById('exchangeFromAmount');
        const swapBtn = document.getElementById('swapCurrenciesBtn');
        const setMaxBtn = document.getElementById('setMaxAmountBtn');

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleExchangeConfirm();
        });

        fromCurrencySelect?.addEventListener('change', this.handleCurrencyChange.bind(this));
        toCurrencySelect?.addEventListener('change', this.handleCurrencyChange.bind(this));
        fromAmountInput?.addEventListener('input', this.updateConversion.bind(this));

        swapBtn?.addEventListener('click', this.swapCurrencies.bind(this));
        setMaxBtn?.addEventListener('click', this.setMaxAmount.bind(this));
    }

    // Call this when the Exchange section is shown
    activate() {
        this.updateBalanceDisplay();
        this.updateAvailableBalance(); // Initial update
        this.updateConversion(); // Initial update
        this.startRateFetching(); // Ensure rates are fresh
    }

    // Call this when the Exchange section is hidden
    deactivate() {
        this.stopRateFetching();
    }

    startRateFetching() {
        if (this.rateFetchInterval) clearInterval(this.rateFetchInterval); // Clear existing interval
        this.fetchExchangeRates(); // Fetch immediately
        this.rateFetchInterval = setInterval(() => this.fetchExchangeRates(), 30000); // Fetch every 30 seconds
    }

    stopRateFetching() {
        if (this.rateFetchInterval) clearInterval(this.rateFetchInterval);
        this.rateFetchInterval = null;
    }

    async fetchExchangeRates() {
        try {
            // Use a base currency relevant to your users or system, e.g., USD
            const baseCurrency = 'USD';
            const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
            const data = await response.json();

            if (data && data.result === 'success' && data.rates) {
                this.exchangeRates = data.rates;
                // Update the live rates display
                this.updateLiveRatesDisplay();
                // Update the current conversion calculation
                this.updateConversion();
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
             this.walletManager.showToast('Could not fetch live exchange rates.', 'warning');
            // Optionally use stale rates or disable exchange if rates are crucial
        }
    }

    updateBalanceDisplay() {
        if (!this.walletManager) return;
        const balances = this.walletManager.balances;
        document.getElementById('balance-usd').textContent = this.walletManager.formatAmount(balances.USD, 'USD');
        document.getElementById('balance-eur').textContent = this.walletManager.formatAmount(balances.EUR, 'EUR');
        document.getElementById('balance-gbp').textContent = this.walletManager.formatAmount(balances.GBP, 'GBP');
    }

     updateLiveRatesDisplay() {
        const rateEUR = document.getElementById('rate-eur');
        const rateGBP = document.getElementById('rate-gbp');

        if (rateEUR && this.exchangeRates['EUR']) {
            rateEUR.textContent = (1 / this.exchangeRates['EUR']).toFixed(4); // Show 1 EUR = X USD
        } else if (rateEUR) {
            rateEUR.textContent = 'N/A';
        }
         if (rateGBP && this.exchangeRates['GBP']) {
            rateGBP.textContent = (1 / this.exchangeRates['GBP']).toFixed(4); // Show 1 GBP = X USD
        } else if (rateGBP) {
            rateGBP.textContent = 'N/A';
        }
    }

    handleCurrencyChange() {
        this.updateAvailableBalance();
        this.updateConversion();
    }

    updateAvailableBalance() {
        if (!this.walletManager) return;

        const fromCurrency = document.getElementById('exchangeFromCurrency')?.value;
        const balanceSpan = document.getElementById('exchangeAvailableBalance');
        const currencySpan = document.getElementById('exchangeAvailableCurrency');

        if (fromCurrency && balanceSpan && currencySpan) {
            const balance = this.walletManager.balances[fromCurrency] || 0;
            balanceSpan.textContent = this.walletManager.formatAmount(balance, fromCurrency, false); // Format without currency symbol
            currencySpan.textContent = fromCurrency;
        }
    }

     setMaxAmount() {
        const fromCurrency = document.getElementById('exchangeFromCurrency')?.value;
        const fromAmountInput = document.getElementById('exchangeFromAmount');
        if (fromCurrency && fromAmountInput && this.walletManager) {
            const balance = this.walletManager.balances[fromCurrency] || 0;
            fromAmountInput.value = balance.toFixed(2); // Set to 2 decimal places
            this.updateConversion(); // Update the 'To' amount
        }
    }

    swapCurrencies() {
        const fromSelect = document.getElementById('exchangeFromCurrency');
        const toSelect = document.getElementById('exchangeToCurrency');
        if (!fromSelect || !toSelect) return;

        const fromVal = fromSelect.value;
        const toVal = toSelect.value;

        fromSelect.value = toVal;
        toSelect.value = fromVal;

        // Trigger updates after swapping
        this.handleCurrencyChange();
    }

    updateConversion() {
        const fromCurrency = document.getElementById('exchangeFromCurrency')?.value;
        const toCurrency = document.getElementById('exchangeToCurrency')?.value;
        const fromAmount = parseFloat(document.getElementById('exchangeFromAmount')?.value) || 0;
        const toAmountInput = document.getElementById('exchangeToAmount');
        const rateDisplay = document.getElementById('exchangeRateDisplay');
        const confirmBtn = document.getElementById('confirmExchangeBtn');

        if (!fromCurrency || !toCurrency || !toAmountInput || !rateDisplay || !confirmBtn) return;

        // Reset display if currencies are the same or amount is zero
        if (fromCurrency === toCurrency || fromAmount <= 0 || Object.keys(this.exchangeRates).length === 0) {
            toAmountInput.value = '';
            rateDisplay.textContent = 'N/A';
            confirmBtn.disabled = true;
            return;
        }

        // Calculate rate (assuming USD is the base from API)
        const rateFromBase = this.exchangeRates[fromCurrency] || 1; // Rate of FromCurrency vs Base (USD)
        const rateToBase = this.exchangeRates[toCurrency] || 1; // Rate of ToCurrency vs Base (USD)

        // Calculate the direct rate: How many ToCurrency units for 1 FromCurrency unit
        // Rate = (Rate of ToCurrency / Rate of FromCurrency)
        const directRate = rateToBase / rateFromBase;

        if (isNaN(directRate) || directRate <= 0) {
             rateDisplay.textContent = 'Rate unavailable';
             toAmountInput.value = '';
             confirmBtn.disabled = true;
             return;
        }

        const calculatedToAmount = fromAmount * directRate;
        toAmountInput.value = calculatedToAmount.toFixed(2); // Display estimated received amount
        rateDisplay.textContent = `1 ${fromCurrency} ≈ ${directRate.toFixed(4)} ${toCurrency}`;

        // Enable/disable button based on sufficient balance
        const availableBalance = this.walletManager.balances[fromCurrency] || 0;
        confirmBtn.disabled = fromAmount > availableBalance;
        if(fromAmount > availableBalance) {
            rateDisplay.textContent += ' (Insufficient Balance)';
        }
    }

    async handleExchangeConfirm() {
        const fromCurrency = document.getElementById('exchangeFromCurrency')?.value;
        const toCurrency = document.getElementById('exchangeToCurrency')?.value;
        const fromAmount = parseFloat(document.getElementById('exchangeFromAmount')?.value);
        const toAmount = parseFloat(document.getElementById('exchangeToAmount')?.value); // Estimated amount

        if (!fromCurrency || !toCurrency || isNaN(fromAmount) || fromAmount <= 0) {
            this.walletManager.showToast('Invalid exchange details.', 'warning');
            return;
        }

        const availableBalance = this.walletManager.balances[fromCurrency] || 0;
        if (fromAmount > availableBalance) {
            this.walletManager.showToast(`Insufficient ${fromCurrency} balance.`, 'error');
            return;
        }

        const confirmBtn = document.getElementById('confirmExchangeBtn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        this.walletManager.showToast(`Exchanging ${fromCurrency} ${fromAmount}...`, 'info');

        // Replace with actual API call
        // try {
        //     const response = await fetch('/api/wallet/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ fromCurrency, toCurrency, amount: fromAmount }) });
        //     const data = await response.json();
        //     if (data.success) {
        //         this.walletManager.showToast('Exchange successful!', 'success');
        //         // IMPORTANT: Update wallet balances from the response or by calling walletManager.loadWalletData()
        //         this.walletManager.balances = data.newBalances; // Assuming API returns updated balances
        //         this.updateBalanceDisplay();
        //         this.updateAvailableBalance();
        //         document.getElementById('exchangeForm').reset(); // Clear form
        //         this.updateConversion(); // Reset conversion display
        //     } else { throw new Error(data.message); }
        // } catch (error) { this.walletManager.showToast(`Exchange failed: ${error.message}`, 'error'); }
        // finally {
        //     confirmBtn.disabled = false;
        //     confirmBtn.textContent = 'Confirm Exchange';
        // }

         // --- Mock Success ---
        setTimeout(() => {
            const rateFromBase = this.exchangeRates[fromCurrency] || 1;
            const rateToBase = this.exchangeRates[toCurrency] || 1;
            const directRate = rateToBase / rateFromBase;
            const actualReceivedAmount = fromAmount * directRate; // Use the rate used for calculation

            this.walletManager.balances[fromCurrency] -= fromAmount;
            this.walletManager.balances[toCurrency] += actualReceivedAmount;

            this.walletManager.showToast('Exchange successful!', 'success');
            this.updateBalanceDisplay();
            this.updateAvailableBalance();
            document.getElementById('exchangeForm').reset();
            this.updateConversion();

            // Add to wallet activity (optional)
            this.walletManager.recentActivity.unshift({ date: new Date(), type: 'Exchange', amount: -fromAmount, currency: fromCurrency, status: 'Completed' });
             this.walletManager.recentActivity.unshift({ date: new Date(), type: 'Received', amount: actualReceivedAmount, currency: toCurrency, status: 'Completed' });
            this.walletManager.renderRecentActivity(); // Update if wallet section shows activity


            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Exchange';
        }, 1500);
         // --- End Mock Success ---
    }
} 