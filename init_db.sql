-- =======================================================
-- QUIZSPHERE 3D — DATABASE INITIALIZATION SCRIPT (MySQL)
-- =======================================================

CREATE DATABASE IF NOT EXISTS quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quiz_db;

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin User: admin / admin123
INSERT INTO admin_users (id, username, password_hash)
VALUES (1, 'admin', 'admin123')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Quiz Submissions Master Table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(100) NOT NULL,
  total_score INT NOT NULL DEFAULT 0,
  accuracy_percent INT NOT NULL DEFAULT 0,
  trivia_correct INT NOT NULL DEFAULT 0,
  total_trivia INT NOT NULL DEFAULT 0,
  paragraphs_count INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  ip_address VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quiz Answers Detail Table (Stores all answers & heartfelt paragraphs)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  question_number INT NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  question_type VARCHAR(20) NOT NULL,
  question_text TEXT NOT NULL,
  user_response LONGTEXT NOT NULL,
  correct_answer VARCHAR(255) DEFAULT NULL,
  is_correct TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES quiz_submissions(id) ON DELETE CASCADE
);
