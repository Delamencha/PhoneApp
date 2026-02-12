import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BubbleData } from '../models/types';
import { CanvasSize } from '../layout/bubblePacker';
import Bubble from './Bubble';
import { Colors } from '../theme';

interface BubbleCanvasProps {
  bubbles: BubbleData[];
  onBubbleTap: (data: BubbleData) => void;
  onBubbleDragEnd: (id: number, normalizedX: number, normalizedY: number) => void;
  canvasSize: CanvasSize;
  onCanvasLayout: (size: CanvasSize) => void;
}

export default function BubbleCanvas({
  bubbles,
  onBubbleTap,
  onBubbleDragEnd,
  canvasSize,
  onCanvasLayout,
}: BubbleCanvasProps) {
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) {
        onCanvasLayout({ width, height });
      }
    },
    [onCanvasLayout]
  );

  const handleDragEnd = useCallback(
    (id: number, screenX: number, screenY: number) => {
      if (canvasSize.width === 0 || canvasSize.height === 0) return;
      // Convert screen coords to normalized 0~1
      const normalizedX = Math.max(0, Math.min(1, screenX / canvasSize.width));
      const normalizedY = Math.max(0, Math.min(1, screenY / canvasSize.height));
      onBubbleDragEnd(id, normalizedX, normalizedY);
    },
    [canvasSize, onBubbleDragEnd]
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {bubbles.map((bubble) => (
        <Bubble
          key={bubble.idea.id}
          data={bubble}
          onTap={onBubbleTap}
          onDragEnd={handleDragEnd}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
});
