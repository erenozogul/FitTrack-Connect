import express from "express";
import { createServer as createViteServer } from "vite";
import { neon } from '@neondatabase/serverless';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-fittrack";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      await sql`
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
      `;
      console.log("Database tables verified");
    }
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
  }

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
