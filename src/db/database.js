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

async function hasColumn(db, table, column) {
  const rows = await db.getAllAsync(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

async function migrate(db) {
  // v1 baseline
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

  // v2 additions — idempotent, safe for users upgrading from v1.
  if (!(await hasColumn(db, 'daily_logs', 'weight_kg'))) {
    await db.execAsync('ALTER TABLE daily_logs ADD COLUMN weight_kg REAL');
  }
  if (!(await hasColumn(db, 'daily_logs', 'moods'))) {
    // moods (plural, JSON array). "mood" (v1, single) is left in place
    // so historical data is preserved and read as [mood] on load.
    await db.execAsync('ALTER TABLE daily_logs ADD COLUMN moods TEXT');
  }
  if (!(await hasColumn(db, 'daily_logs', 'flow_type'))) {
    await db.execAsync('ALTER TABLE daily_logs ADD COLUMN flow_type TEXT');
  }
  if (!(await hasColumn(db, 'daily_logs', 'height_cm'))) {
    await db.execAsync('ALTER TABLE daily_logs ADD COLUMN height_cm REAL');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS intimacy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      protected_flag INTEGER NOT NULL,
      method TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS intimacy_date_idx ON intimacy(date);
  `);
}

export async function resetDatabase() {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS periods;
    DROP TABLE IF EXISTS daily_logs;
    DROP TABLE IF EXISTS reminders;
    DROP TABLE IF EXISTS intimacy;
  `);
  await migrate(db);
}
