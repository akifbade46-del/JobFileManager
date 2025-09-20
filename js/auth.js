/**
 * Authentication Management
 * Job File Management System - HTML/JavaScript Edition
 */

window.Auth = {
    
    // Current user data
    currentUser: null,
    
    // Authentication state
    isAuthenticated: false,
    
    // Login attempt tracking
    loginAttempts: 0,
    maxLoginAttempts: 5,
    
    /**
     * Initialize authentication
     */
    init: async function() {
        try {
            await this.checkAuthStatus();
        } catch (error) {
            console.log('User not authenticated');
            this.clearSession();
        }
    },
    
    /**
     * Check current authentication status
     */
    checkAuthStatus: async function() {
        try {
            // Demo mode bypass
            if (this.isDemoMode()) {
                this.setDemoUser();
                return this.currentUser;
            }
            
            const response = await API.auth.getCurrentUser();
            this.setUser(response.user);
            return this.currentUser;
        } catch (error) {
            // In demo mode, set demo user even on API failure
            if (this.isDemoMode()) {
                this.setDemoUser();
                return this.currentUser;
            }
            
            this.clearSession();
            throw error;
        }
    },
    
    /**
     * Check if we're in demo mode
     */
    isDemoMode: function() {
        return window.location.search.includes('demo=true') || 
               (window.location.hostname === 'localhost' && !window.navigator.onLine);
    },
    
    /**
     * Set demo user for testing
     */
    setDemoUser: function() {
        this.setUser({
            id: 'demo-1',
            name: 'Demo User',
            email: 'demo@qgo-cargo.com',
            role: 'admin',
            status: 'active'
        });
        console.log('Demo mode activated - logged in as:', this.currentUser.name);
    },
    
    /**
     * User login
     */
    login: async function(email, password) {
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            
            if (!Utils.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }
            
            // Check login attempts
            if (this.loginAttempts >= this.maxLoginAttempts) {
                throw new Error('Too many login attempts. Please refresh the page and try again.');
            }
            
            const response = await API.auth.login(email, password);
            
            if (response.success && response.user) {
                this.setUser(response.user);
                this.loginAttempts = 0; // Reset attempts on successful login
                
                // Role-based redirection for POD system
                if (response.user.role === 'driver') {
                    Router.navigate('/pod/driver');
                } else if (response.user.role === 'supervisor') {
                    Router.navigate('/pod/supervisor');
                } else {
                    // Redirect to dashboard for other roles
                    Router.navigate('/dashboard');
                }
                
                UI.showToast('Welcome back!', 'success');
                return response.user;
            } else {
                throw new Error('Invalid credentials');
            }
            
        } catch (error) {
            this.loginAttempts++;
            console.error('Login error:', error);
            throw error;
        }
    },
    
    /**
     * User logout
     */
    logout: async function() {
        try {
            await API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
            Router.navigate('/login');
            UI.showToast('Logged out successfully', 'info');
        }
    },
    
    /**
     * Set user data and update UI
     */
    setUser: function(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Store in localStorage for persistence
        Utils.storage.set('currentUser', user);
        Utils.storage.set('isAuthenticated', true);
        
        // Update navigation
        this.updateNavigation();
    },
    
    /**
     * Clear session data
     */
    clearSession: function() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.loginAttempts = 0;
        
        // Clear localStorage
        Utils.storage.remove('currentUser');
        Utils.storage.remove('isAuthenticated');
        
        // Hide navigation
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.style.display = 'none';
    },
    
    /**
     * Check if user has required role
     */
    hasRole: function(requiredRole) {
        if (!this.currentUser || !this.currentUser.role) {
            return false;
        }
        
        const userRole = this.currentUser.role;
        const roles = ['user', 'checker', 'admin', 'driver', 'supervisor'];
        const userRoleIndex = roles.indexOf(userRole);
        const requiredRoleIndex = roles.indexOf(requiredRole);
        
        return userRoleIndex >= requiredRoleIndex;
    },
    
    /**
     * Check if user has any of the required roles
     */
    hasAnyRole: function(requiredRoles) {
        if (!this.currentUser || !this.currentUser.role) {
            return false;
        }
        
        return requiredRoles.includes(this.currentUser.role);
    },
    
    /**
     * Require authentication
     */
    requireAuth: function() {
        if (!this.isAuthenticated) {
            Router.navigate('/login');
            throw new Error('Authentication required');
        }
    },
    
    /**
     * Require specific role
     */
    requireRole: function(requiredRole) {
        this.requireAuth();
        
        if (!this.hasRole(requiredRole)) {
            UI.showToast('Access denied: Insufficient permissions', 'error');
            Router.navigate('/dashboard');
            throw new Error('Insufficient permissions');
        }
    },
    
    /**
     * Require any of the specified roles
     */
    requireAnyRole: function(requiredRoles) {
        this.requireAuth();
        
        if (!this.hasAnyRole(requiredRoles)) {
            UI.showToast('Access denied: Insufficient permissions', 'error');
            Router.navigate('/dashboard');
            throw new Error('Insufficient permissions');
        }
    },
    
    /**
     * Update navigation based on user role
     */
    updateNavigation: function() {
        if (!this.currentUser) return;
        
        const navbar = document.getElementById('navbar');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const userRole = document.getElementById('user-role');
        
        if (navbar) navbar.style.display = 'block';
        
        if (userName) userName.textContent = this.currentUser.name;
        if (userRole) userRole.textContent = Utils.capitalize(this.currentUser.role);
        
        // Show/hide role-specific navigation items
        const navLinks = document.querySelectorAll('.nav-link[data-role]');
        navLinks.forEach(link => {
            const requiredRoles = link.dataset.role.split(',');
            const shouldShow = this.hasAnyRole(requiredRoles);
            link.style.display = shouldShow ? 'flex' : 'none';
        });
    },
    
    /**
     * Handle authentication errors
     */
    handleAuthError: function(error) {
        console.error('Authentication error:', error);
        
        if (error.message.includes('401') || error.message.includes('Authentication')) {
            this.clearSession();
            Router.navigate('/login');
            UI.showToast('Session expired. Please log in again.', 'warning');
        } else {
            UI.showToast(error.message || 'Authentication failed', 'error');
        }
    },
    
    /**
     * Refresh user data
     */
    refreshUser: async function() {
        try {
            const response = await API.auth.getCurrentUser();
            this.setUser(response.user);
            return this.currentUser;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    },
    
    /**
     * Initialize from stored session
     */
    initFromStorage: function() {
        const storedUser = Utils.storage.get('currentUser');
        const storedAuth = Utils.storage.get('isAuthenticated');
        
        if (storedUser && storedAuth) {
            this.setUser(storedUser);
            
            // Verify session is still valid
            this.checkAuthStatus().catch(() => {
                this.clearSession();
            });
        }
    },
    
    /**
     * Get user display name
     */
    getUserDisplayName: function() {
        return this.currentUser ? this.currentUser.name : 'Guest';
    },
    
    /**
     * Get user role display
     */
    getUserRoleDisplay: function() {
        return this.currentUser ? Utils.capitalize(this.currentUser.role) : '';
    },
    
    /**
     * Check if current user owns the resource
     */
    isOwner: function(resourceUserId) {
        return this.currentUser && this.currentUser.id == resourceUserId;
    },
    
    /**
     * Can edit resource (owner or admin)
     */
    canEdit: function(resourceUserId) {
        return this.hasRole('admin') || this.isOwner(resourceUserId);
    },
    
    /**
     * Can delete resource (admin only, or owner for specific cases)
     */
    canDelete: function(resourceUserId = null) {
        return this.hasRole('admin') || (resourceUserId && this.isOwner(resourceUserId));
    }
};

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize from storage first
    Auth.initFromStorage();
});

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}