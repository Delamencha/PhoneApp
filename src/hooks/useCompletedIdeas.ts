import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../db/provider';
import { Idea, CompletionStatus } from '../models/types';
import * as ideaService from '../services/ideaService';

export function useCompletedIdeas(selectedCategoryId: number | null) {
  const { db, isReady } = useDatabase();
  const [completedIdeas, setCompletedIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      const result =
        selectedCategoryId === null
          ? await ideaService.getAllCompletedIdeas(db)
          : await ideaService.getCompletedIdeasByCategory(db, selectedCategoryId);
      setCompletedIdeas(result);
    } catch (e) {
      console.error('Failed to load completed ideas:', e);
    } finally {
      setLoading(false);
    }
  }, [db, selectedCategoryId]);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const completeIdea = useCallback(
    async (id: number, status: CompletionStatus, note?: string) => {
      if (!db) return;
      await ideaService.completeIdea(db, id, status, note);
      await refresh();
    },
    [db, refresh],
  );

  const removeCompletedIdea = useCallback(
    async (id: number) => {
      if (!db) return;
      await ideaService.deleteIdea(db, id);
      await refresh();
    },
    [db, refresh],
  );

  return { completedIdeas, loading, refresh, completeIdea, removeCompletedIdea };
}
