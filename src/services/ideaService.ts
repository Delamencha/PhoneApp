import * as SQLite from 'expo-sqlite';
import { Idea, IdeaFormData } from '../models/types';

export async function getAllIdeas(db: SQLite.SQLiteDatabase): Promise<Idea[]> {
  return db.getAllAsync<Idea>('SELECT * FROM ideas ORDER BY createdAt DESC');
}

export async function getIdeasByCategory(
  db: SQLite.SQLiteDatabase,
  categoryId: number
): Promise<Idea[]> {
  return db.getAllAsync<Idea>(
    'SELECT * FROM ideas WHERE categoryId = ? ORDER BY createdAt DESC',
    [categoryId]
  );
}

export async function getIdeaById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Idea | null> {
  return db.getFirstAsync<Idea>('SELECT * FROM ideas WHERE id = ?', [id]);
}

export async function createIdea(
  db: SQLite.SQLiteDatabase,
  data: IdeaFormData
): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO ideas (title, source, categoryId, willingness, posX, posY, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.source,
      data.categoryId,
      data.willingness,
      data.posX,
      data.posY,
      data.createdAt || now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateIdea(
  db: SQLite.SQLiteDatabase,
  id: number,
  data: Partial<Omit<Idea, 'id'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.source !== undefined) {
    fields.push('source = ?');
    values.push(data.source);
  }
  if (data.categoryId !== undefined) {
    fields.push('categoryId = ?');
    values.push(data.categoryId);
  }
  if (data.willingness !== undefined) {
    fields.push('willingness = ?');
    values.push(data.willingness);
  }
  if (data.posX !== undefined) {
    fields.push('posX = ?');
    values.push(data.posX);
  }
  if (data.posY !== undefined) {
    fields.push('posY = ?');
    values.push(data.posY);
  }
  if (data.createdAt !== undefined) {
    fields.push('createdAt = ?');
    values.push(data.createdAt);
  }

  if (fields.length === 0) return;

  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE ideas SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function updateIdeaPosition(
  db: SQLite.SQLiteDatabase,
  id: number,
  posX: number,
  posY: number
): Promise<void> {
  await db.runAsync(
    'UPDATE ideas SET posX = ?, posY = ?, updatedAt = ? WHERE id = ?',
    [posX, posY, new Date().toISOString(), id]
  );
}

export async function deleteIdea(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM ideas WHERE id = ?', [id]);
}

export async function getIdeaCountByCategory(
  db: SQLite.SQLiteDatabase,
  categoryId: number
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM ideas WHERE categoryId = ?',
    [categoryId]
  );
  return row?.count ?? 0;
}
