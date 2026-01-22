// Wallet functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    const modals = ['depositModal', 'withdrawModal', 'transferModal'].map(
        id => new bootstrap.Modal(document.getElementById(id))
    );

    // Add event listeners for quick action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]').dataset.action;
            switch(action) {
                case 'deposit':
                    showDepositModal();
                    break;
                case 'withdraw':
                    showWithdrawModal();
                    break;
                case 'transfer':
                    showTransferModal();
                    break;
                case 'history':
                    window.location.href = 'transactions.html';
                    break;
            }
        });
    });

    // Add event listeners for currency action buttons
    document.querySelectorAll('.currency-action-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const currency = e.target.dataset.currency;
            if (action === 'send') {
                showTransferModal(currency);
            } else if (action === 'receive') {
                showReceiveModal(currency);
            }
        });
    });

    // Form submissions
    document.getElementById('depositForm')?.addEventListener('submit', handleDeposit);
    document.getElementById('withdrawForm')?.addEventListener('submit', handleWithdraw);
    document.getElementById('transferForm')?.addEventListener('submit', handleTransfer);
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

function showTransferModal(currency = 'USD') {
    const modal = new bootstrap.Modal(document.getElementById('transferModal'));
    if (currency) {
        document.getElementById('transferCurrency').value = currency;
    }
    modal.show();
}

function showReceiveModal(currency) {
    // Implement receive functionality if needed
    alert(`Receive ${currency} functionality coming soon!`);
}

// Handle form submissions
function handleDeposit(e) {
    e.preventDefault();
    const form = e.target;
    const amount = form.querySelector('#depositAmount').value;
    const currency = form.querySelector('#depositCurrency').value;
    
    // Add your deposit logic here
    alert(`Deposit ${amount} ${currency} functionality coming soon!`);
    bootstrap.Modal.getInstance(document.getElementById('depositModal')).hide();
}

function handleWithdraw(e) {
    e.preventDefault();
    const form = e.target;
    const amount = form.querySelector('#withdrawAmount').value;
    const currency = form.querySelector('#withdrawCurrency').value;
    
    // Add your withdraw logic here
    alert(`Withdraw ${amount} ${currency} functionality coming soon!`);
    bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
}

function handleTransfer(e) {
    e.preventDefault();
    const form = e.target;
    const amount = form.querySelector('#transferAmount').value;
    const currency = form.querySelector('#transferCurrency').value;
    const recipient = form.querySelector('#recipientEmail').value;
    
    // Add your transfer logic here
    alert(`Transfer ${amount} ${currency} to ${recipient} functionality coming soon!`);
    bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
}

function showNotification(message, type = 'success') {
    // Simple notification implementation
    alert(message);
}

class WalletManager {
    constructor() {
        this.balance = parseFloat(localStorage.getItem('userBalance') || '0');
        this.currencies = {
            USD: { balance: 15420.65, symbol: '$' },
            EUR: { balance: 8250.00, symbol: '€' }
        };
        this.init();
    }

    init() {
        this.updateBalanceDisplay();
        this.setupEventListeners();
        this.loadTransactions();
        this.displayCurrencyBalances();
    }

    setupEventListeners() {
        // Quick action buttons
        const depositBtn = document.querySelector('[data-action="deposit"]');
        if (depositBtn) {
            depositBtn.addEventListener('click', () => this.showDepositModal());
        }

        // Payment method selection for deposit
        const depositPaymentMethods = document.querySelectorAll('#depositModal .payment-method');
        depositPaymentMethods.forEach(method => {
            method.addEventListener('click', () => this.selectPaymentMethod(method, 'deposit'));
        });

        // Payment method selection for withdrawal
        const withdrawPaymentMethods = document.querySelectorAll('#withdrawModal .payment-method');
        withdrawPaymentMethods.forEach(method => {
            method.addEventListener('click', () => this.selectPaymentMethod(method, 'withdraw'));
        });

        // Card number input formatting
        const cardNumberInputs = document.querySelectorAll('input[name="cardNumber"]');
        cardNumberInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatCardNumber(e.target));
        });

        // Expiry date formatting
        const expiryInputs = document.querySelectorAll('input[name="expiryDate"]');
        expiryInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatExpiryDate(e.target));
        });

        // Form submissions
        const depositForm = document.getElementById('depositForm');
        if (depositForm) {
            depositForm.addEventListener('submit', (e) => this.handleDeposit(e));
        }

        const withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));
        }
    }

    selectPaymentMethod(methodElement, type) {
        const modal = methodElement.closest('.modal');
        const allMethods = modal.querySelectorAll('.payment-method');
        allMethods.forEach(method => method.classList.remove('active'));
        methodElement.classList.add('active');

        // Hide all payment details sections
        modal.querySelectorAll('.payment-details').forEach(details => {
            details.style.display = 'none';
        });

        // Show relevant payment details section
        const method = methodElement.dataset.method;
        if (type === 'deposit') {
            if (method === 'card') {
                document.getElementById('cardDetails').style.display = 'block';
            } else if (method === 'bank') {
                document.getElementById('bankDetails').style.display = 'block';
            }
        } else if (type === 'withdraw') {
            if (method === 'card') {
                document.getElementById('withdrawCardDetails').style.display = 'block';
            } else if (method === 'bank') {
                document.getElementById('withdrawBankDetails').style.display = 'block';
            }
        }
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        input.value = value.substring(0, 19); // Limit to 16 digits + 3 spaces
    }

    formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        input.value = value.substring(0, 5); // MM/YY format
    }

    validateForm(formData, type) {
        const errors = [];

        // Amount validation
        const amount = parseFloat(formData.get('amount'));
        if (!amount || amount <= 0) {
            errors.push('Please enter a valid amount');
        }

        // Payment method validation
        const modal = document.getElementById(type === 'deposit' ? 'depositModal' : 'withdrawModal');
        const paymentMethod = modal.querySelector('.payment-method.active');
        if (!paymentMethod) {
            errors.push('Please select a payment method');
            return errors;
        }

        const method = paymentMethod.dataset.method;

        // Card details validation
        if (method === 'card') {
            const cardNumber = formData.get('cardNumber')?.replace(/\s/g, '');
            const expiryDate = formData.get('expiryDate');
            const cvv = formData.get('cvv');
            const cardholderName = formData.get('cardholderName');

            if (!cardNumber || cardNumber.length !== 16) {
                errors.push('Please enter a valid 16-digit card number');
            }
            if (!expiryDate || !expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
                errors.push('Please enter a valid expiry date (MM/YY)');
            }
            if (!cvv || !cvv.match(/^\d{3}$/)) {
                errors.push('Please enter a valid 3-digit CVV');
            }
            if (!cardholderName || cardholderName.trim().length < 3) {
                errors.push('Please enter the cardholder name');
            }
        }

        // Bank details validation
        if (method === 'bank') {
            const accountName = formData.get('accountName');
            const bankName = formData.get('bankName');
            const accountNumber = formData.get('accountNumber');
            const routingNumber = formData.get('routingNumber');

            if (!accountName || accountName.trim().length < 3) {
                errors.push('Please enter the account holder name');
            }
            if (!bankName || bankName.trim().length < 2) {
                errors.push('Please enter the bank name');
            }
            if (!accountNumber || accountNumber.length < 8) {
                errors.push('Please enter a valid account number');
            }
            if (!routingNumber || routingNumber.length !== 9) {
                errors.push('Please enter a valid 9-digit routing number');
            }
        }

        return errors;
    }

    async handleDeposit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const errors = this.validateForm(formData, 'deposit');

        // Clear previous errors
        this.clearErrors('deposit');

        if (errors.length > 0) {
            this.displayErrors(errors, 'deposit');
            return;
        }

        try {
            const amount = parseFloat(formData.get('amount'));
            const currency = formData.get('currency') || 'USD';
            const paymentMethod = document.querySelector('#depositModal .payment-method.active').dataset.method;

            // Update balances
            this.currencies[currency].balance += amount;
            localStorage.setItem('walletData', JSON.stringify(this.currencies));

            // Add transaction
            const transaction = {
                date: new Date(),
                type: 'Deposit',
                amount: amount,
                currency: currency,
                status: 'Completed',
                method: paymentMethod
            };
            this.addTransaction(transaction);

            // Update displays
            this.updateBalanceDisplay();
            this.displayCurrencyBalances();

            // Show success message and close modal
            this.showNotification('Deposit successful!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('depositModal')).hide();
            form.reset();

        } catch (error) {
            console.error('Deposit error:', error);
            this.showNotification('Failed to process deposit', 'error');
        }
    }

    async handleWithdraw(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const errors = this.validateForm(formData, 'withdraw');

        // Clear previous errors
        this.clearErrors('withdraw');

        if (errors.length > 0) {
            this.displayErrors(errors, 'withdraw');
            return;
        }

        try {
            const amount = parseFloat(formData.get('amount'));
            const currency = formData.get('currency') || 'USD';
            const paymentMethod = document.querySelector('#withdrawModal .payment-method.active').dataset.method;

            // Check if sufficient balance
            if (amount > this.currencies[currency].balance) {
                this.displayErrors(['Insufficient balance for withdrawal'], 'withdraw');
                return;
            }

            // Update balances
            this.currencies[currency].balance -= amount;
            localStorage.setItem('walletData', JSON.stringify(this.currencies));

            // Add transaction
            const transaction = {
                date: new Date(),
                type: 'Withdrawal',
                amount: amount,
                currency: currency,
                status: 'Completed',
                method: paymentMethod
            };
            this.addTransaction(transaction);

            // Update displays
            this.updateBalanceDisplay();
            this.displayCurrencyBalances();

            // Show success message and close modal
            this.showNotification('Withdrawal successful!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
            form.reset();

        } catch (error) {
            console.error('Withdrawal error:', error);
            this.showNotification('Failed to process withdrawal', 'error');
        }
    }

    clearErrors(type) {
        const errorContainer = document.getElementById(`${type}Errors`);
        if (errorContainer) {
            errorContainer.innerHTML = '';
            errorContainer.style.display = 'none';
        }
    }

    displayErrors(errors, type) {
        const errorContainer = document.getElementById(`${type}Errors`);
        if (errorContainer) {
            errorContainer.innerHTML = errors.map(error => `<div class="alert alert-danger">${error}</div>`).join('');
            errorContainer.style.display = 'block';
        }
    }

    showNotification(message, type = 'success') {
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
        
        const container = document.querySelector('.toast-container');
        if (container) {
            container.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }

    updateBalanceDisplay() {
        const totalBalance = document.getElementById('totalBalance');
        if (totalBalance) {
            const total = Object.values(this.currencies)
                .reduce((sum, curr) => sum + curr.balance, 0);
            totalBalance.textContent = total.toFixed(2);
        }
    }

    displayCurrencyBalances() {
        const container = document.getElementById('currencyBalances');
        if (container) {
            container.innerHTML = Object.entries(this.currencies)
                .map(([currency, data]) => `
                    <div class="currency-row">
                        <span class="currency-code">${currency}</span>
                        <span class="currency-amount">${data.symbol}${data.balance.toFixed(2)}</span>
                    </div>
                `).join('');
        }
    }

    addTransaction(transaction) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        this.updateTransactionHistory(transactions);
    }

    updateTransactionHistory(transactions) {
        const container = document.getElementById('recentTransactions');
        if (container) {
            container.innerHTML = transactions.slice(0, 5).map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>${t.type}</td>
                    <td>${this.currencies[t.currency].symbol}${t.amount.toFixed(2)}</td>
                    <td>${t.currency}</td>
                    <td><span class="badge bg-success">${t.status}</span></td>
                    <td><a href="#" class="text-primary">View</a></td>
                </tr>
            `).join('');
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
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