/**
 * Job Files Management
 * Job File Management System - HTML/JavaScript Edition
 */

window.Jobs = {
    
    // Current jobs data
    currentJobs: [],
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1,
    
    // Current filters
    currentFilters: {
        search: '',
        status: 'all',
        page: 1
    },
    
    // Current job form data
    currentJobId: null,
    currentJobData: null,
    
    /**
     * Initialize jobs list
     */
    init: function() {
        this.setupEventListeners();
        this.loadJobs();
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Search input
        const searchInput = document.getElementById('jobs-search');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e.target.value), 500)
            );
        }
        
        // Status filter
        const statusFilter = document.getElementById('jobs-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }
    },
    
    /**
     * Load jobs with current filters
     */
    loadJobs: async function() {
        try {
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            };
            
            // Remove 'all' status filter
            if (params.status === 'all') {
                delete params.status;
            }
            
            const response = await API.jobs.getAll(params);
            
            this.currentJobs = response.data;
            this.totalPages = response.pagination.pages;
            
            this.renderJobsTable();
            this.renderPagination();
            
        } catch (error) {
            console.error('Load jobs error:', error);
            UI.showToast('Failed to load job files', 'error');
        }
    },
    
    /**
     * Handle search input
     */
    handleSearch: function(searchTerm) {
        this.currentFilters.search = searchTerm;
        this.currentPage = 1;
        this.loadJobs();
    },
    
    /**
     * Handle status filter
     */
    handleStatusFilter: function(status) {
        this.currentFilters.status = status;
        this.currentPage = 1;
        this.loadJobs();
    },
    
    /**
     * Handle page change
     */
    handlePageChange: function(page) {
        this.currentPage = page;
        this.loadJobs();
    },
    
    /**
     * Render jobs table
     */
    renderJobsTable: function() {
        const tableBody = document.getElementById('jobs-table-body');
        if (!tableBody) return;
        
        if (!this.currentJobs || this.currentJobs.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-file-lines" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No job files found
                    </td>
                </tr>
            `;
            return;
        }
        
        const rows = this.currentJobs.map(job => `
            <tr data-testid="row-job-${job.id}">
                <td>
                    <strong>${Utils.escapeHTML(job.job_file_no)}</strong>
                </td>
                <td>${Utils.formatDate(job.opening_date)}</td>
                <td>${Utils.escapeHTML(job.shipper_name)}</td>
                <td>${Utils.escapeHTML(job.consignee_name)}</td>
                <td>${Utils.formatCurrency(job.total_sell)}</td>
                <td>${Utils.getStatusBadge(job.status)}</td>
                <td>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem;">
                        <a href="#/jobs/${job.id}" class="btn btn-secondary btn-sm" title="View Details" data-testid="button-view-${job.id}">
                            <i class="fas fa-eye"></i>
                        </a>
                        ${this.getJobActionButtons(job)}
                    </div>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = rows;
    },
    
    /**
     * Get action buttons based on job status and user role
     */
    getJobActionButtons: function(job) {
        let buttons = '';
        
        // Edit button (for job owner or admin)
        if (Auth.canEdit(job.prepared_by)) {
            buttons += `
                <a href="#/jobs/${job.id}/edit" class="btn btn-secondary btn-sm" title="Edit Job" data-testid="button-edit-${job.id}">
                    <i class="fas fa-edit"></i>
                </a>
            `;
        }
        
        // Status action buttons
        switch (job.status) {
            case 'pending':
                if (Auth.hasAnyRole(['checker', 'admin'])) {
                    buttons += `
                        <button class="btn btn-info btn-sm" onclick="Jobs.checkJob(${job.id})" title="Check Job" data-testid="button-check-${job.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                }
                break;
                
            case 'checked':
                if (Auth.hasRole('admin')) {
                    buttons += `
                        <button class="btn btn-success btn-sm" onclick="Jobs.approveJob(${job.id})" title="Approve Job" data-testid="button-approve-${job.id}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="Jobs.rejectJob(${job.id})" title="Reject Job" data-testid="button-reject-${job.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                }
                break;
        }
        
        // Delete button (admin only)
        if (Auth.hasRole('admin')) {
            buttons += `
                <button class="btn btn-danger btn-sm" onclick="Jobs.deleteJob(${job.id})" title="Delete Job" data-testid="button-delete-${job.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        return buttons;
    },
    
    /**
     * Render pagination
     */
    renderPagination: function() {
        const paginationContainer = document.getElementById('jobs-pagination');
        if (!paginationContainer) return;
        
        const pagination = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            total: this.currentJobs.length,
            pages: this.totalPages
        };
        
        paginationContainer.innerHTML = UI.createPagination(pagination, 
            (page) => this.handlePageChange(page)
        );
    },
    
    /**
     * Initialize job form (create/edit)
     */
    initForm: async function(jobId = null) {
        this.currentJobId = jobId;
        this.currentJobData = null;
        
        // Update form title
        const formTitle = document.getElementById('form-title');
        if (formTitle) {
            formTitle.textContent = jobId ? 'Edit Job File' : 'Create New Job File';
        }
        
        // Load job data if editing
        if (jobId) {
            await this.loadJobData(jobId);
        }
        
        this.setupFormEventListeners();
        this.setupItemsManagement();
        
        // Set default opening date
        if (!jobId) {
            const openingDateInput = document.getElementById('opening_date');
            if (openingDateInput) {
                openingDateInput.value = Utils.getCurrentDateTime();
            }
        }
    },
    
    /**
     * Load job data for editing
     */
    loadJobData: async function(jobId) {
        try {
            this.currentJobData = await API.jobs.getById(jobId);
            this.populateForm(this.currentJobData);
        } catch (error) {
            console.error('Load job data error:', error);
            UI.showToast('Failed to load job data', 'error');
            Router.navigate('/jobs');
        }
    },
    
    /**
     * Populate form with job data
     */
    populateForm: function(jobData) {
        // Basic fields
        const fields = [
            'job_file_no', 'opening_date', 'billing_date', 'shipper_name', 'shipper_address',
            'shipper_contact', 'consignee_name', 'consignee_address', 'consignee_contact',
            'agent', 'agent_ref', 'vessel', 'voyage', 'pol', 'pod', 'container_no',
            'container_size', 'description', 'notes'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && jobData[field] !== null) {
                if (element.type === 'datetime-local') {
                    element.value = Utils.formatDateForInput(jobData[field]);
                } else {
                    element.value = jobData[field] || '';
                }
            }
        });
        
        // Populate items
        if (jobData.items && jobData.items.length > 0) {
            jobData.items.forEach(item => this.addJobItem(item));
        }
        
        this.calculateTotals();
    },
    
    /**
     * Setup form event listeners
     */
    setupFormEventListeners: function() {
        const form = document.getElementById('job-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveJob();
        });
    },
    
    /**
     * Setup items management
     */
    setupItemsManagement: function() {
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addJobItem());
        }
    },
    
    /**
     * Add job item row
     */
    addJobItem: function(itemData = null) {
        const container = document.getElementById('items-container');
        if (!container) return;
        
        const itemId = Utils.generateId();
        const itemHTML = `
            <div class="item-row" data-item-id="${itemId}" style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Description *</label>
                        <input type="text" class="item-description" value="${itemData ? Utils.escapeHTML(itemData.description) : ''}" required data-testid="input-item-description-${itemId}">
                    </div>
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" value="${itemData ? itemData.quantity : 1}" min="0" step="0.01" data-testid="input-item-quantity-${itemId}">
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <input type="text" class="item-unit" value="${itemData ? Utils.escapeHTML(itemData.unit || '') : ''}" data-testid="input-item-unit-${itemId}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Sell Rate (KWD)</label>
                        <input type="number" class="item-sell-rate" value="${itemData ? itemData.sell_rate : 0}" min="0" step="0.001" data-testid="input-item-sell-rate-${itemId}">
                    </div>
                    <div class="form-group">
                        <label>Cost Rate (KWD)</label>
                        <input type="number" class="item-cost-rate" value="${itemData ? itemData.cost_rate : 0}" min="0" step="0.001" data-testid="input-item-cost-rate-${itemId}">
                    </div>
                    <div class="form-group">
                        <label>Actions</label>
                        <button type="button" class="btn btn-danger btn-sm" onclick="Jobs.removeJobItem('${itemId}')" data-testid="button-remove-item-${itemId}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div class="item-totals" style="display: flex; justify-content: flex-end; gap: 2rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light); font-weight: 600;">
                    <span>Sell: <span class="item-sell-amount" data-testid="text-item-sell-${itemId}">0.000 KWD</span></span>
                    <span>Cost: <span class="item-cost-amount" data-testid="text-item-cost-${itemId}">0.000 KWD</span></span>
                    <span>Profit: <span class="item-profit" data-testid="text-item-profit-${itemId}">0.000 KWD</span></span>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHTML);
        
        // Setup event listeners for calculations
        const itemRow = container.querySelector(`[data-item-id="${itemId}"]`);
        const inputs = itemRow.querySelectorAll('.item-quantity, .item-sell-rate, .item-cost-rate');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculateItemTotals(itemRow);
                this.calculateTotals();
            });
        });
        
        // Calculate initial totals if data provided
        if (itemData) {
            this.calculateItemTotals(itemRow);
        }
        
        this.calculateTotals();
    },
    
    /**
     * Remove job item
     */
    removeJobItem: function(itemId) {
        const itemRow = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemRow) {
            itemRow.remove();
            this.calculateTotals();
        }
    },
    
    /**
     * Calculate item totals
     */
    calculateItemTotals: function(itemRow) {
        const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
        const sellRate = parseFloat(itemRow.querySelector('.item-sell-rate').value) || 0;
        const costRate = parseFloat(itemRow.querySelector('.item-cost-rate').value) || 0;
        
        const sellAmount = quantity * sellRate;
        const costAmount = quantity * costRate;
        const profit = sellAmount - costAmount;
        
        itemRow.querySelector('.item-sell-amount').textContent = Utils.formatCurrency(sellAmount);
        itemRow.querySelector('.item-cost-amount').textContent = Utils.formatCurrency(costAmount);
        itemRow.querySelector('.item-profit').textContent = Utils.formatCurrency(profit);
    },
    
    /**
     * Calculate grand totals
     */
    calculateTotals: function() {
        const itemRows = document.querySelectorAll('.item-row');
        let totalSell = 0;
        let totalCost = 0;
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const sellRate = parseFloat(row.querySelector('.item-sell-rate').value) || 0;
            const costRate = parseFloat(row.querySelector('.item-cost-rate').value) || 0;
            
            totalSell += quantity * sellRate;
            totalCost += quantity * costRate;
        });
        
        const totalProfit = totalSell - totalCost;
        
        // Update totals display
        const totalSellElement = document.getElementById('total-sell');
        const totalCostElement = document.getElementById('total-cost');
        const totalProfitElement = document.getElementById('total-profit');
        
        if (totalSellElement) totalSellElement.textContent = Utils.formatCurrency(totalSell);
        if (totalCostElement) totalCostElement.textContent = Utils.formatCurrency(totalCost);
        if (totalProfitElement) {
            totalProfitElement.textContent = Utils.formatCurrency(totalProfit);
            // Color coding for profit
            totalProfitElement.style.color = totalProfit >= 0 ? 'var(--status-approved)' : 'var(--status-rejected)';
        }
    },
    
    /**
     * Save job (create or update)
     */
    saveJob: async function() {
        const form = document.getElementById('job-form');
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
            const jobData = {};
            
            // Basic fields
            for (const [key, value] of formData.entries()) {
                jobData[key] = value;
            }
            
            // Collect items data
            const items = [];
            document.querySelectorAll('.item-row').forEach(row => {
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const sellRate = parseFloat(row.querySelector('.item-sell-rate').value) || 0;
                const costRate = parseFloat(row.querySelector('.item-cost-rate').value) || 0;
                
                items.push({
                    description: row.querySelector('.item-description').value,
                    quantity: quantity,
                    unit: row.querySelector('.item-unit').value,
                    sell_rate: sellRate,
                    cost_rate: costRate,
                    sell_amount: quantity * sellRate,
                    cost_amount: quantity * costRate,
                    profit: (quantity * sellRate) - (quantity * costRate)
                });
            });
            
            jobData.items = items;
            
            // Calculate totals
            jobData.total_sell = items.reduce((sum, item) => sum + item.sell_amount, 0);
            jobData.total_cost = items.reduce((sum, item) => sum + item.cost_amount, 0);
            jobData.total_profit = jobData.total_sell - jobData.total_cost;
            
            // Save job
            let response;
            if (this.currentJobId) {
                response = await API.jobs.update(this.currentJobId, jobData);
            } else {
                response = await API.jobs.create(jobData);
            }
            
            UI.showToast(`Job file ${this.currentJobId ? 'updated' : 'created'} successfully`, 'success');
            Router.navigate('/jobs');
            
        } catch (error) {
            console.error('Save job error:', error);
            UI.showToast(error.message || 'Failed to save job file', 'error');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    },
    
    /**
     * Check job file
     */
    checkJob: async function(jobId) {
        UI.confirm('Are you sure you want to mark this job as checked?', async () => {
            try {
                await API.jobs.check(jobId);
                UI.showToast('Job file checked successfully', 'success');
                this.loadJobs();
            } catch (error) {
                console.error('Check job error:', error);
                UI.showToast('Failed to check job file', 'error');
            }
        });
    },
    
    /**
     * Approve job file
     */
    approveJob: async function(jobId) {
        UI.confirm('Are you sure you want to approve this job file?', async () => {
            try {
                await API.jobs.approve(jobId);
                UI.showToast('Job file approved successfully', 'success');
                this.loadJobs();
            } catch (error) {
                console.error('Approve job error:', error);
                UI.showToast('Failed to approve job file', 'error');
            }
        });
    },
    
    /**
     * Reject job file
     */
    rejectJob: async function(jobId) {
        UI.prompt('Please provide a reason for rejection:', '', async (reason) => {
            if (!reason.trim()) {
                UI.showToast('Please provide a reason for rejection', 'warning');
                return;
            }
            
            try {
                await API.jobs.reject(jobId, reason);
                UI.showToast('Job file rejected successfully', 'success');
                this.loadJobs();
            } catch (error) {
                console.error('Reject job error:', error);
                UI.showToast('Failed to reject job file', 'error');
            }
        });
    },
    
    /**
     * Delete job file
     */
    deleteJob: async function(jobId) {
        UI.confirm('Are you sure you want to delete this job file? This action cannot be undone.', async () => {
            try {
                await API.jobs.delete(jobId);
                UI.showToast('Job file deleted successfully', 'success');
                this.loadJobs();
            } catch (error) {
                console.error('Delete job error:', error);
                UI.showToast('Failed to delete job file', 'error');
            }
        });
    },
    
    /**
     * Show job details
     */
    showDetails: async function(jobId) {
        try {
            const job = await API.jobs.getById(jobId);
            this.renderJobDetails(job);
        } catch (error) {
            console.error('Load job details error:', error);
            UI.showToast('Failed to load job details', 'error');
            Router.navigate('/jobs');
        }
    },
    
    /**
     * Render job details page
     */
    renderJobDetails: function(job) {
        const content = `
            <div class="job-details">
                <div class="page-header">
                    <h1>Job File: ${Utils.escapeHTML(job.job_file_no)}</h1>
                    <div class="page-actions">
                        ${Utils.getStatusBadge(job.status)}
                        ${Auth.canEdit(job.prepared_by) ? `<a href="#/jobs/${job.id}/edit" class="btn btn-primary" data-testid="button-edit-job">
                            <i class="fas fa-edit"></i> Edit Job
                        </a>` : ''}
                        <a href="#/jobs" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to Jobs
                        </a>
                    </div>
                </div>
                
                <!-- Job details content would go here -->
                <div style="text-align: center; padding: 4rem;">
                    <i class="fas fa-tools" style="font-size: 4rem; color: var(--status-pending); margin-bottom: 2rem;"></i>
                    <h2>Job Details View</h2>
                    <p>Detailed job view is being implemented...</p>
                    <p><strong>Job File:</strong> ${Utils.escapeHTML(job.job_file_no)}</p>
                    <p><strong>Status:</strong> ${Utils.capitalize(job.status)}</p>
                    <p><strong>Total:</strong> ${Utils.formatCurrency(job.total_sell)}</p>
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    }
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Jobs;
}