import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { BubbleData, CompletionStatus, Idea, IdeaImage } from '../models/types';
import { CanvasSize, findNewBubblePosition, computeLayout, baseRadius, computeScaleFactor } from '../layout/bubblePacker';
import { useIdeas } from '../hooks/useIdeas';
import { useCompletedIdeas } from '../hooks/useCompletedIdeas';
import { useCategories } from '../hooks/useCategories';
import { useBubbleLayout } from '../hooks/useBubbleLayout';
import { useDatabase } from '../db/provider';
import * as imageService from '../services/imageService';
import * as settingsService from '../services/settingsService';
import BubbleCanvas from '../components/BubbleCanvas';
import CategorySidebar from '../components/CategorySidebar';
import IdeaDetailSheet from '../components/IdeaDetailSheet';
import CategoryManager from '../components/CategoryManager';
import CompletedList from '../components/CompletedList';
import ViewModeToggle, { ViewMode } from '../components/ViewModeToggle';
import FAB from '../components/FAB';
import { Colors, Spacing, BubbleConfig } from '../theme';

export default function MainScreen() {
  // ─── State ───
  const [viewMode, setViewMode] = useState<ViewMode>('ideas');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryRestored, setCategoryRestored] = useState(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewingCompleted, setIsViewingCompleted] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [ideaImages, setIdeaImages] = useState<IdeaImage[]>([]);
  const [pendingImageUris, setPendingImageUris] = useState<string[]>([]);

  const { db } = useDatabase();

  // ─── Data hooks ───
  const {
    categories,
    loading: catLoading,
    addCategory,
    editCategory,
    removeCategory,
    refresh: refreshCategories,
  } = useCategories();

  // ─── Restore persisted sidebar selection ───
  useEffect(() => {
    if (!db || catLoading || categoryRestored) return;
    (async () => {
      const savedId = await settingsService.getSelectedCategoryId(db);
      if (savedId !== null && categories.some((c) => c.id === savedId)) {
        setSelectedCategoryId(savedId);
      }
      setCategoryRestored(true);
    })();
  }, [db, catLoading, categoryRestored, categories]);

  const {
    ideas,
    loading: ideasLoading,
    addIdea,
    editIdea,
    updatePosition,
    removeIdea,
    refresh: refreshIdeas,
  } = useIdeas(selectedCategoryId);

  const {
    completedIdeas,
    completeIdea,
    removeCompletedIdea,
    refresh: refreshCompleted,
  } = useCompletedIdeas(selectedCategoryId);

  // ─── Layout ───
  const bubbles = useBubbleLayout(ideas, canvasSize);

  // ─── Bottom sheet ref ───
  const bottomSheetRef = useRef<BottomSheet>(null);

  // ─── Handlers ───
  const handleCanvasLayout = useCallback((size: CanvasSize) => {
    setCanvasSize(size);
  }, []);

  const loadIdeaImages = useCallback(
    async (ideaId: number) => {
      if (!db) return;
      const imgs = await imageService.getImagesByIdeaId(db, ideaId);
      setIdeaImages(imgs);
    },
    [db]
  );

  const handleBubbleTap = useCallback((data: BubbleData) => {
    setSelectedIdea(data.idea);
    setIsCreating(false);
    loadIdeaImages(data.idea.id);
    bottomSheetRef.current?.expand();
  }, [loadIdeaImages]);

  const handleBubbleDragEnd = useCallback(
    async (id: number, normalizedX: number, normalizedY: number) => {
      await updatePosition(id, normalizedX, normalizedY);
    },
    [updatePosition]
  );

  const handleFABPress = useCallback(() => {
    setSelectedIdea(null);
    setIsCreating(true);
    setIdeaImages([]);
    setPendingImageUris([]);
    bottomSheetRef.current?.expand();
  }, []);

  const handleSheetClose = useCallback(() => {
    setSelectedIdea(null);
    setIsCreating(false);
    setIsViewingCompleted(false);
    setIdeaImages([]);
    setPendingImageUris([]);
  }, []);

  const handleCompleteIdea = useCallback(
    async (status: CompletionStatus, note: string) => {
      if (!selectedIdea) return;
      await completeIdea(selectedIdea.id, status, note || undefined);
      await refreshIdeas();
      bottomSheetRef.current?.close();
    },
    [selectedIdea, completeIdea, refreshIdeas],
  );

  const handleCompletedIdeaTap = useCallback(
    (idea: Idea) => {
      setSelectedIdea(idea);
      setIsCreating(false);
      setIsViewingCompleted(true);
      loadIdeaImages(idea.id);
      bottomSheetRef.current?.expand();
    },
    [loadIdeaImages],
  );

  const handleDeleteCompletedIdea = useCallback(
    async (id: number) => {
      if (db) {
        await imageService.removeAllImagesForIdea(db, id);
      }
      await removeCompletedIdea(id);
    },
    [db, removeCompletedIdea],
  );

  const handleAddImage = useCallback(
    async (uri: string) => {
      if (isCreating) {
        setPendingImageUris((prev) => [...prev, uri]);
        return;
      }
      if (!db || !selectedIdea) return;
      await imageService.addImageToIdea(db, selectedIdea.id, uri);
      await loadIdeaImages(selectedIdea.id);
    },
    [db, selectedIdea, isCreating, loadIdeaImages],
  );

  const handleRemoveImage = useCallback(
    async (imageId: number) => {
      if (isCreating) {
        const index = -(imageId + 1);
        setPendingImageUris((prev) => prev.filter((_, i) => i !== index));
        return;
      }
      if (!db || !selectedIdea) return;
      await imageService.removeImage(db, imageId);
      await loadIdeaImages(selectedIdea.id);
    },
    [db, selectedIdea, isCreating, loadIdeaImages],
  );

  const handleSaveIdea = useCallback(
    async (data: Partial<Idea> & { title: string; source: string; willingness: number; categoryId: number; createdAt: string }) => {
      if (isCreating) {
        const existingOutputs = computeLayout(
          ideas.map((i) => ({ id: i.id, willingness: i.willingness, posX: i.posX, posY: i.posY })),
          canvasSize
        );
        const allInputs = [
          ...ideas.map((i) => ({ id: i.id, willingness: i.willingness, posX: i.posX, posY: i.posY })),
          { id: -1, willingness: data.willingness, posX: 0.5, posY: 0.5 },
        ];
        const scale = computeScaleFactor(allInputs, canvasSize);
        const newRadius = baseRadius(data.willingness, canvasSize.width) * scale;
        const pos = findNewBubblePosition(existingOutputs, newRadius, canvasSize);

        const newId = await addIdea({
          title: data.title,
          source: data.source,
          categoryId: data.categoryId,
          willingness: data.willingness,
          posX: pos.posX,
          posY: pos.posY,
          createdAt: data.createdAt,
        });

        if (newId && db && pendingImageUris.length > 0) {
          for (const uri of pendingImageUris) {
            await imageService.addImageToIdea(db, newId, uri);
          }
          setPendingImageUris([]);
        }
      } else if (selectedIdea) {
        await editIdea(selectedIdea.id, data);
      }
      bottomSheetRef.current?.close();
    },
    [isCreating, selectedIdea, ideas, canvasSize, addIdea, editIdea, db, pendingImageUris],
  );

  const handleDeleteIdea = useCallback(
    async (id: number) => {
      if (db) {
        await imageService.removeAllImagesForIdea(db, id);
      }
      await removeIdea(id);
      bottomSheetRef.current?.close();
    },
    [db, removeIdea]
  );

  const handleCategorySelect = useCallback(
    (catId: number | null) => {
      setSelectedCategoryId(catId);
      if (db) {
        settingsService.setSelectedCategoryId(db, catId);
      }
    },
    [db],
  );

  const handleCategoryLongPress = useCallback(() => {
    setShowCategoryManager(true);
  }, []);

  // ─── Loading state ───
  if (catLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Default category for new ideas
  const defaultCategoryId =
    selectedCategoryId ?? (categories.length > 0 ? categories[0].id : 1);

  const displayImages: IdeaImage[] = isCreating
    ? pendingImageUris.map((uri, i) => ({
        id: -(i + 1),
        ideaId: 0,
        uri,
        sortOrder: i,
        createdAt: '',
      }))
    : ideaImages;

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* Left sidebar */}
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
          onLongPress={handleCategoryLongPress}
        />

        {/* Main canvas area */}
        <View style={styles.canvasWrapper}>
          <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />

          {viewMode === 'ideas' ? (
            <>
              <BubbleCanvas
                bubbles={bubbles}
                onBubbleTap={handleBubbleTap}
                onBubbleDragEnd={handleBubbleDragEnd}
                canvasSize={canvasSize}
                onCanvasLayout={handleCanvasLayout}
              />

              {!ideasLoading && ideas.length === 0 && (
                <View style={styles.emptyState} pointerEvents="none">
                  <Text style={styles.emptyIcon}>💡</Text>
                  <Text style={styles.emptyText}>No ideas yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap + to capture your first idea
                  </Text>
                </View>
              )}

              <FAB onPress={handleFABPress} />
            </>
          ) : (
            <CompletedList
              ideas={completedIdeas}
              categories={categories}
              onPress={handleCompletedIdeaTap}
              onDelete={handleDeleteCompletedIdea}
            />
          )}
        </View>
      </View>

      {/* Bottom sheet for idea detail */}
      <IdeaDetailSheet
        ref={bottomSheetRef}
        idea={selectedIdea}
        isCreating={isCreating}
        isViewingCompleted={isViewingCompleted}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        images={displayImages}
        onSave={handleSaveIdea}
        onDelete={handleDeleteIdea}
        onComplete={handleCompleteIdea}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        onClose={handleSheetClose}
      />

      {/* Category manager modal */}
      <CategoryManager
        visible={showCategoryManager}
        categories={categories}
        onClose={() => setShowCategoryManager(false)}
        onAdd={addCategory}
        onEdit={editCategory}
        onRemove={removeCategory}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
