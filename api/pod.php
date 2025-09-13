<?php
/**
 * POD (Proof of Delivery) API Endpoints
 * Handles delivery assignment, tracking, completion, and feedback
 */

require_once 'config.php';
require_once 'utils.php';

// Configure CORS for same-origin (remove * for security)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Start session and check authentication
session_start();

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }
    return $_SESSION;
}

function requireRole($allowedRoles) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }
    
    if (!in_array($_SESSION['user_role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit();
    }
    
    return $_SESSION;
}

// Get request path and method
$requestPath = $_GET['endpoint'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($requestPath) {
        
        // ===== DELIVERY MANAGEMENT =====
        
        case 'deliveries':
            if ($method === 'GET') {
                // Get deliveries with role-based filtering
                requireRole(['driver', 'supervisor', 'admin']);
                
                $query = "SELECT d.*, jf.job_file_no, jf.shipper_name, jf.consignee_name, 
                         u.name as driver_name, assigner.name as assigned_by_name,
                         pc.delivery_date, pc.receiver_name as completed_receiver_name
                         FROM pod_deliveries d 
                         LEFT JOIN job_files jf ON d.job_file_id = jf.id 
                         LEFT JOIN users u ON d.driver_id = u.id
                         LEFT JOIN users assigner ON d.assigned_by = assigner.id
                         LEFT JOIN pod_completions pc ON d.delivery_id = pc.delivery_id";
                
                $params = [];
                
                // Drivers can only see their own deliveries
                if ($_SESSION['user_role'] === 'driver') {
                    $query .= " WHERE d.driver_id = ?";
                    $params[] = $_SESSION['user_id'];
                } elseif (!in_array($_SESSION['user_role'], ['supervisor', 'admin'])) {
                    // Extra safety: deny access for any other roles
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied']);
                    exit();
                }
                
                $query .= " ORDER BY d.assigned_at DESC";
                
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $deliveries = $stmt->fetchAll();
                
                echo json_encode(['deliveries' => $deliveries]);
            } elseif ($method === 'POST') {
                // Create new delivery assignment - restricted to supervisors and admins only
                requireRole(['supervisor', 'admin']);
                
                $input = json_decode(file_get_contents('php://input'), true);
                $jobFileId = $input['job_file_id'] ?? null;
                $driverId = $input['driver_id'] ?? null;
                $deliveryLocation = $input['delivery_location'] ?? '';
                $additionalNotes = $input['additional_notes'] ?? '';
                
                if (!$jobFileId || !$driverId || !$deliveryLocation) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields']);
                    exit();
                }
                
                // Get job file details
                $jobStmt = $pdo->prepare("SELECT * FROM job_files WHERE id = ?");
                $jobStmt->execute([$jobFileId]);
                $jobFile = $jobStmt->fetch();
                
                if (!$jobFile) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Job file not found']);
                    exit();
                }
                
                // Get driver details
                $driverStmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND role = 'driver'");
                $driverStmt->execute([$driverId]);
                $driver = $driverStmt->fetch();
                
                if (!$driver) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Driver not found']);
                    exit();
                }
                
                // Generate unique delivery ID
                $deliveryId = 'DEL-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
                
                // Create delivery record
                $stmt = $pdo->prepare("
                    INSERT INTO pod_deliveries 
                    (delivery_id, job_file_id, job_file_no, assigned_by, driver_id, driver_name, 
                     origin, destination, airlines, mawb, invoice_no, delivery_location, 
                     additional_notes, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'assigned')
                ");
                
                $stmt->execute([
                    $deliveryId,
                    $jobFileId,
                    $jobFile['job_file_no'],
                    $_SESSION['user_id'],
                    $driverId,
                    $driver['name'],
                    $input['origin'] ?? $jobFile['pol'],
                    $input['destination'] ?? $jobFile['pod'],
                    $input['airlines'] ?? '',
                    $input['mawb'] ?? $jobFile['bl_no'],
                    $input['invoice_no'] ?? $jobFile['invoice_no'],
                    $deliveryLocation,
                    $additionalNotes
                ]);
                
                // Log activity
                logPODActivity($pdo, $deliveryId, $_SESSION['user_id'], 'assigned', null, 'assigned', 
                              "Delivery assigned to driver: {$driver['name']}");
                
                echo json_encode([
                    'success' => true,
                    'delivery_id' => $deliveryId,
                    'message' => 'Delivery assigned successfully'
                ]);
            }
            break;
            
        case 'deliveries/complete':
            if ($method === 'POST') {
                // Complete delivery with POD - only drivers can complete deliveries
                requireRole(['driver']);
                
                $input = json_decode(file_get_contents('php://input'), true);
                $deliveryId = $input['delivery_id'] ?? null;
                $receiverName = trim($input['receiver_name'] ?? '');
                $receiverMobile = trim($input['receiver_mobile'] ?? '');
                $signatureData = $input['signature_data'] ?? '';
                $deliveryNotes = trim($input['delivery_notes'] ?? '');
                $gpsLatitude = $input['gps_latitude'] ?? null;
                $gpsLongitude = $input['gps_longitude'] ?? null;
                
                if (!$deliveryId || !$receiverName || !$signatureData) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields']);
                    exit();
                }
                
                // Verify delivery belongs to current driver and is in correct status
                $stmt = $pdo->prepare("SELECT * FROM pod_deliveries WHERE delivery_id = ? AND driver_id = ? AND status = 'assigned'");
                $stmt->execute([$deliveryId, $_SESSION['user_id']]);
                $delivery = $stmt->fetch();
                
                if (!$delivery) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Delivery not found, access denied, or already completed']);
                    exit();
                }
                
                // Check if already completed
                $checkStmt = $pdo->prepare("SELECT id FROM pod_completions WHERE delivery_id = ?");
                $checkStmt->execute([$deliveryId]);
                if ($checkStmt->fetch()) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Delivery already completed']);
                    exit();
                }
                
                $pdo->beginTransaction();
                
                try {
                    // Update delivery status
                    $updateStmt = $pdo->prepare("
                        UPDATE pod_deliveries 
                        SET status = 'delivered', receiver_name = ?, receiver_mobile = ?, completed_at = NOW() 
                        WHERE delivery_id = ?
                    ");
                    $updateStmt->execute([$receiverName, $receiverMobile, $deliveryId]);
                    
                    // Create POD completion record
                    $podStmt = $pdo->prepare("
                        INSERT INTO pod_completions 
                        (delivery_id, job_file_id, driver_id, receiver_name, receiver_mobile, 
                         delivery_date, delivery_notes, signature_data, gps_latitude, gps_longitude) 
                        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
                    ");
                    
                    $podStmt->execute([
                        $deliveryId,
                        $delivery['job_file_id'],
                        $_SESSION['user_id'],
                        $receiverName,
                        $receiverMobile,
                        $deliveryNotes,
                        $signatureData,
                        $gpsLatitude,
                        $gpsLongitude
                    ]);
                    
                    // Log activity
                    logPODActivity($pdo, $deliveryId, $_SESSION['user_id'], 'completed', 'assigned', 'delivered', 
                                  "Delivery completed by {$_SESSION['user_name']}. Receiver: $receiverName");
                    
                    $pdo->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Delivery completed successfully',
                        'pod_url' => "/pod-public.html?podId=$deliveryId"
                    ]);
                    
                } catch (Exception $e) {
                    $pdo->rollback();
                    throw $e;
                }
            }
            break;
            
        case 'job-files/search':
            if ($method === 'GET') {
                // Search job files for POD assignment - supervisors and admins only
                requireRole(['supervisor', 'admin']);
                
                $search = trim($_GET['q'] ?? '');
                $limit = min(intval($_GET['limit'] ?? 10), 50);
                
                if (strlen($search) < 2) {
                    echo json_encode(['job_files' => []]);
                    exit();
                }
                
                $searchTerm = "%$search%";
                $stmt = $pdo->prepare("
                    SELECT id, job_file_no, shipper_name, consignee_name, pol, pod, 
                           bl_no, invoice_no, status, opening_date
                    FROM job_files 
                    WHERE (job_file_no LIKE ? OR shipper_name LIKE ? OR consignee_name LIKE ?)
                    AND status = 'approved'
                    ORDER BY opening_date DESC 
                    LIMIT ?
                ");
                
                $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $limit]);
                $jobFiles = $stmt->fetchAll();
                
                echo json_encode(['job_files' => $jobFiles]);
            }
            break;
            
        case 'drivers':
            if ($method === 'GET') {
                // Get available drivers - supervisors and admins only
                requireRole(['supervisor', 'admin']);
                
                $stmt = $pdo->prepare("
                    SELECT id, name, email, status, created_at,
                           (SELECT COUNT(*) FROM pod_deliveries WHERE driver_id = users.id AND status IN ('assigned', 'in_transit')) as active_deliveries
                    FROM users 
                    WHERE role = 'driver' AND status = 'active'
                    ORDER BY name
                ");
                
                $stmt->execute();
                $drivers = $stmt->fetchAll();
                
                echo json_encode(['drivers' => $drivers]);
            }
            break;
            
        case 'feedback':
            if ($method === 'POST') {
                // Submit public feedback (no auth required)
                $input = json_decode(file_get_contents('php://input'), true);
                $deliveryId = $input['delivery_id'] ?? null;
                $rating = intval($input['rating'] ?? 0);
                $comment = $input['comment'] ?? '';
                
                if (!$deliveryId || $rating < 1 || $rating > 5) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid input']);
                    exit();
                }
                
                // Check if feedback already exists
                $checkStmt = $pdo->prepare("SELECT id FROM pod_feedback WHERE delivery_id = ?");
                $checkStmt->execute([$deliveryId]);
                if ($checkStmt->fetch()) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Feedback already submitted']);
                    exit();
                }
                
                // Get delivery details
                $deliveryStmt = $pdo->prepare("
                    SELECT pd.*, pc.driver_id, pc.job_file_id 
                    FROM pod_deliveries pd 
                    LEFT JOIN pod_completions pc ON pd.delivery_id = pc.delivery_id 
                    WHERE pd.delivery_id = ? AND pd.status = 'delivered'
                ");
                $deliveryStmt->execute([$deliveryId]);
                $delivery = $deliveryStmt->fetch();
                
                if (!$delivery) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Delivery not found']);
                    exit();
                }
                
                // Insert feedback
                $stmt = $pdo->prepare("
                    INSERT INTO pod_feedback 
                    (delivery_id, job_file_id, driver_id, rating, comment, ip_address, user_agent) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $deliveryId,
                    $delivery['job_file_id'],
                    $delivery['driver_id'],
                    $rating,
                    $comment,
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null
                ]);
                
                // Update delivery feedback status
                $updateStmt = $pdo->prepare("UPDATE pod_deliveries SET feedback_status = 'submitted' WHERE delivery_id = ?");
                $updateStmt->execute([$deliveryId]);
                
                // Log activity
                logPODActivity($pdo, $deliveryId, 0, 'feedback_received', null, null, 
                              "Customer feedback received. Rating: $rating/5");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Feedback submitted successfully'
                ]);
            }
            break;
            
        case 'pod/public':
            if ($method === 'GET') {
                // Get public POD data (no auth required)
                $podId = $_GET['podId'] ?? null;
                
                if (!$podId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'POD ID required']);
                    exit();
                }
                
                $stmt = $pdo->prepare("
                    SELECT pc.*, pd.job_file_no, pd.delivery_location, pd.additional_notes,
                           jf.shipper_name, jf.consignee_name, jf.pol, jf.pod,
                           u.name as driver_name
                    FROM pod_completions pc
                    LEFT JOIN pod_deliveries pd ON pc.delivery_id = pd.delivery_id
                    LEFT JOIN job_files jf ON pc.job_file_id = jf.id
                    LEFT JOIN users u ON pc.driver_id = u.id
                    WHERE pc.delivery_id = ?
                ");
                
                $stmt->execute([$podId]);
                $pod = $stmt->fetch();
                
                if (!$pod) {
                    http_response_code(404);
                    echo json_encode(['error' => 'POD not found']);
                    exit();
                }
                
                // Remove sensitive data for public view
                unset($pod['signature_data']);
                
                echo json_encode(['pod' => $pod]);
            }
            break;
            
        case 'statistics':
            if ($method === 'GET') {
                // Get POD statistics
                $session = requireAuth();
                
                $stats = [];
                
                if ($session['user_role'] === 'driver') {
                    // Driver-specific stats
                    $stmt = $pdo->prepare("
                        SELECT 
                            COUNT(CASE WHEN status = 'assigned' THEN 1 END) as pending,
                            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed,
                            COUNT(*) as total
                        FROM pod_deliveries WHERE driver_id = ?
                    ");
                    $stmt->execute([$session['user_id']]);
                    $stats = $stmt->fetch();
                    
                    // Get average rating
                    $ratingStmt = $pdo->prepare("
                        SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings 
                        FROM pod_feedback WHERE driver_id = ?
                    ");
                    $ratingStmt->execute([$session['user_id']]);
                    $rating = $ratingStmt->fetch();
                    $stats['avg_rating'] = round($rating['avg_rating'] ?? 0, 2);
                    $stats['total_ratings'] = $rating['total_ratings'] ?? 0;
                    
                } else {
                    // Admin/supervisor stats
                    $stmt = $pdo->prepare("
                        SELECT 
                            COUNT(CASE WHEN status IN ('pending', 'assigned') THEN 1 END) as pending,
                            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed,
                            COUNT(*) as total
                        FROM pod_deliveries
                    ");
                    $stmt->execute();
                    $stats = $stmt->fetch();
                }
                
                echo json_encode(['statistics' => $stats]);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
    
} catch (Exception $e) {
    error_log("POD API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Log POD activity
 */
function logPODActivity($pdo, $deliveryId, $userId, $action, $oldStatus, $newStatus, $details) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO pod_activity_logs 
            (delivery_id, user_id, action, old_status, new_status, details, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $deliveryId,
            $userId,
            $action,
            $oldStatus,
            $newStatus,
            $details,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        error_log("Failed to log POD activity: " . $e->getMessage());
    }
}
?>