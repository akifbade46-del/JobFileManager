<?php
/**
 * Authentication API
 * Job File Management System
 */

class AuthAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = explode('/', trim($path, '/'));
        $action = $segments[1] ?? '';
        
        switch ($method) {
            case 'POST':
                switch ($action) {
                    case 'login':
                        $this->login();
                        break;
                    case 'register':
                        $this->register();
                        break;
                    case 'logout':
                        $this->logout();
                        break;
                    default:
                        respond(['error' => 'Invalid action'], 400);
                }
                break;
                
            case 'GET':
                switch ($action) {
                    case 'me':
                        $this->getCurrentUser();
                        break;
                    default:
                        respond(['error' => 'Invalid action'], 400);
                }
                break;
                
            default:
                respond(['error' => 'Method not allowed'], 405);
        }
    }
    
    /**
     * User login
     */
    public function login() {
        $data = getRequestBody();
        validateRequired($data, ['email', 'password']);
        
        $email = sanitizeInput($data['email']);
        $password = $data['password'];
        $ipAddress = getClientIP();
        
        // Check rate limiting
        checkRateLimit($email, $ipAddress);
        
        // Find user
        $sql = "SELECT * FROM users WHERE email = ?";
        $user = $this->db->fetchOne($sql, [$email]);
        
        if (!$user || !verifyPassword($password, $user['password'])) {
            recordFailedLogin($email, $ipAddress);
            respond(['error' => 'Invalid credentials'], 401);
        }
        
        if ($user['status'] !== 'active') {
            respond(['error' => 'Account is not active'], 401);
        }
        
        // Clear failed attempts
        clearLoginAttempts($email, $ipAddress);
        
        // Regenerate session ID for security
        session_regenerate_id(true);
        
        // Set session data
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['name'] = $user['name'];
        
        // Remove password from response
        unset($user['password']);
        
        respond([
            'success' => true,
            'user' => $user
        ]);
    }
    
    /**
     * User registration
     */
    public function register() {
        $data = getRequestBody();
        validateRequired($data, ['name', 'email', 'password']);
        
        $name = sanitizeInput($data['name']);
        $email = sanitizeInput($data['email']);
        $password = $data['password'];
        $role = sanitizeInput($data['role'] ?? 'user');
        
        if (!isValidEmail($email)) {
            respond(['error' => 'Invalid email format'], 400);
        }
        
        if (strlen($password) < 6) {
            respond(['error' => 'Password must be at least 6 characters'], 400);
        }
        
        // Check if user exists
        $sql = "SELECT id FROM users WHERE email = ?";
        $existing = $this->db->fetchOne($sql, [$email]);
        
        if ($existing) {
            respond(['error' => 'User already exists'], 400);
        }
        
        // Create user
        $hashedPassword = hashPassword($password);
        $sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        
        try {
            $this->db->execute($sql, [$name, $email, $hashedPassword, $role]);
            $userId = $this->db->lastInsertId();
            
            // Get created user
            $sql = "SELECT id, name, email, role, status, created_at FROM users WHERE id = ?";
            $user = $this->db->fetchOne($sql, [$userId]);
            
            respond([
                'success' => true,
                'message' => 'User created successfully. Account is pending approval.',
                'user' => $user
            ], 201);
            
        } catch (PDOException $e) {
            respond(['error' => 'Registration failed'], 500);
        }
    }
    
    /**
     * Get current user
     */
    public function getCurrentUser() {
        requireAuth();
        
        $sql = "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?";
        $user = $this->db->fetchOne($sql, [$_SESSION['user_id']]);
        
        if (!$user) {
            respond(['error' => 'User not found'], 404);
        }
        
        respond(['user' => $user]);
    }
    
    /**
     * User logout
     */
    public function logout() {
        // Destroy session
        session_destroy();
        
        // Clear session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }
        
        respond(['success' => true, 'message' => 'Logged out successfully']);
    }
}
?>