-- ==============================================================
-- QUIZSPHERE 3D — COMPLETE MYSQL DATABASE EXPORT
-- Database: quiz_db
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Ready for direct import via phpMyAdmin, MySQL Workbench, or CLI
-- ==============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- Database: `quiz_db`
-- --------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `quiz_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quiz_db`;

-- --------------------------------------------------------
-- Table structure for table `admin_users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_users`
-- Default credentials: admin / admin123
--
INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `created_at`) VALUES
(1, 'admin', 'admin123', current_timestamp());

-- --------------------------------------------------------
-- Table structure for table `admin_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `admin_tokens`;
CREATE TABLE `admin_tokens` (
  `token` varchar(128) NOT NULL,
  `username` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`token`),
  KEY `idx_token_user` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Drop child table first, then parent table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `quiz_answers`;
DROP TABLE IF EXISTS `quiz_submissions`;

-- --------------------------------------------------------
-- Table structure for table `quiz_submissions`
-- Master record of each challenger's attempt
-- --------------------------------------------------------
CREATE TABLE `quiz_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_name` varchar(100) NOT NULL,
  `total_score` int(11) NOT NULL DEFAULT 0,
  `accuracy_percent` int(11) NOT NULL DEFAULT 0,
  `trivia_correct` int(11) NOT NULL DEFAULT 0,
  `total_trivia` int(11) NOT NULL DEFAULT 0,
  `paragraphs_count` int(11) NOT NULL DEFAULT 0,
  `max_streak` int(11) NOT NULL DEFAULT 0,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_player_name` (`player_name`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `quiz_answers`
-- Stores all 25 individual answers, chosen options, and full paragraphs
-- --------------------------------------------------------
CREATE TABLE `quiz_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `submission_id` int(11) NOT NULL,
  `question_number` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `question_type` varchar(20) NOT NULL COMMENT 'mcq, mcq_opinion, or paragraph',
  `question_text` text NOT NULL,
  `user_response` longtext NOT NULL COMMENT 'Chosen option or full written paragraph',
  `correct_answer` varchar(255) DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_submission_id` (`submission_id`),
  KEY `idx_question_number` (`question_number`),
  CONSTRAINT `fk_submission_id` FOREIGN KEY (`submission_id`) REFERENCES `quiz_submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
