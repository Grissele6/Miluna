import { getDb } from './database';

// ---------- Settings ----------
export async function getSetting(key) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export async function getAllSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

// ---------- Periods ----------
export async function addPeriod(startDate, endDate = null) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO periods(start_date, end_date) VALUES(?, ?) ON CONFLICT(start_date) DO UPDATE SET end_date = excluded.end_date',
    startDate,
    endDate
  );
}

export async function updatePeriodEnd(startDate, endDate) {
  const db = await getDb();
  await db.runAsync('UPDATE periods SET end_date = ? WHERE start_date = ?', endDate, startDate);
}

export async function removePeriod(startDate) {
  const db = await getDb();
  await db.runAsync('DELETE FROM periods WHERE start_date = ?', startDate);
}

export async function listPeriods() {
  const db = await getDb();
  return db.getAllAsync('SELECT id, start_date as startDate, end_date as endDate FROM periods ORDER BY start_date ASC');
}

// ---------- Daily logs ----------
export async function upsertDailyLog(date, log) {
  const db = await getDb();
  const symptoms = log.symptoms ? JSON.stringify(log.symptoms) : null;
  await db.runAsync(
    `INSERT INTO daily_logs(date, mood, energy, flow, symptoms, note, updated_at)
     VALUES(?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET
       mood = excluded.mood,
       energy = excluded.energy,
       flow = excluded.flow,
       symptoms = excluded.symptoms,
       note = excluded.note,
       updated_at = excluded.updated_at`,
    date,
    log.mood ?? null,
    log.energy ?? null,
    log.flow ?? null,
    symptoms,
    log.note ?? null
  );
}

export async function getDailyLog(date) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM daily_logs WHERE date = ?', date);
  if (!row) return null;
  return { ...row, symptoms: row.symptoms ? JSON.parse(row.symptoms) : [] };
}

export async function listDailyLogs(limit = 400) {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM daily_logs ORDER BY date DESC LIMIT ?', limit);
  return rows.map((r) => ({ ...r, symptoms: r.symptoms ? JSON.parse(r.symptoms) : [] }));
}

// ---------- Reminders ----------
export async function listReminders() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM reminders ORDER BY kind ASC');
}

export async function upsertReminder(reminder) {
  const db = await getDb();
  const payload = reminder.payload ? JSON.stringify(reminder.payload) : null;
  if (reminder.id) {
    await db.runAsync(
      'UPDATE reminders SET enabled = ?, hour = ?, minute = ?, payload = ?, notif_id = ? WHERE id = ?',
      reminder.enabled ? 1 : 0,
      reminder.hour ?? null,
      reminder.minute ?? null,
      payload,
      reminder.notifId ?? null,
      reminder.id
    );
    return reminder.id;
  }
  const res = await db.runAsync(
    'INSERT INTO reminders(kind, enabled, hour, minute, payload, notif_id) VALUES(?, ?, ?, ?, ?, ?)',
    reminder.kind,
    reminder.enabled ? 1 : 0,
    reminder.hour ?? null,
    reminder.minute ?? null,
    payload,
    reminder.notifId ?? null
  );
  return res.lastInsertRowId;
}

export async function deleteReminder(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

// ---------- Export ----------
export async function exportAll() {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    settings: await getAllSettings(),
    periods: await listPeriods(),
    dailyLogs: await listDailyLogs(10000),
    reminders: await listReminders(),
  };
}
