-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 27, 2026 at 07:58 PM
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
  `action_type` varchar(100) NOT NULL,
  `details` text NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audits_logstable`
--

INSERT INTO `audits_logstable` (`log_id`, `user_id`, `action_type`, `details`, `timestamp`) VALUES
(1, 6, 'Process Document', 'Updated Request #47 to status: Ready to Print', '2026-04-05 06:48:20'),
(2, 6, 'Process Document', 'Updated Request #47 to status: Released', '2026-04-05 06:48:21'),
(3, 6, 'Process Document', 'Updated Request #48 to status: Ready to Print', '2026-04-05 06:48:46'),
(4, 6, 'Process Document', 'Updated Request #48 to status: Released', '2026-04-05 06:48:54'),
(5, 6, 'Process Document', 'Updated Request #49 to status: Ready to Print', '2026-04-05 06:52:42'),
(6, 6, 'Process Document', 'Updated Request #49 to status: Released', '2026-04-05 06:52:43'),
(7, 6, 'Process Document', 'Updated Request #50 to status: Ready to Print', '2026-04-05 06:53:32'),
(8, 6, 'Process Document', 'Updated Request #50 to status: Released', '2026-04-05 06:53:38'),
(9, 6, 'Process Document', 'Updated Request #51 to status: Ready to Print', '2026-04-05 06:55:01'),
(10, 6, 'Process Document', 'Updated Request #51 to status: Released', '2026-04-05 06:55:03'),
(11, 6, 'Process Document', 'Updated Request #52 to status: Ready to Print', '2026-04-05 06:59:17'),
(12, 6, 'Process Document', 'Updated Request #53 to status: Ready to Print', '2026-04-05 06:59:59'),
(13, 6, 'Reject Document', 'Rejected Request #55. Reason: Wrong Photo', '2026-04-05 07:17:04'),
(14, 6, 'Process Document', 'Updated Request #52 to status: Released', '2026-04-05 07:18:07'),
(15, 6, 'Reject Document', 'Rejected Request #56. Reason: Wrong File', '2026-04-05 07:22:01'),
(16, 4, 'Process Document', 'Updated Request #57 to status: Ready to Print', '2026-04-05 07:25:56'),
(17, 4, 'Process Document', 'Updated Request #57 to status: Released', '2026-04-05 07:25:59'),
(18, 4, 'Reject Document', 'Rejected Request #58. Reason: weq', '2026-04-05 07:26:01'),
(19, 5, 'Process Document', 'Updated Request #53 to status: Released', '2026-04-05 08:13:37'),
(20, 5, 'Process Document', 'Updated Request #59 to status: Ready to Print', '2026-04-05 08:19:12'),
(21, 5, 'Process Document', 'Updated Request #59 to status: Released', '2026-04-05 08:22:02'),
(22, 5, 'Reject Document', 'Rejected Request #61. Reason: ihh', '2026-04-05 08:35:53'),
(23, 5, 'Process Document', 'Updated Request #62 to status: Ready to Print', '2026-04-05 08:36:05'),
(24, 5, 'Process Document', 'Updated Request #62 to status: Released', '2026-04-05 08:36:14'),
(25, 5, 'Process Document', 'Updated Request #63 to status: Ready to Print', '2026-04-05 08:52:36'),
(26, 5, 'Process Document', 'Updated Request #63 to status: Released', '2026-04-05 08:53:01'),
(27, 5, 'Process Document', 'Updated Request #65 to status: Ready to Print', '2026-04-05 08:53:59'),
(28, 5, 'Reject Document', 'Rejected Request #64. Reason: No reason\n', '2026-04-05 09:02:47'),
(29, 6, 'Process Document', 'Updated Request #65 to status: Released', '2026-04-05 09:03:16'),
(30, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-28 07:28:32'),
(31, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-28 07:28:37'),
(32, 5, 'Account Update', 'Updated official profile for: Ivan sheehs', '2026-04-28 07:28:43'),
(33, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-28 08:15:02'),
(34, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 8', '2026-04-28 08:15:02'),
(35, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 8', '2026-04-28 08:15:03'),
(36, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-28 08:15:38'),
(37, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:36'),
(38, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:37'),
(39, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:38'),
(40, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:38'),
(41, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:38'),
(42, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:38'),
(43, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:39'),
(44, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:39'),
(45, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:39'),
(46, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:39'),
(47, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:39'),
(48, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:40'),
(49, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:40'),
(50, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:20:40'),
(51, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:20:40'),
(52, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:21:01'),
(53, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:21:01'),
(54, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:21:02'),
(55, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 14:21:45'),
(56, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 14:21:53'),
(57, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 8', '2026-04-29 14:22:44'),
(58, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 8', '2026-04-29 14:22:44'),
(59, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 8', '2026-04-29 14:22:45'),
(60, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 8', '2026-04-29 14:22:45'),
(61, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 8', '2026-04-29 14:22:46'),
(62, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 8', '2026-04-29 14:23:34'),
(63, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 10', '2026-04-29 14:24:06'),
(64, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 10', '2026-04-29 14:24:31'),
(65, 10, 'Process Document', 'Updated Request #66 to status: Ready to Print', '2026-04-29 14:24:34'),
(66, 10, 'Process Document', 'Updated Request #66 to status: Released', '2026-04-29 14:24:53'),
(67, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 10', '2026-04-29 14:25:43'),
(68, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 10', '2026-04-29 14:25:43'),
(69, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 10', '2026-04-29 14:25:44'),
(70, 5, 'Account Update', 'Updated official profile for: Bibar', '2026-04-29 14:26:34'),
(71, 5, 'Account Update', 'Updated resident profile for: Juan Luna', '2026-04-29 14:26:50'),
(72, 5, 'Account Update', 'Updated resident profile for: Juan Luna', '2026-04-29 14:27:45'),
(73, 10, 'Process Document', 'Updated Request #67 to status: Ready to Print', '2026-04-29 14:28:01'),
(74, 10, 'Reject Document', 'Rejected Request #68. Reason: ew', '2026-04-29 14:28:05'),
(75, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 23:08:27'),
(76, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 23:08:29'),
(77, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 23:09:33'),
(78, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-04-29 23:10:20'),
(79, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-04-29 23:10:49'),
(80, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-05-04 19:29:24'),
(81, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-05-04 19:29:34'),
(82, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-05-04 19:29:34'),
(83, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-05-04 19:29:41'),
(84, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-05-04 19:29:41'),
(85, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-05-04 19:30:40'),
(86, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-05-04 19:32:53'),
(87, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-05-04 19:33:04'),
(88, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-05-04 19:42:57'),
(89, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-05-04 19:42:58'),
(90, 5, 'Privilege Change', 'Pending Review access REVOKED for Staff ID: 9', '2026-05-04 19:46:35'),
(91, 5, 'Privilege Change', 'Pending Review access GRANTED for Staff ID: 9', '2026-05-04 19:46:39');

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
  `auth_token` varchar(255) DEFAULT NULL,
  `can_review` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barangay_officialstable`
--

INSERT INTO `barangay_officialstable` (`official_id`, `username`, `full_name`, `password_hash`, `role`, `account_status`, `last_login`, `created_by`, `auth_token`, `can_review`) VALUES
(5, 'admin1', 'Super Admin', '$2b$10$0NAbAj40rolvTSwR07Eww.cD4awIL7vYUOot7F6/.22LkwZVlt4su', 'Admin', 'Active', NULL, NULL, NULL, 1),
(8, 'staff2', 'Owen', '$2b$10$N51920jF5e9SKv.ZLtGx6.Vpq/hJondrCT4Ye5tveYw.c8/x6dISu', 'Staff', 'Active', NULL, NULL, NULL, 0),
(9, 'staff1', 'Ivan sheehs', '$2b$10$x61JURhA0.sXffN14x1LPOkrt/2kkbAiPJfHRbzoIyEtz68mZrP/u', 'Staff', 'Active', NULL, NULL, NULL, 1),
(10, 'staff3', 'Bibar', '$2b$10$cnzNNUym352excUf49EPeOJKDDLqr5tB2tZqAN2/Tw48jTs.2KmGe', 'Staff', 'Active', NULL, NULL, NULL, 0);

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
  `status` varchar(50) DEFAULT 'Pending',
  `date_requested` timestamp NOT NULL DEFAULT current_timestamp(),
  `pick_up_date` date DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `requirement_file` varchar(255) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_requesttable`
--

INSERT INTO `document_requesttable` (`request_id`, `resident_id`, `doc_type_id`, `processed_by`, `status`, `date_requested`, `pick_up_date`, `rejection_reason`, `purpose`, `requirement_file`, `remarks`) VALUES
(61, 3, 3, NULL, 'Rejected', '2026-04-05 00:31:47', NULL, NULL, 'Business', 'uploads/req_1775349107947.pdf', 'ihh'),
(62, 3, 1, NULL, 'Released', '2026-04-05 00:35:37', NULL, NULL, 'qwe', 'uploads/req_1775349337500.pdf', NULL),
(63, 3, 1, NULL, 'Released', '2026-04-05 00:52:02', NULL, NULL, 'School', 'uploads/req_1775350322755.pdf', NULL),
(64, 3, 1, NULL, 'Rejected', '2026-04-05 00:53:30', NULL, NULL, '23', 'uploads/req_1775350410038.pdf', 'No reason\n'),
(65, 3, 3, NULL, 'Released', '2026-04-05 00:53:41', NULL, NULL, '234', 'uploads/req_1775350421664.png', NULL),
(66, 3, 1, NULL, 'Released', '2026-04-27 19:07:07', NULL, NULL, 'School', 'uploads/req_1777316827100.pdf', NULL),
(67, 3, 2, NULL, 'Ready to Print', '2026-04-29 06:18:35', NULL, NULL, 'School', 'uploads/req_1777443515277.png', NULL),
(68, 3, 2, NULL, 'Rejected', '2026-04-29 06:18:51', NULL, NULL, 'we', 'uploads/req_1777443531386.png', 'ew'),
(69, 3, 1, NULL, 'Pending', '2026-05-04 11:36:48', NULL, NULL, 'School', 'uploads/req_1777894608020.pdf', NULL);

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
(1, 'Barangay Clearance', NULL, 'Standard clearance for employment and ID purposes', 60.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-04 21:11:33', NULL),
(2, 'Certificate of Indigency', NULL, NULL, 30.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-04 21:12:36', NULL),
(3, 'Business Permit', NULL, NULL, 150.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-05 00:31:16', NULL);

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
(40, 61, NULL, 1, 'Waiting', '2026-04-05 00:31:47', NULL),
(41, 62, NULL, 2, 'Waiting', '2026-04-05 00:35:37', NULL),
(42, 63, NULL, 3, 'Waiting', '2026-04-05 00:52:02', NULL),
(43, 64, NULL, 4, 'Waiting', '2026-04-05 00:53:30', NULL),
(44, 65, NULL, 5, 'Waiting', '2026-04-05 00:53:41', NULL),
(45, 66, NULL, 1, 'Waiting', '2026-04-27 19:07:07', NULL),
(46, 67, NULL, 1, 'Waiting', '2026-04-29 06:18:35', NULL),
(47, 68, NULL, 2, 'Waiting', '2026-04-29 06:18:51', NULL),
(48, 69, NULL, 1, 'Waiting', '2026-05-04 11:36:48', NULL);

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
  `account_status` varchar(50) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resident_profiletable`
--

INSERT INTO `resident_profiletable` (`resident_id`, `last_name`, `first_name`, `middle_name`, `date_of_birth`, `civil_status`, `addres_street`, `contact_number`, `email_address`, `password_hash`, `id_proof_image`, `account_status`) VALUES
(3, 'De Dios', 'Owen Hart', NULL, '2006-03-06', NULL, 'Bulacan', '09176843479', 'dediosowen@gmail.com', '$2b$10$qNyfCC/BKB3DzPH9Q25TwOAGnuySUVpX6hksREBlm25AmI0sylC0u', NULL, 'Active'),
(4, 'Luna', 'Juan', NULL, '2006-06-03', NULL, 'Bulacan', '09123984098', 'juan@test.com', '$2b$10$3tL1KiNkZMmCWhWuVj4eUu2ILVPBZ/cl6As6sPZ.lyN/Fy2n9LgcC', NULL, 'Active');

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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `barangay_officialstable`
--
ALTER TABLE `barangay_officialstable`
  MODIFY `official_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `digital_signaturetable`
--
ALTER TABLE `digital_signaturetable`
  MODIFY `signature_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_requesttable`
--
ALTER TABLE `document_requesttable`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `document_templatetable`
--
ALTER TABLE `document_templatetable`
  MODIFY `doc_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `password_resettable`
--
ALTER TABLE `password_resettable`
  MODIFY `Reset_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `queue_managementtable`
--
ALTER TABLE `queue_managementtable`
  MODIFY `queue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `resident_profiletable`
--
ALTER TABLE `resident_profiletable`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
