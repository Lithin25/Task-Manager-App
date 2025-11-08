-- init-db.sql: creates tasks table and seeds a sample task
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed sample task (only if empty)
INSERT INTO tasks (title, description, status)
SELECT 'Sample Task', 'This is a seeded task', 'Pending'
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);
