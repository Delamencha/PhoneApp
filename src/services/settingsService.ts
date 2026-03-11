import { SQLiteDatabase } from 'expo-sqlite';

const SELECTED_CATEGORY_KEY = 'selectedCategoryId';

export async function getSetting(
  db: SQLiteDatabase,
  key: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row ? row.value : null;
}

export async function setSetting(
  db: SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function getSelectedCategoryId(
  db: SQLiteDatabase,
): Promise<number | null> {
  const raw = await getSetting(db, SELECTED_CATEGORY_KEY);
  if (raw === null || raw === 'null') return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

export async function setSelectedCategoryId(
  db: SQLiteDatabase,
  categoryId: number | null,
): Promise<void> {
  await setSetting(db, SELECTED_CATEGORY_KEY, String(categoryId));
}
