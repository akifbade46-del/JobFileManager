<?php
/**
 * Users API (Admin Management)
 * Job File Management System
 */

class UsersAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = array_filter(explode('/', $path));
        $id = $segments[1] ?? null;
        
        // All user management requires admin role
        requireRole(['admin']);
        
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getUser($id);
                } else {
                    $this->getAllUsers();
                }
                break;
                
            case 'PUT':
                if ($id) {
                    $this->updateUser($id);
                } else {
                    respond(['error' => 'ID required for update'], 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $this->deleteUser($id);
                } else {
                    respond(['error' => 'ID required for delete'], 400);
                }
                break;
                
            default:
                respond(['error' => 'Method not allowed'], 405);
        }
    }
    
    /**
     * Get all users
     */
    public function getAllUsers() {
        $params = getQueryParams();
        $role = $params['role'] ?? null;
        $status = $params['status'] ?? null;
        $search = $params['search'] ?? null;
        $page = (int)($params['page'] ?? 1);
        $limit = min((int)($params['limit'] ?? 20), 100);
        
        // Build WHERE clause
        $whereConditions = [];
        $queryParams = [];
        
        if ($role && $role !== 'all') {
            $whereConditions[] = "role = ?";
            $queryParams[] = $role;
        }
        
        if ($status && $status !== 'all') {
            $whereConditions[] = "status = ?";
            $queryParams[] = $status;
        }
        
        if ($search) {
            $whereConditions[] = "(name LIKE ? OR email LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        $sql = "
            SELECT 
                id, name, email, role, status, created_at, updated_at,
                (SELECT COUNT(*) FROM job_files WHERE prepared_by = users.id) as jobs_created
            FROM users 
            {$whereClause}
            ORDER BY created_at DESC
        ";
        
        $result = paginate($sql, $queryParams, $page, $limit);
        respond($result);
    }
    
    /**
     * Get single user
     */
    public function getUser($id) {
        $sql = "
            SELECT 
                u.id, u.name, u.email, u.role, u.status, u.created_at, u.updated_at,
                COUNT(jf.id) as jobs_created,
                SUM(CASE WHEN jf.status = 'approved' THEN jf.total_profit ELSE 0 END) as total_profit_generated
            FROM users u
            LEFT JOIN job_files jf ON u.id = jf.prepared_by
            WHERE u.id = ?
            GROUP BY u.id
        ";
        
        $user = $this->db->fetchOne($sql, [$id]);
        
        if (!$user) {
            respond(['error' => 'User not found'], 404);
        }
        
        // Get recent activity
        $activitySql = "
            SELECT al.*, jf.job_file_no 
            FROM activity_logs al
            LEFT JOIN job_files jf ON al.job_file_id = jf.id
            WHERE al.user_id = ?
            ORDER BY al.timestamp DESC
            LIMIT 10
        ";
        
        $activity = $this->db->fetchAll($activitySql, [$id]);
        $user['recent_activity'] = $activity;
        
        respond($user);
    }
    
    /**
     * Update user (role and status)
     */
    public function updateUser($id) {
        // Prevent admin from updating themselves
        if ($id == $_SESSION['user_id']) {
            respond(['error' => 'Cannot update your own account'], 400);
        }
        
        $user = $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$id]);
        if (!$user) {
            respond(['error' => 'User not found'], 404);
        }
        
        $data = getRequestBody();
        
        // Build update query
        $updateFields = [];
        $updateParams = [];
        
        $allowedFields = ['name', 'email', 'role', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $value = sanitizeInput($data[$field]);
                
                // Validate email if provided
                if ($field === 'email' && !isValidEmail($value)) {
                    respond(['error' => 'Invalid email format'], 400);
                }
                
                // Validate role
                if ($field === 'role' && !in_array($value, ['admin', 'checker', 'user'])) {
                    respond(['error' => 'Invalid role'], 400);
                }
                
                // Validate status
                if ($field === 'status' && !in_array($value, ['active', 'pending', 'blocked'])) {
                    respond(['error' => 'Invalid status'], 400);
                }
                
                $updateFields[] = "{$field} = ?";
                $updateParams[] = $value;
            }
        }
        
        // Update password if provided
        if (isset($data['password']) && !empty($data['password'])) {
            if (strlen($data['password']) < 6) {
                respond(['error' => 'Password must be at least 6 characters'], 400);
            }
            
            $updateFields[] = "password = ?";
            $updateParams[] = hashPassword($data['password']);
        }
        
        if (empty($updateFields)) {
            respond(['error' => 'No fields to update'], 400);
        }
        
        try {
            $updateParams[] = $id;
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
            $this->db->execute($sql, $updateParams);
            
            // Get updated user (without password)
            $sql = "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?";
            $updatedUser = $this->db->fetchOne($sql, [$id]);
            
            respond([
                'success' => true,
                'user' => $updatedUser
            ]);
            
        } catch (PDOException $e) {
            if ($e->errorInfo[1] == 1062) { // Duplicate entry
                respond(['error' => 'Email already exists'], 400);
            }
            
            error_log("Update user error: " . $e->getMessage());
            respond(['error' => 'Failed to update user'], 500);
        }
    }
    
    /**
     * Delete user (admin only)
     */
    public function deleteUser($id) {
        // Prevent admin from deleting themselves
        if ($id == $_SESSION['user_id']) {
            respond(['error' => 'Cannot delete your own account'], 400);
        }
        
        $user = $this->db->fetchOne("SELECT name FROM users WHERE id = ?", [$id]);
        if (!$user) {
            respond(['error' => 'User not found'], 404);
        }
        
        // Check if user has job files
        $sql = "SELECT COUNT(*) as count FROM job_files WHERE prepared_by = ?";
        $jobCount = $this->db->fetchOne($sql, [$id]);
        
        if ($jobCount['count'] > 0) {
            respond(['error' => 'Cannot delete user who has created job files'], 400);
        }
        
        try {
            $this->db->execute("DELETE FROM users WHERE id = ?", [$id]);
            respond(['success' => true, 'message' => 'User deleted successfully']);
            
        } catch (Exception $e) {
            error_log("Delete user error: " . $e->getMessage());
            respond(['error' => 'Failed to delete user'], 500);
        }
    }
}
?>