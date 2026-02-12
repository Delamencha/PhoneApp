import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../db/provider';
import { Idea, IdeaFormData } from '../models/types';
import * as ideaService from '../services/ideaService';

export function useIdeas(selectedCategoryId: number | null) {
  const { db, isReady } = useDatabase();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      let result: Idea[];
      if (selectedCategoryId === null) {
        result = await ideaService.getAllIdeas(db);
      } else {
        result = await ideaService.getIdeasByCategory(db, selectedCategoryId);
      }
      setIdeas(result);
    } catch (e) {
      console.error('Failed to load ideas:', e);
    } finally {
      setLoading(false);
    }
  }, [db, selectedCategoryId]);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const addIdea = useCallback(
    async (data: IdeaFormData): Promise<number | null> => {
      if (!db) return null;
      const id = await ideaService.createIdea(db, data);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const editIdea = useCallback(
    async (id: number, data: Partial<Omit<Idea, 'id'>>) => {
      if (!db) return;
      await ideaService.updateIdea(db, id, data);
      await refresh();
    },
    [db, refresh]
  );

  const updatePosition = useCallback(
    async (id: number, posX: number, posY: number) => {
      if (!db) return;
      await ideaService.updateIdeaPosition(db, id, posX, posY);
      // Don't full-refresh for position updates (performance)
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === id ? { ...idea, posX, posY } : idea))
      );
    },
    [db]
  );

  const removeIdea = useCallback(
    async (id: number) => {
      if (!db) return;
      await ideaService.deleteIdea(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return {
    ideas,
    loading,
    refresh,
    addIdea,
    editIdea,
    updatePosition,
    removeIdea,
  };
}
