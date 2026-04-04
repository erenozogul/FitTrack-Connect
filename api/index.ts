import express from "express";
import { neon } from '@neondatabase/serverless';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-fittrack";

const app = express();

app.use(cors());
app.use(express.json());

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

// API Routes
app.post("/api/auth/register", async (req, res) => {
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

    res.status(201).json({ 
      message: "User registered successfully", 
      token, 
      user: { id: userId, role, firstName, lastName, username, email } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

app.post("/api/auth/login", async (req, res) => {
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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: "Login successful", 
      token, 
      user: { 
        id: user.id, 
        role: user.role, 
        firstName: user.first_name, 
        lastName: user.last_name, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "error_internal" });
  }
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
    const { studentId, studentName, workoutId, workoutName, assignedDate, startTime, endTime } = req.body;
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

    const result = await sql`
      INSERT INTO assignments (trainer_id, student_id, student_name, workout_id, workout_name, assigned_date, start_time, end_time)
      VALUES (${req.user.userId}, ${studentId}, ${studentName}, ${workoutId || null}, ${workoutName}, ${assignedDate}::date, ${startTime || null}, ${endTime || null})
      RETURNING *
    `;
    const row = result[0];
    res.status(201).json({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      workoutId: row.workout_id,
      workoutName: row.workout_name,
      assignedDate: dateToStr(row.assigned_date),
      startTime: row.start_time,
      endTime: row.end_time,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/assignments?date=YYYY-MM-DD - get assignments for a date (trainer sees all their students, student sees their own)
app.get("/api/assignments", authenticateToken, async (req: any, res: any) => {
  try {
    const { date } = req.query;
    const sql = getDb();
    let rows;
    if (req.user.role === 'trainer') {
      rows = date
        ? await sql`SELECT * FROM assignments WHERE trainer_id = ${req.user.userId} AND assigned_date = ${date}::date ORDER BY start_time`
        : await sql`SELECT * FROM assignments WHERE trainer_id = ${req.user.userId} ORDER BY assigned_date, start_time`;
    } else {
      rows = date
        ? await sql`SELECT * FROM assignments WHERE student_id = ${req.user.userId} AND assigned_date = ${date}::date ORDER BY start_time`
        : await sql`SELECT * FROM assignments WHERE student_id = ${req.user.userId} ORDER BY assigned_date, start_time`;
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

// GET /api/notes?studentId=X - trainer gets notes for a student
app.get("/api/notes", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    let rows;
    if (req.user.role === 'trainer') {
      const { studentId } = req.query;
      if (!studentId) return res.status(400).json({ error: "error_missing_fields" });
      rows = await sql`SELECT * FROM notes WHERE trainer_id = ${req.user.userId} AND student_id = ${studentId} ORDER BY created_at DESC`;
    } else {
      // Student sees their own notes
      rows = await sql`SELECT * FROM notes WHERE student_id = ${req.user.userId} ORDER BY created_at DESC`;
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
    const { receiverId, content, type = 'text' } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: "error_missing_fields" });
    const sql = getDb();
    const result = await sql`
      INSERT INTO messages (sender_id, receiver_id, content, type)
      VALUES (${req.user.userId}, ${receiverId}, ${content}, ${type})
      RETURNING id, sender_id, receiver_id, content, type, created_at
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "error_internal" });
  }
});

// GET /api/messages/:contactId - get messages between current user and contact
app.get("/api/messages/:contactId", authenticateToken, async (req: any, res: any) => {
  try {
    const sql = getDb();
    const contactId = parseInt(req.params.contactId);
    const userId = req.user.userId;
    const rows = await sql`
      SELECT id, sender_id, receiver_id, content, type, created_at, read_at
      FROM messages
      WHERE (sender_id = ${userId} AND receiver_id = ${contactId})
         OR (sender_id = ${contactId} AND receiver_id = ${userId})
      ORDER BY created_at ASC
    `;
    // Mark received messages as read
    await sql`
      UPDATE messages SET read_at = NOW()
      WHERE sender_id = ${contactId} AND receiver_id = ${userId} AND read_at IS NULL
    `;
    res.json(rows.map((r: any) => ({
      id: r.id,
      from: r.sender_id === userId ? 'me' : 'them',
      text: r.content,
      type: r.type,
      time: new Date(r.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: r.created_at,
    })));
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

export default app;
