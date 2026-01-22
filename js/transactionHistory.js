class TransactionHistory {
    constructor() {
        this.transactions = [];
        this.init();
    }

    init() {
        this.loadTransactionHistory();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for new transactions from wallet
        document.addEventListener('newTransaction', (event) => {
            this.addTransaction(event.detail);
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filterType = button.dataset.filter;
                this.filterTransactions(filterType);
            });
        });
    }

    async loadTransactionHistory() {
        try {
            const response = await fetch('/api/transactions/history', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.transactions = data.transactions;
                this.renderTransactions();
            }
        } catch (error) {
            this.showError('Failed to load transaction history');
        }
    }

    addTransaction(transaction) {
        // Add new transaction to the beginning of the array
        this.transactions.unshift(transaction);
        this.renderTransactions();
        
        // Add animation to the new transaction
        const firstRow = document.querySelector('#transactionTable tbody tr:first-child');
        if (firstRow) {
            firstRow.classList.add('new-transaction');
            setTimeout(() => firstRow.classList.remove('new-transaction'), 1000);
        }
    }

    renderTransactions() {
        const tableBody = document.getElementById('transactionTable')?.querySelector('tbody');
        if (!tableBody) return;

        tableBody.innerHTML = this.transactions.map(transaction => `
            <tr class="transaction-row ${transaction.type.toLowerCase()}">
                <td>${new Date(transaction.timestamp).toLocaleString()}</td>
                <td>
                    <span class="badge ${this.getTypeBadgeClass(transaction.type)}">
                        ${transaction.type}
                    </span>
                </td>
                <td class="${transaction.amount >= 0 ? 'text-success' : 'text-danger'}">
                    ${this.formatCurrency(transaction.amount)}
                </td>
                <td>${transaction.currency || 'USD'}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(transaction.status)}">
                        ${transaction.status}
                    </span>
                </td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info" 
                            onclick="transactionHistory.showTransactionDetails('${transaction._id}')">
                        Details
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateTransactionStats();
    }

    filterTransactions(type) {
        const tableBody = document.getElementById('transactionTable')?.querySelector('tbody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            if (type === 'all' || row.classList.contains(type.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    updateTransactionStats() {
        // Calculate and update transaction statistics
        const stats = this.calculateTransactionStats();
        
        document.getElementById('totalDeposits')?.textContent = this.formatCurrency(stats.totalDeposits);
        document.getElementById('totalWithdrawals')?.textContent = this.formatCurrency(stats.totalWithdrawals);
        document.getElementById('transactionCount')?.textContent = stats.totalCount;
    }

    calculateTransactionStats() {
        return this.transactions.reduce((stats, transaction) => {
            if (transaction.type === 'deposit' && transaction.status === 'completed') {
                stats.totalDeposits += transaction.amount;
            } else if (transaction.type === 'withdrawal' && transaction.status === 'completed') {
                stats.totalWithdrawals += Math.abs(transaction.amount);
            }
            stats.totalCount++;
            return stats;
        }, { totalDeposits: 0, totalWithdrawals: 0, totalCount: 0 });
    }

    async showTransactionDetails(transactionId) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.showTransactionModal(data.transaction);
            }
        } catch (error) {
            this.showError('Failed to load transaction details');
        }
    }

    showTransactionModal(transaction) {
        const modalHtml = `
            <div class="modal fade" id="transactionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Transaction Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="transaction-details">
                                <p><strong>Transaction ID:</strong> ${transaction._id}</p>
                                <p><strong>Type:</strong> ${transaction.type}</p>
                                <p><strong>Amount:</strong> ${this.formatCurrency(transaction.amount)}</p>
                                <p><strong>Status:</strong> ${transaction.status}</p>
                                <p><strong>Date:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
                                <p><strong>Description:</strong> ${transaction.description || '-'}</p>
                                ${this.getAdditionalTransactionDetails(transaction)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        document.getElementById('transactionModal')?.remove();
        
        // Add new modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
        modal.show();
    }

    getAdditionalTransactionDetails(transaction) {
        let details = '';
        
        if (transaction.paymentMethod) {
            details += `<p><strong>Payment Method:</strong> ${transaction.paymentMethod}</p>`;
        }
        
        if (transaction.fee) {
            details += `<p><strong>Fee:</strong> ${this.formatCurrency(transaction.fee)}</p>`;
        }
        
        if (transaction.balanceAfter !== undefined) {
            details += `<p><strong>Balance After:</strong> ${this.formatCurrency(transaction.balanceAfter)}</p>`;
        }

        return details;
    }

    getTypeBadgeClass(type) {
        const classes = {
            deposit: 'bg-success',
            withdrawal: 'bg-danger',
            transfer: 'bg-info',
            fee: 'bg-warning'
        };
        return classes[type.toLowerCase()] || 'bg-secondary';
    }

    getStatusBadgeClass(status) {
        const classes = {
            completed: 'bg-success',
            pending: 'bg-warning',
            failed: 'bg-danger',
            cancelled: 'bg-secondary'
        };
        return classes[status.toLowerCase()] || 'bg-secondary';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    showError(message) {
        // Implement your error notification system
        console.error(message);
    }
}

// Initialize transaction history
document.addEventListener('DOMContentLoaded', () => {
    window.transactionHistory = new TransactionHistory();
}); 