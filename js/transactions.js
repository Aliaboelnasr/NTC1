class TransactionManager {
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
        document.getElementById('filterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFilters();
            this.loadTransactions();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadTransactions();
            this.loadStatistics();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportTransactions();
        });

        // Table sorting
        document.querySelectorAll('th').forEach(header => {
            header.addEventListener('click', () => {
                this.handleSort(header.textContent.toLowerCase());
            });
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }

    updateFilters() {
        this.filters = {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            type: document.getElementById('transactionType').value,
            status: document.getElementById('status').value,
            currency: document.getElementById('currency').value,
            minAmount: document.getElementById('minAmount').value,
            maxAmount: document.getElementById('maxAmount').value
        };
    }

    async loadTransactions() {
        try {
            const response = await fetch('/api/transactions?' + new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.filters
            }), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.renderTransactions(data.transactions);
                this.updatePagination(data.totalPages, data.total);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Error loading transactions', 'error');
        }
    }

    renderTransactions(transactions) {
        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDateTime(transaction.date)}</td>
                <td>${transaction.transactionId}</td>
                <td><span class="badge badge-${transaction.type.toLowerCase()}">${transaction.type}</span></td>
                <td>${this.formatAmount(transaction.amount, transaction.currency)}</td>
                <td>${transaction.currency}</td>
                <td><span class="badge badge-${transaction.status.toLowerCase()}">${transaction.status}</span></td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="transactionManager.viewDetails('${transaction.transactionId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="transactionManager.downloadReceipt('${transaction.transactionId}')">
                        <i class="fas fa-file-download"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/transactions/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.updateStatistics(data.statistics);
            }
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

    async viewDetails(transactionId) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.showTransactionModal(data.transaction);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Error loading transaction details', 'error');
        }
    }

    showTransactionModal(transaction) {
        const detailsHtml = `
            <div class="transaction-details">
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Transaction ID</div>
                        <div class="col-md-8">${transaction.transactionId}</div>
                    </div>
                </div>
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Date & Time</div>
                        <div class="col-md-8">${this.formatDateTime(transaction.date)}</div>
                    </div>
                </div>
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Type</div>
                        <div class="col-md-8">
                            <span class="badge badge-${transaction.type.toLowerCase()}">${transaction.type}</span>
                        </div>
                    </div>
                </div>
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Amount</div>
                        <div class="col-md-8">${this.formatAmount(transaction.amount, transaction.currency)}</div>
                    </div>
                </div>
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Status</div>
                        <div class="col-md-8">
                            <span class="badge badge-${transaction.status.toLowerCase()}">${transaction.status}</span>
                        </div>
                    </div>
                </div>
                ${this.getAdditionalDetails(transaction)}
            </div>
        `;

        document.getElementById('transactionDetails').innerHTML = detailsHtml;
        new bootstrap.Modal(document.getElementById('transactionModal')).show();
    }

    getAdditionalDetails(transaction) {
        let details = '';
        
        if (transaction.type === 'transfer') {
            details += `
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Recipient</div>
                        <div class="col-md-8">${transaction.recipient}</div>
                    </div>
                </div>
            `;
        } else if (transaction.type === 'exchange') {
            details += `
                <div class="transaction-detail-row">
                    <div class="row">
                        <div class="col-md-4 detail-label">Exchange Rate</div>
                        <div class="col-md-8">${transaction.exchangeRate}</div>
                    </div>
                </div>
            `;
        }

        return details;
    }

    async downloadReceipt(transactionId) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/receipt`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${transactionId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                throw new Error('Failed to download receipt');
            }
        } catch (error) {
            this.showToast('Error downloading receipt', 'error');
        }
    }

    async exportTransactions() {
        try {
            const response = await fetch('/api/transactions/export?' + new URLSearchParams(this.filters), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                throw new Error('Failed to export transactions');
            }
        } catch (error) {
            this.showToast('Error exporting transactions', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type}`;
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

    // Utility functions
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    formatAmount(amount, currency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    handleLogout() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Initialize the transaction manager
const transactionManager = new TransactionManager(); 