# 🌟 QuizSphere 3D — Full Stack MySQL & Admin Vault

An ultra-responsive, tactile **3D Quiz Website** with **Direct MySQL Database Integration** and an **Administrator Dashboard**, designed in a theme of **White**, **Soft & Vibrant Pink**, **Coral Red**, and **Light Sky Blue**.

---

## ⚡ Direct Access (No Batch Files Needed!)

Your Apache and MySQL services are already linked and running. You can open the website directly in any browser:

| View | Direct Browser Link | Description |
| :--- | :--- | :--- |
| 👤 **Challenger Landing Page** | [**`http://localhost/Quiz-Website/`**](http://localhost/Quiz-Website/) | Enter challenger name, press Enter to begin quiz |
| 🎮 **Quiz Arena** | [**`http://localhost/Quiz-Website/quiz.html`**](http://localhost/Quiz-Website/quiz.html) | All 25 questions (Trivia + Paragraphs from `questions.txt`) |
| 🔐 **Admin Vault** | [**`http://localhost/Quiz-Website/admin.html`**](http://localhost/Quiz-Website/admin.html) | **Login: `admin` / `admin123`** to see all answers & written paragraphs |

---

## 🚀 How It Works

1. **Challenger Takes Quiz**:
   - The user visits [**`http://localhost/Quiz-Website/`**](http://localhost/Quiz-Website/).
   - Enters their name and presses **Enter**.
   - Answers questions from [`questions.txt`](file:///c:/Users/Aashu%20Patel/OneDrive/Desktop/Websites/Quiz-Website/questions.txt) (Part 1: Multiple Choice with score/streak, Part 2: Heartfelt Paragraphs).
2. **Automatic MySQL Storage**:
   - As soon as the quiz is finished, all responses are automatically sent to `api.php` and stored in the **`quiz_db`** MySQL database.
3. **Admin Dashboard**:
   - Go to [**`http://localhost/Quiz-Website/admin.html`**](http://localhost/Quiz-Website/admin.html).
   - Sign in with **`admin`** / **`admin123`**.
   - View live statistics and click **"👁️ View Answers"** on any participant to read all 25 answers and full written paragraphs in an elegant 3D quote box.

---

## 🗄️ MySQL Database Structure (`quiz_db`)

- **`admin_users`**: Stores administrator login credentials.
- **`quiz_submissions`**: Master table storing challenger name, score, accuracy, timestamp, IP.
- **`quiz_answers`**: Detail table storing question text, section, type, user's chosen option or full paragraph response, correct answer, and correctness flag (linked by `submission_id`).
