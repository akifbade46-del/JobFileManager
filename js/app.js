/**
 * Main Application Entry Point
 * Job File Management System - HTML/JavaScript Edition
 */

class JobManagementApp {
    
    constructor() {
        this.initialized = false;
        this.components = ['UI', 'Auth', 'Router', 'API'];
    }
    
    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;
        
        try {
            console.log('🚢 Q\'go Cargo - Job File Management System');
            console.log('📦 Initializing HTML/JavaScript Edition...');
            
            // Check for required dependencies
            this.checkDependencies();
            
            // Initialize core components
            await this.initializeComponents();
            
            // Setup global error handlers
            this.setupGlobalErrorHandlers();
            
            // Setup service worker (if available)
            this.setupServiceWorker();
            
            // Initialize authentication
            await this.initializeAuth();
            
            // Initialize router
            this.initializeRouter();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ Application initialized successfully');
            
            // Show welcome message for new users
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    /**
     * Check for required dependencies
     */
    checkDependencies() {
        const missing = [];
        
        this.components.forEach(component => {
            if (!window[component]) {
                missing.push(component);
            }
        });
        
        if (missing.length > 0) {
            throw new Error(`Missing required components: ${missing.join(', ')}`);
        }
        
        // Check for required DOM elements
        const requiredElements = ['app', 'main-content', 'loading-screen'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
        }
    }
    
    /**
     * Initialize core components
     */
    async initializeComponents() {
        // Initialize UI components
        UI.init();
        
        // Initialize API base URL (update for production)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Development environment
            API.baseURL = '/api';
        } else {
            // Production environment
            API.baseURL = '/api';
        }
        
        console.log('🔗 API Base URL:', API.baseURL);
    }
    
    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            if (event.reason && event.reason.message) {
                if (event.reason.message.includes('Authentication') || 
                    event.reason.message.includes('401')) {
                    Auth.handleAuthError(event.reason);
                } else {
                    UI.showToast('An unexpected error occurred', 'error');
                }
            }
        });
        
        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            // Don't show UI errors for script loading failures in development
            if (event.filename && event.filename.includes('node_modules')) {
                return;
            }
            
            UI.showToast('A system error occurred. Please refresh the page.', 'error');
        });
        
        // Handle network errors
        window.addEventListener('online', () => {
            UI.showToast('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            UI.showToast('No internet connection', 'warning');
        });
    }
    
    /**
     * Setup service worker for offline support
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').then(() => {
                console.log('📱 Service Worker registered for offline support');
            }).catch(error => {
                console.log('Service Worker registration failed:', error);
            });
        }
    }
    
    /**
     * Initialize authentication
     */
    async initializeAuth() {
        try {
            await Auth.init();
            console.log('🔐 Authentication initialized');
        } catch (error) {
            console.log('🔐 No active session found');
            // This is expected for logged out users
        }
    }
    
    /**
     * Initialize router
     */
    initializeRouter() {
        Router.init();
        console.log('🧭 Router initialized');
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen && app) {
            // Fade out loading screen
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                app.style.display = 'flex';
                
                // Fade in app
                app.style.opacity = '0';
                app.style.transition = 'opacity 0.3s ease-in';
                
                requestAnimationFrame(() => {
                    app.style.opacity = '1';
                });
                
            }, 300);
        }
    }
    
    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: white;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 2rem; color: #ff6b6b;"></i>
                    <h2>Initialization Failed</h2>
                    <p>The application failed to start properly.</p>
                    <p style="font-size: 0.875rem; opacity: 0.8; margin: 2rem 0;">${Utils.escapeHTML(error.message)}</p>
                    <button onclick="window.location.reload()" 
                            style="background: white; color: #333; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Show welcome message for new installations
     */
    showWelcomeMessage() {
        const hasSeenWelcome = Utils.storage.get('hasSeenWelcome', false);
        
        if (!hasSeenWelcome && !Auth.isAuthenticated) {
            setTimeout(() => {
                const welcomeHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 2rem;">🚢</div>
                        <h2>Welcome to Q'go Cargo</h2>
                        <p style="margin: 1.5rem 0; color: var(--text-secondary);">
                            Professional Job File Management System<br>
                            HTML/PHP Edition for Shared Hosting
                        </p>
                        <div style="background: var(--bg-muted); padding: 1.5rem; border-radius: var(--radius-lg); margin: 2rem 0;">
                            <h4 style="margin: 0 0 1rem 0; color: var(--primary);">✨ Key Features</h4>
                            <ul style="text-align: left; margin: 0; padding-left: 1.5rem;">
                                <li>📋 Complete job file management</li>
                                <li>🏢 Client management system</li>
                                <li>👥 Role-based access control</li>
                                <li>📊 Analytics and reporting</li>
                                <li>💰 KWD currency support</li>
                                <li>📤 Data import/export tools</li>
                            </ul>
                        </div>
                        <div style="margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="UI.hideModal(); Utils.storage.set('hasSeenWelcome', true);" data-testid="button-get-started">
                                <i class="fas fa-rocket"></i>
                                Get Started
                            </button>
                        </div>
                    </div>
                `;
                
                UI.showModal(welcomeHTML, { maxWidth: '600px' });
                Utils.storage.set('hasSeenWelcome', true);
            }, 1000);
        }
    }
    
    /**
     * Get application info
     */
    getInfo() {
        return {
            name: 'Q\'go Cargo Job File Management System',
            version: '2.0.0',
            edition: 'HTML/PHP Shared Hosting Edition',
            currency: 'KWD (Kuwaiti Dinar)',
            features: [
                'Job File Management',
                'Client Management',
                'Role-based Access Control',
                'Analytics & Reporting',
                'Data Migration Tools',
                'Activity Logging'
            ],
            tech_stack: {
                frontend: 'HTML5, CSS3, JavaScript (ES6+)',
                backend: 'PHP 8.0+, MySQL 8.0+',
                hosting: 'Shared Hosting Compatible'
            }
        };
    }
    
    /**
     * Restart application
     */
    restart() {
        console.log('🔄 Restarting application...');
        window.location.reload();
    }
    
    /**
     * Show application info
     */
    showInfo() {
        const info = this.getInfo();
        
        const infoHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🚢</div>
                <h2>${info.name}</h2>
                <p style="margin: 1rem 0; color: var(--text-secondary);">
                    Version ${info.version} - ${info.edition}
                </p>
                <p style="margin: 1rem 0; font-weight: 600;">
                    Currency: ${info.currency}
                </p>
                
                <div style="text-align: left; margin: 2rem 0;">
                    <h4>✨ Features:</h4>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                        ${info.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    
                    <h4 style="margin-top: 1.5rem;">🛠️ Technology Stack:</h4>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                        <li><strong>Frontend:</strong> ${info.tech_stack.frontend}</li>
                        <li><strong>Backend:</strong> ${info.tech_stack.backend}</li>
                        <li><strong>Hosting:</strong> ${info.tech_stack.hosting}</li>
                    </ul>
                </div>
                
                <div style="margin-top: 2rem;">
                    <button class="btn btn-secondary" onclick="UI.hideModal()" data-testid="button-close-info">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        UI.showModal(infoHTML, { maxWidth: '600px' });
    }
}

// Global app instance
window.JobApp = new JobManagementApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        JobApp.init();
    });
} else {
    // DOM is already ready
    JobApp.init();
}

// Make app globally available for debugging
window.app = JobApp;

// Add keyboard shortcut for app info
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        JobApp.showInfo();
    }
});

// Development helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.dev = {
        // Development utilities
        clearStorage: () => {
            Utils.storage.clear();
            console.log('🧹 Local storage cleared');
        },
        
        showWelcome: () => {
            Utils.storage.set('hasSeenWelcome', false);
            JobApp.showWelcomeMessage();
        },
        
        testAuth: () => {
            console.log('👤 Current user:', Auth.currentUser);
            console.log('🔐 Is authenticated:', Auth.isAuthenticated);
        },
        
        testAPI: async (endpoint = '/auth/me') => {
            try {
                const result = await API.get(endpoint);
                console.log('🔗 API test result:', result);
                return result;
            } catch (error) {
                console.error('🔗 API test failed:', error);
                return error;
            }
        },
        
        info: () => JobApp.getInfo()
    };
    
    console.log('🛠️ Development mode active. Use window.dev for utilities.');
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobManagementApp;
}

// Performance monitoring (simple version)
window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        if (pageLoadTime > 0) {
            console.log(`📊 Page load time: ${pageLoadTime}ms`);
            
            // Send to analytics if needed
            if (pageLoadTime > 3000) {
                console.warn('⚠️ Slow page load detected');
            }
        }
    }
});

console.log('📦 Q\'go Cargo App Module loaded');