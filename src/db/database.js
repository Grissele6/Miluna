import * as SQLite from 'expo-sqlite';

let _db = null;

export async function getDb() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('miluna.db');
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(_db);
  return _db;
}

async function migrate(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS periods_start_uniq ON periods(start_date);

    CREATE TABLE IF NOT EXISTS daily_logs (
      date TEXT PRIMARY KEY,
      mood TEXT,
      energy INTEGER,
      flow TEXT,
      symptoms TEXT,
      note TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      hour INTEGER,
      minute INTEGER,
      payload TEXT,
      notif_id TEXT
    );
  `);
}

export async function resetDatabase() {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS periods;
    DROP TABLE IF EXISTS daily_logs;
    DROP TABLE IF EXISTS reminders;
  `);
  await migrate(db);
}
