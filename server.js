/**
 * QUIZSPHERE 3D — FULL STACK NODE.JS & MYSQL BACKEND SERVER
 * Serves static frontend files and exposes secure REST API endpoints
 * for saving quiz submissions, admin authentication, and inspecting all answers.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// MySQL Database Connection Pool
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
const activeAdminSessions = new Map(); // token -> { username, loginTime }

// --- DATABASE INITIALIZATION ---
async function initDatabase() {
  try {
    // 1. Connect without database first to ensure quiz_db exists
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    // 2. Connect with pool to quiz_db
    pool = mysql.createPool(dbConfig);

    // 3. Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure default admin user (admin / admin123)
    await pool.query(`
      INSERT INTO admin_users (id, username, password_hash)
      VALUES (1, 'admin', 'admin123')
      ON DUPLICATE KEY UPDATE id=id;
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    console.log(`[MySQL] Connected successfully to database: ${dbConfig.database}`);
  } catch (err) {
    console.error("[MySQL Error] Database connection failed:", err.message);
  }
}

// --- HELPER FUNCTIONS ---
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error("Payload too large"));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function getAuthToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return req.headers['x-admin-token'] || null;
}

function isAuthenticatedAdmin(req) {
  const token = getAuthToken(req);
  if (!token) return false;
  return activeAdminSessions.has(token);
}

// --- REQUEST DISPATCHER ---
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // --- API ROUTE: SAVE QUIZ SUBMISSION (PUBLIC) ---
  if (req.method === 'POST' && pathname === '/api/submissions') {
    try {
      const data = await parseJSONBody(req);
      if (!data.playerName || !Array.isArray(data.answers)) {
        return sendJSON(res, 400, { error: "Missing required fields (playerName, answers)" });
      }

      if (!pool) {
        return sendJSON(res, 503, { error: "Database not connected. Please ensure MySQL is running." });
      }

      const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';

      // 1. Insert master submission record
      const [result] = await pool.query(`
        INSERT INTO quiz_submissions 
        (player_name, total_score, accuracy_percent, trivia_correct, total_trivia, paragraphs_count, max_streak, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.playerName.trim(),
        parseInt(data.totalScore || 0, 10),
        parseInt(data.accuracy || 0, 10),
        parseInt(data.triviaCorrect || 0, 10),
        parseInt(data.totalTrivia || 0, 10),
        parseInt(data.paragraphsCount || 0, 10),
        parseInt(data.maxStreak || 0, 10),
        clientIp
      ]);

      const submissionId = result.insertId;

      // 2. Insert all individual answers & paragraphs
      if (data.answers.length > 0) {
        const answerValues = data.answers.map((ans, idx) => [
          submissionId,
          parseInt(ans.number || (idx + 1), 10),
          ans.section || 'General',
          ans.type || 'mcq',
          ans.question || `Question ${idx + 1}`,
          ans.userResponse || '',
          ans.correctAnswer || null,
          ans.isCorrect ? 1 : 0
        ]);

        await pool.query(`
          INSERT INTO quiz_answers 
          (submission_id, question_number, section_name, question_type, question_text, user_response, correct_answer, is_correct)
          VALUES ?
        `, [answerValues]);
      }

      console.log(`[Submission] Saved quiz from '${data.playerName}' with ID: ${submissionId}`);
      return sendJSON(res, 201, { success: true, submissionId });
    } catch (err) {
      console.error("[Submission Error]", err);
      return sendJSON(res, 500, { error: "Failed to save submission to MySQL database", details: err.message });
    }
  }

  // --- API ROUTE: ADMIN LOGIN ---
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    try {
      const { username, password } = await parseJSONBody(req);
      if (!username || !password) {
        return sendJSON(res, 400, { error: "Username and password required" });
      }

      if (!pool) {
        return sendJSON(res, 503, { error: "Database not connected" });
      }

      const [rows] = await pool.query(
        "SELECT * FROM admin_users WHERE username = ? LIMIT 1",
        [username.trim()]
      );

      if (rows.length === 0 || rows[0].password_hash !== password) {
        return sendJSON(res, 401, { error: "Invalid username or password" });
      }

      // Generate session token
      const token = crypto.randomBytes(32).toString('hex');
      activeAdminSessions.set(token, {
        username: rows[0].username,
        loginTime: Date.now()
      });

      return sendJSON(res, 200, {
        success: true,
        token: token,
        username: rows[0].username
      });
    } catch (err) {
      console.error("[Admin Login Error]", err);
      return sendJSON(res, 500, { error: "Login error", details: err.message });
    }
  }

  // --- API ROUTE: VERIFY ADMIN TOKEN ---
  if (req.method === 'GET' && pathname === '/api/admin/verify') {
    if (!isAuthenticatedAdmin(req)) {
      return sendJSON(res, 401, { authenticated: false });
    }
    const token = getAuthToken(req);
    const session = activeAdminSessions.get(token);
    return sendJSON(res, 200, { authenticated: true, username: session.username });
  }

  // --- API ROUTE: ADMIN LOGOUT ---
  if (req.method === 'POST' && pathname === '/api/admin/logout') {
    const token = getAuthToken(req);
    if (token) activeAdminSessions.delete(token);
    return sendJSON(res, 200, { success: true });
  }

  // --- PROTECTED ADMIN API ROUTES ---
  if (pathname.startsWith('/api/admin/')) {
    if (!isAuthenticatedAdmin(req)) {
      return sendJSON(res, 401, { error: "Unauthorized access. Admin login required." });
    }

    // GET /api/admin/submissions (List all attempts)
    if (req.method === 'GET' && pathname === '/api/admin/submissions') {
      try {
        const [rows] = await pool.query(`
          SELECT 
            id, player_name, total_score, accuracy_percent, 
            trivia_correct, total_trivia, paragraphs_count, 
            max_streak, ip_address, created_at 
          FROM quiz_submissions 
          ORDER BY created_at DESC
        `);
        return sendJSON(res, 200, { submissions: rows });
      } catch (err) {
        return sendJSON(res, 500, { error: "Database query failed", details: err.message });
      }
    }

    // GET /api/admin/submissions/:id (Single submission with all 25 answers & paragraphs)
    const matchDetail = pathname.match(/^\/api\/admin\/submissions\/(\d+)$/);
    if (req.method === 'GET' && matchDetail) {
      const submissionId = parseInt(matchDetail[1], 10);
      try {
        const [subRows] = await pool.query(
          "SELECT * FROM quiz_submissions WHERE id = ? LIMIT 1",
          [submissionId]
        );
        if (subRows.length === 0) {
          return sendJSON(res, 404, { error: "Submission not found" });
        }

        const [answerRows] = await pool.query(
          "SELECT * FROM quiz_answers WHERE submission_id = ? ORDER BY question_number ASC",
          [submissionId]
        );

        return sendJSON(res, 200, {
          submission: subRows[0],
          answers: answerRows
        });
      } catch (err) {
        return sendJSON(res, 500, { error: "Database query failed", details: err.message });
      }
    }

    // DELETE /api/admin/submissions/:id
    if (req.method === 'DELETE' && matchDetail) {
      const submissionId = parseInt(matchDetail[1], 10);
      try {
        await pool.query("DELETE FROM quiz_submissions WHERE id = ?", [submissionId]);
        return sendJSON(res, 200, { success: true, deletedId: submissionId });
      } catch (err) {
        return sendJSON(res, 500, { error: "Delete failed", details: err.message });
      }
    }

    // GET /api/admin/stats
    if (req.method === 'GET' && pathname === '/api/admin/stats') {
      try {
        const [[stats]] = await pool.query(`
          SELECT 
            COUNT(*) as totalParticipants,
            COALESCE(AVG(total_score), 0) as avgScore,
            COALESCE(AVG(accuracy_percent), 0) as avgAccuracy,
            COALESCE(SUM(paragraphs_count), 0) as totalParagraphs
          FROM quiz_submissions
        `);
        return sendJSON(res, 200, { stats });
      } catch (err) {
        return sendJSON(res, 500, { error: "Stats query failed", details: err.message });
      }
    }
  }

  // --- STATIC FILE SERVER ---
  let cleanPath = pathname === '/' ? '/index.html' : pathname;
  // Sanitize path to prevent directory traversal
  const safePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8'
  };

  const ext = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start Server & Connect to MySQL
server.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🌟 QuizSphere 3D Server running on http://localhost:${PORT}`);
  console.log(`👤 Main Quiz:  http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`======================================================\n`);
  await initDatabase();
});
