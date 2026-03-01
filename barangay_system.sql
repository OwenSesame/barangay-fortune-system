-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2026 at 06:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `barangay_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `audits_logstable`
--

CREATE TABLE `audits_logstable` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('Resident','Official') NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `table_affected` varchar(100) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `barangay_officialstable`
--

CREATE TABLE `barangay_officialstable` (
  `official_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Staff','Admin') NOT NULL,
  `account_status` varchar(50) DEFAULT 'Active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `auth_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barangay_officialstable`
--

INSERT INTO `barangay_officialstable` (`official_id`, `username`, `full_name`, `password_hash`, `role`, `account_status`, `last_login`, `created_by`, `auth_token`) VALUES
(1, 'staff_user', NULL, '$2b$10$0w4TYeYoSzWmhh3SUwORPuvuxkEdQ3iQdQWqDAhK.uFBG0x8MlV76', 'Staff', 'Active', NULL, NULL, NULL),
(2, 'admin_user', NULL, '$2b$10$0w4TYeYoSzWmhh3SUwORPuvuxkEdQ3iQdQWqDAhK.uFBG0x8MlV76', 'Admin', 'Active', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `digital_signaturetable`
--

CREATE TABLE `digital_signaturetable` (
  `signature_id` int(11) NOT NULL,
  `official_id` int(11) NOT NULL,
  `checksum` varchar(255) DEFAULT NULL,
  `signature_blob` longblob DEFAULT NULL,
  `encryption_key` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Active',
  `expiry_date` date DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_requesttable`
--

CREATE TABLE `document_requesttable` (
  `request_id` int(11) NOT NULL,
  `resident_id` int(11) NOT NULL,
  `doc_type_id` int(11) NOT NULL,
  `processed_by` int(11) DEFAULT NULL,
  `status` enum('Pending','Processing','Ready to Print','Printed','Denied','Completed') DEFAULT 'Pending',
  `date_requested` timestamp NOT NULL DEFAULT current_timestamp(),
  `pick_up_date` date DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_requesttable`
--

INSERT INTO `document_requesttable` (`request_id`, `resident_id`, `doc_type_id`, `processed_by`, `status`, `date_requested`, `pick_up_date`, `rejection_reason`) VALUES
(1, 1, 1, 1, 'Ready to Print', '2026-03-01 15:24:54', NULL, NULL),
(2, 1, 1, NULL, 'Pending', '2026-03-01 15:25:10', NULL, NULL),
(3, 1, 1, 2, 'Ready to Print', '2026-03-01 15:25:11', NULL, NULL),
(4, 1, 1, NULL, 'Pending', '2026-03-01 15:25:11', NULL, NULL),
(5, 1, 1, NULL, 'Pending', '2026-03-01 15:37:49', NULL, NULL),
(6, 1, 1, NULL, 'Pending', '2026-03-01 15:53:50', NULL, NULL),
(7, 2, 1, 2, 'Ready to Print', '2026-03-01 16:20:17', NULL, NULL),
(8, 2, 1, NULL, 'Pending', '2026-03-01 16:21:18', NULL, NULL),
(9, 2, 1, NULL, 'Pending', '2026-03-01 16:21:31', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_templatetable`
--

CREATE TABLE `document_templatetable` (
  `doc_type_id` int(11) NOT NULL,
  `doc_name` varchar(100) NOT NULL,
  `template_structure` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `base_fee` decimal(10,2) DEFAULT 0.00,
  `layout_config` text DEFAULT NULL,
  `paper_size` varchar(50) DEFAULT NULL,
  `template_file` varchar(255) DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `validity_days` int(11) DEFAULT NULL,
  `available` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_templatetable`
--

INSERT INTO `document_templatetable` (`doc_type_id`, `doc_name`, `template_structure`, `description`, `base_fee`, `layout_config`, `paper_size`, `template_file`, `requirements`, `validity_days`, `available`, `updated_at`, `updated_by`) VALUES
(1, 'Barangay Clearance', NULL, 'Standard clearance for employment and ID purposes', 50.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-01 15:20:19', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `password_resettable`
--

CREATE TABLE `password_resettable` (
  `Reset_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `ip_request` varchar(45) DEFAULT NULL,
  `attempt_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queue_managementtable`
--

CREATE TABLE `queue_managementtable` (
  `queue_id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `official_id` int(11) DEFAULT NULL,
  `daily_sequence_no` int(11) NOT NULL,
  `service_status` varchar(50) DEFAULT 'Waiting',
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `called_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `queue_managementtable`
--

INSERT INTO `queue_managementtable` (`queue_id`, `request_id`, `official_id`, `daily_sequence_no`, `service_status`, `generated_at`, `called_at`) VALUES
(1, 1, 1, 1, 'Serving', '2026-03-01 15:24:54', '2026-03-01 15:46:08'),
(2, 2, 2, 2, 'Serving', '2026-03-01 15:25:10', '2026-03-01 15:48:07'),
(3, 3, NULL, 3, 'Waiting', '2026-03-01 15:25:11', NULL),
(4, 4, 2, 4, 'Serving', '2026-03-01 15:25:11', '2026-03-01 15:54:16'),
(5, 5, NULL, 5, 'Waiting', '2026-03-01 15:37:49', NULL),
(6, 6, NULL, 6, 'Waiting', '2026-03-01 15:53:50', NULL),
(7, 7, NULL, 7, 'Waiting', '2026-03-01 16:20:17', NULL),
(8, 8, NULL, 7, 'Waiting', '2026-03-01 16:21:18', NULL),
(9, 9, NULL, 7, 'Waiting', '2026-03-01 16:21:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `resident_profiletable`
--

CREATE TABLE `resident_profiletable` (
  `resident_id` int(11) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `civil_status` varchar(50) DEFAULT NULL,
  `addres_street` varchar(255) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email_address` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_proof_image` varchar(255) DEFAULT NULL,
  `account_status` varchar(50) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resident_profiletable`
--

INSERT INTO `resident_profiletable` (`resident_id`, `last_name`, `first_name`, `middle_name`, `date_of_birth`, `civil_status`, `addres_street`, `contact_number`, `email_address`, `password_hash`, `id_proof_image`, `account_status`) VALUES
(1, 'Dela Cruz', 'Juan', NULL, '1995-10-15', NULL, '123 Fortune Street', '09123456789', 'juan@test.com', 'dummy_hash_for_now', NULL, 'Suspended'),
(2, 'De Dios', 'Owen', NULL, '2006-03-06', NULL, 'bulacan', '09176843479', 'dediosowen@gmail.com', '$2b$10$hz6f.ncAVuESR4rSCqRsl.1SEsQTyjiAE4PGjEhZwHNK/2svrHbvi', NULL, 'Suspended');

-- --------------------------------------------------------

--
-- Table structure for table `system_settingstable`
--

CREATE TABLE `system_settingstable` (
  `setting_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `data_type` varchar(50) DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `is_encrypted` tinyint(1) DEFAULT 0,
  `category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audits_logstable`
--
ALTER TABLE `audits_logstable`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `barangay_officialstable`
--
ALTER TABLE `barangay_officialstable`
  ADD PRIMARY KEY (`official_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `digital_signaturetable`
--
ALTER TABLE `digital_signaturetable`
  ADD PRIMARY KEY (`signature_id`),
  ADD KEY `official_id` (`official_id`);

--
-- Indexes for table `document_requesttable`
--
ALTER TABLE `document_requesttable`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `resident_id` (`resident_id`),
  ADD KEY `doc_type_id` (`doc_type_id`),
  ADD KEY `processed_by` (`processed_by`);

--
-- Indexes for table `document_templatetable`
--
ALTER TABLE `document_templatetable`
  ADD PRIMARY KEY (`doc_type_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `password_resettable`
--
ALTER TABLE `password_resettable`
  ADD PRIMARY KEY (`Reset_id`);

--
-- Indexes for table `queue_managementtable`
--
ALTER TABLE `queue_managementtable`
  ADD PRIMARY KEY (`queue_id`),
  ADD KEY `request_id` (`request_id`),
  ADD KEY `official_id` (`official_id`);

--
-- Indexes for table `resident_profiletable`
--
ALTER TABLE `resident_profiletable`
  ADD PRIMARY KEY (`resident_id`),
  ADD UNIQUE KEY `email_address` (`email_address`);

--
-- Indexes for table `system_settingstable`
--
ALTER TABLE `system_settingstable`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audits_logstable`
--
ALTER TABLE `audits_logstable`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `barangay_officialstable`
--
ALTER TABLE `barangay_officialstable`
  MODIFY `official_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `digital_signaturetable`
--
ALTER TABLE `digital_signaturetable`
  MODIFY `signature_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_requesttable`
--
ALTER TABLE `document_requesttable`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `document_templatetable`
--
ALTER TABLE `document_templatetable`
  MODIFY `doc_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `password_resettable`
--
ALTER TABLE `password_resettable`
  MODIFY `Reset_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `queue_managementtable`
--
ALTER TABLE `queue_managementtable`
  MODIFY `queue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `resident_profiletable`
--
ALTER TABLE `resident_profiletable`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `system_settingstable`
--
ALTER TABLE `system_settingstable`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `barangay_officialstable`
--
ALTER TABLE `barangay_officialstable`
  ADD CONSTRAINT `barangay_officialstable_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `barangay_officialstable` (`official_id`) ON DELETE SET NULL;

--
-- Constraints for table `digital_signaturetable`
--
ALTER TABLE `digital_signaturetable`
  ADD CONSTRAINT `digital_signaturetable_ibfk_1` FOREIGN KEY (`official_id`) REFERENCES `barangay_officialstable` (`official_id`) ON DELETE CASCADE;

--
-- Constraints for table `document_requesttable`
--
ALTER TABLE `document_requesttable`
  ADD CONSTRAINT `document_requesttable_ibfk_1` FOREIGN KEY (`resident_id`) REFERENCES `resident_profiletable` (`resident_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_requesttable_ibfk_2` FOREIGN KEY (`doc_type_id`) REFERENCES `document_templatetable` (`doc_type_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_requesttable_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `barangay_officialstable` (`official_id`) ON DELETE SET NULL;

--
-- Constraints for table `document_templatetable`
--
ALTER TABLE `document_templatetable`
  ADD CONSTRAINT `document_templatetable_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `barangay_officialstable` (`official_id`) ON DELETE SET NULL;

--
-- Constraints for table `queue_managementtable`
--
ALTER TABLE `queue_managementtable`
  ADD CONSTRAINT `queue_managementtable_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `document_requesttable` (`request_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `queue_managementtable_ibfk_2` FOREIGN KEY (`official_id`) REFERENCES `barangay_officialstable` (`official_id`) ON DELETE SET NULL;

--
-- Constraints for table `system_settingstable`
--
ALTER TABLE `system_settingstable`
  ADD CONSTRAINT `system_settingstable_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `barangay_officialstable` (`official_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
