<?php
/**
 * Utility Functions
 * Job File Management System
 */

/**
 * Send JSON response
 */
function respond($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Get request method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Get request body as JSON
 */
function getRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

/**
 * Get query parameters
 */
function getQueryParams() {
    return $_GET ?? [];
}

/**
 * Get POST parameters
 */
function getPostParams() {
    return $_POST ?? [];
}

/**
 * Get path info for routing
 */
function getPathInfo() {
    return $_SERVER['PATH_INFO'] ?? '/';
}

/**
 * Generate UUID v4
 */
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * Hash password using PHP password_hash
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Format currency to KWD
 */
function formatCurrency($amount, $decimals = 3) {
    return number_format((float)$amount, $decimals, '.', ',') . ' KWD';
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    
    foreach ($ip_keys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            $ip = explode(',', $_SERVER[$key]);
            $ip = trim($ip[0]);
            
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Check if user is authenticated
 */
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        respond(['error' => 'Authentication required'], 401);
    }
}

/**
 * Check if user has required role
 */
function requireRole($allowedRoles = []) {
    requireAuth();
    
    if (!in_array($_SESSION['role'] ?? '', $allowedRoles)) {
        respond(['error' => 'Insufficient permissions'], 403);
    }
}

/**
 * Log activity
 */
function logActivity($jobFileId, $userId, $action, $oldStatus = null, $newStatus = null, $details = null) {
    try {
        $db = getDB();
        $sql = "INSERT INTO activity_logs (job_file_id, user_id, action, old_status, new_status, details) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $db->execute($sql, [$jobFileId, $userId, $action, $oldStatus, $newStatus, $details]);
    } catch (Exception $e) {
        error_log("Failed to log activity: " . $e->getMessage());
    }
}

/**
 * Rate limiting for login attempts
 */
function checkRateLimit($email, $ipAddress) {
    $db = getDB();
    
    // Check current attempts
    $sql = "SELECT attempts, blocked_until FROM login_attempts 
            WHERE (email = ? OR ip_address = ?) AND blocked_until > NOW()";
    $blocked = $db->fetchOne($sql, [$email, $ipAddress]);
    
    if ($blocked) {
        respond(['error' => 'Too many login attempts. Please try again later.'], 429);
    }
    
    return true;
}

/**
 * Record failed login attempt
 */
function recordFailedLogin($email, $ipAddress) {
    $db = getDB();
    
    // Get current attempts
    $sql = "SELECT id, attempts FROM login_attempts 
            WHERE (email = ? OR ip_address = ?) AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)";
    $existing = $db->fetchOne($sql, [$email, $ipAddress]);
    
    if ($existing) {
        $newAttempts = $existing['attempts'] + 1;
        $blockedUntil = null;
        
        if ($newAttempts >= 5) {
            $blockedUntil = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        }
        
        $sql = "UPDATE login_attempts 
                SET attempts = ?, blocked_until = ?, updated_at = NOW() 
                WHERE id = ?";
        $db->execute($sql, [$newAttempts, $blockedUntil, $existing['id']]);
    } else {
        $sql = "INSERT INTO login_attempts (ip_address, email, attempts) VALUES (?, ?, 1)";
        $db->execute($sql, [$ipAddress, $email]);
    }
}

/**
 * Clear successful login attempts
 */
function clearLoginAttempts($email, $ipAddress) {
    $db = getDB();
    $sql = "DELETE FROM login_attempts WHERE email = ? OR ip_address = ?";
    $db->execute($sql, [$email, $ipAddress]);
}

/**
 * Validate required fields
 */
function validateRequired($data, $requiredFields) {
    $missing = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        respond(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
}

/**
 * Paginate results
 */
function paginate($sql, $params, $page = 1, $limit = 20) {
    $offset = ($page - 1) * $limit;
    
    // Count total records
    $countSql = "SELECT COUNT(*) as total FROM ($sql) as count_query";
    $db = getDB();
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Get paginated results
    $paginatedSql = $sql . " LIMIT $limit OFFSET $offset";
    $results = $db->fetchAll($paginatedSql, $params);
    
    return [
        'data' => $results,
        'pagination' => [
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ];
}

/**
 * CORS handling moved to .htaccess and config.php to avoid duplication
 * This function is kept for backward compatibility but no longer sets headers
 */
function enableCORS() {
    // CORS headers now handled by .htaccess and config.php
    // This prevents duplicate header issues on shared hosting
    return true;
}
?>