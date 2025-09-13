/**
 * Analytics and Reporting
 * Job File Management System - HTML/JavaScript Edition
 */

window.Analytics = {
    
    // Chart instances (if using Chart.js)
    charts: {},
    
    /**
     * Initialize analytics page
     */
    init: function() {
        this.renderAnalyticsPage();
        this.loadAnalyticsData();
    },
    
    /**
     * Render analytics page
     */
    renderAnalyticsPage: function() {
        const content = `
            <div class="analytics-page">
                <div class="page-header">
                    <h1>Analytics & Reports</h1>
                    <div class="page-actions">
                        <select id="analytics-period" data-testid="select-analytics-period">
                            <option value="7">Last 7 days</option>
                            <option value="30" selected>Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                            <option value="all">All time</option>
                        </select>
                        <button class="btn btn-secondary" onclick="Analytics.exportData()" data-testid="button-export-analytics">
                            <i class="fas fa-download"></i>
                            Export Report
                        </button>
                    </div>
                </div>
                
                <!-- Summary Stats -->
                <div class="stats-grid" id="analytics-stats">
                    <!-- Dynamic stats -->
                </div>
                
                <!-- Charts Section -->
                <div class="analytics-section">
                    <div class="analytics-grid">
                        <!-- Jobs Overview Chart -->
                        <div class="chart-card">
                            <h3>Job Files Status Overview</h3>
                            <div class="chart-container">
                                <div id="status-chart" class="chart-placeholder">
                                    <div id="status-chart-data"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Monthly Trends Chart -->
                        <div class="chart-card">
                            <h3>Monthly Performance</h3>
                            <div class="chart-container">
                                <div id="monthly-chart" class="chart-placeholder">
                                    <div id="monthly-chart-data"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Profit Analysis -->
                        <div class="chart-card">
                            <h3>Profit Analysis</h3>
                            <div class="chart-container">
                                <div id="profit-chart" class="chart-placeholder">
                                    <div id="profit-chart-data"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Top Clients -->
                        <div class="chart-card">
                            <h3>Top Performing Clients</h3>
                            <div class="chart-container">
                                <div id="clients-list" class="clients-analytics">
                                    <!-- Dynamic content -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Detailed Tables -->
                <div class="analytics-section">
                    <h2>Detailed Reports</h2>
                    <div class="analytics-tabs">
                        <button class="tab-btn active" onclick="Analytics.showTab('jobs-report')" data-testid="tab-jobs-report">
                            Job Files Report
                        </button>
                        <button class="tab-btn" onclick="Analytics.showTab('clients-report')" data-testid="tab-clients-report">
                            Clients Report
                        </button>
                        <button class="tab-btn" onclick="Analytics.showTab('users-report')" data-testid="tab-users-report">
                            Users Report
                        </button>
                    </div>
                    
                    <div id="jobs-report" class="tab-content active">
                        <div id="jobs-report-table"></div>
                    </div>
                    
                    <div id="clients-report" class="tab-content">
                        <div id="clients-report-table"></div>
                    </div>
                    
                    <div id="users-report" class="tab-content">
                        <div id="users-report-table"></div>
                    </div>
                </div>
            </div>
        `;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        const periodSelect = document.getElementById('analytics-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.loadAnalyticsData(e.target.value);
            });
        }
    },
    
    /**
     * Load analytics data
     */
    loadAnalyticsData: async function(period = '30') {
        try {
            // Load summary data
            const params = period !== 'all' ? { 
                date_from: this.getDateFromPeriod(period) 
            } : {};
            
            const [summary, monthly, status, clients, users] = await Promise.all([
                API.analytics.getSummary(params),
                API.analytics.getMonthlyData(new Date().getFullYear()),
                API.analytics.getStatusBreakdown(),
                API.analytics.getClientStats(),
                Auth.hasRole('admin') ? API.analytics.getUserStats() : Promise.resolve([])
            ]);
            
            // Render all components
            this.renderSummaryStats(summary);
            this.renderStatusChart(status);
            this.renderMonthlyChart(monthly);
            this.renderProfitAnalysis(summary);
            this.renderTopClients(clients);
            this.renderJobsReport();
            this.renderClientsReport(clients);
            
            if (Auth.hasRole('admin')) {
                this.renderUsersReport(users);
            }
            
        } catch (error) {
            console.error('Load analytics data error:', error);
            UI.showToast('Failed to load analytics data', 'error');
        }
    },
    
    /**
     * Get date from period
     */
    getDateFromPeriod: function(days) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(days));
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Render summary statistics
     */
    renderSummaryStats: function(summary) {
        const statsContainer = document.getElementById('analytics-stats');
        if (!statsContainer) return;
        
        const statsHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--primary);">
                    <i class="fas fa-file-lines"></i>
                </div>
                <div class="stat-content">
                    <h3>${summary.jobs.total}</h3>
                    <p>Total Job Files</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" status="background: var(--status-approved);">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-content">
                    <h3>${summary.jobs.approved}</h3>
                    <p>Approved Jobs</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--accent);">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="stat-content">
                    <h3>${summary.financial.total_revenue}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--status-approved);">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-content">
                    <h3>${summary.financial.total_profit}</h3>
                    <p>Total Profit</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--secondary);">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stat-content">
                    <h3>${summary.financial.profit_margin}</h3>
                    <p>Profit Margin</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: var(--status-pending);">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                    <h3>${summary.jobs.pending}</h3>
                    <p>Pending Jobs</p>
                </div>
            </div>
        `;
        
        statsContainer.innerHTML = statsHTML;
    },
    
    /**
     * Render status chart (simple HTML version)
     */
    renderStatusChart: function(statusData) {
        const container = document.getElementById('status-chart-data');
        if (!container) return;
        
        const total = statusData.reduce((sum, item) => sum + parseInt(item.count), 0);
        
        if (total === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No data available</p>';
            return;
        }
        
        const chartHTML = statusData.map(item => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            const colors = {
                pending: 'var(--status-pending)',
                checked: 'var(--status-checked)',
                approved: 'var(--status-approved)',
                rejected: 'var(--status-rejected)'
            };
            
            return `
                <div class="status-bar" style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>${Utils.capitalize(item.status)}</span>
                        <span>${item.count} (${percentage}%)</span>
                    </div>
                    <div style="background: var(--bg-muted); height: 20px; border-radius: 10px; overflow: hidden;">
                        <div style="background: ${colors[item.status]}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = chartHTML;
    },
    
    /**
     * Render monthly chart (simple HTML version)
     */
    renderMonthlyChart: function(monthlyData) {
        const container = document.getElementById('monthly-chart-data');
        if (!container) return;
        
        if (!monthlyData || monthlyData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No data available</p>';
            return;
        }
        
        const maxJobs = Math.max(...monthlyData.map(m => m.total_jobs));
        const maxRevenue = Math.max(...monthlyData.map(m => m.revenue));
        
        const chartHTML = `
            <div style="overflow-x: auto;">
                <div style="display: flex; gap: 1rem; min-width: 600px; align-items: end; height: 200px; padding: 1rem;">
                    ${monthlyData.map(month => {
                        const jobHeight = maxJobs > 0 ? (month.total_jobs / maxJobs) * 150 : 0;
                        const revenueHeight = maxRevenue > 0 ? (month.revenue / maxRevenue) * 150 : 0;
                        
                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                <div style="display: flex; gap: 2px; height: 160px; align-items: end;">
                                    <div style="background: var(--primary); width: 15px; height: ${jobHeight}px; border-radius: 2px;" title="Jobs: ${month.total_jobs}"></div>
                                    <div style="background: var(--accent); width: 15px; height: ${revenueHeight}px; border-radius: 2px;" title="Revenue: ${Utils.formatCurrency(month.revenue)}"></div>
                                </div>
                                <div style="margin-top: 0.5rem; font-size: 0.75rem; text-align: center;">
                                    ${month.month_name}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; font-size: 0.875rem;">
                    <div><span style="display: inline-block; width: 15px; height: 15px; background: var(--primary); margin-right: 0.5rem;"></span>Jobs</div>
                    <div><span style="display: inline-block; width: 15px; height: 15px; background: var(--accent); margin-right: 0.5rem;"></span>Revenue</div>
                </div>
            </div>
        `;
        
        container.innerHTML = chartHTML;
    },
    
    /**
     * Render profit analysis
     */
    renderProfitAnalysis: function(summary) {
        const container = document.getElementById('profit-chart-data');
        if (!container) return;
        
        const totalRevenue = Utils.parseCurrency(summary.financial.total_revenue);
        const totalCost = Utils.parseCurrency(summary.financial.total_cost);
        const totalProfit = Utils.parseCurrency(summary.financial.total_profit);
        
        if (totalRevenue === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No financial data available</p>';
            return;
        }
        
        const profitMargin = ((totalProfit / totalRevenue) * 100);
        const costRatio = ((totalCost / totalRevenue) * 100);
        
        const chartHTML = `
            <div class="profit-breakdown">
                <div class="profit-item" style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span><strong>Total Revenue</strong></span>
                        <span><strong>${summary.financial.total_revenue}</strong></span>
                    </div>
                    <div style="background: var(--bg-muted); height: 30px; border-radius: 15px; position: relative; overflow: hidden;">
                        <div style="background: var(--primary); height: 100%; width: 100%;"></div>
                        <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: 600;">100%</span>
                    </div>
                </div>
                
                <div class="profit-item" style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Total Cost</span>
                        <span>${summary.financial.total_cost}</span>
                    </div>
                    <div style="background: var(--bg-muted); height: 25px; border-radius: 12px; position: relative; overflow: hidden;">
                        <div style="background: var(--status-rejected); height: 100%; width: ${costRatio}%;"></div>
                        <span style="position: absolute; top: 50%; right: 0.5rem; transform: translateY(-50%); font-size: 0.75rem; font-weight: 600;">${costRatio.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div class="profit-item">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span><strong>Net Profit</strong></span>
                        <span style="color: ${totalProfit >= 0 ? 'var(--status-approved)' : 'var(--status-rejected)'};">
                            <strong>${summary.financial.total_profit}</strong>
                        </span>
                    </div>
                    <div style="background: var(--bg-muted); height: 25px; border-radius: 12px; position: relative; overflow: hidden;">
                        <div style="background: ${totalProfit >= 0 ? 'var(--status-approved)' : 'var(--status-rejected)'}; height: 100%; width: ${Math.abs(profitMargin)}%;"></div>
                        <span style="position: absolute; top: 50%; right: 0.5rem; transform: translateY(-50%); font-size: 0.75rem; font-weight: 600;">${profitMargin.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = chartHTML;
    },
    
    /**
     * Render top clients
     */
    renderTopClients: function(clientsData) {
        const container = document.getElementById('clients-list');
        if (!container) return;
        
        if (!clientsData || clientsData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No client data available</p>';
            return;
        }
        
        // Sort by total jobs and take top 5
        const topClients = clientsData
            .sort((a, b) => b.actual_jobs - a.actual_jobs)
            .slice(0, 5);
        
        const maxJobs = Math.max(...topClients.map(c => c.actual_jobs));
        
        const clientsHTML = topClients.map(client => {
            const percentage = maxJobs > 0 ? (client.actual_jobs / maxJobs) * 100 : 0;
            const totalRevenue = parseFloat(client.revenue_as_shipper || 0) + parseFloat(client.revenue_as_consignee || 0);
            
            return `
                <div class="client-item" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong>${Utils.escapeHTML(client.name)}</strong>
                        <span class="badge">${client.actual_jobs} jobs</span>
                    </div>
                    <div style="background: var(--bg-muted); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--primary); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                        Total Revenue: ${Utils.formatCurrency(totalRevenue)}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = clientsHTML;
    },
    
    /**
     * Show analytics tab
     */
    showTab: function(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab
        const selectedBtn = document.querySelector(`[onclick="Analytics.showTab('${tabId}')"]`);
        if (selectedBtn) selectedBtn.classList.add('active');
        
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) selectedContent.classList.add('active');
    },
    
    /**
     * Render jobs report
     */
    renderJobsReport: async function() {
        const container = document.getElementById('jobs-report-table');
        if (!container) return;
        
        try {
            const jobs = await API.jobs.getAll({ limit: 50 });
            
            const tableHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Job File No.</th>
                            <th>Opening Date</th>
                            <th>Status</th>
                            <th>Revenue (KWD)</th>
                            <th>Profit (KWD)</th>
                            <th>Margin %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jobs.data.map(job => {
                            const margin = job.total_sell > 0 ? ((job.total_profit / job.total_sell) * 100).toFixed(1) : 0;
                            
                            return `
                                <tr>
                                    <td><strong>${Utils.escapeHTML(job.job_file_no)}</strong></td>
                                    <td>${Utils.formatDate(job.opening_date)}</td>
                                    <td>${Utils.getStatusBadge(job.status)}</td>
                                    <td>${Utils.formatCurrency(job.total_sell)}</td>
                                    <td style="color: ${job.total_profit >= 0 ? 'var(--status-approved)' : 'var(--status-rejected)'};">
                                        ${Utils.formatCurrency(job.total_profit)}
                                    </td>
                                    <td>${margin}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
            
            container.innerHTML = tableHTML;
            
        } catch (error) {
            console.error('Load jobs report error:', error);
            container.innerHTML = '<p style="text-align: center; color: var(--status-rejected);">Failed to load jobs report</p>';
        }
    },
    
    /**
     * Render clients report
     */
    renderClientsReport: function(clientsData) {
        const container = document.getElementById('clients-report-table');
        if (!container) return;
        
        if (!clientsData || clientsData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No client data available</p>';
            return;
        }
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Client Name</th>
                        <th>Type</th>
                        <th>Total Jobs</th>
                        <th>As Shipper (KWD)</th>
                        <th>As Consignee (KWD)</th>
                        <th>Total Revenue (KWD)</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientsData.map(client => {
                        const totalRevenue = parseFloat(client.revenue_as_shipper || 0) + parseFloat(client.revenue_as_consignee || 0);
                        
                        return `
                            <tr>
                                <td><strong>${Utils.escapeHTML(client.name)}</strong></td>
                                <td>${Utils.capitalize(client.type)}</td>
                                <td>${client.actual_jobs || 0}</td>
                                <td>${Utils.formatCurrency(client.revenue_as_shipper || 0)}</td>
                                <td>${Utils.formatCurrency(client.revenue_as_consignee || 0)}</td>
                                <td><strong>${Utils.formatCurrency(totalRevenue)}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    /**
     * Render users report (admin only)
     */
    renderUsersReport: function(usersData) {
        const container = document.getElementById('users-report-table');
        if (!container) return;
        
        if (!usersData || usersData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No user data available</p>';
            return;
        }
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th>Role</th>
                        <th>Jobs Created</th>
                        <th>Total Profit Generated (KWD)</th>
                        <th>Avg Profit per Job (KWD)</th>
                    </tr>
                </thead>
                <tbody>
                    ${usersData.map(user => {
                        const avgProfit = user.jobs_created > 0 ? (user.total_profit_generated / user.jobs_created) : 0;
                        
                        return `
                            <tr>
                                <td><strong>${Utils.escapeHTML(user.name)}</strong></td>
                                <td>${Utils.getRoleBadge(user.role)}</td>
                                <td>${user.jobs_created || 0}</td>
                                <td>${Utils.formatCurrency(user.total_profit_generated || 0)}</td>
                                <td>${Utils.formatCurrency(avgProfit)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    /**
     * Export analytics data
     */
    exportData: function() {
        UI.showToast('Export functionality coming soon...', 'info');
    }
};

// Add CSS for analytics
const analyticsStyle = document.createElement('style');
analyticsStyle.textContent = `
    .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
    }
    
    .chart-card {
        background: var(--bg-primary);
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-light);
        box-shadow: var(--shadow-sm);
    }
    
    .chart-card h3 {
        margin: 0 0 1.5rem 0;
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .chart-container {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .chart-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .analytics-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--border-light);
    }
    
    .tab-btn {
        background: none;
        border: none;
        padding: 1rem 1.5rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-weight: 500;
    }
    
    .tab-btn:hover {
        background: var(--bg-muted);
    }
    
    .tab-btn.active {
        border-bottom-color: var(--primary);
        color: var(--primary);
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .analytics-section {
        margin: 3rem 0;
    }
    
    .analytics-section h2 {
        margin-bottom: 2rem;
        color: var(--text-primary);
    }
`;
document.head.appendChild(analyticsStyle);

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}