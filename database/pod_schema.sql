-- POD (Proof of Delivery) System Database Schema
-- Extension to existing Job File Management System
-- Compatible with shared hosting MySQL

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- UPDATE USERS TABLE - Add driver and supervisor roles
-- =====================================================
ALTER TABLE `users` 
MODIFY COLUMN `role` enum('admin','checker','user','driver','supervisor') NOT NULL DEFAULT 'user';

-- =====================================================
-- POD DELIVERIES TABLE (Main delivery tracking)
-- =====================================================
CREATE TABLE `pod_deliveries` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `delivery_id` varchar(100) NOT NULL UNIQUE COMMENT 'Unique delivery identifier',
  
  -- Job file connection
  `job_file_id` int(11) UNSIGNED NOT NULL,
  `job_file_no` varchar(100) NOT NULL,
  
  -- Assignment details
  `assigned_by` int(11) UNSIGNED NOT NULL COMMENT 'User ID who assigned',
  `driver_id` int(11) UNSIGNED NOT NULL COMMENT 'Assigned driver',
  `driver_name` varchar(255) NOT NULL,
  
  -- Delivery details from job file
  `origin` varchar(255),
  `destination` varchar(255),
  `airlines` varchar(255),
  `mawb` varchar(100) COMMENT 'Master Airway Bill',
  `invoice_no` varchar(100),
  `delivery_location` text NOT NULL,
  
  -- Status tracking
  `status` enum('pending','assigned','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `priority` enum('normal','urgent','high') NOT NULL DEFAULT 'normal',
  
  -- Completion details
  `receiver_name` varchar(255) NULL,
  `receiver_mobile` varchar(50) NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  
  -- Additional info
  `additional_notes` text,
  `special_instructions` text,
  
  -- Timestamps
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_id_unique` (`delivery_id`),
  INDEX `idx_pod_deliveries_status` (`status`),
  INDEX `idx_pod_deliveries_job_file` (`job_file_id`),
  INDEX `idx_pod_deliveries_driver` (`driver_id`),
  INDEX `idx_pod_deliveries_assigned_at` (`assigned_at`),
  
  FOREIGN KEY (`job_file_id`) REFERENCES `job_files` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- POD COMPLETIONS TABLE (Proof of delivery with signatures)
-- =====================================================
CREATE TABLE `pod_completions` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `delivery_id` varchar(100) NOT NULL UNIQUE,
  `job_file_id` int(11) UNSIGNED NOT NULL,
  `driver_id` int(11) UNSIGNED NOT NULL,
  
  -- Delivery completion details
  `receiver_name` varchar(255) NOT NULL,
  `receiver_mobile` varchar(50),
  `delivery_date` timestamp NOT NULL,
  `delivery_notes` text,
  
  -- Signature data (base64 encoded)
  `signature_data` longtext NOT NULL COMMENT 'Base64 encoded signature',
  `signature_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Location and verification
  `gps_latitude` decimal(10, 8) NULL,
  `gps_longitude` decimal(11, 8) NULL,
  `delivery_photo` text NULL COMMENT 'Photo evidence if available',
  
  -- Feedback tracking
  `feedback_status` enum('pending','submitted','skipped') NOT NULL DEFAULT 'pending',
  `feedback_link_sent` boolean NOT NULL DEFAULT FALSE,
  
  -- Receipt generation
  `receipt_generated` boolean NOT NULL DEFAULT FALSE,
  `qr_code_data` text NULL COMMENT 'QR code for verification',
  
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_completion_unique` (`delivery_id`),
  INDEX `idx_pod_completions_job_file` (`job_file_id`),
  INDEX `idx_pod_completions_driver` (`driver_id`),
  INDEX `idx_pod_completions_date` (`delivery_date`),
  
  FOREIGN KEY (`job_file_id`) REFERENCES `job_files` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- POD FEEDBACK TABLE (Customer ratings and feedback)
-- =====================================================
CREATE TABLE `pod_feedback` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `delivery_id` varchar(100) NOT NULL UNIQUE,
  `job_file_id` int(11) UNSIGNED NOT NULL,
  `driver_id` int(11) UNSIGNED NOT NULL,
  
  -- Rating details
  `rating` tinyint(1) UNSIGNED NOT NULL COMMENT '1-5 star rating',
  `comment` text NULL,
  
  -- Customer details
  `customer_name` varchar(255) NULL,
  `customer_email` varchar(255) NULL,
  `customer_phone` varchar(50) NULL,
  
  -- Device and tracking info
  `device_info` text NULL COMMENT 'Browser/device information',
  `ip_address` varchar(45) NULL,
  `user_agent` text NULL,
  
  -- Timestamps
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `feedback_delivery_unique` (`delivery_id`),
  INDEX `idx_pod_feedback_job_file` (`job_file_id`),
  INDEX `idx_pod_feedback_driver` (`driver_id`),
  INDEX `idx_pod_feedback_rating` (`rating`),
  INDEX `idx_pod_feedback_submitted` (`submitted_at`),
  
  FOREIGN KEY (`job_file_id`) REFERENCES `job_files` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- POD ACTIVITY LOGS TABLE (Audit trail for POD operations)
-- =====================================================
CREATE TABLE `pod_activity_logs` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `delivery_id` varchar(100) NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `action` varchar(100) NOT NULL COMMENT 'assigned, started, completed, cancelled, feedback_received',
  `old_status` varchar(50) NULL,
  `new_status` varchar(50) NULL,
  `details` text NULL,
  `ip_address` varchar(45) NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_pod_logs_delivery` (`delivery_id`),
  INDEX `idx_pod_logs_user` (`user_id`),
  INDEX `idx_pod_logs_action` (`action`),
  INDEX `idx_pod_logs_timestamp` (`timestamp`),
  
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- POD SETTINGS TABLE (Configuration specific to POD system)
-- =====================================================
CREATE TABLE `pod_settings` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text,
  `description` varchar(255),
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `pod_settings_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- DEFAULT POD SETTINGS
-- =====================================================
INSERT INTO `pod_settings` (`setting_key`, `setting_value`, `description`) VALUES
('pod_auto_assign', '0', 'Auto-assign deliveries to available drivers'),
('pod_sms_enabled', '0', 'Enable SMS notifications for POD'),
('pod_email_enabled', '1', 'Enable email notifications for POD'),
('pod_feedback_required', '0', 'Make customer feedback mandatory'),
('pod_gps_required', '0', 'Require GPS location for delivery completion'),
('pod_photo_required', '0', 'Require photo evidence for delivery completion'),
('pod_signature_required', '1', 'Require signature for delivery completion'),
('pod_qr_code_enabled', '1', 'Enable QR codes on delivery receipts');

-- Add some sample drivers for testing (optional)
-- INSERT INTO `users` (`name`, `email`, `password`, `role`, `status`) VALUES
-- ('Sample Driver', 'driver@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', 'active'),
-- ('Sample Supervisor', 'supervisor@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 'active');

COMMIT;