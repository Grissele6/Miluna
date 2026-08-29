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
  return db.getAllAsync(
    'SELECT id, start_date as startDate, end_date as endDate FROM periods ORDER BY start_date ASC'
  );
}

// ---------- Daily logs ----------
function hydrateLog(row) {
  if (!row) return null;
  const moods = row.moods ? JSON.parse(row.moods) : row.mood ? [row.mood] : [];
  return {
    ...row,
    moods,
    symptoms: row.symptoms ? JSON.parse(row.symptoms) : [],
    weightKg: row.weight_kg ?? null,
  };
}

export async function upsertDailyLog(date, log) {
  const db = await getDb();
  const symptoms = log.symptoms ? JSON.stringify(log.symptoms) : null;
  const moods = log.moods ? JSON.stringify(log.moods) : null;
  const legacyMood = Array.isArray(log.moods) && log.moods.length ? log.moods[0] : null;
  await db.runAsync(
    `INSERT INTO daily_logs(date, mood, moods, energy, flow, symptoms, note, weight_kg, updated_at)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET
       mood = excluded.mood,
       moods = excluded.moods,
       energy = excluded.energy,
       flow = excluded.flow,
       symptoms = excluded.symptoms,
       note = excluded.note,
       weight_kg = excluded.weight_kg,
       updated_at = excluded.updated_at`,
    date,
    legacyMood,
    moods,
    log.energy ?? null,
    log.flow ?? null,
    symptoms,
    log.note ?? null,
    log.weightKg ?? null
  );
}

export async function getDailyLog(date) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM daily_logs WHERE date = ?', date);
  return hydrateLog(row);
}

export async function listDailyLogs(limit = 400) {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM daily_logs ORDER BY date DESC LIMIT ?', limit);
  return rows.map(hydrateLog);
}

export async function listWeightHistory() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT date, weight_kg as weightKg FROM daily_logs WHERE weight_kg IS NOT NULL ORDER BY date ASC'
  );
  return rows;
}

// ---------- Intimacy ----------
export async function addIntimacy(date, protectedFlag, method) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO intimacy(date, protected_flag, method) VALUES(?, ?, ?)',
    date,
    protectedFlag ? 1 : 0,
    method ?? null
  );
}

export async function listIntimacy(limit = 400) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT id, date, protected_flag as protectedFlag, method, created_at as createdAt FROM intimacy ORDER BY date DESC LIMIT ?',
    limit
  );
  return rows.map((r) => ({ ...r, protectedFlag: !!r.protectedFlag }));
}

export async function listIntimacyForDate(date) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT id, date, protected_flag as protectedFlag, method FROM intimacy WHERE date = ? ORDER BY created_at ASC',
    date
  );
  return rows.map((r) => ({ ...r, protectedFlag: !!r.protectedFlag }));
}

export async function deleteIntimacy(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM intimacy WHERE id = ?', id);
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
    version: 2,
    settings: await getAllSettings(),
    periods: await listPeriods(),
    dailyLogs: await listDailyLogs(10000),
    intimacy: await listIntimacy(10000),
    reminders: await listReminders(),
  };
}
