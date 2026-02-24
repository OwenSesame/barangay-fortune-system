-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 24, 2026 at 08:18 AM
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
-- Table structure for table `barangay_officialstable`
--

CREATE TABLE `barangay_officialstable` (
  `official_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Staff','Admin') NOT NULL,
  `account_status` varchar(50) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barangay_officialstable`
--

INSERT INTO `barangay_officialstable` (`official_id`, `username`, `password_hash`, `role`, `account_status`) VALUES
(5, 'staff_user', '$2b$10$omgbAzecxYsKkcukYWRCIuNG4JpSrAJvs7Pi.Dk82hJZk16WqhwOy', 'Staff', 'Active'),
(6, 'admin_user', '$2b$10$omgbAzecxYsKkcukYWRCIuNG4JpSrAJvs7Pi.Dk82hJZk16WqhwOy', 'Admin', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `resident_profiletable`
--

CREATE TABLE `resident_profiletable` (
  `resident_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `addres_street` varchar(255) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email_address` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `account_status` varchar(50) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resident_profiletable`
--

INSERT INTO `resident_profiletable` (`resident_id`, `first_name`, `last_name`, `date_of_birth`, `addres_street`, `contact_number`, `email_address`, `password_hash`, `account_status`) VALUES
(1, 'Owen', 'De Dios', '2006-03-06', 'Meycauayan Bulacan', '09176843479', 'dediosowen@gmail.com', '$2b$10$mHqEhxmI6dR7s8.ZmAiLvevrqbbtQKQzlY48IK6kwiT.BA/6UEUkC', 'Active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `barangay_officialstable`
--
ALTER TABLE `barangay_officialstable`
  ADD PRIMARY KEY (`official_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `resident_profiletable`
--
ALTER TABLE `resident_profiletable`
  ADD PRIMARY KEY (`resident_id`),
  ADD UNIQUE KEY `email_address` (`email_address`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barangay_officialstable`
--
ALTER TABLE `barangay_officialstable`
  MODIFY `official_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `resident_profiletable`
--
ALTER TABLE `resident_profiletable`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
