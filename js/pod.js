/**
 * POD (Proof of Delivery) System Frontend
 * Handles driver dashboard, supervisor panel, and manual entry
 * Converted from Firebase to PHP/MySQL backend
 */

window.POD = {
    
    // Current data
    currentUser: null,
    deliveries: [],
    drivers: [],
    jobFiles: [],
    
    // Signature pad instance
    signaturePad: null,
    
    /**
     * Initialize POD system
     */
    init: function() {
        this.currentUser = Auth.currentUser;
        this.bindEvents();
        this.loadInitialData();
    },
    
    /**
     * Bind event handlers
     */
    bindEvents: function() {
        // Driver completion modal events
        const completionForm = document.getElementById('completion-form');
        if (completionForm) {
            completionForm.addEventListener('submit', this.handleDeliveryCompletion.bind(this));
        }
        
        // Signature pad clear button
        const clearSignBtn = document.getElementById('clear-signature');
        if (clearSignBtn) {
            clearSignBtn.addEventListener('click', this.clearSignature.bind(this));
        }
        
        // Job file search
        const jobFileSearch = document.getElementById('job-file-search');
        if (jobFileSearch) {
            jobFileSearch.addEventListener('input', Utils.debounce(this.searchJobFiles.bind(this), 300));
        }
        
        // Delivery form
        const deliveryForm = document.getElementById('delivery-form');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', this.handleDeliveryAssignment.bind(this));
        }
        
        // Feedback form
        const feedbackForm = document.getElementById('feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', this.handleFeedbackSubmission.bind(this));
        }
    },
    
    /**
     * Load initial data based on user role
     */
    loadInitialData: async function() {
        try {
            UI.showLoading();
            
            if (this.currentUser.role === 'driver') {
                await this.loadDriverData();
            } else if (this.currentUser.role === 'supervisor' || this.currentUser.role === 'admin') {
                await this.loadSupervisorData();
            }
            
            await this.loadStatistics();
            
        } catch (error) {
            console.error('Failed to load POD data:', error);
            UI.showToast('Failed to load data', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Load driver-specific data
     */
    loadDriverData: async function() {
        const response = await API.request('/api/pod.php?endpoint=deliveries');
        this.deliveries = response.deliveries || [];
        this.renderDriverDashboard();
    },
    
    /**
     * Load supervisor/admin data
     */
    loadSupervisorData: async function() {
        const [deliveriesResponse, driversResponse] = await Promise.all([
            API.request('/api/pod.php?endpoint=deliveries'),
            API.request('/api/pod.php?endpoint=drivers')
        ]);
        
        this.deliveries = deliveriesResponse.deliveries || [];
        this.drivers = driversResponse.drivers || [];
        this.renderSupervisorDashboard();
    },
    
    /**
     * Load statistics
     */
    loadStatistics: async function() {
        try {
            const response = await API.request('/api/pod.php?endpoint=statistics');
            this.renderStatistics(response.statistics);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    },
    
    /**
     * Render driver dashboard
     */
    renderDriverDashboard: function() {
        const container = document.getElementById('driver-tasks-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.deliveries.length === 0) {
            container.innerHTML = `
                <div class="text-center p-8 text-gray-500">
                    <div class="text-6xl mb-4">📦</div>
                    <p class="text-lg">No deliveries assigned yet</p>
                    <p class="text-sm">Check back later for new assignments</p>
                </div>
            `;
            return;
        }
        
        // Group deliveries by status
        const pending = this.deliveries.filter(d => d.status === 'assigned');
        const completed = this.deliveries.filter(d => d.status === 'delivered');
        
        // Render pending deliveries
        if (pending.length > 0) {
            const pendingSection = document.createElement('div');
            pendingSection.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                    Pending Deliveries (${pending.length})
                </h3>
                <div class="space-y-4" id="pending-deliveries"></div>
            `;
            container.appendChild(pendingSection);
            
            const pendingContainer = pendingSection.querySelector('#pending-deliveries');
            pending.forEach(delivery => {
                pendingContainer.appendChild(this.createDeliveryCard(delivery, true));
            });
        }
        
        // Render completed deliveries
        if (completed.length > 0) {
            const completedSection = document.createElement('div');
            completedSection.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 mb-4 mt-8 flex items-center">
                    <span class="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                    Completed Deliveries (${completed.length})
                </h3>
                <div class="space-y-4" id="completed-deliveries"></div>
            `;
            container.appendChild(completedSection);
            
            const completedContainer = completedSection.querySelector('#completed-deliveries');
            completed.forEach(delivery => {
                completedContainer.appendChild(this.createDeliveryCard(delivery, false));
            });
        }
    },
    
    /**
     * Render supervisor dashboard
     */
    renderSupervisorDashboard: function() {
        // Render delivery assignment section
        this.renderDriverSelect();
        
        // Render delivery lists
        this.renderDeliveryLists();
    },
    
    /**
     * Render driver select dropdown
     */
    renderDriverSelect: function() {
        const driverSelect = document.getElementById('driver-select');
        if (!driverSelect) return;
        
        driverSelect.innerHTML = '<option value="">-- Select a Driver --</option>';
        
        this.drivers.forEach(driver => {
            const option = document.createElement('option');
            option.value = driver.id;
            option.textContent = `${driver.name} (${driver.active_deliveries} active)`;
            option.disabled = driver.status !== 'active';
            driverSelect.appendChild(option);
        });
    },
    
    /**
     * Render delivery lists for supervisor
     */
    renderDeliveryLists: function() {
        const pendingList = document.getElementById('pending-deliveries-list');
        const completedList = document.getElementById('completed-deliveries-list');
        
        if (pendingList) {
            pendingList.innerHTML = '';
            const pending = this.deliveries.filter(d => d.status !== 'delivered');
            pending.forEach(delivery => {
                pendingList.appendChild(this.createDeliveryCard(delivery, false, true));
            });
            
            if (pending.length === 0) {
                pendingList.innerHTML = '<p class="text-gray-500 text-center p-4">No pending deliveries</p>';
            }
        }
        
        if (completedList) {
            completedList.innerHTML = '';
            const completed = this.deliveries.filter(d => d.status === 'delivered');
            completed.forEach(delivery => {
                completedList.appendChild(this.createDeliveryCard(delivery, false, true));
            });
            
            if (completed.length === 0) {
                completedList.innerHTML = '<p class="text-gray-500 text-center p-4">No completed deliveries</p>';
            }
        }
    },
    
    /**
     * Create delivery card element - secure against XSS
     */
    createDeliveryCard: function(delivery, showCompleteButton = false, showManageButtons = false) {
        const card = document.createElement('div');
        card.className = 'delivery-card bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow';
        
        const statusColor = {
            'pending': 'bg-gray-100 text-gray-800',
            'assigned': 'bg-yellow-100 text-yellow-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleDateString();
        };
        
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // Create header section
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-start mb-3';
        
        const leftDiv = document.createElement('div');
        const jobTitle = document.createElement('h4');
        jobTitle.className = 'font-bold text-gray-900';
        jobTitle.textContent = delivery.job_file_no || '';
        
        const shipperInfo = document.createElement('p');
        shipperInfo.className = 'text-sm text-gray-600';
        shipperInfo.textContent = `${delivery.shipper_name || ''} → ${delivery.consignee_name || ''}`;
        
        leftDiv.appendChild(jobTitle);
        leftDiv.appendChild(shipperInfo);
        
        const statusSpan = document.createElement('span');
        statusSpan.className = `px-2 py-1 text-xs rounded-full ${statusColor[delivery.status] || statusColor.pending}`;
        statusSpan.textContent = Utils.capitalize(delivery.status);
        
        headerDiv.appendChild(leftDiv);
        headerDiv.appendChild(statusSpan);
        card.appendChild(headerDiv);
        
        // Create details section
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'space-y-2 text-sm text-gray-600 mb-4';
        
        const details = [
            ['Destination:', delivery.destination || 'N/A'],
            ['AWB/MAWB:', delivery.mawb || 'N/A'],
            ['Driver:', delivery.driver_name || 'N/A'],
            ['Assigned:', formatDate(delivery.assigned_at)]
        ];
        
        if (delivery.completed_receiver_name) {
            details.push(
                ['Received by:', delivery.completed_receiver_name],
                ['Completed:', formatDate(delivery.delivery_date)]
            );
        }
        
        details.forEach(([label, value]) => {
            const detailDiv = document.createElement('div');
            detailDiv.className = 'flex justify-between';
            
            const labelSpan = document.createElement('span');
            labelSpan.textContent = label;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'font-medium';
            valueSpan.textContent = value;
            
            detailDiv.appendChild(labelSpan);
            detailDiv.appendChild(valueSpan);
            detailsDiv.appendChild(detailDiv);
        });
        
        card.appendChild(detailsDiv);
        
        // Create location section
        const locationDiv = document.createElement('div');
        locationDiv.className = 'delivery-location bg-gray-50 p-3 rounded mb-4';
        
        const locationTitle = document.createElement('h5');
        locationTitle.className = 'font-semibold text-sm text-gray-700 mb-1';
        locationTitle.textContent = 'Delivery Location:';
        
        const locationText = document.createElement('p');
        locationText.className = 'text-sm text-gray-600';
        locationText.textContent = delivery.delivery_location || '';
        
        locationDiv.appendChild(locationTitle);
        locationDiv.appendChild(locationText);
        
        if (delivery.additional_notes) {
            const notesText = document.createElement('p');
            notesText.className = 'text-xs text-gray-500 mt-2';
            notesText.textContent = `Notes: ${delivery.additional_notes}`;
            locationDiv.appendChild(notesText);
        }
        
        card.appendChild(locationDiv);
        
        // Create buttons section
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'flex flex-wrap gap-2';
        
        if (showCompleteButton && delivery.status === 'assigned') {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn btn-success text-sm';
            completeBtn.setAttribute('data-testid', 'button-complete-delivery');
            completeBtn.textContent = 'Complete Delivery';
            completeBtn.onclick = () => POD.openCompletionModal(delivery.delivery_id);
            buttonsDiv.appendChild(completeBtn);
        }
        
        if (delivery.status === 'delivered') {
            const receiptBtn = document.createElement('button');
            receiptBtn.className = 'btn btn-primary text-sm';
            receiptBtn.setAttribute('data-testid', 'button-view-receipt');
            receiptBtn.textContent = 'View Receipt';
            receiptBtn.onclick = () => POD.viewReceipt(delivery.delivery_id);
            buttonsDiv.appendChild(receiptBtn);
        }
        
        if (showManageButtons) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary text-sm';
            editBtn.setAttribute('data-testid', 'button-edit-delivery');
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => POD.editDelivery(delivery.delivery_id);
            buttonsDiv.appendChild(editBtn);
            
            if (delivery.status !== 'delivered') {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn btn-danger text-sm';
                cancelBtn.setAttribute('data-testid', 'button-cancel-delivery');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = () => POD.cancelDelivery(delivery.delivery_id);
                buttonsDiv.appendChild(cancelBtn);
            }
        }
        
        card.appendChild(buttonsDiv);
        return card;
    },
    
    /**
     * Render statistics
     */
    renderStatistics: function(stats) {
        const elements = {
            'stat-pending': stats.pending || 0,
            'stat-completed': stats.completed || 0,
            'stat-total': stats.total || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Driver-specific stats
        if (this.currentUser.role === 'driver' && stats.avg_rating) {
            const ratingElement = document.getElementById('driver-rating');
            if (ratingElement) {
                const stars = '★'.repeat(Math.round(stats.avg_rating)) + 
                            '☆'.repeat(5 - Math.round(stats.avg_rating));
                ratingElement.innerHTML = `${stars} (${stats.avg_rating}/5.0)`;
            }
        }
    },
    
    /**
     * Search job files for assignment
     */
    searchJobFiles: async function(event) {
        const searchTerm = event.target.value.trim();
        const suggestionsContainer = document.getElementById('job-file-suggestions');
        
        if (searchTerm.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        try {
            const response = await API.request(`/api/pod.php?endpoint=job-files/search&q=${encodeURIComponent(searchTerm)}`);
            const jobFiles = response.job_files || [];
            
            this.renderJobFileSuggestions(jobFiles, suggestionsContainer);
            
        } catch (error) {
            console.error('Job file search failed:', error);
        }
    },
    
    /**
     * Render job file suggestions
     */
    renderJobFileSuggestions: function(jobFiles, container) {
        container.innerHTML = '';
        
        if (jobFiles.length === 0) {
            container.innerHTML = '<div class="suggestion-item text-gray-500">No job files found</div>';
            container.style.display = 'block';
            return;
        }
        
        jobFiles.forEach(jobFile => {
            const item = document.createElement('div');
            item.className = 'suggestion-item hover:bg-gray-50 cursor-pointer';
            item.innerHTML = `
                <div class="font-medium">${jobFile.job_file_no}</div>
                <div class="text-sm text-gray-600">${jobFile.shipper_name} → ${jobFile.consignee_name}</div>
                <div class="text-xs text-gray-500">${jobFile.pol} → ${jobFile.pod}</div>
            `;
            
            item.addEventListener('click', () => this.selectJobFile(jobFile));
            container.appendChild(item);
        });
        
        container.style.display = 'block';
    },
    
    /**
     * Select job file for delivery assignment
     */
    selectJobFile: function(jobFile) {
        // Hide suggestions
        document.getElementById('job-file-suggestions').style.display = 'none';
        
        // Update search input
        document.getElementById('job-file-search').value = jobFile.job_file_no;
        
        // Update job details display
        document.getElementById('form-job-file-no').textContent = jobFile.job_file_no;
        document.getElementById('form-job-shipper-consignee').textContent = 
            `${jobFile.shipper_name} → ${jobFile.consignee_name}`;
        
        // Auto-fill form fields
        const form = document.getElementById('delivery-form');
        if (form) {
            form.querySelector('#delivery-origin').value = jobFile.pol || '';
            form.querySelector('#delivery-destination').value = jobFile.pod || '';
            form.querySelector('#delivery-mawb').value = jobFile.bl_no || '';
            form.querySelector('#delivery-inv').value = jobFile.invoice_no || '';
        }
        
        // Store selected job file
        this.selectedJobFile = jobFile;
    },
    
    /**
     * Handle delivery assignment form submission
     */
    handleDeliveryAssignment: async function(event) {
        event.preventDefault();
        
        if (!this.selectedJobFile) {
            UI.showToast('Please select a job file first', 'error');
            return;
        }
        
        const form = event.target;
        const formData = new FormData(form);
        
        const deliveryData = {
            job_file_id: this.selectedJobFile.id,
            driver_id: formData.get('driver_id'),
            origin: formData.get('origin'),
            destination: formData.get('destination'),
            airlines: formData.get('airlines'),
            mawb: formData.get('mawb'),
            invoice_no: formData.get('invoice_no'),
            delivery_location: formData.get('delivery_location'),
            additional_notes: formData.get('additional_notes')
        };
        
        try {
            UI.showLoading();
            
            const response = await API.request('/api/pod.php?endpoint=deliveries', {
                method: 'POST',
                body: JSON.stringify(deliveryData)
            });
            
            UI.showToast('Delivery assigned successfully!', 'success');
            
            // Reset form and reload data
            form.reset();
            this.selectedJobFile = null;
            document.getElementById('form-job-file-no').textContent = 'Select a job';
            document.getElementById('form-job-shipper-consignee').textContent = 'N/A';
            
            await this.loadSupervisorData();
            
        } catch (error) {
            console.error('Delivery assignment failed:', error);
            UI.showToast(error.message || 'Failed to assign delivery', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Open delivery completion modal
     */
    openCompletionModal: function(deliveryId) {
        const delivery = this.deliveries.find(d => d.delivery_id === deliveryId);
        if (!delivery) return;
        
        // Update modal content
        document.getElementById('delivery-id-input').value = deliveryId;
        document.getElementById('modal-job-no').textContent = delivery.job_file_no;
        document.getElementById('modal-location').textContent = delivery.delivery_location;
        
        // Initialize signature pad
        this.initSignaturePad();
        
        // Show modal
        UI.openModal('delivery-completion-modal');
    },
    
    /**
     * Initialize signature pad
     */
    initSignaturePad: function() {
        const canvas = document.getElementById('signature-pad');
        if (!canvas) return;
        
        this.signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(255,255,255,1)',
            penColor: 'rgb(0,0,0)',
            minWidth: 1,
            maxWidth: 2
        });
        
        // Resize canvas
        this.resizeSignaturePad();
    },
    
    /**
     * Resize signature pad to fit container
     */
    resizeSignaturePad: function() {
        if (!this.signaturePad) return;
        
        const canvas = this.signaturePad.canvas;
        const container = canvas.parentElement;
        
        canvas.width = container.offsetWidth;
        canvas.height = 200; // Fixed height
        
        this.signaturePad.clear();
    },
    
    /**
     * Clear signature pad
     */
    clearSignature: function() {
        if (this.signaturePad) {
            this.signaturePad.clear();
        }
    },
    
    /**
     * Handle delivery completion form submission
     */
    handleDeliveryCompletion: async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Validate signature
        if (!this.signaturePad || this.signaturePad.isEmpty()) {
            UI.showToast('Please provide a signature', 'error');
            return;
        }
        
        const deliveryData = {
            delivery_id: formData.get('delivery_id'),
            receiver_name: formData.get('receiver_name'),
            receiver_mobile: formData.get('receiver_mobile'),
            delivery_notes: formData.get('delivery_notes'),
            signature_data: this.signaturePad.toDataURL(),
            gps_latitude: null, // TODO: Implement GPS if needed
            gps_longitude: null
        };
        
        try {
            UI.showLoading();
            
            const response = await API.request('/api/pod.php?endpoint=deliveries/complete', {
                method: 'POST',
                body: JSON.stringify(deliveryData)
            });
            
            UI.showToast('Delivery completed successfully!', 'success');
            UI.closeModal('delivery-completion-modal');
            
            // Show POD URL for feedback
            if (response.pod_url) {
                UI.showToast(`POD receipt: ${window.location.origin}${response.pod_url}`, 'info');
            }
            
            // Reload data
            await this.loadDriverData();
            
        } catch (error) {
            console.error('Delivery completion failed:', error);
            UI.showToast(error.message || 'Failed to complete delivery', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Handle feedback submission (public)
     */
    handleFeedbackSubmission: async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const feedbackData = {
            delivery_id: formData.get('delivery_id'),
            rating: parseInt(formData.get('rating')),
            comment: formData.get('comment')
        };
        
        if (!feedbackData.rating) {
            UI.showToast('Please provide a rating', 'error');
            return;
        }
        
        try {
            UI.showLoading();
            
            await API.request('/api/pod.php?endpoint=feedback', {
                method: 'POST',
                body: JSON.stringify(feedbackData)
            });
            
            // Hide form and show thank you message
            document.getElementById('feedback-form-container').style.display = 'none';
            document.getElementById('feedback-thanks-message').style.display = 'block';
            
        } catch (error) {
            console.error('Feedback submission failed:', error);
            UI.showToast(error.message || 'Failed to submit feedback', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * View POD receipt
     */
    viewReceipt: function(deliveryId) {
        const url = `/pod-public.html?podId=${deliveryId}`;
        window.open(url, '_blank');
    },
    
    /**
     * Cancel delivery
     */
    cancelDelivery: async function(deliveryId) {
        if (!confirm('Are you sure you want to cancel this delivery?')) {
            return;
        }
        
        try {
            UI.showLoading();
            
            // TODO: Implement cancel delivery endpoint
            UI.showToast('Cancel delivery functionality coming soon', 'info');
            
        } catch (error) {
            console.error('Cancel delivery failed:', error);
            UI.showToast('Failed to cancel delivery', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Edit delivery
     */
    editDelivery: function(deliveryId) {
        // TODO: Implement edit delivery functionality
        UI.showToast('Edit delivery functionality coming soon', 'info');
    }
    
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if on POD pages
    if (window.location.hash.includes('/pod/')) {
        POD.init();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = POD;
}