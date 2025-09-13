<?php
/**
 * Configuration File
 * Job File Management System - PHP/MySQL Edition
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Access denied');
}

// Environment Configuration
define('ENVIRONMENT', $_ENV['ENVIRONMENT'] ?? 'development');
define('DEBUG', ENVIRONMENT === 'development');

// Database Configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'jobfiles_system');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_CHARSET', 'utf8mb4');

// Session Configuration
define('SESSION_NAME', 'jobfiles_session');
define('SESSION_LIFETIME', 86400); // 24 hours
define('SESSION_SECURE', !DEBUG); // Only secure in production
define('SESSION_HTTPONLY', true);
define('SESSION_SAMESITE', 'Lax');

// Initialize session with secure settings
session_name(SESSION_NAME);
session_set_cookie_params([
    'lifetime' => SESSION_LIFETIME,
    'path' => '/',
    'domain' => '',
    'secure' => SESSION_SECURE,
    'httponly' => SESSION_HTTPONLY,
    'samesite' => SESSION_SAMESITE
]);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Security Configuration
define('BCRYPT_COST', 12);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes

// File Upload Configuration
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_UPLOAD_TYPES', ['csv', 'json']);
define('UPLOAD_DIR', __DIR__ . '/../uploads');

// API Configuration
define('API_RATE_LIMIT', 100); // requests per minute
define('API_RATE_WINDOW', 60); // seconds

// Currency Configuration
define('DEFAULT_CURRENCY', 'KWD');
define('CURRENCY_PRECISION', 3);

// Application Configuration
define('APP_NAME', 'Q\'go Cargo Job File Management System');
define('APP_VERSION', '2.0.0');
define('APP_EDITION', 'HTML/PHP Shared Hosting Edition');

// Email Configuration (if needed)
define('MAIL_HOST', $_ENV['MAIL_HOST'] ?? '');
define('MAIL_PORT', $_ENV['MAIL_PORT'] ?? 587);
define('MAIL_USERNAME', $_ENV['MAIL_USERNAME'] ?? '');
define('MAIL_PASSWORD', $_ENV['MAIL_PASSWORD'] ?? '');
define('MAIL_FROM_ADDRESS', $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@qgo-cargo.com');
define('MAIL_FROM_NAME', $_ENV['MAIL_FROM_NAME'] ?? APP_NAME);

// Backup Configuration
define('BACKUP_DIR', __DIR__ . '/../backups');
define('BACKUP_RETENTION_DAYS', 30);

// Timezone
date_default_timezone_set($_ENV['TIMEZONE'] ?? 'Asia/Kuwait');

// Error Reporting
if (DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
}

// CORS Configuration - Headers handled by .htaccess and index.php
// Keeping configuration here for reference but not setting headers to avoid duplication

// Content Security Policy
if (!DEBUG) {
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com cdnjs.cloudflare.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:;");
    header("X-Frame-Options: DENY");
    header("X-XSS-Protection: 1; mode=block");
    header("X-Content-Type-Options: nosniff");
    header("Referrer-Policy: strict-origin-when-cross-origin");
}
?>