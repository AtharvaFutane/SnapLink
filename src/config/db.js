const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'urlshortener.db');

let db = null;

// Initialize SQLite database (async — call once at startup)
const initDb = async () => {
  fs.mkdirSync(dataDir, { recursive: true });

  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing database from:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('Created new database at:', dbPath);
  }

  // Auto-create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      long_url TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_urls_code ON urls(code)');
  saveDb();

  return db;
};

// Save database to disk (call after every write operation)
const saveDb = () => {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
};

// Helper: get a single row (returns object or null)
const getRow = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
};

// Helper: run a write query (INSERT/UPDATE/DELETE), auto-saves to disk
const runQuery = (sql, params = []) => {
  db.run(sql, params);
  const changes = db.getRowsModified();
  saveDb();
  return { changes };
};

module.exports = { initDb, getRow, runQuery };
