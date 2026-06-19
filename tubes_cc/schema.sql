-- -------------------------------------------------------------
-- SQL Schema & Seed Data for XAMPP MySQL
-- Import this file inside phpMyAdmin or run it in your MySQL client.
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `tubes_cc`;
USE `tubes_cc`;

-- Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS `todos`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `users`;

-- 1. Table structure for users
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Member Accounts
-- Default password for members is username + 123
INSERT INTO `users` (`id`, `username`, `password`) VALUES
(1, 'zaky', 'zaky123'),
(2, 'hafiz', 'hafiz123'),
(3, 'haris', 'haris123'),
(4, 'djordhi', 'djordhi123'),
(5, 'farid', 'farid123')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`), `password`=VALUES(`password`);

-- 2. Table structure for members (Project Contributors)
CREATE TABLE `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `class_room` VARCHAR(50) NOT NULL,
  `nim` VARCHAR(20) NULL,
  `user_id` INT UNIQUE NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Contributors Data linked to users
INSERT INTO `members` (`id`, `name`, `class_room`, `nim`, `user_id`) VALUES 
(1, 'Muhammad Zaky Ryan Ardhiansyah', 'SI-47-05', '102022300380', 1),
(2, 'Muhammad Hafiz Nur Irawan',      'SI-47-05', '102022300048', 2),
(3, 'Muhammad Haris Caisariyanto',    'SI-47-05', '102022300112', 3),
(4, 'Michail Djordhi',                'SI-47-05', '102022300411', 4),
(5, 'Farid Munadhil',                 'SI-47-05', '102022300235', 5)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `class_room`=VALUES(`class_room`), `nim`=VALUES(`nim`), `user_id`=VALUES(`user_id`);

-- 3. Table structure for todos (Personal Tasks)
CREATE TABLE `todos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;