<?php
/**
 * Main API Router - Shared Hosting Compatible
 * Job File Management System - PHP/MySQL Edition
 */

// Define API access constant before including config
define('API_ACCESS', true);

// Include configuration first
require_once 'config.php';

// Include dependencies
require_once 'db.php';
require_once 'utils.php';

// Session already started in config.php, no need to start again

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get request info
$method = getRequestMethod();
$path = getPathInfo();
$segments = explode('/', trim($path, '/'));

// Simple routing based on first segment
try {
    if (empty($segments)) {
        respond(['message' => 'Job File Management System API', 'version' => '1.0']);
    }
    
    $endpoint = $segments[0] ?? '';
    
    switch ($endpoint) {
        case 'auth':
            require_once 'auth.php';
            $auth = new AuthAPI();
            $auth->handleRequest();
            break;
            
        case 'users':
            require_once 'users.php';
            $users = new UsersAPI();
            $users->handleRequest();
            break;
            
        case 'clients':
            require_once 'clients.php';
            $clients = new ClientsAPI();
            $clients->handleRequest();
            break;
            
        case 'jobs':
            require_once 'jobs.php';
            $jobs = new JobsAPI();
            $jobs->handleRequest();
            break;
            
        case 'analytics':
            require_once 'analytics.php';
            $analytics = new AnalyticsAPI();
            $analytics->handleRequest();
            break;
            
        case 'activity':
            require_once 'activity.php';
            $activity = new ActivityAPI();
            $activity->handleRequest();
            break;
            
        case 'migration':
            require_once 'migration.php';
            $migration = new MigrationAPI();
            $migration->handleRequest();
            break;
            
        default:
            respond(['error' => 'Endpoint not found'], 404);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    respond(['error' => 'Internal server error'], 500);
}
?>