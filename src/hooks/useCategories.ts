import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../db/provider';
import { Category } from '../models/types';
import * as categoryService from '../services/categoryService';

export function useCategories() {
  const { db, isReady } = useDatabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      const cats = await categoryService.getAllCategories(db);
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const addCategory = useCallback(
    async (name: string) => {
      if (!db) return;
      await categoryService.createCategory(db, name);
      await refresh();
    },
    [db, refresh]
  );

  const editCategory = useCallback(
    async (id: number, name: string) => {
      if (!db) return;
      await categoryService.updateCategory(db, id, name);
      await refresh();
    },
    [db, refresh]
  );

  const removeCategory = useCallback(
    async (id: number): Promise<boolean> => {
      if (!db) return false;
      const count = await categoryService.getCategoryIdeaCount(db, id);
      if (count > 0) return false; // has ideas, cannot delete
      await categoryService.deleteCategory(db, id);
      await refresh();
      return true;
    },
    [db, refresh]
  );

  return {
    categories,
    loading,
    refresh,
    addCategory,
    editCategory,
    removeCategory,
  };
}
