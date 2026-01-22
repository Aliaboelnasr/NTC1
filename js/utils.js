// Toast notification function
export function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Check if server is running
export async function checkServerStatus() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/health');
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Validation utilities
export const validators = {
    email: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: regex.test(email),
            message: 'Please enter a valid email address'
        };
    },
    
    password: (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const isValid = password.length >= minLength && 
                       hasUpperCase && 
                       hasLowerCase && 
                       hasNumbers && 
                       hasSpecialChar;
                       
        return {
            isValid,
            message: isValid ? '' : 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters'
        };
    },
    
    name: (name) => {
        const isValid = name.trim().length >= 2;
        return {
            isValid,
            message: 'Name must be at least 2 characters long'
        };
    }
};

// Currency formatting
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Date formatting
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

// Error handling
export const handleError = (error) => {
    console.error('Error:', error);
    return {
        message: error.message || 'An unexpected error occurred',
        status: error.status || 500
    };
};

// Handle API errors
export function handleApiError(error) {
    console.error('API Error:', error);
    
    if (!navigator.onLine) {
        showToast('No internet connection. Please check your network.', 'error');
        return;
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        showToast('Unable to connect to server. Please ensure the server is running.', 'error');
        return;
    }

    showToast(error.message || 'An error occurred. Please try again.', 'error');
}

// Validate email helper
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
export function validatePassword(password) {
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