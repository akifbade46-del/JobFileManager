/**
 * API Communication Layer
 * Job File Management System - HTML/JavaScript Edition
 */

window.API = {
    
    // Base API URL - Update for production
    baseURL: '/api',
    
    /**
     * Make HTTP request
     */
    request: async function(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'same-origin', // Include cookies for session
            ...options
        };
        
        // Add JSON body if provided
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            UI.showGlobalLoading(true);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            UI.showGlobalLoading(false);
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            UI.showGlobalLoading(false);
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * GET request
     */
    get: function(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url);
    },
    
    /**
     * POST request
     */
    post: function(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    },
    
    /**
     * PUT request
     */
    put: function(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    },
    
    /**
     * DELETE request
     */
    delete: function(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },
    
    /**
     * Upload file
     */
    uploadFile: function(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional form data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    },
    
    // ===========================================
    // AUTHENTICATION API ENDPOINTS
    // ===========================================
    auth: {
        /**
         * User login
         */
        login: function(email, password) {
            return API.post('/auth/login', { email, password });
        },
        
        /**
         * User registration
         */
        register: function(userData) {
            return API.post('/auth/register', userData);
        },
        
        /**
         * Get current user
         */
        getCurrentUser: function() {
            return API.get('/auth/me');
        },
        
        /**
         * User logout
         */
        logout: function() {
            return API.post('/auth/logout');
        }
    },
    
    // ===========================================
    // JOB FILES API ENDPOINTS
    // ===========================================
    jobs: {
        /**
         * Get all job files with filtering
         */
        getAll: function(params = {}) {
            return API.get('/jobs', params);
        },
        
        /**
         * Get single job file
         */
        getById: function(id) {
            return API.get(`/jobs/${id}`);
        },
        
        /**
         * Create new job file
         */
        create: function(jobData) {
            return API.post('/jobs', jobData);
        },
        
        /**
         * Update job file
         */
        update: function(id, jobData) {
            return API.put(`/jobs/${id}`, jobData);
        },
        
        /**
         * Delete job file
         */
        delete: function(id) {
            return API.delete(`/jobs/${id}`);
        },
        
        /**
         * Check job file (checker role)
         */
        check: function(id) {
            return API.post(`/jobs/check/${id}`);
        },
        
        /**
         * Approve job file (admin role)
         */
        approve: function(id) {
            return API.post(`/jobs/approve/${id}`);
        },
        
        /**
         * Reject job file (admin role)
         */
        reject: function(id, reason) {
            return API.post(`/jobs/reject/${id}`, { reason });
        }
    },
    
    // ===========================================
    // CLIENTS API ENDPOINTS
    // ===========================================
    clients: {
        /**
         * Get all clients
         */
        getAll: function(params = {}) {
            return API.get('/clients', params);
        },
        
        /**
         * Get single client
         */
        getById: function(id) {
            return API.get(`/clients/${id}`);
        },
        
        /**
         * Create new client
         */
        create: function(clientData) {
            return API.post('/clients', clientData);
        },
        
        /**
         * Update client
         */
        update: function(id, clientData) {
            return API.put(`/clients/${id}`, clientData);
        },
        
        /**
         * Delete client
         */
        delete: function(id) {
            return API.delete(`/clients/${id}`);
        }
    },
    
    // ===========================================
    // USERS API ENDPOINTS (Admin only)
    // ===========================================
    users: {
        /**
         * Get all users
         */
        getAll: function(params = {}) {
            return API.get('/users', params);
        },
        
        /**
         * Get single user
         */
        getById: function(id) {
            return API.get(`/users/${id}`);
        },
        
        /**
         * Update user
         */
        update: function(id, userData) {
            return API.put(`/users/${id}`, userData);
        },
        
        /**
         * Delete user
         */
        delete: function(id) {
            return API.delete(`/users/${id}`);
        }
    },
    
    // ===========================================
    // ANALYTICS API ENDPOINTS
    // ===========================================
    analytics: {
        /**
         * Get summary analytics
         */
        getSummary: function(params = {}) {
            return API.get('/analytics/summary', params);
        },
        
        /**
         * Get monthly data
         */
        getMonthlyData: function(year) {
            return API.get('/analytics/monthly', { year });
        },
        
        /**
         * Get status breakdown
         */
        getStatusBreakdown: function() {
            return API.get('/analytics/status');
        },
        
        /**
         * Get user statistics
         */
        getUserStats: function() {
            return API.get('/analytics/users');
        },
        
        /**
         * Get client statistics
         */
        getClientStats: function() {
            return API.get('/analytics/clients');
        },
        
        /**
         * Get profit analysis
         */
        getProfitAnalysis: function(period = 30) {
            return API.get('/analytics/profit', { period });
        }
    },
    
    // ===========================================
    // ACTIVITY LOGS API ENDPOINTS
    // ===========================================
    activity: {
        /**
         * Get activity logs
         */
        getLogs: function(params = {}) {
            return API.get('/activity', params);
        }
    },
    
    // ===========================================
    // MIGRATION API ENDPOINTS (Admin only)
    // ===========================================
    migration: {
        /**
         * Import users from CSV
         */
        importUsers: function(file) {
            return API.uploadFile('/migration/import-users', file);
        },
        
        /**
         * Import clients from CSV
         */
        importClients: function(file) {
            return API.uploadFile('/migration/import-clients', file);
        },
        
        /**
         * Import job files from CSV
         */
        importJobs: function(file) {
            return API.uploadFile('/migration/import-jobs', file);
        },
        
        /**
         * Export users to CSV
         */
        exportUsers: function() {
            window.open(`${API.baseURL}/migration/export-users`);
        },
        
        /**
         * Export clients to CSV
         */
        exportClients: function() {
            window.open(`${API.baseURL}/migration/export-clients`);
        },
        
        /**
         * Export job files to CSV
         */
        exportJobs: function() {
            window.open(`${API.baseURL}/migration/export-jobs`);
        },
        
        /**
         * Create full backup
         */
        createBackup: function() {
            window.open(`${API.baseURL}/migration/backup`);
        }
    }
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}