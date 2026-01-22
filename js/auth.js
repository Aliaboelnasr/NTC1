class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        this.setupEventListeners();
        this.updateUIState();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Prevent traditional form submission
                console.log('Login form submitted'); // Debug log

                try {
                    const emailInput = document.getElementById('loginEmail');
                    const passwordInput = document.getElementById('loginPassword');
                    const rememberMe = document.getElementById('rememberMe');

                    // Clear previous errors
                    this.clearErrors();

                    // Validate inputs
                    if (!emailInput.value || !passwordInput.value) {
                        throw new Error('Please fill in all fields');
                    }

                    // Show loading state
                    const submitButton = loginForm.querySelector('button[type="submit"]');
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';

                    // Get users from storage
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const user = users.find(u => u.email === emailInput.value);

                    if (!user || user.password !== passwordInput.value) {
                        throw new Error('Invalid email or password');
                    }

                    // Set current user
                    this.currentUser = { ...user, password: undefined };
                    
                    // Store user session based on remember me
                    if (rememberMe.checked) {
                        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    } else {
                        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    }

                    // Show success message
                    this.showNotification('Login successful!', 'success');

                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (modal) {
                        modal.hide();
                    }

                    // Update UI
                    this.updateUIState();

                    // Clear form
                    loginForm.reset();

                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);

                } catch (error) {
                    this.showError(error.message);
                } finally {
                    // Reset button state
                    const submitButton = loginForm.querySelector('button[type="submit"]');
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Login';
                }
            });
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = button.getAttribute('data-target');
                const passwordInput = document.querySelector(targetId);
                const icon = button.querySelector('i');

                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        if (password.length < minLength) errors.push('Password must be at least 8 characters long');
        if (!hasUpperCase) errors.push('Include at least one uppercase letter');
        if (!hasLowerCase) errors.push('Include at least one lowercase letter');
        if (!hasNumbers) errors.push('Include at least one number');
        if (!hasSpecialChar) errors.push('Include at least one special character');

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async handleSignup(event) {
        event.preventDefault();
        
        // Get form elements
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const termsCheckbox = document.getElementById('termsAgree');
        
        // Clear previous errors
        this.clearErrors();

        try {
            // Validate inputs
            if (!nameInput.value.trim()) {
                throw new Error('Name is required');
            }

            if (!emailInput.value.trim()) {
                throw new Error('Email is required');
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                throw new Error('Invalid email format');
            }

            // Password validation
            const passwordValidation = this.validatePassword(passwordInput.value);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('\n'));
            }

            // Confirm password
            if (passwordInput.value !== confirmPasswordInput.value) {
                throw new Error('Passwords do not match');
            }

            // Terms agreement
            if (!termsCheckbox.checked) {
                throw new Error('Please agree to the Terms and Conditions');
            }

            // Check if email already exists
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.some(user => user.email === emailInput.value)) {
                throw new Error('Email already registered');
            }

            // Create new user
            const newUser = {
                id: Date.now(),
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value, // In a real app, this should be hashed
                createdAt: new Date().toISOString()
            };

            // Save user
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Auto login
            this.currentUser = { ...newUser, password: undefined };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Show success message
            this.showNotification('Account created successfully!', 'success');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
            modal.hide();

            // Update UI
            this.updateUIState();

            // Clear form
            event.target.reset();

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            this.showError(error.message);
        }
    }

    handleLogout(event) {
        event.preventDefault();
        
        // Clear user session
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;

        // Show notification
        this.showNotification('Logged out successfully', 'success');

        // Update UI
        this.updateUIState();

        // Redirect to home
        window.location.href = 'index.html';
    }

    loadUserFromStorage() {
        const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }
    }

    updateUIState() {
        const authElements = document.querySelectorAll('[data-auth-required]');
        const guestElements = document.querySelectorAll('[data-guest-only]');
        const userNameElements = document.querySelectorAll('[data-user-name]');

        if (this.currentUser) {
            authElements.forEach(el => el.classList.remove('d-none'));
            guestElements.forEach(el => el.classList.add('d-none'));
            userNameElements.forEach(el => el.textContent = this.currentUser.name);
        } else {
            authElements.forEach(el => el.classList.add('d-none'));
            guestElements.forEach(el => el.classList.remove('d-none'));
            userNameElements.forEach(el => el.textContent = '');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = message;
        
        const form = document.getElementById('loginForm');
        form.insertAdjacentElement('beforeend', errorDiv);
        
        // Remove error after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    clearErrors() {
        const form = document.getElementById('loginForm');
        const errors = form.querySelectorAll('.alert');
        errors.forEach(error => error.remove());
    }

    showNotification(message, type = 'success') {
        // Implement your notification logic here
        // You can use bootstrap toasts or alerts
        console.log(`${type}: ${message}`);
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Add this at the bottom of auth.js
window.auth = new AuthManager(); 