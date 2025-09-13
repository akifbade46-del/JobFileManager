<?php
/**
 * Clients API
 * Job File Management System
 */

class ClientsAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = explode('/', trim($path, '/'));
        $id = $segments[1] ?? null;
        
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getClient($id);
                } else {
                    $this->getAllClients();
                }
                break;
                
            case 'POST':
                $this->createClient();
                break;
                
            case 'PUT':
                if ($id) {
                    $this->updateClient($id);
                } else {
                    respond(['error' => 'ID required for update'], 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $this->deleteClient($id);
                } else {
                    respond(['error' => 'ID required for delete'], 400);
                }
                break;
                
            default:
                respond(['error' => 'Method not allowed'], 405);
        }
    }
    
    /**
     * Get all clients with filtering
     */
    public function getAllClients() {
        requireAuth();
        
        $params = getQueryParams();
        $type = $params['type'] ?? null;
        $search = $params['search'] ?? null;
        $page = (int)($params['page'] ?? 1);
        $limit = min((int)($params['limit'] ?? 50), 100);
        
        // Build WHERE clause
        $whereConditions = [];
        $queryParams = [];
        
        if ($type && $type !== 'all') {
            $whereConditions[] = "(type = ? OR type = 'both')";
            $queryParams[] = $type;
        }
        
        if ($search) {
            $whereConditions[] = "(name LIKE ? OR contact LIKE ? OR email LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        $sql = "
            SELECT * FROM clients 
            {$whereClause}
            ORDER BY last_job_date DESC, name ASC
        ";
        
        $result = paginate($sql, $queryParams, $page, $limit);
        respond($result);
    }
    
    /**
     * Get single client
     */
    public function getClient($id) {
        requireAuth();
        
        $sql = "SELECT * FROM clients WHERE id = ?";
        $client = $this->db->fetchOne($sql, [$id]);
        
        if (!$client) {
            respond(['error' => 'Client not found'], 404);
        }
        
        // Get recent job files for this client
        $sql = "
            SELECT id, job_file_no, opening_date, status, total_sell 
            FROM job_files 
            WHERE shipper_id = ? OR consignee_id = ?
            ORDER BY opening_date DESC 
            LIMIT 10
        ";
        $recentJobs = $this->db->fetchAll($sql, [$id, $id]);
        
        $client['recent_jobs'] = $recentJobs;
        
        respond($client);
    }
    
    /**
     * Create new client
     */
    public function createClient() {
        requireAuth();
        
        $data = getRequestBody();
        validateRequired($data, ['name', 'contact']);
        
        $name = sanitizeInput($data['name']);
        $type = sanitizeInput($data['type'] ?? 'both');
        $address = sanitizeInput($data['address'] ?? null);
        $contact = sanitizeInput($data['contact']);
        $email = sanitizeInput($data['email'] ?? null);
        $phone = sanitizeInput($data['phone'] ?? null);
        $notes = sanitizeInput($data['notes'] ?? null);
        
        // Validate email if provided
        if ($email && !isValidEmail($email)) {
            respond(['error' => 'Invalid email format'], 400);
        }
        
        // Check if client name already exists
        $sql = "SELECT id FROM clients WHERE name = ?";
        $existing = $this->db->fetchOne($sql, [$name]);
        
        if ($existing) {
            respond(['error' => 'Client name already exists'], 400);
        }
        
        try {
            $sql = "
                INSERT INTO clients (name, type, address, contact, email, phone, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ";
            
            $this->db->execute($sql, [$name, $type, $address, $contact, $email, $phone, $notes]);
            $clientId = $this->db->lastInsertId();
            
            // Get created client
            $client = $this->db->fetchOne("SELECT * FROM clients WHERE id = ?", [$clientId]);
            respond($client, 201);
            
        } catch (Exception $e) {
            error_log("Create client error: " . $e->getMessage());
            respond(['error' => 'Failed to create client'], 500);
        }
    }
    
    /**
     * Update client
     */
    public function updateClient($id) {
        requireAuth();
        
        $client = $this->db->fetchOne("SELECT * FROM clients WHERE id = ?", [$id]);
        if (!$client) {
            respond(['error' => 'Client not found'], 404);
        }
        
        $data = getRequestBody();
        
        // Build update query
        $updateFields = [];
        $updateParams = [];
        
        $allowedFields = ['name', 'type', 'address', 'contact', 'email', 'phone', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $value = sanitizeInput($data[$field]);
                
                // Validate email if provided
                if ($field === 'email' && $value && !isValidEmail($value)) {
                    respond(['error' => 'Invalid email format'], 400);
                }
                
                $updateFields[] = "{$field} = ?";
                $updateParams[] = $value;
            }
        }
        
        if (empty($updateFields)) {
            respond(['error' => 'No fields to update'], 400);
        }
        
        try {
            $updateParams[] = $id;
            $sql = "UPDATE clients SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
            $this->db->execute($sql, $updateParams);
            
            // Get updated client
            $updatedClient = $this->db->fetchOne("SELECT * FROM clients WHERE id = ?", [$id]);
            respond($updatedClient);
            
        } catch (Exception $e) {
            error_log("Update client error: " . $e->getMessage());
            respond(['error' => 'Failed to update client'], 500);
        }
    }
    
    /**
     * Delete client (admin only)
     */
    public function deleteClient($id) {
        requireRole(['admin']);
        
        $client = $this->db->fetchOne("SELECT name FROM clients WHERE id = ?", [$id]);
        if (!$client) {
            respond(['error' => 'Client not found'], 404);
        }
        
        // Check if client is used in job files
        $sql = "SELECT COUNT(*) as count FROM job_files WHERE shipper_id = ? OR consignee_id = ?";
        $usage = $this->db->fetchOne($sql, [$id, $id]);
        
        if ($usage['count'] > 0) {
            respond(['error' => 'Cannot delete client that is used in job files'], 400);
        }
        
        try {
            $this->db->execute("DELETE FROM clients WHERE id = ?", [$id]);
            respond(['success' => true, 'message' => 'Client deleted successfully']);
            
        } catch (Exception $e) {
            error_log("Delete client error: " . $e->getMessage());
            respond(['error' => 'Failed to delete client'], 500);
        }
    }
    
    /**
     * Update client job statistics
     */
    public function updateClientStats($clientId) {
        try {
            $sql = "
                UPDATE clients SET 
                    total_jobs = (
                        SELECT COUNT(*) FROM job_files 
                        WHERE shipper_id = ? OR consignee_id = ?
                    ),
                    last_job_date = (
                        SELECT MAX(opening_date) FROM job_files 
                        WHERE shipper_id = ? OR consignee_id = ?
                    ),
                    updated_at = NOW()
                WHERE id = ?
            ";
            
            $this->db->execute($sql, [$clientId, $clientId, $clientId, $clientId, $clientId]);
            
        } catch (Exception $e) {
            error_log("Update client stats error: " . $e->getMessage());
        }
    }
}
?>