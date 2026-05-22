import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// --- Database Connections ---

let mysqlPool: mysql.Pool | null = null;

async function getMysqlPool() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tellme_db',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return mysqlPool;
}

// Optional: Initialize Firebase Admin if service account is provided
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : null;
if (serviceAccount && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const dbType = process.env.DB_TYPE || 'firebase';

// --- API Routes ---

// Get DB Configuration for Frontend
app.get("/api/config", (req, res) => {
  res.json({ dbType });
});

// Users API (MySQL Implementation)
app.get("/api/users/:username", async (req, res) => {
  if (dbType !== 'mysql') return res.status(400).json({ error: "MySQL mode not enabled" });

  try {
    const pool = await getMysqlPool();
    const [rows]: any = await pool.execute(
      "SELECT id as uid, username, displayName FROM users WHERE username = ?",
      [req.params.username.toLowerCase()]
    );
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Letters API (MySQL Implementation)
app.post("/api/letters", async (req, res) => {
  if (dbType !== 'mysql') {
    return res.status(400).json({ error: "MySQL mode not enabled" });
  }

  try {
    const pool = await getMysqlPool();
    const { 
      toUserId, toUsername, fromUserId, fromUsername, 
      encryptedContent, templateId, fontSize, attachmentBase64, voiceBase64 
    } = req.body;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO letters (id, toUserId, toUsername, fromUserId, fromUsername, encryptedContent, templateId, fontSize, attachmentBase64, voiceBase64) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, toUserId, toUsername, fromUserId || null, fromUsername || null, encryptedContent, templateId, fontSize, attachmentBase64 || null, voiceBase64 || null]
    );

    res.json({ id, status: "success" });
  } catch (error: any) {
    console.error("MySQL Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/letters/:userId", async (req, res) => {
  if (dbType !== 'mysql') return res.status(400).json({ error: "MySQL mode not enabled" });

  try {
    const pool = await getMysqlPool();
    const [rows] = await pool.execute(
      "SELECT * FROM letters WHERE toUserId = ? OR fromUserId = ? ORDER BY createdAt DESC",
      [req.params.userId, req.params.userId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/letters/:id", async (req, res) => {
  if (dbType !== 'mysql') return res.status(400).json({ error: "MySQL mode not enabled" });

  try {
    const pool = await getMysqlPool();
    const { isRead, replyEncryptedContent } = req.body;
    
    if (isRead !== undefined) {
      await pool.execute("UPDATE letters SET isRead = ? WHERE id = ?", [isRead, req.params.id]);
    }
    
    if (replyEncryptedContent !== undefined) {
      await pool.execute(
        "UPDATE letters SET replyEncryptedContent = ?, repliedAt = CURRENT_TIMESTAMP WHERE id = ?", 
        [replyEncryptedContent, req.params.id]
      );
    }

    res.json({ status: "success" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Vite Middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${dbType} mode`);
  });
}

startServer();
