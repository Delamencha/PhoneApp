import * as SQLite from 'expo-sqlite';

const DB_NAME = 'idea_bubbles.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeSchema(dbInstance);
  return dbInstance;
}

async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      categoryId INTEGER NOT NULL,
      willingness REAL NOT NULL DEFAULT 0.5,
      posX REAL NOT NULL DEFAULT 0.5,
      posY REAL NOT NULL DEFAULT 0.5,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS idea_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ideaId INTEGER NOT NULL,
      uri TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (ideaId) REFERENCES ideas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ─── Migration: add completion columns to ideas ───
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(ideas)`
  );
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('completionStatus')) {
    await db.execAsync(`
      ALTER TABLE ideas ADD COLUMN completionStatus INTEGER DEFAULT NULL;
      ALTER TABLE ideas ADD COLUMN completionNote TEXT DEFAULT NULL;
      ALTER TABLE ideas ADD COLUMN completedAt TEXT DEFAULT NULL;
    `);
  }

  // Seed default categories if none exist
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (row && row.count === 0) {
    await db.execAsync(`
      INSERT INTO categories (name, sortOrder) VALUES ('Work & Study', 1);
      INSERT INTO categories (name, sortOrder) VALUES ('Entertain', 2);
      INSERT INTO categories (name, sortOrder) VALUES ('Others', 3);
    `);
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
