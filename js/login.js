import { apiService } from './api.js';

class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.setupPasswordToggles();
            this.checkAuthStatus();
        });
    }

    setupEventListeners() {
        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                console.log('Login form submitted');
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const rememberMe = document.getElementById('rememberMe').checked;

                try {
                    const response = await apiService.login({ email, password });
                    
                    // Store user session
                    const sessionData = {
                        user: response.user,
                        token: response.token
                    };

                    if (rememberMe) {
                        localStorage.setItem('userSession', JSON.stringify(sessionData));
                    } else {
                        sessionStorage.setItem('userSession', JSON.stringify(sessionData));
                    }

                    this.showNotification('Login successful!', 'success');
                    this.closeModal('loginModal');
                    this.updateUI(sessionData.user);
                    
                    // Redirect to dashboard
                    window.location.href = '/dashboard.html';
                } catch (error) {
                    this.showNotification(error.message, 'danger');
                }
            });
        }

        // Signup form handler
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Logout button handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    setupPasswordToggles() {
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

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            const response = await apiService.login({ email, password });
            
            // Store user session
            const sessionData = {
                user: response.user,
                token: response.token
            };

            if (rememberMe) {
                localStorage.setItem('userSession', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
            }

            this.showNotification('Login successful!', 'success');
            this.closeModal('loginModal');
            this.updateUI(sessionData.user);
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            this.showNotification(error.message, 'danger');
        }
    }

    async handleSignup(event) {
        event.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAgreed = document.getElementById('termsAgree').checked;

        try {
            // Validate inputs
            if (!termsAgreed) {
                throw new Error('Please agree to the Terms and Conditions');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            const response = await apiService.signup({ name, email, password });
            
            // Auto login after signup
            const sessionData = {
                user: response.user,
                token: response.token
            };
            localStorage.setItem('userSession', JSON.stringify(sessionData));

            this.showNotification('Account created successfully!', 'success');
            this.closeModal('signupModal');
            this.updateUI(response.user);
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            this.showNotification(error.message, 'danger');
        }
    }

    async handleLogout(event) {
        event.preventDefault();
        
        try {
            await apiService.logout();
            
            // Clear session
            localStorage.removeItem('userSession');
            sessionStorage.removeItem('userSession');
            
            this.showNotification('Logged out successfully', 'success');
            this.updateUI(null);
            
            // Redirect to home page
            window.location.href = '/';
        } catch (error) {
            this.showNotification('Error logging out', 'danger');
        }
    }

    async checkAuthStatus() {
        const session = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}');
        
        if (session.token) {
            try {
                const response = await fetch(apiService.baseUrl + apiService.endpoints.validateToken, {
                    headers: {
                        'Authorization': `Bearer ${session.token}`
                    }
                });
                
                if (response.ok) {
                    this.updateUI(session.user);
                } else {
                    this.handleLogout();
                }
            } catch (error) {
                this.handleLogout();
            }
        }
    }

    updateUI(user) {
        const authElements = document.querySelectorAll('[data-auth-required]');
        const guestElements = document.querySelectorAll('[data-guest-only]');
        const userNameElements = document.querySelectorAll('[data-user-name]');

        if (user) {
            // Show authenticated elements, hide guest elements
            authElements.forEach(el => el.classList.remove('d-none'));
            guestElements.forEach(el => el.classList.add('d-none'));
            userNameElements.forEach(el => el.textContent = user.name);
        } else {
            // Show guest elements, hide authenticated elements
            authElements.forEach(el => el.classList.add('d-none'));
            guestElements.forEach(el => el.classList.remove('d-none'));
            userNameElements.forEach(el => el.textContent = '');
        }
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

    showNotification(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        
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
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Initialize the login manager
const loginManager = new LoginManager();
