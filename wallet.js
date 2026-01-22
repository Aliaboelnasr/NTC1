class WalletManager {
    constructor() {
        this.balances = {};
        this.transactions = [];
        this.exchangeRates = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadWalletData();
        this.setupSidebarToggle();
    }

    setupEventListeners() {
        // Form submissions
        const depositForm = document.getElementById('depositForm');
        if (depositForm) {
            depositForm.addEventListener('submit', (e) => this.handleDeposit(e));
        }

        const withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));
        }

        const transferForm = document.getElementById('transferForm');
        if (transferForm) {
            transferForm.addEventListener('submit', (e) => this.handleTransfer(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const dashboardContainer = document.querySelector('.dashboard-container');
        
        if (sidebarToggle && dashboardContainer) {
            sidebarToggle.addEventListener('click', () => {
                dashboardContainer.classList.toggle('sidebar-collapsed');
            });
        }
    }

    async loadWalletData() {
        try {
            // Show loading state
            this.showLoading(true);

            // Simulate API call - replace with actual API call
            const data = await this.fetchWalletData();
            
            // Update UI with wallet data
            this.updateWalletUI(data);

            // Load recent transactions
            this.loadTransactions();

        } catch (error) {
            this.showNotification('Failed to load wallet data', 'danger');
            console.error('Error loading wallet data:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchWalletData() {
        // Simulate API call - replace with actual API endpoint
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    totalBalance: 25420.65,
                    availableBalance: 24150.00,
                    pendingBalance: 1270.65,
                    currencies: [
                        {
                            code: 'USD',
                            balance: 15420.65,
                            valueInUSD: 15420.65,
                            change24h: 1.2
                        },
                        {
                            code: 'EUR',
                            balance: 8250.00,
                            valueInUSD: 9075.00,
                            change24h: -0.8
                        }
                    ]
                });
            }, 1000);
        });
    }

    updateWalletUI(data) {
        // Update balance displays
        document.getElementById('totalBalance').textContent = this.formatCurrency(data.totalBalance);
        document.getElementById('availableBalance').textContent = this.formatCurrency(data.availableBalance);
        document.getElementById('pendingBalance').textContent = this.formatCurrency(data.pendingBalance);

        // Update currency table
        const tableBody = document.querySelector('#currencyTable tbody');
        if (tableBody && data.currencies) {
            tableBody.innerHTML = data.currencies.map(currency => this.createCurrencyRow(currency)).join('');
        }
    }

    async loadTransactions() {
        try {
            // Simulate API call - replace with actual API endpoint
            const transactions = await this.fetchTransactions();
            this.updateTransactionTable(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showNotification('Failed to load transactions', 'danger');
        }
    }

    async handleDeposit(event) {
        event.preventDefault();
        const form = event.target;
        const amount = form.querySelector('#depositAmount').value;
        const currency = form.querySelector('#depositCurrency').value;

        try {
            // Simulate API call - replace with actual API endpoint
            await this.processDeposit(amount, currency);
            this.showNotification('Deposit initiated successfully', 'success');
            this.closeModal('depositModal');
            this.loadWalletData(); // Refresh wallet data
        } catch (error) {
            this.showNotification('Failed to process deposit', 'danger');
            console.error('Deposit error:', error);
        }
    }

    async handleWithdraw(event) {
        event.preventDefault();
        const form = event.target;
        const amount = form.querySelector('#withdrawAmount').value;
        const currency = form.querySelector('#withdrawCurrency').value;
        const bankAccount = form.querySelector('#bankAccount').value;

        try {
            // Simulate API call - replace with actual API endpoint
            await this.processWithdraw(amount, currency, bankAccount);
            this.showNotification('Withdrawal initiated successfully', 'success');
            this.closeModal('withdrawModal');
            this.loadWalletData(); // Refresh wallet data
        } catch (error) {
            this.showNotification('Failed to process withdrawal', 'danger');
            console.error('Withdrawal error:', error);
        }
    }

    async handleTransfer(event) {
        event.preventDefault();
        const form = event.target;
        const amount = form.querySelector('#transferAmount').value;
        const currency = form.querySelector('#transferCurrency').value;
        const recipient = form.querySelector('#recipientEmail').value;

        try {
            // Simulate API call - replace with actual API endpoint
            await this.processTransfer(amount, currency, recipient);
            this.showNotification('Transfer initiated successfully', 'success');
            this.closeModal('transferModal');
            this.loadWalletData(); // Refresh wallet data
        } catch (error) {
            this.showNotification('Failed to process transfer', 'danger');
            console.error('Transfer error:', error);
        }
    }

    handleLogout() {
        // Clear session data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }

    // Helper methods
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('d-none', !show);
        }
    }

    showNotification(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
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

    closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }
}

// Initialize wallet manager
const walletManager = new WalletManager(); 