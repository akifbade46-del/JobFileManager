<?php
/**
 * Job Files API
 * Job File Management System
 */

class JobsAPI {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    public function handleRequest() {
        $method = getRequestMethod();
        $path = getPathInfo();
        $segments = array_filter(explode('/', $path));
        $action = $segments[1] ?? '';
        $id = $segments[2] ?? null;
        
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getJobFile($id);
                } else {
                    $this->getAllJobFiles();
                }
                break;
                
            case 'POST':
                if ($action === 'check' && $id) {
                    $this->checkJobFile($id);
                } elseif ($action === 'approve' && $id) {
                    $this->approveJobFile($id);
                } elseif ($action === 'reject' && $id) {
                    $this->rejectJobFile($id);
                } else {
                    $this->createJobFile();
                }
                break;
                
            case 'PUT':
                if ($id) {
                    $this->updateJobFile($id);
                } else {
                    respond(['error' => 'ID required for update'], 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $this->deleteJobFile($id);
                } else {
                    respond(['error' => 'ID required for delete'], 400);
                }
                break;
                
            default:
                respond(['error' => 'Method not allowed'], 405);
        }
    }
    
    /**
     * Get all job files with filtering
     */
    public function getAllJobFiles() {
        requireAuth();
        
        $params = getQueryParams();
        $status = $params['status'] ?? null;
        $search = $params['search'] ?? null;
        $page = (int)($params['page'] ?? 1);
        $limit = min((int)($params['limit'] ?? 20), 100);
        
        // Build WHERE clause
        $whereConditions = [];
        $queryParams = [];
        
        // Role-based filtering
        if ($_SESSION['role'] === 'user') {
            $whereConditions[] = "prepared_by = ?";
            $queryParams[] = $_SESSION['user_id'];
        }
        
        if ($status && $status !== 'all') {
            $whereConditions[] = "status = ?";
            $queryParams[] = $status;
        }
        
        if ($search) {
            $whereConditions[] = "(job_file_no LIKE ? OR shipper_name LIKE ? OR consignee_name LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        $sql = "
            SELECT jf.*, 
                   u_prep.name as prepared_by_name,
                   u_check.name as checked_by_name,
                   u_approve.name as approved_by_name,
                   u_reject.name as rejected_by_name
            FROM job_files jf
            LEFT JOIN users u_prep ON jf.prepared_by = u_prep.id
            LEFT JOIN users u_check ON jf.checked_by = u_check.id
            LEFT JOIN users u_approve ON jf.approved_by = u_approve.id
            LEFT JOIN users u_reject ON jf.rejected_by = u_reject.id
            {$whereClause}
            ORDER BY jf.updated_at DESC
        ";
        
        $result = paginate($sql, $queryParams, $page, $limit);
        respond($result);
    }
    
    /**
     * Get single job file with items
     */
    public function getJobFile($id) {
        requireAuth();
        
        // Get job file
        $sql = "SELECT * FROM job_files_with_users WHERE id = ?";
        $jobFile = $this->db->fetchOne($sql, [$id]);
        
        if (!$jobFile) {
            respond(['error' => 'Job file not found'], 404);
        }
        
        // Check access permissions
        if ($_SESSION['role'] === 'user' && $jobFile['prepared_by'] != $_SESSION['user_id']) {
            respond(['error' => 'Access denied'], 403);
        }
        
        // Get job file items
        $sql = "SELECT * FROM job_file_items WHERE job_file_id = ? ORDER BY id";
        $items = $this->db->fetchAll($sql, [$id]);
        
        $jobFile['items'] = $items;
        
        respond($jobFile);
    }
    
    /**
     * Create new job file
     */
    public function createJobFile() {
        requireAuth();
        
        $data = getRequestBody();
        validateRequired($data, ['job_file_no', 'opening_date', 'shipper_name', 'consignee_name']);
        
        // Check if job file number already exists
        $sql = "SELECT id FROM job_files WHERE job_file_no = ?";
        $existing = $this->db->fetchOne($sql, [$data['job_file_no']]);
        
        if ($existing) {
            respond(['error' => 'Job file number already exists'], 400);
        }
        
        try {
            $this->db->beginTransaction();
            
            // Insert job file
            $sql = "
                INSERT INTO job_files (
                    job_file_no, opening_date, billing_date, shipper_id, shipper_name, 
                    shipper_address, shipper_contact, consignee_id, consignee_name, 
                    consignee_address, consignee_contact, agent, agent_ref, vessel, 
                    voyage, pol, pod, etd, eta, container_no, seal_no, container_size, 
                    bl_no, invoice_no, lc_no, total_sell, total_cost, total_profit, 
                    description, notes, prepared_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            
            $this->db->execute($sql, [
                $data['job_file_no'],
                $data['opening_date'],
                $data['billing_date'] ?? null,
                $data['shipper_id'] ?? null,
                $data['shipper_name'],
                $data['shipper_address'] ?? null,
                $data['shipper_contact'] ?? null,
                $data['consignee_id'] ?? null,
                $data['consignee_name'],
                $data['consignee_address'] ?? null,
                $data['consignee_contact'] ?? null,
                $data['agent'] ?? null,
                $data['agent_ref'] ?? null,
                $data['vessel'] ?? null,
                $data['voyage'] ?? null,
                $data['pol'] ?? null,
                $data['pod'] ?? null,
                $data['etd'] ?? null,
                $data['eta'] ?? null,
                $data['container_no'] ?? null,
                $data['seal_no'] ?? null,
                $data['container_size'] ?? null,
                $data['bl_no'] ?? null,
                $data['invoice_no'] ?? null,
                $data['lc_no'] ?? null,
                $data['total_sell'] ?? 0,
                $data['total_cost'] ?? 0,
                $data['total_profit'] ?? 0,
                $data['description'] ?? null,
                $data['notes'] ?? null,
                $_SESSION['user_id']
            ]);
            
            $jobFileId = $this->db->lastInsertId();
            
            // Insert job file items if provided
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->insertJobFileItem($jobFileId, $item);
                }
                
                // Recalculate totals
                $this->recalculateTotals($jobFileId);
            }
            
            // Log activity
            logActivity($jobFileId, $_SESSION['user_id'], 'created', null, 'pending', 
                       "Job file {$data['job_file_no']} created");
            
            $this->db->commit();
            
            // Get created job file
            $jobFile = $this->db->fetchOne("SELECT * FROM job_files WHERE id = ?", [$jobFileId]);
            respond($jobFile, 201);
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Create job file error: " . $e->getMessage());
            respond(['error' => 'Failed to create job file'], 500);
        }
    }
    
    /**
     * Update job file
     */
    public function updateJobFile($id) {
        requireAuth();
        
        $jobFile = $this->db->fetchOne("SELECT * FROM job_files WHERE id = ?", [$id]);
        if (!$jobFile) {
            respond(['error' => 'Job file not found'], 404);
        }
        
        // Check permissions
        if ($_SESSION['role'] === 'user' && $jobFile['prepared_by'] != $_SESSION['user_id']) {
            respond(['error' => 'Access denied'], 403);
        }
        
        $data = getRequestBody();
        
        try {
            $this->db->beginTransaction();
            
            // Update job file
            $updateFields = [];
            $updateParams = [];
            
            $allowedFields = [
                'opening_date', 'billing_date', 'shipper_id', 'shipper_name', 
                'shipper_address', 'shipper_contact', 'consignee_id', 'consignee_name',
                'consignee_address', 'consignee_contact', 'agent', 'agent_ref', 'vessel',
                'voyage', 'pol', 'pod', 'etd', 'eta', 'container_no', 'seal_no',
                'container_size', 'bl_no', 'invoice_no', 'lc_no', 'description', 'notes'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "{$field} = ?";
                    $updateParams[] = $data[$field];
                }
            }
            
            if (!empty($updateFields)) {
                $updateParams[] = $id;
                $sql = "UPDATE job_files SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
                $this->db->execute($sql, $updateParams);
            }
            
            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $this->db->execute("DELETE FROM job_file_items WHERE job_file_id = ?", [$id]);
                
                // Insert new items
                foreach ($data['items'] as $item) {
                    $this->insertJobFileItem($id, $item);
                }
                
                // Recalculate totals
                $this->recalculateTotals($id);
            }
            
            // Log activity
            logActivity($id, $_SESSION['user_id'], 'updated', null, null, 'Job file updated');
            
            $this->db->commit();
            
            // Return updated job file
            $this->getJobFile($id);
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Update job file error: " . $e->getMessage());
            respond(['error' => 'Failed to update job file'], 500);
        }
    }
    
    /**
     * Check job file (checker role)
     */
    public function checkJobFile($id) {
        requireRole(['checker', 'admin']);
        
        $this->updateJobFileStatus($id, 'checked', 'checked_by', 'checked_at');
    }
    
    /**
     * Approve job file (admin role)
     */
    public function approveJobFile($id) {
        requireRole(['admin']);
        
        $this->updateJobFileStatus($id, 'approved', 'approved_by', 'approved_at');
    }
    
    /**
     * Reject job file (admin role)
     */
    public function rejectJobFile($id) {
        requireRole(['admin']);
        
        $data = getRequestBody();
        $reason = $data['reason'] ?? 'No reason provided';
        
        $this->updateJobFileStatus($id, 'rejected', 'rejected_by', 'rejected_at', $reason);
    }
    
    /**
     * Delete job file (admin only)
     */
    public function deleteJobFile($id) {
        requireRole(['admin']);
        
        $jobFile = $this->db->fetchOne("SELECT job_file_no FROM job_files WHERE id = ?", [$id]);
        if (!$jobFile) {
            respond(['error' => 'Job file not found'], 404);
        }
        
        try {
            // Delete job file (items will be deleted by CASCADE)
            $this->db->execute("DELETE FROM job_files WHERE id = ?", [$id]);
            
            respond(['success' => true, 'message' => 'Job file deleted successfully']);
            
        } catch (Exception $e) {
            error_log("Delete job file error: " . $e->getMessage());
            respond(['error' => 'Failed to delete job file'], 500);
        }
    }
    
    /**
     * Helper: Update job file status
     */
    private function updateJobFileStatus($id, $status, $userField, $dateField, $reason = null) {
        $jobFile = $this->db->fetchOne("SELECT * FROM job_files WHERE id = ?", [$id]);
        if (!$jobFile) {
            respond(['error' => 'Job file not found'], 404);
        }
        
        try {
            $sql = "UPDATE job_files SET status = ?, {$userField} = ?, {$dateField} = NOW()";
            $params = [$status, $_SESSION['user_id']];
            
            if ($reason) {
                $sql .= ", rejection_reason = ?";
                $params[] = $reason;
            }
            
            $sql .= ", updated_at = NOW() WHERE id = ?";
            $params[] = $id;
            
            $this->db->execute($sql, $params);
            
            // Log activity
            logActivity($id, $_SESSION['user_id'], $status, $jobFile['status'], $status, $reason);
            
            // Get updated job file
            $updatedJobFile = $this->db->fetchOne("SELECT * FROM job_files WHERE id = ?", [$id]);
            respond($updatedJobFile);
            
        } catch (Exception $e) {
            error_log("Update job file status error: " . $e->getMessage());
            respond(['error' => 'Failed to update job file status'], 500);
        }
    }
    
    /**
     * Helper: Insert job file item
     */
    private function insertJobFileItem($jobFileId, $item) {
        $sellAmount = ($item['quantity'] ?? 1) * ($item['sell_rate'] ?? 0);
        $costAmount = ($item['quantity'] ?? 1) * ($item['cost_rate'] ?? 0);
        $profit = $sellAmount - $costAmount;
        
        $sql = "
            INSERT INTO job_file_items 
            (job_file_id, description, quantity, unit, sell_rate, cost_rate, sell_amount, cost_amount, profit) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $this->db->execute($sql, [
            $jobFileId,
            $item['description'] ?? '',
            $item['quantity'] ?? 1,
            $item['unit'] ?? null,
            $item['sell_rate'] ?? 0,
            $item['cost_rate'] ?? 0,
            $sellAmount,
            $costAmount,
            $profit
        ]);
    }
    
    /**
     * Helper: Recalculate job file totals
     */
    private function recalculateTotals($jobFileId) {
        $sql = "
            SELECT 
                SUM(sell_amount) as total_sell,
                SUM(cost_amount) as total_cost,
                SUM(profit) as total_profit
            FROM job_file_items 
            WHERE job_file_id = ?
        ";
        
        $totals = $this->db->fetchOne($sql, [$jobFileId]);
        
        $sql = "
            UPDATE job_files 
            SET total_sell = ?, total_cost = ?, total_profit = ?, updated_at = NOW()
            WHERE id = ?
        ";
        
        $this->db->execute($sql, [
            $totals['total_sell'] ?? 0,
            $totals['total_cost'] ?? 0,
            $totals['total_profit'] ?? 0,
            $jobFileId
        ]);
    }
}
?>