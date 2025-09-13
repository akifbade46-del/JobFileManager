/**
 * Admin Panel Management
 * Job File Management System - HTML/JavaScript Edition
 */

window.Admin = {
    
    /**
     * Initialize admin panel
     */
    init: function() {
        this.renderAdminDashboard();
        this.loadAdminData();
    },
    
    /**
     * Render admin dashboard
     */
    renderAdminDashboard: function() {
        const content = `
            <div class="admin-dashboard">
                <div class="page-header">
                    <h1>Admin Panel</h1>
                    <div class="page-actions">
                        <button class="btn btn-secondary" onclick="Admin.showUsers()" data-testid="button-manage-users">
                            <i class="fas fa-users"></i>
                            Manage Users
                        </button>
                        <button class="btn btn-secondary" onclick="Admin.showMigration()" data-testid="button-data-migration">
                            <i class="fas fa-database"></i>
                            Data Migration
                        </button>
                    </div>
                </div>
                
                <!-- Admin Stats -->
                <div class="stats-grid" id="admin-stats">
                    <!-- Dynamic stats -->
                </div>
                
                <!-- Quick Actions -->
                <div class="admin-section">
                    <h2>Quick Actions</h2>
                    <div class="admin-actions-grid">
                        <div class="action-card" onclick="Admin.showUsers()">
                            <div class="action-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <h3>User Management</h3>
                            <p>Manage user accounts, roles, and permissions</p>
                        </div>
                        
                        <div class="action-card" onclick="Admin.showMigration()">
                            <div class="action-icon">
                                <i class="fas fa-database"></i>
                            </div>
                            <h3>Data Migration</h3>
                            <p>Import/Export data, create backups</p>
                        </div>
                        
                        <div class="action-card" onclick="Admin.showSystemSettings()">
                            <div class="action-icon">
                                <i class="fas fa-cog"></i>
                            </div>
                            <h3>System Settings</h3>
                            <p>Configure system preferences and settings</p>
                        </div>
                        
                        <div class="action-card" onclick="Admin.showActivityLogs()">
                            <div class="action-icon">
                                <i class="fas fa-history"></i>
                            </div>
                            <h3>Activity Logs</h3>
                            <p>View system activity and audit logs</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    },
    
    /**
     * Load admin dashboard data
     */
    loadAdminData: async function() {
        try {
            // Load admin-specific stats
            const [summary, users] = await Promise.all([
                API.analytics.getSummary(),
                API.users.getAll({ limit: 100 })
            ]);
            
            this.renderAdminStats(summary, users);
            
        } catch (error) {
            console.error('Load admin data error:', error);
            UI.showToast('Failed to load admin data', 'error');
        }
    },
    
    /**
     * Render admin statistics
     */
    renderAdminStats: function(summary, users) {
        const statsContainer = document.getElementById('admin-stats');
        if (!statsContainer) return;
        
        const usersByRole = users.data.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        
        const activeUsers = users.data.filter(u => u.status === 'active').length;
        const pendingUsers = users.data.filter(u => u.status === 'pending').length;
        
        const statsHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--primary);">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-content">
                    <h3>${users.data.length}</h3>
                    <p>Total Users</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--status-approved);">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="stat-content">
                    <h3>${activeUsers}</h3>
                    <p>Active Users</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--status-pending);">
                    <i class="fas fa-user-clock"></i>
                </div>
                <div class="stat-content">
                    <h3>${pendingUsers}</h3>
                    <p>Pending Approval</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--accent);">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="stat-content">
                    <h3>${usersByRole.admin || 0}</h3>
                    <p>Admin Users</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--secondary);">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="stat-content">
                    <h3>${usersByRole.checker || 0}</h3>
                    <p>Checker Users</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--status-checked);">
                    <i class="fas fa-user"></i>
                </div>
                <div class="stat-content">
                    <h3>${usersByRole.user || 0}</h3>
                    <p>Regular Users</p>
                </div>
            </div>
        `;
        
        statsContainer.innerHTML = statsHTML;
    },
    
    /**
     * Show users management
     */
    showUsers: function() {
        const content = `
            <div class="admin-users">
                <div class="page-header">
                    <h1>User Management</h1>
                    <div class="page-actions">
                        <div class="search-box">
                            <input 
                                type="text" 
                                id="users-search" 
                                placeholder="Search users..." 
                                data-testid="input-search-users"
                            >
                            <i class="fas fa-search"></i>
                        </div>
                        
                        <select id="users-role-filter" data-testid="select-role-filter">
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="checker">Checker</option>
                            <option value="user">User</option>
                        </select>
                        
                        <select id="users-status-filter" data-testid="select-status-filter">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        
                        <a href="#/admin" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i>
                            Back to Admin
                        </a>
                    </div>
                </div>
                
                <div class="users-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Jobs Created</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-users-table-body">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
                
                <div id="admin-users-pagination" class="pagination">
                    <!-- Dynamic pagination -->
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
        
        this.setupUsersEventListeners();
        this.loadUsers();
    },
    
    /**
     * Setup users management event listeners
     */
    setupUsersEventListeners: function() {
        const searchInput = document.getElementById('users-search');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleUsersSearch(e.target.value), 500)
            );
        }
        
        const roleFilter = document.getElementById('users-role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => this.handleUsersRoleFilter(e.target.value));
        }
        
        const statusFilter = document.getElementById('users-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleUsersStatusFilter(e.target.value));
        }
    },
    
    /**
     * Load users data
     */
    loadUsers: async function() {
        try {
            const params = {
                page: 1,
                limit: 50,
                ...this.getUsersFilters()
            };
            
            const response = await API.users.getAll(params);
            this.renderUsersTable(response.data);
            
        } catch (error) {
            console.error('Load users error:', error);
            UI.showToast('Failed to load users', 'error');
        }
    },
    
    /**
     * Get users filters
     */
    getUsersFilters: function() {
        const filters = {};
        
        const searchInput = document.getElementById('users-search');
        if (searchInput && searchInput.value) {
            filters.search = searchInput.value;
        }
        
        const roleFilter = document.getElementById('users-role-filter');
        if (roleFilter && roleFilter.value !== 'all') {
            filters.role = roleFilter.value;
        }
        
        const statusFilter = document.getElementById('users-status-filter');
        if (statusFilter && statusFilter.value !== 'all') {
            filters.status = statusFilter.value;
        }
        
        return filters;
    },
    
    /**
     * Handle users search
     */
    handleUsersSearch: function(searchTerm) {
        this.loadUsers();
    },
    
    /**
     * Handle users role filter
     */
    handleUsersRoleFilter: function(role) {
        this.loadUsers();
    },
    
    /**
     * Handle users status filter
     */
    handleUsersStatusFilter: function(status) {
        this.loadUsers();
    },
    
    /**
     * Render users table
     */
    renderUsersTable: function(users) {
        const tableBody = document.getElementById('admin-users-table-body');
        if (!tableBody) return;
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No users found
                    </td>
                </tr>
            `;
            return;
        }
        
        const rows = users.map(user => `
            <tr data-testid="row-user-${user.id}">
                <td><strong>${Utils.escapeHTML(user.name)}</strong></td>
                <td>${Utils.escapeHTML(user.email)}</td>
                <td>${Utils.getRoleBadge(user.role)}</td>
                <td>${this.getStatusBadge(user.status)}</td>
                <td>${user.jobs_created || 0}</td>
                <td>${Utils.formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="Admin.showUserDetails(${user.id})" title="View Details" data-testid="button-view-user-${user.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="Admin.showEditUserForm(${user.id})" title="Edit User" data-testid="button-edit-user-${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.id !== Auth.currentUser.id ? `
                            <button class="btn btn-danger btn-sm" onclick="Admin.deleteUser(${user.id})" title="Delete User" data-testid="button-delete-user-${user.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = rows;
    },
    
    /**
     * Get status badge HTML
     */
    getStatusBadge: function(status) {
        const badges = {
            active: '<span class="badge bg-success">Active</span>',
            pending: '<span class="badge bg-warning">Pending</span>',
            blocked: '<span class="badge bg-danger">Blocked</span>'
        };
        
        return badges[status] || `<span class="badge">${status}</span>`;
    },
    
    /**
     * Show edit user form
     */
    showEditUserForm: function(userId) {
        // Load user data and show edit form
        this.loadUserForEdit(userId);
    },
    
    /**
     * Load user data for editing
     */
    loadUserForEdit: async function(userId) {
        try {
            const user = await API.users.getById(userId);
            this.showUserForm(user);
        } catch (error) {
            console.error('Load user error:', error);
            UI.showToast('Failed to load user data', 'error');
        }
    },
    
    /**
     * Show user form (edit)
     */
    showUserForm: function(user) {
        const formHTML = `
            <div class="user-form">
                <h3>Edit User: ${Utils.escapeHTML(user.name)}</h3>
                <form id="admin-user-form">
                    <div class="form-group">
                        <label for="user-name">Name *</label>
                        <input type="text" id="user-name" name="name" value="${Utils.escapeHTML(user.name)}" required data-testid="input-user-name">
                    </div>
                    
                    <div class="form-group">
                        <label for="user-email">Email *</label>
                        <input type="email" id="user-email" name="email" value="${Utils.escapeHTML(user.email)}" required data-testid="input-user-email">
                    </div>
                    
                    <div class="form-group">
                        <label for="user-role">Role *</label>
                        <select id="user-role" name="role" required data-testid="select-user-role">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="checker" ${user.role === 'checker' ? 'selected' : ''}>Checker</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-status">Status *</label>
                        <select id="user-status" name="status" required data-testid="select-user-status">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-password">New Password (leave blank to keep current)</label>
                        <input type="password" id="user-password" name="password" data-testid="input-user-password">
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                        <button type="button" class="btn btn-secondary" onclick="UI.hideModal()" data-testid="button-cancel">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" data-testid="button-save-user">
                            <i class="fas fa-save"></i>
                            Update User
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        UI.showModal(formHTML, { maxWidth: '500px' });
        
        // Setup form submit handler
        const form = document.getElementById('admin-user-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUser(user.id);
            });
        }
    },
    
    /**
     * Save user changes
     */
    saveUser: async function(userId) {
        const form = document.getElementById('admin-user-form');
        if (!form) return;
        
        // Validate form
        if (!UI.validateForm(form)) {
            UI.showToast('Please fix the form errors', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        
        try {
            UI.setButtonLoading(submitBtn, true, 'Saving...');
            
            // Collect form data
            const formData = new FormData(form);
            const userData = {};
            
            for (const [key, value] of formData.entries()) {
                if (key === 'password' && !value.trim()) {
                    // Skip empty password
                    continue;
                }
                userData[key] = value.trim();
            }
            
            await API.users.update(userId, userData);
            UI.showToast('User updated successfully', 'success');
            UI.hideModal();
            this.loadUsers();
            
        } catch (error) {
            console.error('Save user error:', error);
            UI.showToast(error.message || 'Failed to save user', 'error');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Delete user
     */
    deleteUser: function(userId) {
        UI.confirm('Are you sure you want to delete this user? This action cannot be undone.', async () => {
            try {
                await API.users.delete(userId);
                UI.showToast('User deleted successfully', 'success');
                this.loadUsers();
            } catch (error) {
                console.error('Delete user error:', error);
                UI.showToast(error.message || 'Failed to delete user', 'error');
            }
        });
    },
    
    /**
     * Show data migration
     */
    showMigration: function() {
        const content = `
            <div class="admin-migration">
                <div class="page-header">
                    <h1>Data Migration</h1>
                    <div class="page-actions">
                        <a href="#/admin" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i>
                            Back to Admin
                        </a>
                    </div>
                </div>
                
                <!-- Import Section -->
                <div class="migration-section">
                    <h2><i class="fas fa-upload"></i> Import Data</h2>
                    <div class="migration-grid">
                        <div class="migration-card">
                            <h3>Import Users</h3>
                            <p>Upload a CSV file with user data</p>
                            <input type="file" id="import-users-file" accept=".csv" style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('import-users-file').click()" data-testid="button-import-users">
                                <i class="fas fa-file-csv"></i>
                                Choose CSV File
                            </button>
                        </div>
                        
                        <div class="migration-card">
                            <h3>Import Clients</h3>
                            <p>Upload a CSV file with client data</p>
                            <input type="file" id="import-clients-file" accept=".csv" style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('import-clients-file').click()" data-testid="button-import-clients">
                                <i class="fas fa-file-csv"></i>
                                Choose CSV File
                            </button>
                        </div>
                        
                        <div class="migration-card">
                            <h3>Import Job Files</h3>
                            <p>Upload a CSV file with job file data</p>
                            <input type="file" id="import-jobs-file" accept=".csv" style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('import-jobs-file').click()" data-testid="button-import-jobs">
                                <i class="fas fa-file-csv"></i>
                                Choose CSV File
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Export Section -->
                <div class="migration-section">
                    <h2><i class="fas fa-download"></i> Export Data</h2>
                    <div class="migration-grid">
                        <div class="migration-card">
                            <h3>Export Users</h3>
                            <p>Download all users as CSV</p>
                            <button class="btn btn-secondary" onclick="Admin.exportUsers()" data-testid="button-export-users">
                                <i class="fas fa-download"></i>
                                Download CSV
                            </button>
                        </div>
                        
                        <div class="migration-card">
                            <h3>Export Clients</h3>
                            <p>Download all clients as CSV</p>
                            <button class="btn btn-secondary" onclick="Admin.exportClients()" data-testid="button-export-clients">
                                <i class="fas fa-download"></i>
                                Download CSV
                            </button>
                        </div>
                        
                        <div class="migration-card">
                            <h3>Export Job Files</h3>
                            <p>Download all job files as CSV</p>
                            <button class="btn btn-secondary" onclick="Admin.exportJobs()" data-testid="button-export-jobs">
                                <i class="fas fa-download"></i>
                                Download CSV
                            </button>
                        </div>
                        
                        <div class="migration-card">
                            <h3>Full System Backup</h3>
                            <p>Download complete database backup</p>
                            <button class="btn btn-success" onclick="Admin.createBackup()" data-testid="button-create-backup">
                                <i class="fas fa-database"></i>
                                Create Backup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
        
        this.setupMigrationEventListeners();
    },
    
    /**
     * Setup migration event listeners
     */
    setupMigrationEventListeners: function() {
        // Users import
        const usersFile = document.getElementById('import-users-file');
        if (usersFile) {
            usersFile.addEventListener('change', (e) => this.handleImport(e, 'users'));
        }
        
        // Clients import
        const clientsFile = document.getElementById('import-clients-file');
        if (clientsFile) {
            clientsFile.addEventListener('change', (e) => this.handleImport(e, 'clients'));
        }
        
        // Jobs import
        const jobsFile = document.getElementById('import-jobs-file');
        if (jobsFile) {
            jobsFile.addEventListener('change', (e) => this.handleImport(e, 'jobs'));
        }
    },
    
    /**
     * Handle file import
     */
    handleImport: async function(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.csv')) {
            UI.showToast('Please select a CSV file', 'error');
            return;
        }
        
        const confirmMessage = `Are you sure you want to import ${type} from "${file.name}"? This will add new records to the database.`;
        
        UI.confirm(confirmMessage, async () => {
            try {
                let response;
                
                switch (type) {
                    case 'users':
                        response = await API.migration.importUsers(file);
                        break;
                    case 'clients':
                        response = await API.migration.importClients(file);
                        break;
                    case 'jobs':
                        response = await API.migration.importJobs(file);
                        break;
                }
                
                if (response.success) {
                    UI.showToast(`Successfully imported ${response.imported} ${type}`, 'success');
                    
                    if (response.errors && response.errors.length > 0) {
                        console.warn('Import errors:', response.errors);
                        UI.showToast(`${response.errors.length} records had errors`, 'warning');
                    }
                } else {
                    UI.showToast(response.error || 'Import failed', 'error');
                }
                
            } catch (error) {
                console.error('Import error:', error);
                UI.showToast(error.message || 'Import failed', 'error');
            } finally {
                // Clear file input
                event.target.value = '';
            }
        });
    },
    
    /**
     * Export functions
     */
    exportUsers: function() {
        API.migration.exportUsers();
        UI.showToast('Downloading users export...', 'info');
    },
    
    exportClients: function() {
        API.migration.exportClients();
        UI.showToast('Downloading clients export...', 'info');
    },
    
    exportJobs: function() {
        API.migration.exportJobs();
        UI.showToast('Downloading job files export...', 'info');
    },
    
    createBackup: function() {
        UI.confirm('Create a full system backup? This may take a few moments.', () => {
            API.migration.createBackup();
            UI.showToast('Creating system backup...', 'info');
        });
    },
    
    /**
     * Show system settings (placeholder)
     */
    showSystemSettings: function() {
        UI.showToast('System settings coming soon...', 'info');
    },
    
    /**
     * Show activity logs (placeholder)
     */
    showActivityLogs: function() {
        UI.showToast('Activity logs coming soon...', 'info');
    }
};

// Add CSS for admin panel
const adminStyle = document.createElement('style');
adminStyle.textContent = `
    .admin-actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
    }
    
    .action-card {
        background: var(--bg-primary);
        padding: 2rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-light);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
    }
    
    .action-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary);
    }
    
    .action-icon {
        width: 60px;
        height: 60px;
        background: var(--primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        color: white;
        font-size: 1.5rem;
    }
    
    .action-card h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
    }
    
    .action-card p {
        color: var(--text-secondary);
        margin: 0;
    }
    
    .migration-section {
        margin: 3rem 0;
    }
    
    .migration-section h2 {
        margin-bottom: 2rem;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .migration-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }
    
    .migration-card {
        background: var(--bg-primary);
        padding: 2rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-light);
        text-align: center;
    }
    
    .migration-card h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
    }
    
    .migration-card p {
        color: var(--text-secondary);
        margin: 0 0 1.5rem 0;
    }
    
    .admin-section {
        margin: 3rem 0;
    }
    
    .admin-section h2 {
        margin-bottom: 2rem;
        color: var(--text-primary);
    }
`;
document.head.appendChild(adminStyle);

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Admin;
}