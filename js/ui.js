/**
 * UI Components and Interactions
 * Job File Management System - HTML/JavaScript Edition
 */

window.UI = {
    
    // Global loading state
    globalLoading: false,
    
    // Toast container
    toastContainer: null,
    
    // Modal overlay
    modalOverlay: null,
    
    /**
     * Initialize UI components
     */
    init: function() {
        this.toastContainer = document.getElementById('toast-container');
        this.modalOverlay = document.getElementById('modal-overlay');
        
        // Setup modal close handlers
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.hideModal();
                }
            });
        }
        
        // Setup user dropdown
        this.setupUserDropdown();
        
        // Setup global keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup form validation helpers
        this.setupFormValidation();
    },
    
    /**
     * Show page content from template
     */
    showPage: function(templateId, data = {}) {
        const template = document.getElementById(templateId);
        const mainContent = document.getElementById('main-content');
        
        if (!template || !mainContent) {
            console.error('Template or main content not found:', templateId);
            return;
        }
        
        // Clone template content
        const content = template.content.cloneNode(true);
        
        // Replace placeholders with data
        this.replacePlaceholders(content, data);
        
        // Clear and append new content
        mainContent.innerHTML = '';
        mainContent.appendChild(content);
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    /**
     * Replace placeholders in content
     */
    replacePlaceholders: function(content, data) {
        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            let text = textNode.textContent;
            Object.keys(data).forEach(key => {
                const placeholder = `{{${key}}}`;
                text = text.replace(new RegExp(placeholder, 'g'), data[key]);
            });
            textNode.textContent = text;
        });
    },
    
    /**
     * Show toast notification
     */
    showToast: function(message, type = 'info', duration = 5000) {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const icon = iconMap[type] || 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${Utils.escapeHTML(message)}</span>
            <button class="toast-close" data-testid="button-close-toast">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Add to container
        this.toastContainer.appendChild(toast);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        return toast;
    },
    
    /**
     * Remove toast
     */
    removeToast: function(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },
    
    /**
     * Show modal
     */
    showModal: function(content, options = {}) {
        if (!this.modalOverlay) return;
        
        const modalContent = this.modalOverlay.querySelector('#modal-content');
        if (!modalContent) return;
        
        modalContent.innerHTML = content;
        
        // Apply options
        if (options.maxWidth) {
            modalContent.style.maxWidth = options.maxWidth;
        }
        
        this.modalOverlay.classList.add('show');
        
        // Focus first input if available
        const firstInput = modalContent.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    },
    
    /**
     * Hide modal
     */
    hideModal: function() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('show');
        }
    },
    
    /**
     * Show confirmation dialog
     */
    confirm: function(message, onConfirm, onCancel = null) {
        const content = `
            <div style="text-align: center;">
                <i class="fas fa-question-circle" style="font-size: 3rem; color: var(--status-pending); margin-bottom: 1rem;"></i>
                <h3>Confirm Action</h3>
                <p style="margin: 1rem 0 2rem 0;">${Utils.escapeHTML(message)}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-secondary" onclick="UI.hideModal(); ${onCancel ? onCancel.toString() + '()' : ''}" data-testid="button-cancel">
                        Cancel
                    </button>
                    <button class="btn btn-danger" onclick="UI.hideModal(); (${onConfirm.toString()})()" data-testid="button-confirm">
                        Confirm
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(content);
    },
    
    /**
     * Show prompt dialog
     */
    prompt: function(message, defaultValue = '', onSubmit, onCancel = null) {
        const content = `
            <div>
                <h3>Input Required</h3>
                <p style="margin: 1rem 0;">${Utils.escapeHTML(message)}</p>
                <div style="margin: 1rem 0;">
                    <input type="text" id="prompt-input" value="${Utils.escapeHTML(defaultValue)}" 
                           style="width: 100%; padding: 0.5rem;" data-testid="input-prompt">
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                    <button class="btn btn-secondary" onclick="UI.hideModal(); ${onCancel ? onCancel.toString() + '()' : ''}" data-testid="button-cancel">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="UI.handlePromptSubmit(${onSubmit.toString()})" data-testid="button-submit">
                        Submit
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(content);
        
        // Setup enter key handler
        setTimeout(() => {
            const input = document.getElementById('prompt-input');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handlePromptSubmit(onSubmit);
                    }
                });
            }
        }, 100);
    },
    
    /**
     * Handle prompt submit
     */
    handlePromptSubmit: function(onSubmit) {
        const input = document.getElementById('prompt-input');
        if (input && onSubmit) {
            const value = input.value.trim();
            this.hideModal();
            onSubmit(value);
        }
    },
    
    /**
     * Show/hide global loading
     */
    showGlobalLoading: function(show = true) {
        this.globalLoading = show;
        
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = show ? 'flex' : 'none';
        }
        
        // Update cursor
        document.body.style.cursor = show ? 'wait' : '';
    },
    
    /**
     * Setup user dropdown
     */
    setupUserDropdown: function() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (!userMenuBtn || !userDropdown) return;
        
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
        
        // Setup logout handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirm('Are you sure you want to logout?', () => {
                    Auth.logout();
                });
            });
        }
    },
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals
            if (e.key === 'Escape') {
                this.hideModal();
            }
            
            // Ctrl/Cmd + shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        // Quick search
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case 'n':
                        // New job file
                        if (Router.currentRoute === '/jobs') {
                            e.preventDefault();
                            Router.navigate('/jobs/create');
                        }
                        break;
                }
            }
        });
    },
    
    /**
     * Focus search input
     */
    focusSearch: function() {
        const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="search" i], input[type="search"]');
        if (searchInputs.length > 0) {
            searchInputs[0].focus();
        }
    },
    
    /**
     * Setup form validation
     */
    setupFormValidation: function() {
        // Add real-time validation to forms
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        });
        
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        }, true);
    },
    
    /**
     * Validate form field
     */
    validateField: function(field) {
        const errors = [];
        const value = field.value.trim();
        
        // Required validation
        if (field.required && !value) {
            errors.push('This field is required');
        }
        
        // Email validation
        if (field.type === 'email' && value && !Utils.isValidEmail(value)) {
            errors.push('Please enter a valid email address');
        }
        
        // Number validation
        if (field.type === 'number' && value && isNaN(parseFloat(value))) {
            errors.push('Please enter a valid number');
        }
        
        // Custom validation rules
        const minLength = field.getAttribute('data-min-length');
        if (minLength && value && value.length < parseInt(minLength)) {
            errors.push(`Minimum ${minLength} characters required`);
        }
        
        const maxLength = field.getAttribute('data-max-length');
        if (maxLength && value && value.length > parseInt(maxLength)) {
            errors.push(`Maximum ${maxLength} characters allowed`);
        }
        
        // Update field appearance
        if (errors.length > 0) {
            field.classList.add('error');
            this.showFieldError(field, errors[0]);
        } else {
            field.classList.remove('error');
            this.hideFieldError(field);
        }
        
        return errors.length === 0;
    },
    
    /**
     * Show field error message
     */
    showFieldError: function(field, message) {
        // Remove existing error message
        this.hideFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = 'color: var(--status-rejected); font-size: 0.75rem; margin-top: 0.25rem;';
        errorDiv.textContent = message;
        errorDiv.setAttribute('data-field-error', field.name || field.id);
        
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    },
    
    /**
     * Hide field error message
     */
    hideFieldError: function(field) {
        const errorDiv = field.parentNode.querySelector(`[data-field-error="${field.name || field.id}"]`);
        if (errorDiv) {
            errorDiv.remove();
        }
    },
    
    /**
     * Validate entire form
     */
    validateForm: function(form) {
        let isValid = true;
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    /**
     * Create pagination HTML
     */
    createPagination: function(pagination, onPageChange) {
        const { page, limit, total, pages } = pagination;
        
        if (pages <= 1) return '';
        
        let html = '<div class="pagination">';
        
        // Previous button
        if (page > 1) {
            html += `<button onclick="(${onPageChange.toString()})(${page - 1})" data-testid="button-prev-page">
                <i class="fas fa-chevron-left"></i> Previous
            </button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);
        
        if (startPage > 1) {
            html += `<button onclick="(${onPageChange.toString()})(1)">1</button>`;
            if (startPage > 2) {
                html += '<span>...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === page ? ' active' : '';
            html += `<button class="${activeClass}" onclick="(${onPageChange.toString()})(${i})" data-testid="button-page-${i}">${i}</button>`;
        }
        
        if (endPage < pages) {
            if (endPage < pages - 1) {
                html += '<span>...</span>';
            }
            html += `<button onclick="(${onPageChange.toString()})(${pages})">${pages}</button>`;
        }
        
        // Next button
        if (page < pages) {
            html += `<button onclick="(${onPageChange.toString()})(${page + 1})" data-testid="button-next-page">
                Next <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div>';
        
        // Add page info
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        
        html += `<div style="text-align: center; margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
            Showing ${start}-${end} of ${total} items
        </div>`;
        
        return html;
    },
    
    /**
     * Format table data
     */
    formatTableCell: function(value, type = 'text') {
        if (value === null || value === undefined) {
            return '<span style="color: var(--text-muted);">-</span>';
        }
        
        switch (type) {
            case 'currency':
                return Utils.formatCurrency(value);
            case 'date':
                return Utils.formatDate(value);
            case 'datetime':
                return Utils.formatDate(value, true);
            case 'status':
                return Utils.getStatusBadge(value);
            case 'role':
                return Utils.getRoleBadge(value);
            default:
                return Utils.escapeHTML(value.toString());
        }
    },
    
    /**
     * Show loading state on button
     */
    setButtonLoading: function(button, loading = true, loadingText = 'Loading...') {
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.disabled = false;
            delete button.dataset.originalText;
        }
    },
    
    /**
     * Copy text to clipboard and show feedback
     */
    copyToClipboard: async function(text, successMessage = 'Copied to clipboard') {
        try {
            await Utils.copyToClipboard(text);
            this.showToast(successMessage, 'success', 2000);
        } catch (error) {
            this.showToast('Failed to copy to clipboard', 'error');
        }
    },
    
    /**
     * Animate number counting
     */
    animateCounter: function(element, targetValue, duration = 1000) {
        const startValue = 0;
        const increment = targetValue / (duration / 16); // 60fps
        let currentValue = startValue;
        
        const updateCounter = () => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = targetValue;
            } else {
                element.textContent = Math.floor(currentValue);
                requestAnimationFrame(updateCounter);
            }
        };
        
        updateCounter();
    }
};

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .field-error {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}