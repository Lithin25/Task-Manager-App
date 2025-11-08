// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.sqlite');
const INIT_SQL = path.join(__dirname, 'init-db.sql');

// Create DB file if missing
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '');

// Open DB
const db = new Database(DB_FILE);

// Run init script (idempotent)
if (fs.existsSync(INIT_SQL)) {
  const initSql = fs.readFileSync(INIT_SQL, 'utf8');
  db.exec(initSql);
}

const app = express();
app.use(cors());
app.use(express.json());

// Helper to build WHERE clause and params
function buildFilters(q) {
  const filters = [];
  const params = {};
  if (q.status) {
    filters.push('status = @status');
    params.status = q.status;
  }
  if (q.title_like) {
    filters.push('LOWER(title) LIKE @title_like');
    params.title_like = `%${String(q.title_like).toLowerCase()}%`;
  }
  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
  return { where, params };
}

// GET /tasks
app.get('/tasks', (req, res) => {
  try {
    const q = req.query || {};
    const { where, params } = buildFilters(q);
    const sort = req.query._sort ? String(req.query._sort) : 'created_at';
    const order = (req.query._order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const sql = `SELECT id, title, description, status, created_at FROM tasks ${where} ORDER BY ${sort} ${order}`;
    const stmt = db.prepare(sql);
    const rows = stmt.all(params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks
app.post('/tasks', (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    const stmt = db.prepare('INSERT INTO tasks (title, description, status) VALUES (@title, @description, @status)');
    const info = stmt.run({
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      status: 'Pending'
    });
    const task = db.prepare('SELECT id, title, description, status, created_at FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id
app.patch('/tasks/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const allowed = ['status', 'title', 'description'];
    const toUpdate = {};
    for (const k of allowed) if (k in req.body) toUpdate[k] = req.body[k];

    if (Object.keys(toUpdate).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    const sets = Object.keys(toUpdate).map(k => `${k} = @${k}`).join(', ');
    const sql = `UPDATE tasks SET ${sets} WHERE id = @id`;
    const stmt = db.prepare(sql);
    stmt.run({ ...toUpdate, id });

    const updated = db.prepare('SELECT id, title, description, status, created_at FROM tasks WHERE id = ?').get(id);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// health
app.get('/_health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express + SQLite server listening on port ${PORT}`);
  console.log('DB file:', DB_FILE);
});
