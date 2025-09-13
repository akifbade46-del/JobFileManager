<?php
/**
 * Activity Logs API
 * Job File Management System
 */

class ActivityAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = explode('/', trim($path, '/'));
        
        if ($method !== 'GET') {
            respond(['error' => 'Method not allowed'], 405);
        }
        
        // Require checker or admin role for activity logs
        requireRole(['checker', 'admin']);
        
        $this->getActivityLogs();
    }
    
    /**
     * Get activity logs with filtering
     */
    public function getActivityLogs() {
        $params = getQueryParams();
        $jobFileId = $params['job_file_id'] ?? null;
        $userId = $params['user_id'] ?? null;
        $action = $params['action'] ?? null;
        $dateFrom = $params['date_from'] ?? null;
        $dateTo = $params['date_to'] ?? null;
        $page = (int)($params['page'] ?? 1);
        $limit = min((int)($params['limit'] ?? 50), 100);
        
        // Build WHERE clause
        $whereConditions = [];
        $queryParams = [];
        
        if ($jobFileId) {
            $whereConditions[] = "al.job_file_id = ?";
            $queryParams[] = $jobFileId;
        }
        
        if ($userId) {
            $whereConditions[] = "al.user_id = ?";
            $queryParams[] = $userId;
        }
        
        if ($action) {
            $whereConditions[] = "al.action = ?";
            $queryParams[] = $action;
        }
        
        if ($dateFrom) {
            $whereConditions[] = "DATE(al.timestamp) >= ?";
            $queryParams[] = $dateFrom;
        }
        
        if ($dateTo) {
            $whereConditions[] = "DATE(al.timestamp) <= ?";
            $queryParams[] = $dateTo;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        $sql = "
            SELECT 
                al.*,
                u.name as user_name,
                u.role as user_role,
                jf.job_file_no
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN job_files jf ON al.job_file_id = jf.id
            {$whereClause}
            ORDER BY al.timestamp DESC
        ";
        
        $result = paginate($sql, $queryParams, $page, $limit);
        
        // Add formatted timestamps and action descriptions
        foreach ($result['data'] as &$log) {
            $log['formatted_timestamp'] = date('M d, Y H:i:s', strtotime($log['timestamp']));
            $log['action_description'] = $this->getActionDescription($log);
        }
        
        respond($result);
    }
    
    /**
     * Get action description for display
     */
    private function getActionDescription($log) {
        $userName = $log['user_name'] ?? 'Unknown User';
        $jobFileNo = $log['job_file_no'] ?? 'Unknown Job';
        
        switch ($log['action']) {
            case 'created':
                return "{$userName} created job file {$jobFileNo}";
                
            case 'updated':
                return "{$userName} updated job file {$jobFileNo}";
                
            case 'checked':
                return "{$userName} checked job file {$jobFileNo}";
                
            case 'approved':
                return "{$userName} approved job file {$jobFileNo}";
                
            case 'rejected':
                $reason = $log['details'] ? " (Reason: {$log['details']})" : '';
                return "{$userName} rejected job file {$jobFileNo}{$reason}";
                
            case 'status_changed':
                $from = $log['old_status'] ?? 'unknown';
                $to = $log['new_status'] ?? 'unknown';
                return "{$userName} changed status of {$jobFileNo} from {$from} to {$to}";
                
            default:
                return "{$userName} performed {$log['action']} on {$jobFileNo}";
        }
    }
}
?>