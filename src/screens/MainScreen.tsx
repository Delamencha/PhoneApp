import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { BubbleData, Idea, IdeaImage } from '../models/types';
import { CanvasSize, findNewBubblePosition, computeLayout, baseRadius, computeScaleFactor } from '../layout/bubblePacker';
import { useIdeas } from '../hooks/useIdeas';
import { useCategories } from '../hooks/useCategories';
import { useBubbleLayout } from '../hooks/useBubbleLayout';
import { useDatabase } from '../db/provider';
import * as imageService from '../services/imageService';
import BubbleCanvas from '../components/BubbleCanvas';
import CategorySidebar from '../components/CategorySidebar';
import IdeaDetailSheet from '../components/IdeaDetailSheet';
import CategoryManager from '../components/CategoryManager';
import FAB from '../components/FAB';
import { Colors, Spacing, BubbleConfig } from '../theme';

export default function MainScreen() {
  // ─── State ───
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [ideaImages, setIdeaImages] = useState<IdeaImage[]>([]);

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

  const {
    ideas,
    loading: ideasLoading,
    addIdea,
    editIdea,
    updatePosition,
    removeIdea,
    refresh: refreshIdeas,
  } = useIdeas(selectedCategoryId);

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
    bottomSheetRef.current?.expand();
  }, []);

  const handleSheetClose = useCallback(() => {
    setSelectedIdea(null);
    setIsCreating(false);
    setIdeaImages([]);
  }, []);

  const handleAddImage = useCallback(
    async (uri: string) => {
      if (!db || !selectedIdea) return;
      await imageService.addImageToIdea(db, selectedIdea.id, uri);
      await loadIdeaImages(selectedIdea.id);
    },
    [db, selectedIdea, loadIdeaImages]
  );

  const handleRemoveImage = useCallback(
    async (imageId: number) => {
      if (!db || !selectedIdea) return;
      await imageService.removeImage(db, imageId);
      await loadIdeaImages(selectedIdea.id);
    },
    [db, selectedIdea, loadIdeaImages]
  );

  const handleSaveIdea = useCallback(
    async (data: Partial<Idea> & { title: string; source: string; willingness: number; categoryId: number; createdAt: string }) => {
      if (isCreating) {
        // Find position for new bubble
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

        await addIdea({
          title: data.title,
          source: data.source,
          categoryId: data.categoryId,
          willingness: data.willingness,
          posX: pos.posX,
          posY: pos.posY,
          createdAt: data.createdAt,
        });
      } else if (selectedIdea) {
        await editIdea(selectedIdea.id, data);
      }
      bottomSheetRef.current?.close();
    },
    [isCreating, selectedIdea, ideas, canvasSize, addIdea, editIdea]
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

  const handleCategorySelect = useCallback((catId: number | null) => {
    setSelectedCategoryId(catId);
  }, []);

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
          <BubbleCanvas
            bubbles={bubbles}
            onBubbleTap={handleBubbleTap}
            onBubbleDragEnd={handleBubbleDragEnd}
            canvasSize={canvasSize}
            onCanvasLayout={handleCanvasLayout}
          />

          {/* Empty state */}
          {!ideasLoading && ideas.length === 0 && (
            <View style={styles.emptyState} pointerEvents="none">
              <Text style={styles.emptyIcon}>💡</Text>
              <Text style={styles.emptyText}>No ideas yet</Text>
              <Text style={styles.emptySubtext}>
                Tap + to capture your first idea
              </Text>
            </View>
          )}

          {/* FAB */}
          <FAB onPress={handleFABPress} />
        </View>
      </View>

      {/* Bottom sheet for idea detail */}
      <IdeaDetailSheet
        ref={bottomSheetRef}
        idea={selectedIdea}
        isCreating={isCreating}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        images={ideaImages}
        onSave={handleSaveIdea}
        onDelete={handleDeleteIdea}
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
