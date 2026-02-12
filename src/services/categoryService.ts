import * as SQLite from 'expo-sqlite';
import { Category } from '../models/types';

export async function getAllCategories(
  db: SQLite.SQLiteDatabase
): Promise<Category[]> {
  return db.getAllAsync<Category>(
    'SELECT * FROM categories ORDER BY sortOrder ASC'
  );
}

export async function getCategoryById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Category | null> {
  return db.getFirstAsync<Category>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
}

export async function createCategory(
  db: SQLite.SQLiteDatabase,
  name: string
): Promise<number> {
  // Get max sortOrder
  const row = await db.getFirstAsync<{ maxSort: number | null }>(
    'SELECT MAX(sortOrder) as maxSort FROM categories'
  );
  const nextOrder = (row?.maxSort ?? 0) + 1;

  const result = await db.runAsync(
    'INSERT INTO categories (name, sortOrder) VALUES (?, ?)',
    [name, nextOrder]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  db: SQLite.SQLiteDatabase,
  id: number,
  name: string
): Promise<void> {
  await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteCategory(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function getCategoryIdeaCount(
  db: SQLite.SQLiteDatabase,
  categoryId: number
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM ideas WHERE categoryId = ?',
    [categoryId]
  );
  return row?.count ?? 0;
}
