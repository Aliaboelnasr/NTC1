class ProfileManager {
    constructor() {
        this.authManager = new AuthManager();
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadUserProfile();
        this.setupEventListeners();
    }

    checkAuth() {
        if (!this.authManager.currentUser) {
            // Redirect to login page if not authenticated
            window.location.href = 'index.html';
            return;
        }
    }

    loadUserProfile() {
        const user = this.authManager.currentUser;
        if (!user) return;

        // Update profile information
        document.getElementById('userName').textContent = user.name;
        document.querySelector('.profile-header h2').textContent = user.name;
        
        // Update member since date
        const joinDate = new Date(user.createdAt);
        const joinDateText = `Member since ${joinDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        document.querySelector('.profile-header p').textContent = joinDateText;

        // Update email in personal info form
        document.querySelector('input[name="email"]').value = user.email;
    }

    setupEventListeners() {
        // Profile picture upload
        const editAvatar = document.querySelector('.edit-avatar');
        if (editAvatar) {
            editAvatar.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => this.handleImageUpload(e);
                input.click();
            });
        }

        // Personal info form submission
        const personalInfoForm = document.querySelector('#personal-info form');
        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', (e) => this.handlePersonalInfoUpdate(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.authManager.handleLogout(e));
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size should be less than 5MB', 'error');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const profilePicture = document.getElementById('profilePicture');
            profilePicture.src = e.target.result;
            
            // Save to localStorage
            const user = this.authManager.currentUser;
            user.profilePicture = e.target.result;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.showNotification('Profile picture updated successfully', 'success');
        };
        reader.readAsDataURL(file);
    }

    handlePersonalInfoUpdate(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const updates = Object.fromEntries(formData.entries());

        try {
            // Validate email if changed
            if (updates.email && updates.email !== this.authManager.currentUser.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(updates.email)) {
                    throw new Error('Invalid email format');
                }
            }

            // Update user data
            const user = this.authManager.currentUser;
            Object.assign(user, updates);
            
            // Update in localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Update UI
            this.loadUserProfile();
            
            this.showNotification('Profile updated successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        bsToast.show();

        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', function () {
            toast.remove();
        });
    }
}

// Initialize profile manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
}); 