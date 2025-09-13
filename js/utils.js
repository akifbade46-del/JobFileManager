/**
 * Utility Functions
 * Job File Management System - HTML/JavaScript Edition
 */

// Global utilities object
window.Utils = {
    
    /**
     * Format currency amount for KWD
     */
    formatCurrency: function(amount, decimals = 3) {
        if (amount === null || amount === undefined) return '0.000 KWD';
        const num = parseFloat(amount) || 0;
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + ' KWD';
    },
    
    /**
     * Parse currency input (remove KWD and formatting)
     */
    parseCurrency: function(value) {
        if (!value) return 0;
        return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
    },
    
    /**
     * Format date for display
     */
    formatDate: function(date, includeTime = false) {
        if (!date) return '-';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
        }
        
        return d.toLocaleDateString('en-US', options);
    },
    
    /**
     * Format date for input fields
     */
    formatDateForInput: function(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        // Format: YYYY-MM-DDTHH:MM
        return d.toISOString().slice(0, 16);
    },
    
    /**
     * Get current date/time for input
     */
    getCurrentDateTime: function() {
        return new Date().toISOString().slice(0, 16);
    },
    
    /**
     * Debounce function calls
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML: function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    /**
     * Escape HTML entities
     */
    escapeHTML: function(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    
    /**
     * Generate random ID
     */
    generateId: function() {
        return Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Deep clone object
     */
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Check if email is valid
     */
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Capitalize first letter
     */
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    /**
     * Get status badge HTML
     */
    getStatusBadge: function(status) {
        const badges = {
            pending: '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>',
            checked: '<span class="status-badge status-checked"><i class="fas fa-eye"></i> Checked</span>',
            approved: '<span class="status-badge status-approved"><i class="fas fa-check-circle"></i> Approved</span>',
            rejected: '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Rejected</span>'
        };
        
        return badges[status] || `<span class="status-badge">${status}</span>`;
    },
    
    /**
     * Get role badge HTML
     */
    getRoleBadge: function(role) {
        const badges = {
            admin: '<span class="badge bg-danger">Admin</span>',
            checker: '<span class="badge bg-info">Checker</span>',
            user: '<span class="badge bg-secondary">User</span>'
        };
        
        return badges[role] || `<span class="badge">${role}</span>`;
    },
    
    /**
     * Show loading state on element
     */
    showLoading: function(element, show = true) {
        if (show) {
            element.classList.add('loading');
            element.style.pointerEvents = 'none';
        } else {
            element.classList.remove('loading');
            element.style.pointerEvents = '';
        }
    },
    
    /**
     * Get query parameters from URL hash
     */
    getQueryParams: function() {
        const hash = window.location.hash;
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryString);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    },
    
    /**
     * Set query parameters in URL hash
     */
    setQueryParams: function(params) {
        const currentHash = window.location.hash.split('?')[0];
        const queryString = new URLSearchParams(params).toString();
        const newHash = queryString ? `${currentHash}?${queryString}` : currentHash;
        
        history.replaceState(null, '', newHash);
    },
    
    /**
     * Copy text to clipboard
     */
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    },
    
    /**
     * Download data as file
     */
    downloadFile: function(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },
    
    /**
     * Parse CSV data
     */
    parseCSV: function(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
        
        return { headers, data };
    },
    
    /**
     * Convert data to CSV
     */
    convertToCSV: function(data, headers = null) {
        if (!data || !data.length) return '';
        
        const keys = headers || Object.keys(data[0]);
        const csvContent = [
            keys.join(','),
            ...data.map(row => 
                keys.map(key => {
                    const value = row[key] || '';
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');
        
        return csvContent;
    },
    
    /**
     * Storage helpers
     */
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Failed to read from localStorage:', e);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('Failed to remove from localStorage:', e);
            }
        },
        
        clear: function() {
            try {
                localStorage.clear();
            } catch (e) {
                console.warn('Failed to clear localStorage:', e);
            }
        }
    },
    
    /**
     * Validation helpers
     */
    validate: {
        required: function(value, message = 'This field is required') {
            return value && value.toString().trim() ? null : message;
        },
        
        email: function(value, message = 'Please enter a valid email address') {
            return !value || Utils.isValidEmail(value) ? null : message;
        },
        
        minLength: function(value, min, message = `Minimum ${min} characters required`) {
            return !value || value.length >= min ? null : message;
        },
        
        maxLength: function(value, max, message = `Maximum ${max} characters allowed`) {
            return !value || value.length <= max ? null : message;
        },
        
        number: function(value, message = 'Please enter a valid number') {
            return !value || !isNaN(parseFloat(value)) ? null : message;
        },
        
        positiveNumber: function(value, message = 'Please enter a positive number') {
            const num = parseFloat(value);
            return !value || (!isNaN(num) && num > 0) ? null : message;
        }
    }
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}