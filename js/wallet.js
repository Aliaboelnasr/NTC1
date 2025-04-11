// Wallet functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    const modals = ['depositModal', 'withdrawModal', 'transferModal'].map(
        id => new bootstrap.Modal(document.getElementById(id))
    );

    // Load initial data
    loadWalletData();
    loadTransactionHistory();

    // Add event listeners
    document.getElementById('depositForm').addEventListener('submit', handleDeposit);
    document.getElementById('withdrawForm').addEventListener('submit', handleWithdraw);
    document.getElementById('transferForm').addEventListener('submit', handleTransfer);
    document.getElementById('transactionType').addEventListener('change', filterTransactions);

    // Update exchange rate when currencies change
    document.getElementById('fromCurrency').addEventListener('change', updateExchangeRate);
    document.getElementById('toCurrency').addEventListener('change', updateExchangeRate);
    document.getElementById('transferAmount').addEventListener('input', updateReceiveAmount);
});

// Show modals
function showDepositModal() {
    const modal = new bootstrap.Modal(document.getElementById('depositModal'));
    modal.show();
}

function showWithdrawModal() {
    const modal = new bootstrap.Modal(document.getElementById('withdrawModal'));
    modal.show();
}

function showTransferModal() {
    const modal = new bootstrap.Modal(document.getElementById('transferModal'));
    modal.show();
    updateExchangeRate();
}

// Global variables to store user data
let userData = {
    balances: {},
    transactions: []
};

// Function to fetch user data when the page loads
async function fetchUserData() {
    try {
        const response = await fetch('/api/user/wallet', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            userData = data;
            updateWalletDisplay();
            updateTransactionHistory();
        } else {
            showToast('Failed to load wallet data', 'error');
        }
    } catch (error) {
        showToast('Error loading wallet data', 'error');
    }
}

// Function to update the wallet display with real data
function updateWalletDisplay() {
    // Update balance cards
    Object.entries(userData.balances).forEach(([currency, balance]) => {
        const balanceElement = document.querySelector(`#${currency.toLowerCase()}Balance`);
        if (balanceElement) {
            balanceElement.textContent = formatCurrency(balance, currency);
        }
    });

    // Update total balance in USD
    const totalUSDBalance = calculateTotalUSDBalance();
    document.querySelector('#totalBalance').textContent = formatCurrency(totalUSDBalance, 'USD');
}

// Function to update transaction history with real data
function updateTransactionHistory() {
    const transactionTable = document.querySelector('#transactionHistory tbody');
    transactionTable.innerHTML = ''; // Clear existing rows

    userData.transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.type}</td>
            <td class="${transaction.type === 'deposit' ? 'text-success' : 'text-danger'}">
                ${formatCurrency(transaction.amount, transaction.currency)}
            </td>
            <td>${transaction.status}</td>
            <td>${transaction.description || '-'}</td>
        `;
        transactionTable.appendChild(row);
    });
}

// Helper function to format currency
function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Helper function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate total balance in USD
function calculateTotalUSDBalance() {
    // This would need real exchange rates from your backend
    const exchangeRates = {
        EUR: userData.exchangeRates?.EUR || 1.1,
        GBP: userData.exchangeRates?.GBP || 1.3,
        USD: 1
    };

    return Object.entries(userData.balances).reduce((total, [currency, balance]) => {
        return total + (balance * exchangeRates[currency]);
    }, 0);
}

// Initialize real-time updates
function initializeRealTimeUpdates() {
    // Fetch initial data
    fetchUserData();

    // Set up periodic updates (every 30 seconds)
    setInterval(fetchUserData, 30000);
}

// Event listener for when the page loads
document.addEventListener('DOMContentLoaded', initializeRealTimeUpdates);

// Load wallet data
async function loadWalletData() {
    try {
        const response = await fetch('/api/wallet/info', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.success) {
            updateBalanceDisplays(data.balances);
        } else {
            showToast('Failed to load wallet data', 'error');
        }
    } catch (error) {
        showToast('Error loading wallet data', 'error');
    }
}

// Load transaction history
async function loadTransactionHistory(page = 1, type = 'all') {
    try {
        const response = await fetch(`/api/wallet/transactions?page=${page}&type=${type}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.success) {
            displayTransactions(data.transactions);
            updatePagination(data.currentPage, data.totalPages);
        }
    } catch (error) {
        showToast('Error loading transactions', 'error');
    }
}

// Handle form submissions
async function handleDeposit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const currency = document.getElementById('depositCurrency').value;
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;

    try {
        const response = await fetch('/api/wallet/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                type: 'deposit',
                amount,
                fromCurrency: currency,
                toCurrency: currency,
                paymentMethod: method
            })
        });

        const data = await response.json();

        if (data.success) {
            updateBalanceDisplays(data.newBalances);
            loadTransactionHistory();
            showToast('Deposit successful!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('depositModal')).hide();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleWithdraw(e) {
    e.preventDefault();
    const amount = document.getElementById('withdrawAmount').value;
    const currency = document.getElementById('withdrawCurrency').value;
    const method = document.getElementById('withdrawMethod').value;

    try {
        // Check if sufficient balance
        const currentBalance = parseFloat(document.getElementById(`${currency.toLowerCase()}Balance`).textContent.replace(/,/g, ''));
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        // Simulate API call
        await simulateApiCall({ amount, currency, method });
        updateBalance(currency, amount, 'subtract');
        addTransaction('withdrawal', amount, currency);
        showToast('Withdrawal request submitted!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTransfer(e) {
    e.preventDefault();
    const amount = document.getElementById('transferAmount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    try {
        // Check if sufficient balance
        const currentBalance = parseFloat(document.getElementById(`${fromCurrency.toLowerCase()}Balance`).textContent.replace(/,/g, ''));
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        // Simulate API call
        await simulateApiCall({ amount, fromCurrency, toCurrency });
        updateBalance(fromCurrency, amount, 'subtract');
        updateBalance(toCurrency, amount * getExchangeRate(fromCurrency, toCurrency), 'add');
        addTransaction('transfer', amount, `${fromCurrency} → ${toCurrency}`);
        showToast('Transfer successful!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Helper functions
function updateBalance(currency, amount, operation) {
    const balanceElement = document.getElementById(`${currency.toLowerCase()}Balance`);
    let currentBalance = parseFloat(balanceElement.textContent.replace(/,/g, ''));
    
    if (operation === 'add') {
        currentBalance += parseFloat(amount);
    } else {
        currentBalance -= parseFloat(amount);
    }

    balanceElement.textContent = currentBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function addTransaction(type, amount, currency) {
    const tbody = document.getElementById('transactionHistory');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date().toLocaleDateString()}</td>
        <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
        <td>${amount}</td>
        <td>${currency}</td>
        <td><span class="badge bg-success">Completed</span></td>
        <td><button class="btn btn-sm btn-outline-primary">Details</button></td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
}

function updateExchangeRate() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    
    document.getElementById('exchangeRate').textContent = 
        `1 ${fromCurrency} = ${rate} ${toCurrency}`;
    
    updateReceiveAmount();
}

function updateReceiveAmount() {
    const amount = document.getElementById('transferAmount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    
    const receiveAmount = (amount * rate).toFixed(2);
    document.getElementById('receiveAmount').textContent = 
        `${receiveAmount} ${toCurrency}`;
}

// Mock functions
function getExchangeRate(from, to) {
    const rates = {
        'USD': { 'EUR': 0.85, 'GBP': 0.73 },
        'EUR': { 'USD': 1.18, 'GBP': 0.86 },
        'GBP': { 'USD': 1.37, 'EUR': 1.16 }
    };
    return rates[from][to];
}

function simulateApiCall(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate
                resolve(data);
            } else {
                reject(new Error('Transaction failed. Please try again.'));
            }
        }, 1000);
    });
}

// Update balance displays
function updateBalanceDisplays(balances) {
    Object.keys(balances).forEach(currency => {
        const element = document.getElementById(`${currency.toLowerCase()}Balance`);
        if (element) {
            element.textContent = balances[currency].toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    });
}

// Display transactions
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionHistory');
    tbody.innerHTML = '';

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.createdAt).toLocaleDateString()}</td>
            <td>${formatTransactionType(transaction.type)}</td>
            <td>${formatAmount(transaction.amount, transaction.fromCurrency)}</td>
            <td>${transaction.type === 'transfer' ? 
                `${transaction.fromCurrency} → ${transaction.toCurrency}` : 
                transaction.fromCurrency}</td>
            <td><span class="badge bg-${getStatusColor(transaction.status)}">${transaction.status}</span></td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="showTransactionDetails('${transaction._id}')">Details</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Helper functions
function formatTransactionType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatAmount(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function getStatusColor(status) {
    const colors = {
        completed: 'success',
        pending: 'warning',
        failed: 'danger'
    };
    return colors[status] || 'secondary';
}

// Show transaction details
async function showTransactionDetails(transactionId) {
    try {
        const response = await fetch(`/api/wallet/transaction/${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.success) {
            // Create and show modal with transaction details
            const modal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
            document.getElementById('transactionDetails').innerHTML = `
                <p><strong>Date:</strong> ${new Date(data.transaction.createdAt).toLocaleString()}</p>
                <p><strong>Type:</strong> ${formatTransactionType(data.transaction.type)}</p>
                <p><strong>Amount:</strong> ${formatAmount(data.transaction.amount, data.transaction.fromCurrency)}</p>
                <p><strong>Status:</strong> ${data.transaction.status}</p>
                <p><strong>Payment Method:</strong> ${data.transaction.paymentMethod}</p>
                ${data.transaction.description ? `<p><strong>Description:</strong> ${data.transaction.description}</p>` : ''}
            `;
            modal.show();
        }
    } catch (error) {
        showToast('Error loading transaction details', 'error');
    }
} 