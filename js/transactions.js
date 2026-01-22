class TransactionManager {
    constructor() {
        this.transactions = [];
        this.init();
    }

    init() {
            this.loadTransactions();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                this.filterTransactions(filterType);
                
                // Update active button state
                document.querySelectorAll('[data-filter]').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });

        // Listen for new transactions from wallet
        window.addEventListener('walletTransaction', (event) => {
            this.addNewTransaction(event.detail);
        });
    }

    async loadTransactions() {
        try {
            // In a real app, this would be an API call
            const transactions = await this.fetchTransactions();
            this.transactions = transactions;
            this.updateUI();
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Failed to load transactions');
        }
    }

    async fetchTransactions() {
        // Simulate API call - replace with actual API endpoint
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        date: new Date(),
                        type: 'deposit',
                        amount: 1000,
                        status: 'completed',
                        description: 'Bank transfer deposit'
                    },
                    {
                        id: 2,
                        date: new Date(Date.now() - 86400000),
                        type: 'withdrawal',
                        amount: -500,
                        status: 'completed',
                        description: 'ATM withdrawal'
                    }
                    // Add more mock transactions as needed
                ]);
            }, 1000);
        });
    }

    async addNewTransaction(transaction) {
        this.transactions.unshift(transaction);
        this.updateUI();

        // Update balance display if available
        if (window.walletManager) {
            window.walletManager.loadBalance();
        }
    }

    updateUI() {
        this.updateTransactionTable();
        this.updateSummary();
    }

    updateTransactionTable() {
        const tbody = document.querySelector('#transactionTable tbody');
        if (!tbody) return;

        tbody.innerHTML = this.transactions.map(transaction => `
            <tr class="transaction-row ${transaction.type}">
                <td>${new Date(transaction.date).toLocaleString()}</td>
                <td>
                    <span class="badge ${this.getTypeBadgeClass(transaction.type)}">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td class="${transaction.amount >= 0 ? 'text-success' : 'text-danger'}">
                    ${this.formatCurrency(Math.abs(transaction.amount))}
                </td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(transaction.status)}">
                        ${transaction.status}
                    </span>
                </td>
                <td>${transaction.description}</td>
            </tr>
        `).join('');
    }

    updateSummary() {
        const summary = this.calculateSummary();
        
        document.getElementById('totalTransactions').textContent = summary.total;
        document.getElementById('totalDeposits').textContent = this.formatCurrency(summary.deposits);
        document.getElementById('totalWithdrawals').textContent = this.formatCurrency(summary.withdrawals);
    }

    calculateSummary() {
        return this.transactions.reduce((summary, transaction) => {
            if (transaction.type === 'deposit' && transaction.status === 'completed') {
                summary.deposits += transaction.amount;
            } else if (transaction.type === 'withdrawal' && transaction.status === 'completed') {
                summary.withdrawals += Math.abs(transaction.amount);
            }
            summary.total++;
            return summary;
        }, { deposits: 0, withdrawals: 0, total: 0 });
    }

    filterTransactions(type) {
        const rows = document.querySelectorAll('#transactionTable tbody tr');
        rows.forEach(row => {
            if (type === 'all' || row.classList.contains(type)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    getTypeBadgeClass(type) {
        return type === 'deposit' ? 'bg-success' : 'bg-danger';
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'completed': return 'bg-success';
            case 'pending': return 'bg-warning';
            case 'failed': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    showError(message) {
        // Implement error notification
        console.error(message);
    }
}

// Initialize transaction manager
document.addEventListener('DOMContentLoaded', () => {
    window.transactionManager = new TransactionManager();
}); 
// Add this to the bottom of each page's script section
document.addEventListener('DOMContentLoaded', () => {
    // Set active state for current page
    const currentPage = window.location.pathname.split('/').pop();
    const navigationButtons = document.querySelectorAll('.navigation-buttons .btn');
    
    navigationButtons.forEach(button => {
        const href = button.getAttribute('href');
        if (href === currentPage) {
            button.classList.add('active');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadTransactionHistory();
});

function loadTransactionHistory() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const historyTable = document.getElementById('transactionHistory');

    // Clear existing transactions
    historyTable.innerHTML = '';

    // Add transactions to the table
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.type}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td><span class="badge bg-success">${transaction.status}</span></td>
        `;
        historyTable.appendChild(row);
    });
}