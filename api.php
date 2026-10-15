<?php
/**
 * QUIZSPHERE 3D — PHP MYSQL API CONTROLLER
 * Connects directly to MySQL database (quiz_db) on localhost:3306 without any bat file.
 * Handles quiz submissions, admin authentication, and full answer retrieval.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Database Configuration
$dbHost = '127.0.0.1';
$dbPort = '3306';
$dbUser = 'root';
$dbPass = '';
$dbName = 'quiz_db';

try {
    // Connect to MySQL
    $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Ensure database exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbName}`");

    // Ensure tables exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS admin_tokens (
            token VARCHAR(128) PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // Ensure default admin user (admin / admin123)
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO admin_users (username, password_hash) VALUES ('admin', 'admin123')");
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'MySQL Connection Failed: ' . $e->getMessage()]);
    exit;
}

// Helper: Read JSON Input
function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?: [];
}

// Helper: Check Admin Auth
function checkAdminAuth($pdo) {
    $headers = getallheaders();
    $token = null;

    if (isset($headers['Authorization']) && preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $m)) {
        $token = trim($m[1]);
    } elseif (isset($headers['authorization']) && preg_match('/Bearer\s+(.*)$/i', $headers['authorization'], $m)) {
        $token = trim($m[1]);
    } elseif (isset($headers['x-admin-token'])) {
        $token = trim($headers['x-admin-token']);
    } elseif (isset($_GET['token'])) {
        $token = trim($_GET['token']);
    }

    if (!$token) return false;

    $stmt = $pdo->prepare("SELECT username FROM admin_tokens WHERE token = ? LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ? $row['username'] : false;
}

// Route handling
$action = $_GET['action'] ?? '';

// ==========================================
// 1. PUBLIC ROUTE: SUBMIT QUIZ ANSWERS
// ==========================================
if ($action === 'submit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();

    $playerName = trim($data['playerName'] ?? '');
    if (!$playerName) {
        http_response_code(400);
        echo json_encode(['error' => 'Player name is required']);
        exit;
    }

    $totalScore = intval($data['totalScore'] ?? 0);
    $accuracy = intval($data['accuracy'] ?? 0);
    $triviaCorrect = intval($data['triviaCorrect'] ?? 0);
    $totalTrivia = intval($data['totalTrivia'] ?? 0);
    $paragraphsCount = intval($data['paragraphsCount'] ?? 0);
    $maxStreak = intval($data['maxStreak'] ?? 0);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    // 1. Insert master record
    $stmt = $pdo->prepare("
        INSERT INTO quiz_submissions 
        (player_name, total_score, accuracy_percent, trivia_correct, total_trivia, paragraphs_count, max_streak, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $playerName, $totalScore, $accuracy, $triviaCorrect, $totalTrivia, $paragraphsCount, $maxStreak, $ip
    ]);
    $submissionId = $pdo->lastInsertId();

    // 2. Insert all individual answers
    $answers = $data['answers'] ?? [];
    if (!empty($answers) && is_array($answers)) {
        $stmtAns = $pdo->prepare("
            INSERT INTO quiz_answers
            (submission_id, question_number, section_name, question_type, question_text, user_response, correct_answer, is_correct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($answers as $idx => $ans) {
            $stmtAns->execute([
                $submissionId,
                intval($ans['number'] ?? ($idx + 1)),
                $ans['section'] ?? 'General',
                $ans['type'] ?? 'mcq',
                $ans['question'] ?? "Question " . ($idx + 1),
                $ans['userResponse'] ?? '',
                $ans['correctAnswer'] ?? null,
                !empty($ans['isCorrect']) ? 1 : 0
            ]);
        }
    }

    echo json_encode(['success' => true, 'submissionId' => $submissionId]);
    exit;
}

// ==========================================
// 2. ADMIN ROUTE: LOGIN
// ==========================================
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && $user['password_hash'] === $password) {
        $token = bin2hex(random_bytes(32));
        $stmtToken = $pdo->prepare("INSERT INTO admin_tokens (token, username) VALUES (?, ?)");
        $stmtToken->execute([$token, $username]);

        echo json_encode(['success' => true, 'token' => $token, 'username' => $username]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid admin username or password']);
    }
    exit;
}

// ==========================================
// 3. ADMIN ROUTE: VERIFY TOKEN
// ==========================================
if ($action === 'verify') {
    $username = checkAdminAuth($pdo);
    if ($username) {
        echo json_encode(['authenticated' => true, 'username' => $username]);
    } else {
        http_response_code(401);
        echo json_encode(['authenticated' => false]);
    }
    exit;
}

// ==========================================
// 4. ADMIN ROUTE: LOGOUT
// ==========================================
if ($action === 'logout') {
    $headers = getallheaders();
    $token = null;
    if (isset($headers['Authorization']) && preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $m)) {
        $token = trim($m[1]);
    } elseif (isset($headers['x-admin-token'])) {
        $token = trim($headers['x-admin-token']);
    }
    if ($token) {
        $pdo->prepare("DELETE FROM admin_tokens WHERE token = ?")->execute([$token]);
    }
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================
// 5. PROTECTED ADMIN ROUTES
// ==========================================
$adminUser = checkAdminAuth($pdo);
if (!$adminUser) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized admin access']);
    exit;
}

// GET SUBMISSIONS LIST
if ($action === 'get_submissions') {
    $stmt = $pdo->query("SELECT * FROM quiz_submissions ORDER BY created_at DESC");
    echo json_encode(['submissions' => $stmt->fetchAll()]);
    exit;
}

// GET SINGLE SUBMISSION DETAIL (ALL ANSWERS & PARAGRAPHS)
if ($action === 'get_submission_detail') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT * FROM quiz_submissions WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $sub = $stmt->fetch();

    if (!$sub) {
        http_response_code(404);
        echo json_encode(['error' => 'Submission not found']);
        exit;
    }

    $stmtAns = $pdo->prepare("SELECT * FROM quiz_answers WHERE submission_id = ? ORDER BY question_number ASC");
    $stmtAns->execute([$id]);
    $answers = $stmtAns->fetchAll();

    echo json_encode(['submission' => $sub, 'answers' => $answers]);
    exit;
}

// DELETE SUBMISSION
if ($action === 'delete_submission') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM quiz_submissions WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'deletedId' => $id]);
    exit;
}

// STATS
if ($action === 'stats') {
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as totalParticipants,
            COALESCE(AVG(total_score), 0) as avgScore,
            COALESCE(AVG(accuracy_percent), 0) as avgAccuracy,
            COALESCE(SUM(paragraphs_count), 0) as totalParagraphs
        FROM quiz_submissions
    ");
    echo json_encode(['stats' => $stmt->fetch()]);
    exit;
}

// Unknown action
http_response_code(400);
echo json_encode(['error' => 'Invalid action parameter']);
