import express from "express";
import { neon } from '@neondatabase/serverless';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-fittrack";

const app = express();

app.use(cors());
app.use(express.json());

// ─── Simple in-memory rate limiter ──────────────────
// Limits: auth endpoints 10 req/15min, general API 100 req/min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const createRateLimit = (maxRequests: number, windowMs: number) => (req: any, res: any, next: any) => {
  const key = `${req.ip}:${req.path}:${Math.floor(Date.now() / windowMs)}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateLimitMap.set(key, entry);
  if (entry.count > maxRequests) {
    return res.status(429).json({ error: 'error_too_many_requests' });
  }
  next();
};

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

const authRateLimit = createRateLimit(10, 15 * 60 * 1000); // 10 req/15min for auth
const apiRateLimit = createRateLimit(100, 60 * 1000);       // 100 req/min for general API
app.use('/api', apiRateLimit);

// ─── File Upload (multer) ─────────────────────────────
// Use /tmp on Vercel (read-only FS), fallback to local uploads dir in dev
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// Initialize Neon Database
const getDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return neon(process.env.DATABASE_URL);
};



// Create tables if they don't exist
try {
  if (process.env.DATABASE_URL) {
    const sql = getDb();
    sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role, email),
        UNIQUE(role, username)
      )
    `.then(() => {
        return sql`
          CREATE TABLE IF NOT EXISTS templates (
            id SERIAL PRIMARY KEY,
            trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            level VARCHAR(50) NOT NULL,
            category VARCHAR(50),
            duration VARCHAR(50) NOT NULL,
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
    }).then(() => {
        return sql`
          CREATE TABLE IF NOT EXISTS trainer_student (
            id SERIAL PRIMARY KEY,
            trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(trainer_id, student_id)
          )
        `;
    }).then(() => {
        return sql`
          CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            student_name VARCHAR(255) NOT NULL,
            workout_id VARCHAR(100),
            workout_name VARCHAR(255) NOT NULL,
            assigned_date DATE NOT NULL,
            start_time VARCHAR(10),
            end_time VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
    }).then(() => {
        return sql`
          CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'general',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type VARCHAR(20) DEFAULT 'text',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP
        )
      `;
    }).then(() => {
      return sql`
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
      `;
    }).then(() => {
      return sql`
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS exercises TEXT DEFAULT '[]';
      `;
    }).then(() => {
      // Convert exercises column to TEXT if it was previously created as JSONB
      return sql`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='assignments' AND column_name='exercises' AND data_type='jsonb'
          ) THEN
            ALTER TABLE assignments ALTER COLUMN exercises TYPE TEXT USING exercises::text;
          END IF;
        END $$;
      `;
    }).then(() => {
      // Fresh TEXT column - never existed as JSONB, guaranteed clean storage
      return sql`
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS exercise_list TEXT DEFAULT '';
      `;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(30) DEFAULT 'system',
          title TEXT NOT NULL,
          body TEXT DEFAULT '',
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(128) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }).then(() => {
      return sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS exercise_media (
          id SERIAL PRIMARY KEY,
          exercise_id VARCHAR(100) NOT NULL,
          trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          video_url TEXT NOT NULL,
          label TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(exercise_id, trainer_id)
        )
      `;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS trainer_reviews (
          id SERIAL PRIMARY KEY,
          trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(trainer_id, student_id)
        )
      `;
    }).then(() => {
      return sql`
        CREATE TABLE IF NOT EXISTS progress_entries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          entry_date DATE NOT NULL,
          weight NUMERIC(5,1),
          body_fat NUMERIC(4,1),
          notes TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }).then(() => {
      return sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trainer_plan VARCHAR(20) DEFAULT 'free'`;
    }).then(() => {
      // Dedicated exercises table — no JSON, no casting, no column type issues
      return sql`
        CREATE TABLE IF NOT EXISTS assignment_exercises (
          id SERIAL PRIMARY KEY,
          assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
          exercise_id VARCHAR(100) NOT NULL,
          exercise_name VARCHAR(255) NOT NULL,
          target_tr TEXT DEFAULT '',
          target_en TEXT DEFAULT '',
          sort_order INTEGER DEFAULT 0
        )
      `;
    }).then(() => console.log("Database tables verified"))
     .catch(err => console.error("Failed to initialize database tables:", err));
  }
} catch (error) {
  console.error("Failed to initialize database tables:", error);
}

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "error_unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "error_forbidden" });
    req.user = user;
    next();
  });
};

// POST /api/upload — upload a file, returns { url, name, type }
app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.originalname, type: req.file.mimetype });
});

// API Routes
app.post("/api/auth/register", authRateLimit, async (req, res) => {
  try {
    const { role, firstName, lastName, username, email, password } = req.body;
    
    if (!role || !firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ error: "error_missing_fields" });
    }

    const sql = getDb();

    // Check if user exists with the SAME role
    const existingUsers = await sql`
      SELECT * FROM users WHERE role = ${role} AND (email = ${email} OR username = ${username})
    `;
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        return res.status(400).json({ error: "error_email_in_use" });
      }
      return res.status(400).json({ error: "error_username_in_use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (role, first_name, last_name, username, email, password_hash) 
      VALUES (${role}, ${firstName}, ${lastName}, ${username}, ${email}, ${passwordHash})
      RETURNING id
    `;

    const userId = result[0].id;
    const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });

    // Generate email verification token (6-char alphanumeric)
    const verifyToken = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    try {
      await sql`
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES (${userId}, ${verifyToken}, ${expiresAt.toISOString()})
      `;
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const verifyUrl = `${appUrl}/#/verify-email?token=${verifyToken}`;
      // If SMTP configured, send email here. Otherwise, log for dev.
      if (process.env.SMTP_HOST) {
        // nodemailer would go here
        console.log(`[EMAIL] Verification for ${email}: ${verifyUrl}`);
      } else {
        console.log(`[DEV] Email verification token for ${email}: ${verifyToken} — ${verifyUrl}`);
      }
    } catch { /* non-fatal */ }

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: userId, role, firstName, lastName, username, email, emailVerified: false },
      ...(process.env.NODE_ENV !== 'production' ? { _devVerifyToken: verifyToken } : {}),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// POST /api/auth/verify-email — verify email with token
app.post("/api/auth/verify-email", async (req: any, res: any) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'error_missing_fields' });
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM email_verification_tokens
      WHERE token = ${token.toUpperCase()} AND expires_at > NOW()
    `;
    if (!rows[0]) return res.status(400).json({ error: 'error_invalid_token' });
    await sql`UPDATE users SET email_verified = true WHERE id = ${rows[0].user_id}`;
    await sql`DELETE FROM email_verification_tokens WHERE id = ${rows[0].id}`;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// GET /api/auth/resend-verification — resend verification email
app.post("/api/auth/resend-verification", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const users = await sql`SELECT * FROM users WHERE id = ${req.user.userId}`;
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'not_found' });
    if (user.email_verified) return res.json({ ok: true, already: true });
    // Delete old tokens
    await sql`DELETE FROM email_verification_tokens WHERE user_id = ${req.user.userId}`;
    const verifyToken = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sql`INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (${req.user.userId}, ${verifyToken}, ${expiresAt.toISOString()})`;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    console.log(`[DEV] Resend verify token for ${user.email}: ${verifyToken} — ${appUrl}/#/verify-email?token=${verifyToken}`);
    res.json({ ok: true, ...(process.env.NODE_ENV !== 'production' ? { _devVerifyToken: verifyToken } : {}) });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

app.post("/api/auth/login", authRateLimit, async (req, res) => {
  try {
    const { role, usernameOrEmail, password } = req.body;

    if (!role || !usernameOrEmail || !password) {
      return res.status(400).json({ error: "error_missing_fields" });
    }

    const sql = getDb();

    const users = await sql`
      SELECT * FROM users WHERE role = ${role} AND (email = ${usernameOrEmail} OR username = ${usernameOrEmail})
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: "error_invalid_credentials" });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "error_invalid_credentials" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

    // Issue refresh token (30 days)
    let refreshToken: string | undefined;
    try {
      const sql2 = getDb();
      refreshToken = `${user.id}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await sql2`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (${user.id}, ${refreshToken}, ${expiresAt.toISOString()}) ON CONFLICT DO NOTHING`;
    } catch { /* non-fatal */ }

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        email: user.email,
        emailVerified: user.email_verified ?? false,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// POST /api/auth/refresh — exchange refresh token for new access token
app.post("/api/auth/refresh", async (req: any, res: any) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'error_missing_fields' });
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT rt.*, u.role FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token = ${refreshToken} AND rt.expires_at > NOW()
    `;
    if (!rows[0]) return res.status(401).json({ error: 'error_invalid_token' });
    const { user_id, role } = rows[0];
    // Rotate: delete old, issue new
    await sql`DELETE FROM refresh_tokens WHERE id = ${rows[0].id}`;
    const newRefreshToken = `${user_id}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await sql`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (${user_id}, ${newRefreshToken}, ${expiresAt.toISOString()})`;
    const accessToken = jwt.sign({ userId: user_id, role }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// POST /api/auth/logout — revoke refresh token
app.post("/api/auth/logout", async (req: any, res: any) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const sql = getDb();
      await sql`DELETE FROM refresh_tokens WHERE token = ${refreshToken}`;
    } catch { /* ignore */ }
  }
  res.json({ ok: true });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { role, email } = req.body;
    if (!role || !email) {
      return res.status(400).json({ error: "error_missing_fields" });
    }
    const sql = getDb();
    const users = await sql`
      SELECT id FROM users WHERE role = ${role} AND email = ${email}
    `;
    if (users.length === 0) {
      return res.status(404).json({ error: "error_email_not_found" });
    }
    res.json({ message: "ok" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { role, email, newPassword } = req.body;
    if (!role || !email || !newPassword) {
      return res.status(400).json({ error: "error_missing_fields" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "error_password_too_short" });
    }
    const sql = getDb();
    const users = await sql`
      SELECT id FROM users WHERE role = ${role} AND email = ${email}
    `;
    if (users.length === 0) {
      return res.status(404).json({ error: "error_email_not_found" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE role = ${role} AND email = ${email}
    `;
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

app.get("/api/templates", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const sql = getDb();
    const templates = await sql`
      SELECT id, title, level, category, duration, image, updated_at as "updatedAt"
      FROM templates
      WHERE trainer_id = ${userId}
      ORDER BY created_at DESC
    `;
    res.json(templates);
  } catch (error) {
    console.error("Fetch templates error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

app.post("/api/templates", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { title, level, category, duration, image } = req.body;

    if (!title || !level || !duration) {
      return res.status(400).json({ error: "error_missing_fields" });
    }

    const sql = getDb();
    
    // Explicitly casting values that Neon/Postgres might reject if undefined
    const categoryParam = category || null;
    const imageParam = image || null;
    
    const result = await sql`
      INSERT INTO templates (trainer_id, title, level, category, duration, image)
      VALUES (${userId}, ${title}, ${level}, ${categoryParam}, ${duration}, ${imageParam})
      RETURNING id, title, level, category, duration, image, updated_at as "updatedAt"
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/me - get current user info
app.get("/api/me", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const users = await sql`SELECT id, role, first_name, last_name, username, email FROM users WHERE id = ${req.user.userId}`;
    if (users.length === 0) return res.status(404).json({ error: "error_not_found" });
    const u = users[0];
    res.json({ id: u.id, role: u.role, firstName: u.first_name, lastName: u.last_name, username: u.username, email: u.email });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// POST /api/trainer/connect - student connects to trainer via invite code
// Invite code format: USERNAME2026 (uppercase username + 2026)
app.post("/api/trainer/connect", authenticateToken, async (req: any, res: any) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "error_missing_fields" });

    // Extract username from invite code (remove trailing "2026")
    const username = inviteCode.replace(/2026$/, '').toLowerCase();
    const sql = getDb();

    const trainers = await sql`SELECT id, first_name, last_name, username FROM users WHERE role = 'trainer' AND UPPER(username) = ${username.toUpperCase()}`;
    if (trainers.length === 0) return res.status(404).json({ error: "error_trainer_not_found" });

    const trainer = trainers[0];
    const studentId = req.user.userId;

    // Remove existing connection first
    await sql`DELETE FROM trainer_student WHERE student_id = ${studentId}`;
    // Add new connection
    await sql`INSERT INTO trainer_student (trainer_id, student_id) VALUES (${trainer.id}, ${studentId}) ON CONFLICT DO NOTHING`;

    res.json({ trainer: { id: trainer.id, name: `${trainer.first_name} ${trainer.last_name}`, username: trainer.username, code: inviteCode.toUpperCase() } });
  } catch (error) {
    console.error("Connect trainer error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/student/trainer - student gets their connected trainer
app.get("/api/student/trainer", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT u.id, u.first_name, u.last_name, u.username
      FROM trainer_student ts
      JOIN users u ON u.id = ts.trainer_id
      WHERE ts.student_id = ${req.user.userId}
    `;
    if (rows.length === 0) return res.json({ trainer: null });
    const t = rows[0];
    const code = t.username.toUpperCase() + '2026';
    res.json({ trainer: { id: t.id, name: `${t.first_name} ${t.last_name}`, username: t.username, code, avatar: `https://picsum.photos/seed/${t.username}/100/100`, specialty: 'Personal Training' } });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/trainer/students - trainer gets their connected students
app.get("/api/trainer/students", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT u.id, u.first_name, u.last_name, u.username, u.email
      FROM trainer_student ts
      JOIN users u ON u.id = ts.student_id
      WHERE ts.trainer_id = ${req.user.userId}
    `;
    res.json(rows.map((u: any) => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, username: u.username, email: u.email, avatar: `https://picsum.photos/seed/${u.username}/100/100` })));
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/users/trainer/:username — public trainer profile lookup
app.get('/api/users/trainer/:username', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.username,
        (SELECT COUNT(*) FROM trainer_student ts WHERE ts.trainer_id = u.id) as total_students,
        (SELECT COUNT(*) FROM assignments a WHERE a.trainer_id = u.id) as total_sessions
      FROM users u
      WHERE u.username = ${req.params.username} AND u.role = 'trainer'
    `;
    if (!rows[0]) return res.status(404).json({ error: 'trainer_not_found' });
    const r = rows[0];
    res.json({
      id: r.id,
      name: r.name,
      username: r.username,
      totalStudents: parseInt(r.total_students) || 0,
      totalSessions: parseInt(r.total_sessions) || 0,
    });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// Helper: parse exercises field — handles both TEXT column (string) and JSONB column (already-parsed array)
// When the DB column is JSONB, Neon returns an already-parsed JS array; JSON.parse on an array throws.
// When the DB column is TEXT, Neon returns a string; we need JSON.parse.
const parseExercises = (val: any): any[] => {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return [];
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

// Helper: convert Neon DATE (JS Date object, UTC midnight) to "YYYY-MM-DD" using local date parts
const dateToStr = (d: any): string => {
  if (!d) return '';
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
};

// POST /api/assignments - trainer creates assignment
app.post("/api/assignments", authenticateToken, async (req: any, res: any) => {
  try {
    const { studentId, studentName, workoutId, workoutName, assignedDate, startTime, endTime, exercises } = req.body;
    if (!studentId || !workoutName || !assignedDate) return res.status(400).json({ error: "error_missing_fields" });
    const sql = getDb();

    // Check for overlapping time slot for the same trainer on the same date (any student)
    if (startTime && endTime) {
      const conflicts = await sql`
        SELECT id FROM assignments
        WHERE trainer_id = ${req.user.userId}
          AND assigned_date = ${assignedDate}::date
          AND start_time < ${endTime}
          AND end_time > ${startTime}
      `;
      if (conflicts.length > 0) {
        return res.status(409).json({ error: "error_time_conflict" });
      }
    }

    const exercisesArr = Array.isArray(exercises) ? exercises : [];

    // Insert the assignment
    const result = await sql`
      INSERT INTO assignments (trainer_id, student_id, student_name, workout_id, workout_name, assigned_date, start_time, end_time)
      VALUES (${req.user.userId}, ${studentId}, ${studentName}, ${workoutId || null}, ${workoutName}, ${assignedDate}::date, ${startTime || null}, ${endTime || null})
      RETURNING *
    `;
    const row = result[0];

    // Insert exercises into dedicated table — no JSON, no type casting
    if (exercisesArr.length > 0) {
      for (let i = 0; i < exercisesArr.length; i++) {
        const ex = exercisesArr[i];
        await sql`
          INSERT INTO assignment_exercises (assignment_id, exercise_id, exercise_name, target_tr, target_en, sort_order)
          VALUES (${row.id}, ${ex.id || ''}, ${ex.name || ''}, ${ex.target?.tr || ''}, ${ex.target?.en || ''}, ${i})
        `;
      }
    }

    res.status(201).json({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      workoutId: row.workout_id,
      workoutName: row.workout_name,
      assignedDate: dateToStr(row.assigned_date),
      startTime: row.start_time,
      endTime: row.end_time,
      exercises: exercisesArr,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/assignments?date=YYYY-MM-DD&limit=N&offset=N - get assignments
app.get("/api/assignments", authenticateToken, async (req: any, res: any) => {
  try {
    const { date } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const sql = getDb();
    let rows;
    if (req.user.role === 'trainer') {
      rows = date
        ? await sql`SELECT * FROM assignments WHERE trainer_id = ${req.user.userId} AND assigned_date = ${date}::date ORDER BY start_time`
        : await sql`SELECT * FROM assignments WHERE trainer_id = ${req.user.userId} ORDER BY assigned_date DESC, start_time LIMIT ${limit} OFFSET ${offset}`;
    } else {
      rows = date
        ? await sql`SELECT * FROM assignments WHERE student_id = ${req.user.userId} AND assigned_date = ${date}::date ORDER BY start_time`
        : await sql`SELECT * FROM assignments WHERE student_id = ${req.user.userId} ORDER BY assigned_date DESC, start_time LIMIT ${limit} OFFSET ${offset}`;
    }

    // Fetch exercises from dedicated table for all assignments in one query
    const assignmentIds = rows.map((r: any) => r.id);
    let exerciseRows: any[] = [];
    if (assignmentIds.length > 0) {
      exerciseRows = await sql`
        SELECT assignment_id, exercise_id, exercise_name, target_tr, target_en, sort_order
        FROM assignment_exercises
        WHERE assignment_id = ANY(${assignmentIds})
        ORDER BY assignment_id, sort_order
      `;
    }

    // Group exercises by assignment_id
    const exercisesByAssignment: Record<number, any[]> = {};
    for (const ex of exerciseRows) {
      const aid = ex.assignment_id;
      if (!exercisesByAssignment[aid]) exercisesByAssignment[aid] = [];
      exercisesByAssignment[aid].push({
        id: ex.exercise_id,
        name: ex.exercise_name,
        target: { tr: ex.target_tr, en: ex.target_en },
      });
    }

    res.json(rows.map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      workoutId: r.workout_id,
      workoutName: r.workout_name,
      assignedDate: dateToStr(r.assigned_date),
      startTime: r.start_time,
      endTime: r.end_time,
      completed: r.completed ?? false,
      exercises: exercisesByAssignment[r.id] || [],
    })));
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// DELETE /api/assignments/:id
app.delete("/api/assignments/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM assignments WHERE id = ${req.params.id} AND trainer_id = ${req.user.userId}`;
    res.json({ message: "deleted" });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// PATCH /api/assignments/:id/complete — student marks assignment as completed
app.patch("/api/assignments/:id/complete", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const { completed } = req.body;
    await sql`
      UPDATE assignments SET completed = ${completed ?? true}
      WHERE id = ${req.params.id} AND student_id = ${req.user.userId}
    `;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/notes?studentId=X&limit=N&offset=N - trainer gets notes for a student
app.get("/api/notes", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    let rows;
    if (req.user.role === 'trainer') {
      const { studentId } = req.query;
      if (!studentId) return res.status(400).json({ error: "error_missing_fields" });
      rows = await sql`SELECT * FROM notes WHERE trainer_id = ${req.user.userId} AND student_id = ${studentId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      // Student sees their own notes
      rows = await sql`SELECT * FROM notes WHERE student_id = ${req.user.userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    res.json(rows.map((r: any) => ({
      id: r.id,
      content: r.content,
      category: r.category,
      createdAt: r.created_at,
    })));
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// POST /api/notes
app.post("/api/notes", authenticateToken, async (req: any, res: any) => {
  try {
    const { studentId, content, category } = req.body;
    if (!studentId || !content) return res.status(400).json({ error: "error_missing_fields" });
    const sql = getDb();
    const result = await sql`
      INSERT INTO notes (trainer_id, student_id, content, category)
      VALUES (${req.user.userId}, ${studentId}, ${content}, ${category || 'general'})
      RETURNING *
    `;
    res.status(201).json({ id: result[0].id, content: result[0].content, category: result[0].category, createdAt: result[0].created_at });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// DELETE /api/notes/:id
app.delete("/api/notes/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM notes WHERE id = ${req.params.id} AND trainer_id = ${req.user.userId}`;
    res.json({ message: "deleted" });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// POST /api/auth/change-password
app.post("/api/auth/change-password", authenticateToken, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "error_missing_fields" });
    const sql = getDb();
    const users = await sql`SELECT password_hash FROM users WHERE id = ${req.user.userId}`;
    if (users.length === 0) return res.status(404).json({ error: "error_not_found" });
    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!valid) return res.status(401).json({ error: "error_invalid_credentials" });
    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${req.user.userId}`;
    res.json({ message: "ok" });
  } catch (error) {
    res.status(500).json({ error: "error_internal" });
  }
});

// POST /api/messages - send a message
app.post("/api/messages", authenticateToken, async (req: any, res: any) => {
  try {
    const { receiverId, content, type = 'text', fileName } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: "error_missing_fields" });
    const sql = getDb();
    // For file/image/voice: encode as "url|||filename" so we can recover the name on GET
    const stored = (type !== 'text' && fileName) ? `${content}|||${fileName}` : content;
    const result = await sql`
      INSERT INTO messages (sender_id, receiver_id, content, type)
      VALUES (${req.user.userId}, ${receiverId}, ${stored}, ${type})
      RETURNING id, sender_id, receiver_id, content, type, created_at
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/messages/:contactId?limit=N&before=<id> - get messages (cursor-based pagination)
app.get("/api/messages/:contactId", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const contactId = parseInt(req.params.contactId);
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const before = req.query.before ? parseInt(req.query.before as string) : null;
    const rows = before
      ? await sql`
          SELECT id, sender_id, receiver_id, content, type, created_at, read_at
          FROM messages
          WHERE ((sender_id = ${userId} AND receiver_id = ${contactId})
             OR (sender_id = ${contactId} AND receiver_id = ${userId}))
            AND id < ${before}
          ORDER BY created_at DESC LIMIT ${limit}
        `
      : await sql`
          SELECT id, sender_id, receiver_id, content, type, created_at, read_at
          FROM messages
          WHERE (sender_id = ${userId} AND receiver_id = ${contactId})
             OR (sender_id = ${contactId} AND receiver_id = ${userId})
          ORDER BY created_at DESC LIMIT ${limit}
        `;
    // Return in chronological order
    const sorted = [...rows].reverse();
    // Mark received messages as read
    await sql`
      UPDATE messages SET read_at = NOW()
      WHERE sender_id = ${contactId} AND receiver_id = ${userId} AND read_at IS NULL
    `;
    res.json(sorted.map((r: any) => {
      const parts = r.content.includes('|||') ? r.content.split('|||') : [r.content, undefined];
      return {
        id: r.id,
        from: r.sender_id === userId ? 'me' : 'them',
        text: parts[0],
        fileName: parts[1],
        type: r.type,
        time: new Date(r.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: r.created_at,
        hasMore: rows.length === limit,
      };
    }));
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/conversations - get all conversations with last message and unread count
app.get("/api/conversations", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const userId = req.user.userId;
    const rows = await sql`
      SELECT
        u.id as contact_id,
        u.first_name || ' ' || u.last_name as contact_name,
        u.username as contact_username,
        (
          SELECT content FROM messages
          WHERE (sender_id = ${userId} AND receiver_id = u.id)
             OR (sender_id = u.id AND receiver_id = ${userId})
          ORDER BY created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM messages
          WHERE (sender_id = ${userId} AND receiver_id = u.id)
             OR (sender_id = u.id AND receiver_id = ${userId})
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) FROM messages
          WHERE sender_id = u.id AND receiver_id = ${userId} AND read_at IS NULL
        ) as unread_count
      FROM users u
      WHERE u.id IN (
        SELECT CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
      )
      ORDER BY last_message_time DESC NULLS LAST
    `;
    res.json(rows.map((r: any) => ({
      id: r.contact_id,
      name: r.contact_name,
      username: r.contact_username,
      avatar: `https://picsum.photos/seed/${r.contact_username}/100/100`,
      lastMsg: r.last_message || '',
      time: r.last_message_time ? new Date(r.last_message_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
      unread: parseInt(r.unread_count) || 0,
      online: false,
    })));
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/trainer/analytics - trainer stats
app.get("/api/trainer/analytics", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: "error_forbidden" });
    const sql = getDb();
    const trainerId = req.user.userId;

    const [studentRows, weekRows, monthRows, studentStats] = await Promise.all([
      sql`SELECT COUNT(*) as total FROM trainer_student WHERE trainer_id = ${trainerId}`,
      sql`SELECT COUNT(*) as total FROM assignments WHERE trainer_id = ${trainerId} AND assigned_date >= CURRENT_DATE - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) as total FROM assignments WHERE trainer_id = ${trainerId} AND assigned_date >= CURRENT_DATE - INTERVAL '30 days'`,
      sql`
        SELECT u.id, u.first_name || ' ' || u.last_name as name, u.username,
          COUNT(a.id) as total_assignments,
          MAX(a.assigned_date) as last_assignment
        FROM trainer_student ts
        JOIN users u ON u.id = ts.student_id
        LEFT JOIN assignments a ON a.student_id = u.id AND a.trainer_id = ${trainerId}
        WHERE ts.trainer_id = ${trainerId}
        GROUP BY u.id, u.first_name, u.last_name, u.username
        ORDER BY total_assignments DESC
      `,
    ]);

    res.json({
      totalStudents: parseInt(studentRows[0].total) || 0,
      assignmentsThisWeek: parseInt(weekRows[0].total) || 0,
      assignmentsThisMonth: parseInt(monthRows[0].total) || 0,
      students: studentStats.map((s: any) => ({
        id: s.id,
        name: s.name,
        username: s.username,
        avatar: `https://picsum.photos/seed/${s.username}/100/100`,
        totalAssignments: parseInt(s.total_assignments) || 0,
        lastAssignment: s.last_assignment,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// ─── Exercise Media ────────────────────────────────────
// GET /api/exercise-media/:exerciseId — all videos for an exercise
app.get('/api/exercise-media/:exerciseId', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT em.*, u.first_name || ' ' || u.last_name as trainer_name
      FROM exercise_media em
      JOIN users u ON u.id = em.trainer_id
      WHERE em.exercise_id = ${req.params.exerciseId}
      ORDER BY em.created_at DESC
    `;
    res.json(rows.map((r: any) => ({ id: r.id, videoUrl: r.video_url, label: r.label, trainerId: r.trainer_id, trainerName: r.trainer_name })));
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// POST /api/exercise-media — trainer adds/updates a video for an exercise
app.post('/api/exercise-media', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'error_forbidden' });
  const { exerciseId, videoUrl, label } = req.body;
  if (!exerciseId || !videoUrl) return res.status(400).json({ error: 'error_missing_fields' });
  try {
    const sql = getDb();
    await sql`
      INSERT INTO exercise_media (exercise_id, trainer_id, video_url, label)
      VALUES (${exerciseId}, ${req.user.userId}, ${videoUrl}, ${label ?? ''})
      ON CONFLICT (exercise_id, trainer_id) DO UPDATE SET video_url = ${videoUrl}, label = ${label ?? ''}
    `;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// DELETE /api/exercise-media/:id — trainer removes their video
app.delete('/api/exercise-media/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM exercise_media WHERE id = ${req.params.id} AND trainer_id = ${req.user.userId}`;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// ─── Trainer Reviews ──────────────────────────────────
// GET /api/trainer/:id/reviews — get reviews + avg for a trainer
app.get('/api/trainer/:id/reviews', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT tr.*, u.first_name || ' ' || u.last_name as student_name, u.username as student_username
      FROM trainer_reviews tr
      JOIN users u ON u.id = tr.student_id
      WHERE tr.trainer_id = ${req.params.id}
      ORDER BY tr.created_at DESC
      LIMIT 20
    `;
    const avg = rows.length > 0 ? rows.reduce((s: number, r: any) => s + r.rating, 0) / rows.length : null;
    res.json({
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: rows.length,
      reviews: rows.map((r: any) => ({
        id: r.id,
        studentName: r.student_name,
        studentUsername: r.student_username,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// GET /api/trainer/me/reviews — shorthand for own reviews (trainer)
app.get('/api/trainer/me/reviews', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'error_forbidden' });
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT tr.*, u.first_name || ' ' || u.last_name as student_name
      FROM trainer_reviews tr
      JOIN users u ON u.id = tr.student_id
      WHERE tr.trainer_id = ${req.user.userId}
      ORDER BY tr.created_at DESC
      LIMIT 20
    `;
    const avg = rows.length > 0 ? rows.reduce((s: number, r: any) => s + r.rating, 0) / rows.length : null;
    res.json({ average: avg ? Math.round(avg * 10) / 10 : null, count: rows.length });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// POST /api/trainer/:id/review — student submits/updates a review
app.post('/api/trainer/:id/review', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'error_forbidden' });
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'error_missing_fields' });
  try {
    const sql = getDb();
    await sql`
      INSERT INTO trainer_reviews (trainer_id, student_id, rating, comment)
      VALUES (${req.params.id}, ${req.user.userId}, ${rating}, ${comment ?? ''})
      ON CONFLICT (trainer_id, student_id) DO UPDATE SET rating = ${rating}, comment = ${comment ?? ''}
    `;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// ─── Progress Entries ─────────────────────────────────
// GET /api/progress — get all progress entries for current user
app.get('/api/progress', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM progress_entries
      WHERE user_id = ${req.user.userId}
      ORDER BY entry_date ASC
    `;
    res.json(rows.map((r: any) => ({
      id: r.id,
      date: dateToStr(r.entry_date),
      weight: r.weight ? parseFloat(r.weight) : null,
      bodyFat: r.body_fat ? parseFloat(r.body_fat) : null,
      notes: r.notes || '',
    })));
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// POST /api/progress — add a progress entry
app.post('/api/progress', authenticateToken, async (req: any, res: any) => {
  try {
    const { date, weight, bodyFat, notes } = req.body;
    if (!date) return res.status(400).json({ error: 'error_missing_fields' });
    const sql = getDb();
    const rows = await sql`
      INSERT INTO progress_entries (user_id, entry_date, weight, body_fat, notes)
      VALUES (${req.user.userId}, ${date}::date, ${weight ?? null}, ${bodyFat ?? null}, ${notes ?? ''})
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const r = rows[0];
    if (!r) return res.status(409).json({ error: 'entry_exists' });
    res.json({ id: r.id, date: dateToStr(r.entry_date), weight: r.weight ? parseFloat(r.weight) : null, bodyFat: r.body_fat ? parseFloat(r.body_fat) : null, notes: r.notes });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// DELETE /api/progress/:id — delete a progress entry
app.delete('/api/progress/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM progress_entries WHERE id = ${req.params.id} AND user_id = ${req.user.userId}`;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'error_internal' });
  }
});

// ─── Stripe Payment ───────────────────────────────────
// POST /api/payments/create-intent — create a Stripe PaymentIntent
app.post('/api/payments/create-intent', authenticateToken, async (req: any, res: any) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: 'stripe_not_configured' });
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);
    const { planId, amount } = req.body; // amount in kuruş (Turkish lira cents)
    if (!planId || !amount) return res.status(400).json({ error: 'error_missing_fields' });
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'try',
      metadata: { userId: req.user.userId, planId },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: 'stripe_error', message: error.message });
  }
});

// ─── Notifications (DB-persisted) ─────────────────────
// GET /api/notifications
app.get('/api/notifications', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, type, title, body, read, created_at
      FROM notifications
      WHERE user_id = ${req.user.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    res.json(rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      read: r.read,
      time: new Date(r.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    })));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'error_internal' });
  }
});

// POST /api/notifications — create a notification (internal use)
app.post('/api/notifications', authenticateToken, async (req: any, res: any) => {
  try {
    const { userId, type, title, body } = req.body;
    const targetId = userId || req.user.userId;
    const sql = getDb();
    const result = await sql`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (${targetId}, ${type || 'system'}, ${title}, ${body || ''})
      RETURNING id
    `;
    res.status(201).json({ id: result[0].id });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'error_internal' });
  }
});

// PATCH /api/notifications/read — mark all as read
app.patch('/api/notifications/read', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    await sql`UPDATE notifications SET read = true WHERE user_id = ${req.user.userId}`;
    res.json({ ok: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'error_internal' });
  }
});

// ─── Weekly/Monthly Report ────────────────────────────
// GET /api/report?period=week|month — summary report for trainer or student
app.get('/api/report', authenticateToken, async (req: any, res: any) => {
  const period = (req.query.period as string) === 'month' ? 'month' : 'week';
  const interval = period === 'week' ? '7 days' : '30 days';
  try {
    const sql = getDb();
    const userId = req.user.userId;
    if (req.user.role === 'trainer') {
      const [totals, byStudent, byDay, completed] = await Promise.all([
        sql`
          SELECT
            COUNT(*) as total_sessions,
            COUNT(DISTINCT student_id) as active_students
          FROM assignments
          WHERE trainer_id = ${userId}
            AND assigned_date >= CURRENT_DATE - ${interval}::interval
        `,
        sql`
          SELECT student_name, COUNT(*) as sessions, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
          FROM assignments
          WHERE trainer_id = ${userId}
            AND assigned_date >= CURRENT_DATE - ${interval}::interval
          GROUP BY student_name
          ORDER BY sessions DESC
          LIMIT 10
        `,
        sql`
          SELECT TO_CHAR(assigned_date, 'YYYY-MM-DD') as day, COUNT(*) as count
          FROM assignments
          WHERE trainer_id = ${userId}
            AND assigned_date >= CURRENT_DATE - ${interval}::interval
          GROUP BY day ORDER BY day
        `,
        sql`
          SELECT COUNT(*) as completed FROM assignments
          WHERE trainer_id = ${userId}
            AND assigned_date >= CURRENT_DATE - ${interval}::interval
            AND completed = true
        `,
      ]);
      res.json({
        role: 'trainer',
        period,
        totalSessions: parseInt(totals[0].total_sessions) || 0,
        activeStudents: parseInt(totals[0].active_students) || 0,
        completedSessions: parseInt(completed[0].completed) || 0,
        byStudent: byStudent.map((r: any) => ({ name: r.student_name, sessions: parseInt(r.sessions), completed: parseInt(r.completed) })),
        byDay: byDay.map((r: any) => ({ day: r.day, count: parseInt(r.count) })),
      });
    } else {
      const [totals, byWorkout, progress] = await Promise.all([
        sql`
          SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
          FROM assignments
          WHERE student_id = ${userId}
            AND assigned_date >= CURRENT_DATE - ${interval}::interval
        `,
        sql`
          SELECT workout_name, COUNT(*) as sessions, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
          FROM assignments
          WHERE student_id = ${userId}
            AND assigned_date >= CURRENT_DATE - ${interval}::interval
          GROUP BY workout_name
          ORDER BY sessions DESC
          LIMIT 5
        `,
        sql`
          SELECT TO_CHAR(entry_date, 'YYYY-MM-DD') as date, weight, body_fat
          FROM progress_entries
          WHERE user_id = ${userId}
            AND entry_date >= CURRENT_DATE - ${interval}::interval
          ORDER BY entry_date
        `,
      ]);
      res.json({
        role: 'student',
        period,
        totalSessions: parseInt(totals[0].total) || 0,
        completedSessions: parseInt(totals[0].completed) || 0,
        byWorkout: byWorkout.map((r: any) => ({ name: r.workout_name, sessions: parseInt(r.sessions), completed: parseInt(r.completed) })),
        progress: progress.map((r: any) => ({ date: r.date, weight: r.weight ? parseFloat(r.weight) : null, bodyFat: r.body_fat ? parseFloat(r.body_fat) : null })),
      });
    }
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'error_internal' });
  }
});

// ─── Trainer Plan Endpoints ───────────────────────────

app.get('/api/trainer/plan', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT trainer_plan FROM users WHERE id = ${req.user.userId}`;
    res.json({ plan: rows[0]?.trainer_plan || 'free' });
  } catch { res.status(500).json({ error: 'error_internal' }); }
});

app.post('/api/trainer/plan', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'error_forbidden' });
    const { plan } = req.body;
    const validPlans = ['free', 'bronze', 'silver', 'gold'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: 'error_invalid_plan' });
    const sql = getDb();
    await sql`UPDATE users SET trainer_plan = ${plan} WHERE id = ${req.user.userId}`;
    res.json({ plan });
  } catch { res.status(500).json({ error: 'error_internal' }); }
});

app.get('/api/student/trainer-plan', authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    // Find trainer connected to this student
    const rows = await sql`
      SELECT u.trainer_plan
      FROM trainer_student ts
      JOIN users u ON u.id = ts.trainer_id
      WHERE ts.student_id = ${req.user.userId}
      LIMIT 1
    `;
    res.json({ plan: rows[0]?.trainer_plan || 'free' });
  } catch { res.status(500).json({ error: 'error_internal' }); }
});

export default app;
