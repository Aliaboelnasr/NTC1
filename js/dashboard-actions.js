// Quick Action Buttons
function initializeQuickActions() {
    // Add Money Button
    document.getElementById('add-money-btn')?.addEventListener('click', () => {
        const addMoneyModal = new bootstrap.Modal(document.getElementById('addMoneyModal'));
        addMoneyModal.show();
    });

    // Withdraw Button
    document.getElementById('withdraw-btn')?.addEventListener('click', () => {
        const withdrawModal = new bootstrap.Modal(document.getElementById('withdrawModal'));
        withdrawModal.show();
    });

    // Transfer Button
    document.getElementById('transfer-btn')?.addEventListener('click', () => {
        const transferModal = new bootstrap.Modal(document.getElementById('transferModal'));
        transferModal.show();
    });

    // Exchange Button
    document.getElementById('exchange-btn')?.addEventListener('click', () => {
        const exchangeModal = new bootstrap.Modal(document.getElementById('exchangeModal'));
        exchangeModal.show();
    });
}

// Add Money Form Handler
async function handleAddMoney(event) {
    event.preventDefault();
    const form = event.target;
    const amount = parseFloat(form.amount.value);
    const currency = form.currency.value;
    const paymentMethod = form.paymentMethod.value;

    try {
        const response = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount, currency, paymentMethod })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Money added successfully!', 'success');
            updateWalletBalance();
            bootstrap.Modal.getInstance(document.getElementById('addMoneyModal')).hide();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Withdraw Form Handler
async function handleWithdraw(event) {
    event.preventDefault();
    const form = event.target;
    const amount = parseFloat(form.amount.value);
    const currency = form.currency.value;
    const withdrawalMethod = form.withdrawalMethod.value;
    const accountDetails = form.accountDetails.value;

    try {
        const response = await fetch('/api/wallet/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                amount, 
                currency, 
                withdrawalMethod, 
                accountDetails 
            })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Withdrawal initiated successfully!', 'success');
            updateWalletBalance();
            bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Transfer Form Handler
async function handleTransfer(event) {
    event.preventDefault();
    const form = event.target;
    const amount = parseFloat(form.amount.value);
    const fromCurrency = form.fromCurrency.value;
    const toCurrency = form.toCurrency.value;
    const recipientEmail = form.recipientEmail.value;

    try {
        const response = await fetch('/api/wallet/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                amount, 
                fromCurrency, 
                toCurrency, 
                recipientEmail 
            })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Transfer completed successfully!', 'success');
            updateWalletBalance();
            bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Exchange Form Handler
async function handleExchange(event) {
    event.preventDefault();
    const form = event.target;
    const amount = parseFloat(form.amount.value);
    const fromCurrency = form.fromCurrency.value;
    const toCurrency = form.toCurrency.value;

    try {
        const response = await fetch('/api/wallet/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                amount, 
                fromCurrency, 
                toCurrency 
            })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Currency exchanged successfully!', 'success');
            updateWalletBalance();
            bootstrap.Modal.getInstance(document.getElementById('exchangeModal')).hide();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Profile Update Handler
async function handleProfileUpdate(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            showToast('Profile updated successfully!', 'success');
            loadUserProfile();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Settings Update Handler
async function handleSettingsUpdate(event) {
    event.preventDefault();
    const form = event.target;
    const settings = {
        notifications: form.notifications.checked,
        twoFactorAuth: form.twoFactorAuth.checked,
        language: form.language.value,
        currency: form.defaultCurrency.value
    };

    try {
        const response = await fetch('/api/user/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(settings)
        });

        const data = await response.json();
        if (data.success) {
            showToast('Settings updated successfully!', 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Utility Functions
function showToast(message, type = 'info') {
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

    const toastContainer = document.getElementById('toast-container');
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Initialize all handlers when document loads
document.addEventListener('DOMContentLoaded', function() {
    initializeQuickActions();
    
    // Add form submit handlers
    document.getElementById('add-money-form')?.addEventListener('submit', handleAddMoney);
    document.getElementById('withdraw-form')?.addEventListener('submit', handleWithdraw);
    document.getElementById('transfer-form')?.addEventListener('submit', handleTransfer);
    document.getElementById('exchange-form')?.addEventListener('submit', handleExchange);
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('settings-form')?.addEventListener('submit', handleSettingsUpdate);
}); 