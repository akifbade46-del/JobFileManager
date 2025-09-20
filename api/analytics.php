<?php
/**
 * Analytics API
 * Job File Management System
 */

class AnalyticsAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = explode('/', trim($path, '/'));
        $action = $segments[1] ?? 'summary';
        
        if ($method !== 'GET') {
            respond(['error' => 'Method not allowed'], 405);
        }
        
        // Require checker or admin role for analytics
        requireRole(['checker', 'admin']);
        
        switch ($action) {
            case 'summary':
                $this->getSummary();
                break;
            case 'monthly':
                $this->getMonthlyData();
                break;
            case 'status':
                $this->getStatusBreakdown();
                break;
            case 'users':
                $this->getUserStats();
                break;
            case 'clients':
                $this->getClientStats();
                break;
            case 'profit':
                $this->getProfitAnalysis();
                break;
            case 'salesmen':
                $this->getSalesmenStats();
                break;
            case 'product-types':
                $this->getProductTypeBreakdown();
                break;
            case 'completion-time':
                $this->getJobCompletionTime();
                break;
            case 'freight-modes':
                $this->getFreightModeStats();
                break;
            default:
                respond(['error' => 'Invalid analytics endpoint'], 400);
        }
    }
    
    /**
     * Get analytics summary
     */
    public function getSummary() {
        $params = getQueryParams();
        $dateFrom = $params['date_from'] ?? null;
        $dateTo = $params['date_to'] ?? null;
        
        // Build date filter
        $dateFilter = '';
        $dateParams = [];
        
        if ($dateFrom) {
            $dateFilter .= ' AND opening_date >= ?';
            $dateParams[] = $dateFrom;
        }
        
        if ($dateTo) {
            $dateFilter .= ' AND opening_date <= ?';
            $dateParams[] = $dateTo;
        }
        
        // Get basic counts
        $sql = "
            SELECT 
                COUNT(*) as total_jobs,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs,
                SUM(CASE WHEN status = 'checked' THEN 1 ELSE 0 END) as checked_jobs,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_jobs,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_jobs,
                SUM(total_sell) as total_revenue_kwd,
                SUM(total_cost) as total_cost_kwd,
                SUM(total_profit) as total_profit_kwd,
                AVG(total_profit) as avg_profit_kwd
            FROM job_files 
            WHERE 1=1 {$dateFilter}
        ";
        
        $summary = $this->db->fetchOne($sql, $dateParams);
        
        // Get user counts
        $userSql = "SELECT COUNT(*) as total FROM users";
        $userCount = $this->db->fetchOne($userSql);
        
        // Get client counts
        $clientSql = "SELECT COUNT(*) as total FROM clients";
        $clientCount = $this->db->fetchOne($clientSql);
        
        // Calculate profit margin
        $profitMargin = 0;
        if ($summary['total_revenue_kwd'] > 0) {
            $profitMargin = ($summary['total_profit_kwd'] / $summary['total_revenue_kwd']) * 100;
        }
        
        respond([
            'jobs' => [
                'total' => (int)$summary['total_jobs'],
                'pending' => (int)$summary['pending_jobs'],
                'checked' => (int)$summary['checked_jobs'],
                'approved' => (int)$summary['approved_jobs'],
                'rejected' => (int)$summary['rejected_jobs']
            ],
            'financial' => [
                'total_revenue' => formatCurrency($summary['total_revenue_kwd']),
                'total_cost' => formatCurrency($summary['total_cost_kwd']),
                'total_profit' => formatCurrency($summary['total_profit_kwd']),
                'avg_profit' => formatCurrency($summary['avg_profit_kwd']),
                'profit_margin' => round($profitMargin, 2) . '%'
            ],
            'counts' => [
                'users' => (int)$userCount['total'],
                'clients' => (int)$clientCount['total']
            ]
        ]);
    }
    
    /**
     * Get monthly data for charts
     */
    public function getMonthlyData() {
        $params = getQueryParams();
        $year = (int)($params['year'] ?? date('Y'));
        
        $sql = "
            SELECT 
                MONTH(opening_date) as month,
                COUNT(*) as total_jobs,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_jobs,
                SUM(total_sell) as revenue,
                SUM(total_profit) as profit
            FROM job_files 
            WHERE YEAR(opening_date) = ?
            GROUP BY MONTH(opening_date)
            ORDER BY month
        ";
        
        $monthlyData = $this->db->fetchAll($sql, [$year]);
        
        // Fill in missing months
        $months = [];
        for ($i = 1; $i <= 12; $i++) {
            $found = false;
            foreach ($monthlyData as $data) {
                if ((int)$data['month'] === $i) {
                    $months[] = [
                        'month' => $i,
                        'month_name' => date('M', mktime(0, 0, 0, $i, 1)),
                        'total_jobs' => (int)$data['total_jobs'],
                        'approved_jobs' => (int)$data['approved_jobs'],
                        'revenue' => (float)$data['revenue'],
                        'profit' => (float)$data['profit']
                    ];
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                $months[] = [
                    'month' => $i,
                    'month_name' => date('M', mktime(0, 0, 0, $i, 1)),
                    'total_jobs' => 0,
                    'approved_jobs' => 0,
                    'revenue' => 0,
                    'profit' => 0
                ];
            }
        }
        
        respond($months);
    }
    
    /**
     * Get status breakdown
     */
    public function getStatusBreakdown() {
        $sql = "
            SELECT 
                status,
                COUNT(*) as count,
                AVG(CASE WHEN status = 'approved' THEN total_profit ELSE NULL END) as avg_profit
            FROM job_files 
            GROUP BY status
        ";
        
        $statusData = $this->db->fetchAll($sql);
        
        respond($statusData);
    }
    
    /**
     * Get user statistics
     */
    public function getUserStats() {
        requireRole(['admin']); // Admin only
        
        $sql = "
            SELECT 
                u.id,
                u.name,
                u.role,
                COUNT(jf.id) as jobs_created,
                SUM(CASE WHEN jf.status = 'approved' THEN jf.total_profit ELSE 0 END) as total_profit_generated
            FROM users u
            LEFT JOIN job_files jf ON u.id = jf.prepared_by
            GROUP BY u.id, u.name, u.role
            ORDER BY jobs_created DESC
        ";
        
        $userStats = $this->db->fetchAll($sql);
        
        respond($userStats);
    }
    
    /**
     * Get client statistics
     */
    public function getClientStats() {
        $sql = "
            SELECT 
                c.id,
                c.name,
                c.type,
                c.total_jobs,
                SUM(CASE WHEN c.id = jf.shipper_id THEN jf.total_sell ELSE 0 END) as revenue_as_shipper,
                SUM(CASE WHEN c.id = jf.consignee_id THEN jf.total_sell ELSE 0 END) as revenue_as_consignee,
                COUNT(DISTINCT jf.id) as actual_jobs
            FROM clients c
            LEFT JOIN job_files jf ON (c.id = jf.shipper_id OR c.id = jf.consignee_id)
            GROUP BY c.id, c.name, c.type, c.total_jobs
            ORDER BY actual_jobs DESC
        ";
        
        $clientStats = $this->db->fetchAll($sql);
        
        respond($clientStats);
    }
    
    /**
     * Get profit analysis
     */
    public function getProfitAnalysis() {
        $params = getQueryParams();
        $period = $params['period'] ?? '30'; // days
        
        $sql = "
            SELECT 
                DATE(opening_date) as date,
                COUNT(*) as jobs,
                SUM(total_profit) as daily_profit,
                AVG(total_profit) as avg_profit_per_job
            FROM job_files 
            WHERE opening_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status = 'approved'
            GROUP BY DATE(opening_date)
            ORDER BY date DESC
        ";
        
        $profitData = $this->db->fetchAll($sql, [$period]);
        
        // Calculate trends
        $totalProfit = array_sum(array_column($profitData, 'daily_profit'));
        $avgDailyProfit = count($profitData) > 0 ? $totalProfit / count($profitData) : 0;
        
        respond([
            'daily_data' => $profitData,
            'summary' => [
                'total_profit_kwd' => formatCurrency($totalProfit),
                'avg_daily_profit_kwd' => formatCurrency($avgDailyProfit),
                'period_days' => (int)$period
            ]
        ]);
    }
    
    /**
     * Get salesmen statistics
     */
    public function getSalesmenStats() {
        $params = getQueryParams();
        $dateFrom = $params['date_from'] ?? null;
        $dateTo = $params['date_to'] ?? null;
        
        // Build date filter
        $dateFilter = '';
        $dateParams = [];
        
        if ($dateFrom) {
            $dateFilter .= ' AND opening_date >= ?';
            $dateParams[] = $dateFrom;
        }
        
        if ($dateTo) {
            $dateFilter .= ' AND opening_date <= ?';
            $dateParams[] = $dateTo;
        }
        
        // Note: Using notes field to simulate salesman data since it's not in the current schema
        // In a real implementation, you'd add a salesman field to the job_files table
        $sql = "
            SELECT 
                COALESCE(
                    SUBSTRING_INDEX(SUBSTRING_INDEX(notes, 'Salesman:', -1), '\n', 1),
                    'No Salesman'
                ) as salesman_name,
                COUNT(*) as total_jobs,
                SUM(total_sell) as total_revenue,
                SUM(total_profit) as total_profit,
                AVG(total_profit) as avg_profit_per_job
            FROM job_files 
            WHERE status = 'approved' {$dateFilter}
            GROUP BY salesman_name
            ORDER BY total_profit DESC
            LIMIT 20
        ";
        
        $salesmenData = $this->db->fetchAll($sql, $dateParams);
        
        respond($salesmenData);
    }
    
    /**
     * Get product type breakdown
     */
    public function getProductTypeBreakdown() {
        $params = getQueryParams();
        $dateFrom = $params['date_from'] ?? null;
        $dateTo = $params['date_to'] ?? null;
        
        // Build date filter
        $dateFilter = '';
        $dateParams = [];
        
        if ($dateFrom) {
            $dateFilter .= ' AND opening_date >= ?';
            $dateParams[] = $dateFrom;
        }
        
        if ($dateTo) {
            $dateFilter .= ' AND opening_date <= ?';
            $dateParams[] = $dateTo;
        }
        
        // Note: Using description field to extract product type information
        // In a real implementation, you'd add product_type field to the job_files table
        $sql = "
            SELECT 
                CASE 
                    WHEN LOWER(description) LIKE '%air%' OR LOWER(description) LIKE '%flight%' THEN 'Air Freight'
                    WHEN LOWER(description) LIKE '%sea%' OR LOWER(description) LIKE '%ocean%' OR LOWER(description) LIKE '%ship%' THEN 'Sea Freight'
                    WHEN LOWER(description) LIKE '%land%' OR LOWER(description) LIKE '%truck%' OR LOWER(description) LIKE '%road%' THEN 'Land Freight'
                    ELSE 'Others'
                END as product_type,
                COUNT(*) as total_jobs,
                SUM(total_sell) as total_revenue,
                SUM(total_profit) as total_profit,
                AVG(total_profit) as avg_profit_per_job
            FROM job_files 
            WHERE status = 'approved' {$dateFilter}
            GROUP BY product_type
            ORDER BY total_profit DESC
        ";
        
        $productData = $this->db->fetchAll($sql, $dateParams);
        
        respond($productData);
    }
    
    /**
     * Get average job completion time
     */
    public function getJobCompletionTime() {
        $params = getQueryParams();
        $dateFrom = $params['date_from'] ?? null;
        $dateTo = $params['date_to'] ?? null;
        
        // Build date filter
        $dateFilter = '';
        $dateParams = [];
        
        if ($dateFrom) {
            $dateFilter .= ' AND opening_date >= ?';
            $dateParams[] = $dateFrom;
        }
        
        if ($dateTo) {
            $dateFilter .= ' AND opening_date <= ?';
            $dateParams[] = $dateTo;
        }
        
        $sql = "
            SELECT 
                AVG(DATEDIFF(
                    COALESCE(approved_at, rejected_at, checked_at, updated_at),
                    opening_date
                )) as avg_completion_days,
                COUNT(*) as total_completed_jobs,
                MIN(DATEDIFF(
                    COALESCE(approved_at, rejected_at, checked_at, updated_at),
                    opening_date
                )) as fastest_completion_days,
                MAX(DATEDIFF(
                    COALESCE(approved_at, rejected_at, checked_at, updated_at),
                    opening_date
                )) as slowest_completion_days
            FROM job_files 
            WHERE status IN ('approved', 'rejected') {$dateFilter}
            AND (approved_at IS NOT NULL OR rejected_at IS NOT NULL)
        ";
        
        $completionData = $this->db->fetchOne($sql, $dateParams);
        
        respond([
            'avg_completion_days' => round($completionData['avg_completion_days'] ?? 0, 1),
            'total_completed_jobs' => (int)($completionData['total_completed_jobs'] ?? 0),
            'fastest_completion_days' => (int)($completionData['fastest_completion_days'] ?? 0),
            'slowest_completion_days' => (int)($completionData['slowest_completion_days'] ?? 0)
        ]);
    }
    
    /**
     * Get freight mode statistics (simulated from vessel/transportation data)
     */
    public function getFreightModeStats() {
        $params = getQueryParams();
        $dateFrom = $params['date_from'] ?? null;
        $dateTo = $params['date_to'] ?? null;
        
        // Build date filter
        $dateFilter = '';
        $dateParams = [];
        
        if ($dateFrom) {
            $dateFilter .= ' AND opening_date >= ?';
            $dateParams[] = $dateFrom;
        }
        
        if ($dateTo) {
            $dateFilter .= ' AND opening_date <= ?';
            $dateParams[] = $dateTo;
        }
        
        $sql = "
            SELECT 
                CASE 
                    WHEN vessel IS NOT NULL AND vessel != '' THEN 'Sea Freight'
                    WHEN pol IS NOT NULL AND pod IS NOT NULL THEN 'Air Freight'
                    ELSE 'Land Freight'
                END as freight_mode,
                COUNT(*) as total_jobs,
                SUM(total_sell) as total_revenue,
                SUM(total_profit) as total_profit
            FROM job_files 
            WHERE status = 'approved' {$dateFilter}
            GROUP BY freight_mode
            ORDER BY total_profit DESC
        ";
        
        $freightData = $this->db->fetchAll($sql, $dateParams);
        
        respond($freightData);
    }
}
?>