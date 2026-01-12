import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const db = await open({
  filename: "./database.db",
  driver: sqlite3.Database
});

// Create tables if they do not exist
await db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  access_until DATETIME,
  device_hash TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT,
  options_json TEXT,
  rarity TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

await db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS access_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const accessInfo = await db.all("PRAGMA table_info(access_requests)");
const hasPlanDays = accessInfo.some(col => col.name === "plan_days");
const hasCurrency = accessInfo.some(col => col.name === "currency");
const hasPrice = accessInfo.some(col => col.name === "price");
const hasStatus = accessInfo.some(col => col.name === "status");
const hasContactName = accessInfo.some(col => col.name === "contact_name");
const hasContactLastName = accessInfo.some(col => col.name === "contact_last_name");
const hasContactEmail = accessInfo.some(col => col.name === "contact_email");
const hasContactPhone = accessInfo.some(col => col.name === "contact_phone");
const hasContactNotes = accessInfo.some(col => col.name === "contact_notes");
if (!hasPlanDays) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN plan_days INTEGER");
}
if (!hasCurrency) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN currency TEXT");
}
if (!hasPrice) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN price TEXT");
}
if (!hasStatus) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN status TEXT DEFAULT 'pending'");
  await db.exec("UPDATE access_requests SET status = 'pending' WHERE status IS NULL");
}
if (!hasContactName) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN contact_name TEXT");
}
if (!hasContactLastName) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN contact_last_name TEXT");
}
if (!hasContactEmail) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN contact_email TEXT");
}
if (!hasContactPhone) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN contact_phone TEXT");
}
if (!hasContactNotes) {
  await db.exec("ALTER TABLE access_requests ADD COLUMN contact_notes TEXT");
}

const usersInfo = await db.all("PRAGMA table_info(users)");
const hasAccessUntil = usersInfo.some(col => col.name === "access_until");
const hasDeviceHash = usersInfo.some(col => col.name === "device_hash");
const hasEmail = usersInfo.some(col => col.name === "email");
if (!hasAccessUntil) {
  await db.exec("ALTER TABLE users ADD COLUMN access_until DATETIME");
}
if (!hasDeviceHash) {
  await db.exec("ALTER TABLE users ADD COLUMN device_hash TEXT");
}
if (!hasEmail) {
  await db.exec("ALTER TABLE users ADD COLUMN email TEXT");
}

const usersWithoutAccess = await db.all(
  "SELECT id, created_at FROM users WHERE access_until IS NULL"
);
for (const row of usersWithoutAccess) {
  const createdAt = row.created_at ? new Date(row.created_at) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) continue;
  const accessUntil = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000)
    .toISOString();
  await db.run(
    "UPDATE users SET access_until = ? WHERE id = ?",
    [accessUntil, row.id]
  );
}

const tableInfo = await db.all("PRAGMA table_info(search_configs)");
const hasItemType = tableInfo.some(col => col.name === "item_type");
const hasItemLevel = tableInfo.some(col => col.name === "item_level");
const hasMaxPrice = tableInfo.some(col => col.name === "max_price");

if (!hasItemType) {
  await db.exec("ALTER TABLE search_configs ADD COLUMN item_type TEXT");
}

if (hasItemLevel || hasMaxPrice) {
  await db.exec("BEGIN");
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS search_configs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        item_type TEXT,
        options_json TEXT,
        rarity TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.exec(`
      INSERT INTO search_configs_new (
        id, user_id, item_name, item_type, options_json, rarity, active, created_at
      )
      SELECT
        id, user_id, item_name, item_type, options_json, rarity, active, created_at
      FROM search_configs;
    `);

    await db.exec("DROP TABLE search_configs");
    await db.exec("ALTER TABLE search_configs_new RENAME TO search_configs");
    await db.exec("COMMIT");
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}

const rows = await db.all(
  "SELECT id, item_type, options_json FROM search_configs"
);

for (const row of rows) {
  if (row.item_type) continue;
  let type = "";
  try {
    const opts = JSON.parse(row.options_json || "{}");
    type = opts.type || "";
  } catch {
    type = "";
  }

  if (type) {
    await db.run(
      "UPDATE search_configs SET item_type = ? WHERE id = ?",
      [type, row.id]
    );
  }
}
