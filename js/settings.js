class Settings {
    constructor() {
        this.settings = this.loadSettings();
        this.initializeElements();
        this.setupEventListeners();
        this.applySettings();
    }

    initializeElements() {
        // Theme buttons
        this.themeButtons = document.querySelectorAll('.theme-btn');
        this.fontSizeButtons = document.querySelectorAll('[data-font-size]');
        
        // Form elements
        this.defaultCurrency = document.getElementById('defaultCurrency');
        this.timeZone = document.getElementById('timeZone');
        this.showGraphs = document.getElementById('showGraphs');
        this.showNews = document.getElementById('showNews');
        this.emailNotifications = document.getElementById('emailNotifications');
        this.pushNotifications = document.getElementById('pushNotifications');
        this.rateAlertThreshold = document.getElementById('rateAlertThreshold');
        
        // Save button
        this.saveButton = document.getElementById('saveSettings');
    }

    setupEventListeners() {
        // Theme switching
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTheme(btn.dataset.theme);
                this.updateActiveThemeButton(btn);
            });
        });

        // Font size switching
        this.fontSizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFontSize(btn.dataset.fontSize);
                this.updateActiveFontSizeButton(btn);
            });
        });

        // Save settings
        this.saveButton.addEventListener('click', () => this.saveSettings());
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'light',
            fontSize: 'medium',
            defaultCurrency: 'USD',
            timeZone: 'UTC',
            showGraphs: true,
            showNews: true,
            emailNotifications: true,
            pushNotifications: true,
            rateAlertThreshold: 5
        };

        const savedSettings = localStorage.getItem('userSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }

    saveSettings() {
        const newSettings = {
            theme: this.settings.theme,
            fontSize: this.settings.fontSize,
            defaultCurrency: this.defaultCurrency.value,
            timeZone: this.timeZone.value,
            showGraphs: this.showGraphs.checked,
            showNews: this.showNews.checked,
            emailNotifications: this.emailNotifications.checked,
            pushNotifications: this.pushNotifications.checked,
            rateAlertThreshold: parseInt(this.rateAlertThreshold.value)
        };

        this.settings = newSettings;
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        
        this.showSaveConfirmation();
    }

    applySettings() {
        // Apply theme
        this.setTheme(this.settings.theme);
        this.updateActiveThemeButton(document.querySelector(`[data-theme="${this.settings.theme}"]`));

        // Apply font size
        this.setFontSize(this.settings.fontSize);
        this.updateActiveFontSizeButton(document.querySelector(`[data-font-size="${this.settings.fontSize}"]`));

        // Apply other settings
        this.defaultCurrency.value = this.settings.defaultCurrency;
        this.timeZone.value = this.settings.timeZone;
        this.showGraphs.checked = this.settings.showGraphs;
        this.showNews.checked = this.settings.showNews;
        this.emailNotifications.checked = this.settings.emailNotifications;
        this.pushNotifications.checked = this.settings.pushNotifications;
        this.rateAlertThreshold.value = this.settings.rateAlertThreshold;
    }

    setTheme(theme) {
        this.settings.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'auto') {
            this.handleAutoTheme();
        }
    }

    handleAutoTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (this.settings.theme === 'auto') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    setFontSize(size) {
        this.settings.fontSize = size;
        document.documentElement.setAttribute('data-font-size', size);
    }

    updateActiveThemeButton(activeButton) {
        this.themeButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    updateActiveFontSizeButton(activeButton) {
        this.fontSizeButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    showSaveConfirmation() {
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>
                    Settings saved successfully!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove the toast container after the toast is hidden
        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }
}

// Initialize settings when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settings = new Settings();
}); 