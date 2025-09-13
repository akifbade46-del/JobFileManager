-- Job File Management System - MySQL Database Schema
-- Currency: KWD (Kuwaiti Dinar)
-- Compatible with shared hosting

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS `job_management_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- USE `job_management_system`;

-- =====================================================
-- USERS TABLE (Admin, Checker, User roles)
-- =====================================================
CREATE TABLE `users` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','checker','user') NOT NULL DEFAULT 'user',
  `status` enum('active','pending','blocked') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- CLIENTS TABLE (Shippers and Consignees)
-- =====================================================
CREATE TABLE `clients` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('shipper','consignee','both') NOT NULL DEFAULT 'both',
  `address` text,
  `contact` varchar(255) NOT NULL,
  `email` varchar(255),
  `phone` varchar(50),
  `notes` text,
  `total_jobs` int(11) NOT NULL DEFAULT 0,
  `last_job_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_clients_name` (`name`),
  INDEX `idx_clients_type` (`type`),
  INDEX `idx_clients_last_job` (`last_job_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- JOB FILES TABLE (Main job file records)
-- =====================================================
CREATE TABLE `job_files` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_file_no` varchar(100) NOT NULL UNIQUE,
  `opening_date` timestamp NOT NULL,
  `billing_date` timestamp NULL DEFAULT NULL,
  
  -- Shipper details
  `shipper_id` int(11) UNSIGNED,
  `shipper_name` varchar(255) NOT NULL,
  `shipper_address` text,
  `shipper_contact` varchar(255),
  
  -- Consignee details
  `consignee_id` int(11) UNSIGNED,
  `consignee_name` varchar(255) NOT NULL,
  `consignee_address` text,
  `consignee_contact` varchar(255),
  
  -- Agent details
  `agent` varchar(255),
  `agent_ref` varchar(100),
  
  -- Transportation details
  `vessel` varchar(255),
  `voyage` varchar(100),
  `pol` varchar(255) COMMENT 'Port of Loading',
  `pod` varchar(255) COMMENT 'Port of Discharge',
  `etd` timestamp NULL DEFAULT NULL COMMENT 'Estimated Time of Departure',
  `eta` timestamp NULL DEFAULT NULL COMMENT 'Estimated Time of Arrival',
  
  -- Container details
  `container_no` varchar(100),
  `seal_no` varchar(100),
  `container_size` varchar(50),
  
  -- Documentation
  `bl_no` varchar(100) COMMENT 'Bill of Lading',
  `invoice_no` varchar(100),
  `lc_no` varchar(100) COMMENT 'Letter of Credit',
  
  -- Financial totals (KWD currency)
  `total_sell` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Total in KWD',
  `total_cost` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Total in KWD', 
  `total_profit` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Total in KWD',
  
  -- Status and workflow
  `status` enum('pending','checked','approved','rejected') NOT NULL DEFAULT 'pending',
  
  -- Tracking (user assignments)
  `prepared_by` int(11) UNSIGNED NOT NULL,
  `checked_by` int(11) UNSIGNED,
  `approved_by` int(11) UNSIGNED,
  `rejected_by` int(11) UNSIGNED,
  `checked_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text,
  
  -- Notes
  `description` text,
  `notes` text,
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_files_no_unique` (`job_file_no`),
  INDEX `idx_job_files_status` (`status`),
  INDEX `idx_job_files_opening_date` (`opening_date`),
  INDEX `idx_job_files_prepared_by` (`prepared_by`),
  INDEX `idx_job_files_shipper` (`shipper_id`),
  INDEX `idx_job_files_consignee` (`consignee_id`),
  
  FOREIGN KEY (`shipper_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`consignee_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`prepared_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- JOB FILE ITEMS TABLE (Line items for each job)
-- =====================================================
CREATE TABLE `job_file_items` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_file_id` int(11) UNSIGNED NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit` varchar(50),
  `sell_rate` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Rate in KWD',
  `cost_rate` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Rate in KWD',
  `sell_amount` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Amount in KWD',
  `cost_amount` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Amount in KWD',
  `profit` decimal(12,3) NOT NULL DEFAULT '0.000' COMMENT 'Profit in KWD',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_job_file_items_job_id` (`job_file_id`),
  
  FOREIGN KEY (`job_file_id`) REFERENCES `job_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- ACTIVITY LOGS TABLE (Audit trail)
-- =====================================================
CREATE TABLE `activity_logs` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_file_id` int(11) UNSIGNED,
  `user_id` int(11) UNSIGNED NOT NULL,
  `action` varchar(100) NOT NULL COMMENT 'created, checked, approved, rejected, updated',
  `old_status` enum('pending','checked','approved','rejected'),
  `new_status` enum('pending','checked','approved','rejected'),
  `details` text,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_activity_logs_job_file` (`job_file_id`),
  INDEX `idx_activity_logs_user` (`user_id`),
  INDEX `idx_activity_logs_timestamp` (`timestamp`),
  
  FOREIGN KEY (`job_file_id`) REFERENCES `job_files` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- LOGIN ATTEMPTS TABLE (Rate limiting)
-- =====================================================
CREATE TABLE `login_attempts` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `email` varchar(255),
  `attempts` int(11) NOT NULL DEFAULT 1,
  `blocked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_login_attempts_ip` (`ip_address`),
  INDEX `idx_login_attempts_email` (`email`),
  INDEX `idx_login_attempts_blocked` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- SYSTEM SETTINGS TABLE (Configuration)
-- =====================================================
CREATE TABLE `system_settings` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text,
  `description` varchar(255),
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- DEFAULT SYSTEM SETTINGS
-- =====================================================
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('currency_code', 'KWD', 'System currency code'),
('currency_symbol', 'KWD', 'Currency symbol for display'),
('decimal_places', '3', 'Number of decimal places for KWD'),
('company_name', 'Q''go Cargo', 'Company name for system'),
('max_login_attempts', '5', 'Maximum login attempts before blocking'),
('login_block_duration', '15', 'Login block duration in minutes');

-- =====================================================
-- CREATE DEFAULT ADMIN USER
-- Password: admin123 (hashed)
-- =====================================================
INSERT INTO `users` (`name`, `email`, `password`, `role`, `status`) VALUES
('System Administrator', 'admin@system.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- =====================================================
-- SAMPLE CLIENTS DATA
-- =====================================================
INSERT INTO `clients` (`name`, `type`, `contact`, `email`, `phone`, `address`) VALUES
('Kuwait Shipping Co.', 'shipper', 'Ahmed Al-Mahmoud', 'ahmed@kuwaitshipping.com', '+965-2234-5678', 'Shuwaikh Port, Kuwait City, Kuwait'),
('Gulf Trading LLC', 'consignee', 'Fatima Al-Sabah', 'fatima@gulftrading.com', '+965-2345-6789', 'Ahmadi Industrial Area, Kuwait'),
('Middle East Logistics', 'both', 'Omar Al-Rashid', 'omar@melogistics.com', '+965-2456-7890', 'Farwaniya, Kuwait City, Kuwait');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Job Files with User Names
CREATE VIEW `job_files_with_users` AS
SELECT 
  jf.*,
  u_prep.name as prepared_by_name,
  u_check.name as checked_by_name,
  u_approve.name as approved_by_name,
  u_reject.name as rejected_by_name,
  c_shipper.name as shipper_client_name,
  c_consignee.name as consignee_client_name
FROM job_files jf
LEFT JOIN users u_prep ON jf.prepared_by = u_prep.id
LEFT JOIN users u_check ON jf.checked_by = u_check.id  
LEFT JOIN users u_approve ON jf.approved_by = u_approve.id
LEFT JOIN users u_reject ON jf.rejected_by = u_reject.id
LEFT JOIN clients c_shipper ON jf.shipper_id = c_shipper.id
LEFT JOIN clients c_consignee ON jf.consignee_id = c_consignee.id;

-- View: Analytics Summary
CREATE VIEW `analytics_summary` AS
SELECT 
  COUNT(*) as total_jobs,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs,
  SUM(CASE WHEN status = 'checked' THEN 1 ELSE 0 END) as checked_jobs,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_jobs,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_jobs,
  SUM(total_sell) as total_revenue_kwd,
  SUM(total_cost) as total_cost_kwd,
  SUM(total_profit) as total_profit_kwd,
  AVG(total_profit) as avg_profit_kwd
FROM job_files;

COMMIT;