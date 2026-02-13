import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
const port = process.env.PORT || 4000;

// Basic CORS for local dev; tighten this in production.
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(express.json({ limit: "2mb" }));

// Simple SQLite JSON store: one table for studies, JSON payload matches StoredStudy shape.
const db = new Database("user-research.db");

db.prepare(
  `CREATE TABLE IF NOT EXISTS studies (
    id TEXT PRIMARY KEY,
    json TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`
).run();

const upsertStudyStmt = db.prepare(
  `INSERT INTO studies (id, json, createdAt, updatedAt)
   VALUES (@id, @json, @createdAt, @updatedAt)
   ON CONFLICT(id) DO UPDATE SET
     json = excluded.json,
     updatedAt = excluded.updatedAt`
);

const getStudyStmt = db.prepare(`SELECT * FROM studies WHERE id = ?`);
const listStudiesStmt = db.prepare(`SELECT * FROM studies ORDER BY updatedAt DESC`);
const deleteStudyStmt = db.prepare(`DELETE FROM studies WHERE id = ?`);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// List all studies (admin use)
app.get("/api/studies", (_req, res) => {
  const rows = listStudiesStmt.all();
  const studies = rows.map((row) => JSON.parse(row.json));
  res.json(studies);
});

// Get single study (admin or participant/survey use)
app.get("/api/studies/:id", (req, res) => {
  const row = getStudyStmt.get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Study not found" });
  }
  res.json(JSON.parse(row.json));
});

// Create or update a study (body should be a StoredStudy JSON)
app.put("/api/studies/:id", (req, res) => {
  const study = req.body;
  if (!study || typeof study !== "object" || study.id !== req.params.id) {
    return res.status(400).json({ error: "Invalid study payload or id mismatch" });
  }
  const now = Date.now();
  const createdAt = typeof study.createdAt === "number" ? study.createdAt : now;
  const payload = {
    id: study.id,
    json: JSON.stringify({ ...study, createdAt, updatedAt: now }),
    createdAt,
    updatedAt: now,
  };
  upsertStudyStmt.run(payload);
  res.json({ ok: true });
});

// Delete a study
app.delete("/api/studies/:id", (req, res) => {
  deleteStudyStmt.run(req.params.id);
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`User Research backend listening on http://localhost:${port}`);
});

