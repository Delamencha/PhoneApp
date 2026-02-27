import * as SQLite from 'expo-sqlite';
import { File, Directory, Paths } from 'expo-file-system';
import { IdeaImage } from '../models/types';

function getImageDir(): Directory {
  return new Directory(Paths.document, 'idea_images');
}

function ensureImageDir(): void {
  const dir = getImageDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/** Copy a picked image to app's persistent storage and return the new URI */
export function saveImageToStorage(sourceUri: string): string {
  ensureImageDir();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const destFile = new File(getImageDir(), filename);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);
  return destFile.uri;
}

export function deleteImageFromStorage(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore deletion errors
  }
}

export async function getImagesByIdeaId(
  db: SQLite.SQLiteDatabase,
  ideaId: number
): Promise<IdeaImage[]> {
  return db.getAllAsync<IdeaImage>(
    'SELECT * FROM idea_images WHERE ideaId = ? ORDER BY sortOrder ASC',
    [ideaId]
  );
}

export async function addImageToIdea(
  db: SQLite.SQLiteDatabase,
  ideaId: number,
  uri: string
): Promise<number> {
  const row = await db.getFirstAsync<{ maxSort: number | null }>(
    'SELECT MAX(sortOrder) as maxSort FROM idea_images WHERE ideaId = ?',
    [ideaId]
  );
  const nextOrder = (row?.maxSort ?? -1) + 1;

  const persistedUri = saveImageToStorage(uri);

  const result = await db.runAsync(
    'INSERT INTO idea_images (ideaId, uri, sortOrder, createdAt) VALUES (?, ?, ?, ?)',
    [ideaId, persistedUri, nextOrder, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function removeImage(
  db: SQLite.SQLiteDatabase,
  imageId: number
): Promise<void> {
  const image = await db.getFirstAsync<IdeaImage>(
    'SELECT * FROM idea_images WHERE id = ?',
    [imageId]
  );
  if (image) {
    deleteImageFromStorage(image.uri);
    await db.runAsync('DELETE FROM idea_images WHERE id = ?', [imageId]);
  }
}

export async function removeAllImagesForIdea(
  db: SQLite.SQLiteDatabase,
  ideaId: number
): Promise<void> {
  const images = await getImagesByIdeaId(db, ideaId);
  for (const img of images) {
    deleteImageFromStorage(img.uri);
  }
  await db.runAsync('DELETE FROM idea_images WHERE ideaId = ?', [ideaId]);
}

export async function getImageCount(
  db: SQLite.SQLiteDatabase,
  ideaId: number
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM idea_images WHERE ideaId = ?',
    [ideaId]
  );
  return row?.count ?? 0;
}
