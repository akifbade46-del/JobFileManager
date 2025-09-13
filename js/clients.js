/**
 * Clients Management
 * Job File Management System - HTML/JavaScript Edition
 */

window.Clients = {
    
    // Current clients data
    currentClients: [],
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1,
    
    // Current filters
    currentFilters: {
        search: '',
        type: 'all',
        page: 1
    },
    
    /**
     * Initialize clients management
     */
    init: function() {
        this.renderClientsPage();
        this.setupEventListeners();
        this.loadClients();
    },
    
    /**
     * Render clients page
     */
    renderClientsPage: function() {
        const content = `
            <div class="clients-page">
                <div class="page-header">
                    <h1>Clients</h1>
                    <div class="page-actions">
                        <div class="search-box">
                            <input 
                                type="text" 
                                id="clients-search" 
                                placeholder="Search clients..." 
                                data-testid="input-search-clients"
                            >
                            <i class="fas fa-search"></i>
                        </div>
                        
                        <select id="clients-type-filter" data-testid="select-type-filter">
                            <option value="all">All Types</option>
                            <option value="shipper">Shippers</option>
                            <option value="consignee">Consignees</option>
                            <option value="both">Both</option>
                        </select>
                        
                        <button class="btn btn-primary" onclick="Clients.showCreateForm()" data-testid="button-create-client">
                            <i class="fas fa-plus"></i>
                            New Client
                        </button>
                    </div>
                </div>
                
                <div class="clients-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Contact</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Total Jobs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table-body">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
                
                <div id="clients-pagination" class="pagination">
                    <!-- Dynamic pagination -->
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Search input
        const searchInput = document.getElementById('clients-search');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e.target.value), 500)
            );
        }
        
        // Type filter
        const typeFilter = document.getElementById('clients-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => this.handleTypeFilter(e.target.value));
        }
    },
    
    /**
     * Load clients with current filters
     */
    loadClients: async function() {
        try {
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            };
            
            // Remove 'all' type filter
            if (params.type === 'all') {
                delete params.type;
            }
            
            const response = await API.clients.getAll(params);
            
            this.currentClients = response.data;
            this.totalPages = response.pagination.pages;
            
            this.renderClientsTable();
            this.renderPagination();
            
        } catch (error) {
            console.error('Load clients error:', error);
            UI.showToast('Failed to load clients', 'error');
        }
    },
    
    /**
     * Handle search input
     */
    handleSearch: function(searchTerm) {
        this.currentFilters.search = searchTerm;
        this.currentPage = 1;
        this.loadClients();
    },
    
    /**
     * Handle type filter
     */
    handleTypeFilter: function(type) {
        this.currentFilters.type = type;
        this.currentPage = 1;
        this.loadClients();
    },
    
    /**
     * Handle page change
     */
    handlePageChange: function(page) {
        this.currentPage = page;
        this.loadClients();
    },
    
    /**
     * Render clients table
     */
    renderClientsTable: function() {
        const tableBody = document.getElementById('clients-table-body');
        if (!tableBody) return;
        
        if (!this.currentClients || this.currentClients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-building" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No clients found
                    </td>
                </tr>
            `;
            return;
        }
        
        const rows = this.currentClients.map(client => `
            <tr data-testid="row-client-${client.id}">
                <td><strong>${Utils.escapeHTML(client.name)}</strong></td>
                <td>${this.getTypeBadge(client.type)}</td>
                <td>${Utils.escapeHTML(client.contact)}</td>
                <td>${client.email ? Utils.escapeHTML(client.email) : '-'}</td>
                <td>${client.phone ? Utils.escapeHTML(client.phone) : '-'}</td>
                <td>${client.total_jobs || 0}</td>
                <td>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="Clients.showDetails(${client.id})" title="View Details" data-testid="button-view-${client.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="Clients.showEditForm(${client.id})" title="Edit Client" data-testid="button-edit-${client.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${Auth.hasRole('admin') ? `
                            <button class="btn btn-danger btn-sm" onclick="Clients.deleteClient(${client.id})" title="Delete Client" data-testid="button-delete-${client.id}">
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
     * Get type badge HTML
     */
    getTypeBadge: function(type) {
        const badges = {
            shipper: '<span class="badge bg-primary">Shipper</span>',
            consignee: '<span class="badge bg-info">Consignee</span>',
            both: '<span class="badge bg-success">Both</span>'
        };
        
        return badges[type] || `<span class="badge">${type}</span>`;
    },
    
    /**
     * Render pagination
     */
    renderPagination: function() {
        const paginationContainer = document.getElementById('clients-pagination');
        if (!paginationContainer) return;
        
        const pagination = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            total: this.currentClients.length,
            pages: this.totalPages
        };
        
        paginationContainer.innerHTML = UI.createPagination(pagination, 
            (page) => this.handlePageChange(page)
        );
    },
    
    /**
     * Show create form
     */
    showCreateForm: function() {
        this.showClientForm();
    },
    
    /**
     * Show edit form
     */
    showEditForm: function(clientId) {
        this.showClientForm(clientId);
    },
    
    /**
     * Show client form (create/edit)
     */
    showClientForm: function(clientId = null) {
        const isEdit = !!clientId;
        const title = isEdit ? 'Edit Client' : 'Create New Client';
        
        const formHTML = `
            <div class="client-form">
                <h3>${title}</h3>
                <form id="client-form">
                    <div class="form-group">
                        <label for="client-name">Client Name *</label>
                        <input type="text" id="client-name" name="name" required data-testid="input-client-name">
                    </div>
                    
                    <div class="form-group">
                        <label for="client-type">Type *</label>
                        <select id="client-type" name="type" required data-testid="select-client-type">
                            <option value="both">Both (Shipper & Consignee)</option>
                            <option value="shipper">Shipper Only</option>
                            <option value="consignee">Consignee Only</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="client-contact">Contact Person *</label>
                        <input type="text" id="client-contact" name="contact" required data-testid="input-client-contact">
                    </div>
                    
                    <div class="form-group">
                        <label for="client-email">Email</label>
                        <input type="email" id="client-email" name="email" data-testid="input-client-email">
                    </div>
                    
                    <div class="form-group">
                        <label for="client-phone">Phone</label>
                        <input type="text" id="client-phone" name="phone" data-testid="input-client-phone">
                    </div>
                    
                    <div class="form-group">
                        <label for="client-address">Address</label>
                        <textarea id="client-address" name="address" rows="3" data-testid="input-client-address"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="client-notes">Notes</label>
                        <textarea id="client-notes" name="notes" rows="2" data-testid="input-client-notes"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                        <button type="button" class="btn btn-secondary" onclick="UI.hideModal()" data-testid="button-cancel">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" data-testid="button-save-client">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Update' : 'Create'} Client
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        UI.showModal(formHTML, { maxWidth: '600px' });
        
        // Load client data if editing
        if (isEdit) {
            this.loadClientForEdit(clientId);
        }
        
        // Setup form submit handler
        const form = document.getElementById('client-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveClient(clientId);
            });
        }
    },
    
    /**
     * Load client data for editing
     */
    loadClientForEdit: async function(clientId) {
        try {
            const client = await API.clients.getById(clientId);
            
            // Populate form fields
            document.getElementById('client-name').value = client.name || '';
            document.getElementById('client-type').value = client.type || 'both';
            document.getElementById('client-contact').value = client.contact || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('client-address').value = client.address || '';
            document.getElementById('client-notes').value = client.notes || '';
            
        } catch (error) {
            console.error('Load client error:', error);
            UI.showToast('Failed to load client data', 'error');
            UI.hideModal();
        }
    },
    
    /**
     * Save client (create or update)
     */
    saveClient: async function(clientId = null) {
        const form = document.getElementById('client-form');
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
            const clientData = {};
            
            for (const [key, value] of formData.entries()) {
                clientData[key] = value.trim();
            }
            
            // Save client
            if (clientId) {
                await API.clients.update(clientId, clientData);
                UI.showToast('Client updated successfully', 'success');
            } else {
                await API.clients.create(clientData);
                UI.showToast('Client created successfully', 'success');
            }
            
            UI.hideModal();
            this.loadClients();
            
        } catch (error) {
            console.error('Save client error:', error);
            UI.showToast(error.message || 'Failed to save client', 'error');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Show client details
     */
    showDetails: async function(clientId) {
        try {
            const client = await API.clients.getById(clientId);
            this.renderClientDetails(client);
        } catch (error) {
            console.error('Load client details error:', error);
            UI.showToast('Failed to load client details', 'error');
        }
    },
    
    /**
     * Render client details modal
     */
    renderClientDetails: function(client) {
        const detailsHTML = `
            <div class="client-details">
                <h3>${Utils.escapeHTML(client.name)}</h3>
                
                <div style="margin: 1.5rem 0;">
                    <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                        <strong style="min-width: 100px;">Type:</strong>
                        <span>${this.getTypeBadge(client.type)}</span>
                    </div>
                    <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                        <strong style="min-width: 100px;">Contact:</strong>
                        <span>${Utils.escapeHTML(client.contact)}</span>
                    </div>
                    ${client.email ? `
                        <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                            <strong style="min-width: 100px;">Email:</strong>
                            <span>${Utils.escapeHTML(client.email)}</span>
                        </div>
                    ` : ''}
                    ${client.phone ? `
                        <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                            <strong style="min-width: 100px;">Phone:</strong>
                            <span>${Utils.escapeHTML(client.phone)}</span>
                        </div>
                    ` : ''}
                    ${client.address ? `
                        <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                            <strong style="min-width: 100px;">Address:</strong>
                            <span>${Utils.escapeHTML(client.address)}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                        <strong style="min-width: 100px;">Total Jobs:</strong>
                        <span>${client.total_jobs || 0}</span>
                    </div>
                    ${client.last_job_date ? `
                        <div class="detail-row" style="display: flex; margin-bottom: 0.75rem;">
                            <strong style="min-width: 100px;">Last Job:</strong>
                            <span>${Utils.formatDate(client.last_job_date)}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${client.recent_jobs && client.recent_jobs.length > 0 ? `
                    <div style="margin-top: 2rem;">
                        <h4>Recent Jobs</h4>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                            ${client.recent_jobs.map(job => `
                                <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${Utils.escapeHTML(job.job_file_no)}</strong>
                                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                            ${Utils.formatDate(job.opening_date)}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        ${Utils.getStatusBadge(job.status)}
                                        <div style="font-weight: 600; margin-top: 0.25rem;">
                                            ${Utils.formatCurrency(job.total_sell)}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="Clients.showEditForm(${client.id}); UI.hideModal();" data-testid="button-edit-from-details">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary" onclick="UI.hideModal()" data-testid="button-close-details">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        UI.showModal(detailsHTML, { maxWidth: '700px' });
    },
    
    /**
     * Delete client
     */
    deleteClient: function(clientId) {
        UI.confirm('Are you sure you want to delete this client? This action cannot be undone.', async () => {
            try {
                await API.clients.delete(clientId);
                UI.showToast('Client deleted successfully', 'success');
                this.loadClients();
            } catch (error) {
                console.error('Delete client error:', error);
                UI.showToast(error.message || 'Failed to delete client', 'error');
            }
        });
    }
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Clients;
}