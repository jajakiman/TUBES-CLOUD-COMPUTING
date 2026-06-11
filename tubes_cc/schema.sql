-- -------------------------------------------------------------
-- SQL Schema & Seed Data for XAMPP MySQL
-- Import this file inside phpMyAdmin or run it in your MySQL client.
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `tubes_cc`;
USE `tubes_cc`;

-- 1. Table structure for users (Admin Credentials)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Admin Credentials
-- Username: admin | Password: admin123
INSERT INTO `users` (`username`, `password`) 
VALUES ('admin', 'admin123')
ON DUPLICATE KEY UPDATE `username`=`username`;


-- 2. Table structure for members (Project Contributors)
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `class_room` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Contributors Data
INSERT INTO `members` (`name`, `class_room`) VALUES 
('Muhammad Zaky Ryan Ardhiansyah', 'SI-47-05'),
('Muhammad Hafiz Nur Irawan', 'SI-47-05'),
('Muhammad Haris Caisariyanto', 'SI-47-05'),
('Michail Djordhi', 'SI-47-05'),
('Farid Munadhil', 'SI-47-05')
ON DUPLICATE KEY UPDATE `name`=`name`;