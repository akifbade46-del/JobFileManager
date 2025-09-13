/**
 * Client-Side Router
 * Job File Management System - HTML/JavaScript Edition
 */

window.Router = {
    
    // Current route
    currentRoute: null,
    
    // Route definitions
    routes: {
        '/': () => Router.navigate('/login'),
        '/login': () => Router.showLogin(),
        '/dashboard': () => Router.showDashboard(),
        '/jobs': () => Router.showJobsList(),
        '/jobs/create': () => Router.showJobForm(),
        '/jobs/:id': (id) => Router.showJobDetails(id),
        '/jobs/:id/edit': (id) => Router.showJobForm(id),
        '/clients': () => Router.showClientsList(),
        '/clients/create': () => Router.showClientForm(),
        '/clients/:id': (id) => Router.showClientDetails(id),
        '/clients/:id/edit': (id) => Router.showClientForm(id),
        '/analytics': () => Router.showAnalytics(),
        '/admin': () => Router.showAdmin(),
        '/admin/users': () => Router.showAdminUsers(),
        '/admin/migration': () => Router.showAdminMigration(),
        '/profile': () => Router.showProfile(),
        '/activity': () => Router.showActivity()
    },
    
    /**
     * Initialize router
     */
    init: function() {
        // Handle initial load
        this.handleRoute();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    this.navigate(href.substring(1)); // Remove #
                }
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => this.handleRoute());
    },
    
    /**
     * Navigate to route
     */
    navigate: function(path, replace = false) {
        const hash = '#' + path;
        
        if (replace) {
            window.history.replaceState({}, '', hash);
        } else {
            window.history.pushState({}, '', hash);
        }
        
        this.handleRoute();
    },
    
    /**
     * Handle current route
     */
    handleRoute: function() {
        let path = window.location.hash.substring(1) || '/';
        
        // Remove query parameters for route matching
        const [routePath] = path.split('?');
        this.currentRoute = routePath;
        
        // Update active navigation
        this.updateActiveNavigation();
        
        // Find and execute matching route
        const route = this.findRoute(routePath);
        if (route) {
            try {
                route.handler(...route.params);
            } catch (error) {
                console.error('Route handler error:', error);
                
                // Handle authentication errors
                if (error.message.includes('Authentication') || error.message.includes('permissions')) {
                    return; // Auth handler will redirect
                }
                
                // Show error page
                this.showError('An error occurred while loading the page.');
            }
        } else {
            this.showNotFound();
        }
    },
    
    /**
     * Find matching route
     */
    findRoute: function(path) {
        for (const [pattern, handler] of Object.entries(this.routes)) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                return {
                    handler: handler,
                    params: match.params
                };
            }
        }
        return null;
    },
    
    /**
     * Match route pattern with path
     */
    matchRoute: function(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = [];
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                // Dynamic segment
                params.push(decodeURIComponent(pathPart));
            } else if (patternPart !== pathPart) {
                // Exact match required
                return null;
            }
        }
        
        return { params };
    },
    
    /**
     * Update active navigation item
     */
    updateActiveNavigation: function() {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current route
        const currentNavLink = document.querySelector(`.nav-link[href="#${this.currentRoute}"]`) ||
                             document.querySelector(`.nav-link[data-route="${this.getNavRoute()}"]`);
        
        if (currentNavLink) {
            currentNavLink.classList.add('active');
        }
    },
    
    /**
     * Get navigation route for current path
     */
    getNavRoute: function() {
        const path = this.currentRoute;
        
        if (path.startsWith('/jobs')) return 'jobs';
        if (path.startsWith('/clients')) return 'clients';
        if (path.startsWith('/analytics')) return 'analytics';
        if (path.startsWith('/admin')) return 'admin';
        
        return path.substring(1) || 'dashboard';
    },
    
    /**
     * Show login page
     */
    showLogin: function() {
        // Redirect if already authenticated
        if (Auth.isAuthenticated) {
            return this.navigate('/dashboard');
        }
        
        UI.showPage('login-template');
        this.setupLoginForm();
    },
    
    /**
     * Show dashboard
     */
    showDashboard: function() {
        Auth.requireAuth();
        UI.showPage('dashboard-template');
        this.loadDashboardData();
    },
    
    /**
     * Show jobs list
     */
    showJobsList: function() {
        Auth.requireAuth();
        UI.showPage('jobs-list-template');
        Jobs.init();
    },
    
    /**
     * Show job form (create/edit)
     */
    showJobForm: function(id = null) {
        Auth.requireAuth();
        UI.showPage('job-form-template');
        Jobs.initForm(id);
    },
    
    /**
     * Show job details
     */
    showJobDetails: function(id) {
        Auth.requireAuth();
        Jobs.showDetails(id);
    },
    
    /**
     * Show clients list
     */
    showClientsList: function() {
        Auth.requireAuth();
        Clients.init();
    },
    
    /**
     * Show client form
     */
    showClientForm: function(id = null) {
        Auth.requireAuth();
        Clients.initForm(id);
    },
    
    /**
     * Show client details
     */
    showClientDetails: function(id) {
        Auth.requireAuth();
        Clients.showDetails(id);
    },
    
    /**
     * Show analytics
     */
    showAnalytics: function() {
        Auth.requireAnyRole(['checker', 'admin']);
        Analytics.init();
    },
    
    /**
     * Show admin panel
     */
    showAdmin: function() {
        Auth.requireRole('admin');
        Admin.init();
    },
    
    /**
     * Show admin users
     */
    showAdminUsers: function() {
        Auth.requireRole('admin');
        Admin.showUsers();
    },
    
    /**
     * Show admin migration
     */
    showAdminMigration: function() {
        Auth.requireRole('admin');
        Admin.showMigration();
    },
    
    /**
     * Show profile page
     */
    showProfile: function() {
        Auth.requireAuth();
        this.showComingSoon('Profile Management');
    },
    
    /**
     * Show activity logs
     */
    showActivity: function() {
        Auth.requireAnyRole(['checker', 'admin']);
        this.showComingSoon('Activity Logs');
    },
    
    /**
     * Show 404 page
     */
    showNotFound: function() {
        const content = `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--status-rejected); margin-bottom: 2rem;"></i>
                <h1>Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="#/dashboard" class="btn btn-primary" style="margin-top: 2rem;">
                    <i class="fas fa-home"></i>
                    Go to Dashboard
                </a>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    },
    
    /**
     * Show error page
     */
    showError: function(message = 'An unexpected error occurred') {
        const content = `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--status-rejected); margin-bottom: 2rem;"></i>
                <h1>Error</h1>
                <p>${Utils.escapeHTML(message)}</p>
                <div style="margin-top: 2rem; gap: 1rem; display: flex; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i>
                        Reload Page
                    </button>
                    <a href="#/dashboard" class="btn btn-primary">
                        <i class="fas fa-home"></i>
                        Go to Dashboard
                    </a>
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    },
    
    /**
     * Show coming soon page
     */
    showComingSoon: function(feature = 'This feature') {
        const content = `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-tools" style="font-size: 4rem; color: var(--status-pending); margin-bottom: 2rem;"></i>
                <h1>Coming Soon</h1>
                <p>${Utils.escapeHTML(feature)} is under development.</p>
                <a href="#/dashboard" class="btn btn-primary" style="margin-top: 2rem;">
                    <i class="fas fa-arrow-left"></i>
                    Back to Dashboard
                </a>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    },
    
    /**
     * Setup login form
     */
    setupLoginForm: function() {
        const form = document.getElementById('login-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
                submitBtn.disabled = true;
                
                await Auth.login(email, password);
                
            } catch (error) {
                UI.showToast(error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    },
    
    /**
     * Load dashboard data
     */
    loadDashboardData: async function() {
        try {
            // Load summary statistics
            const summary = await API.analytics.getSummary();
            
            // Update stats
            document.getElementById('total-jobs').textContent = summary.jobs.total;
            document.getElementById('pending-jobs').textContent = summary.jobs.pending;
            document.getElementById('approved-jobs').textContent = summary.jobs.approved;
            document.getElementById('total-profit').textContent = summary.financial.total_profit;
            
            // Load recent jobs
            const jobs = await API.jobs.getAll({ limit: 5 });
            this.renderRecentJobs(jobs.data);
            
        } catch (error) {
            console.error('Dashboard data error:', error);
            UI.showToast('Failed to load dashboard data', 'error');
        }
    },
    
    /**
     * Render recent jobs on dashboard
     */
    renderRecentJobs: function(jobs) {
        const container = document.getElementById('recent-jobs');
        if (!container) return;
        
        if (!jobs || jobs.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No recent job files</p>';
            return;
        }
        
        const jobsHTML = jobs.map(job => `
            <div class="job-card" style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0;">
                            <a href="#/jobs/${job.id}" style="text-decoration: none; color: var(--primary);">${job.job_file_no}</a>
                        </h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                            ${job.shipper_name} → ${job.consignee_name}
                        </p>
                        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.75rem;">
                            ${Utils.formatDate(job.opening_date)}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        ${Utils.getStatusBadge(job.status)}
                        <p style="margin: 0.5rem 0 0 0; font-weight: 600; color: var(--text-primary);">
                            ${Utils.formatCurrency(job.total_sell)}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = jobsHTML;
    }
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}