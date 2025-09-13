<?php
/**
 * Data Migration API (CSV/JSON Import/Export)
 * Job File Management System
 */

class MigrationAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = array_filter(explode('/', $path));
        $action = $segments[1] ?? '';
        
        // All migration operations require admin role
        requireRole(['admin']);
        
        switch ($method) {
            case 'POST':
                switch ($action) {
                    case 'import-users':
                        $this->importUsers();
                        break;
                    case 'import-clients':
                        $this->importClients();
                        break;
                    case 'import-jobs':
                        $this->importJobFiles();
                        break;
                    default:
                        respond(['error' => 'Invalid import action'], 400);
                }
                break;
                
            case 'GET':
                switch ($action) {
                    case 'export-users':
                        $this->exportUsers();
                        break;
                    case 'export-clients':
                        $this->exportClients();
                        break;
                    case 'export-jobs':
                        $this->exportJobFiles();
                        break;
                    case 'backup':
                        $this->createBackup();
                        break;
                    default:
                        respond(['error' => 'Invalid export action'], 400);
                }
                break;
                
            default:
                respond(['error' => 'Method not allowed'], 405);
        }
    }
    
    /**
     * Import users from CSV
     */
    public function importUsers() {
        if (!isset($_FILES['file'])) {
            respond(['error' => 'No file uploaded'], 400);
        }
        
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            respond(['error' => 'File upload failed'], 400);
        }
        
        if (!$this->isCSVFile($file)) {
            respond(['error' => 'Invalid file type. CSV required.'], 400);
        }
        
        try {
            $this->db->beginTransaction();
            
            $handle = fopen($file['tmp_name'], 'r');
            $headers = fgetcsv($handle); // Skip header row
            
            $imported = 0;
            $errors = [];
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                try {
                    if (count($data) < 4) continue;
                    
                    $name = sanitizeInput($data[0]);
                    $email = sanitizeInput($data[1]);
                    $password = $data[2];
                    $role = sanitizeInput($data[3] ?? 'user');
                    $status = sanitizeInput($data[4] ?? 'active');
                    
                    if (!isValidEmail($email)) {
                        $errors[] = "Invalid email: {$email}";
                        continue;
                    }
                    
                    // Check if user exists
                    $existing = $this->db->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
                    if ($existing) {
                        $errors[] = "User already exists: {$email}";
                        continue;
                    }
                    
                    $hashedPassword = hashPassword($password);
                    $sql = "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)";
                    $this->db->execute($sql, [$name, $email, $hashedPassword, $role, $status]);
                    
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Error importing user {$email}: " . $e->getMessage();
                }
            }
            
            fclose($handle);
            $this->db->commit();
            
            respond([
                'success' => true,
                'imported' => $imported,
                'errors' => $errors
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Import users error: " . $e->getMessage());
            respond(['error' => 'Import failed'], 500);
        }
    }
    
    /**
     * Import clients from CSV
     */
    public function importClients() {
        if (!isset($_FILES['file'])) {
            respond(['error' => 'No file uploaded'], 400);
        }
        
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            respond(['error' => 'File upload failed'], 400);
        }
        
        if (!$this->isCSVFile($file)) {
            respond(['error' => 'Invalid file type. CSV required.'], 400);
        }
        
        try {
            $this->db->beginTransaction();
            
            $handle = fopen($file['tmp_name'], 'r');
            $headers = fgetcsv($handle); // Skip header row
            
            $imported = 0;
            $errors = [];
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                try {
                    if (count($data) < 3) continue;
                    
                    $name = sanitizeInput($data[0]);
                    $type = sanitizeInput($data[1] ?? 'both');
                    $contact = sanitizeInput($data[2]);
                    $email = sanitizeInput($data[3] ?? '');
                    $phone = sanitizeInput($data[4] ?? '');
                    $address = sanitizeInput($data[5] ?? '');
                    $notes = sanitizeInput($data[6] ?? '');
                    
                    if ($email && !isValidEmail($email)) {
                        $email = null;
                    }
                    
                    // Check if client exists
                    $existing = $this->db->fetchOne("SELECT id FROM clients WHERE name = ?", [$name]);
                    if ($existing) {
                        $errors[] = "Client already exists: {$name}";
                        continue;
                    }
                    
                    $sql = "INSERT INTO clients (name, type, contact, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
                    $this->db->execute($sql, [$name, $type, $contact, $email, $phone, $address, $notes]);
                    
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Error importing client {$name}: " . $e->getMessage();
                }
            }
            
            fclose($handle);
            $this->db->commit();
            
            respond([
                'success' => true,
                'imported' => $imported,
                'errors' => $errors
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Import clients error: " . $e->getMessage());
            respond(['error' => 'Import failed'], 500);
        }
    }
    
    /**
     * Export users to CSV
     */
    public function exportUsers() {
        $sql = "SELECT id, name, email, role, status, created_at FROM users ORDER BY id";
        $users = $this->db->fetchAll($sql);
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="users_export_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // CSV headers
        fputcsv($output, ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At']);
        
        foreach ($users as $user) {
            fputcsv($output, [
                $user['id'],
                $user['name'],
                $user['email'],
                $user['role'],
                $user['status'],
                $user['created_at']
            ]);
        }
        
        fclose($output);
        exit;
    }
    
    /**
     * Export clients to CSV
     */
    public function exportClients() {
        $sql = "SELECT * FROM clients ORDER BY id";
        $clients = $this->db->fetchAll($sql);
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="clients_export_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // CSV headers
        fputcsv($output, ['ID', 'Name', 'Type', 'Contact', 'Email', 'Phone', 'Address', 'Total Jobs', 'Last Job Date', 'Notes']);
        
        foreach ($clients as $client) {
            fputcsv($output, [
                $client['id'],
                $client['name'],
                $client['type'],
                $client['contact'],
                $client['email'],
                $client['phone'],
                $client['address'],
                $client['total_jobs'],
                $client['last_job_date'],
                $client['notes']
            ]);
        }
        
        fclose($output);
        exit;
    }
    
    /**
     * Export job files to CSV
     */
    public function exportJobFiles() {
        $sql = "
            SELECT jf.*, u.name as prepared_by_name 
            FROM job_files jf
            LEFT JOIN users u ON jf.prepared_by = u.id
            ORDER BY jf.id
        ";
        $jobs = $this->db->fetchAll($sql);
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="job_files_export_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // CSV headers
        fputcsv($output, [
            'ID', 'Job File No', 'Opening Date', 'Billing Date', 'Shipper', 'Consignee',
            'Agent', 'Vessel', 'Voyage', 'POL', 'POD', 'ETD', 'ETA', 'Container No',
            'Total Sell (KWD)', 'Total Cost (KWD)', 'Total Profit (KWD)', 'Status',
            'Prepared By', 'Description', 'Notes', 'Created At'
        ]);
        
        foreach ($jobs as $job) {
            fputcsv($output, [
                $job['id'],
                $job['job_file_no'],
                $job['opening_date'],
                $job['billing_date'],
                $job['shipper_name'],
                $job['consignee_name'],
                $job['agent'],
                $job['vessel'],
                $job['voyage'],
                $job['pol'],
                $job['pod'],
                $job['etd'],
                $job['eta'],
                $job['container_no'],
                $job['total_sell'],
                $job['total_cost'],
                $job['total_profit'],
                $job['status'],
                $job['prepared_by_name'],
                $job['description'],
                $job['notes'],
                $job['created_at']
            ]);
        }
        
        fclose($output);
        exit;
    }
    
    /**
     * Create complete database backup
     */
    public function createBackup() {
        $backup = [
            'exported_at' => date('Y-m-d H:i:s'),
            'system' => 'Job File Management System',
            'currency' => 'KWD',
            'data' => []
        ];
        
        // Export all tables
        $tables = ['users', 'clients', 'job_files', 'job_file_items', 'activity_logs'];
        
        foreach ($tables as $table) {
            $sql = "SELECT * FROM {$table} ORDER BY id";
            $data = $this->db->fetchAll($sql);
            
            // Remove passwords from users
            if ($table === 'users') {
                foreach ($data as &$row) {
                    unset($row['password']);
                }
            }
            
            $backup['data'][$table] = $data;
        }
        
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="backup_' . date('Y-m-d_H-i-s') . '.json"');
        
        echo json_encode($backup, JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Helper: Check if file is CSV
     */
    private function isCSVFile($file) {
        $allowedTypes = ['text/csv', 'text/plain', 'application/csv'];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        return in_array($file['type'], $allowedTypes) || $extension === 'csv';
    }
}
?>