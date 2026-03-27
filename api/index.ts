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

export default app;
