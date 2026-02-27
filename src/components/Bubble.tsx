import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { BubbleData } from '../models/types';
import { Colors, Typography, Shadow } from '../theme';

interface BubbleProps {
  data: BubbleData;
  onTap: (idea: BubbleData) => void;
  onDragEnd: (id: number, screenX: number, screenY: number) => void;
  onDragMove?: (id: number, screenX: number, screenY: number) => void;
}

export default function Bubble({ data, onTap, onDragEnd, onDragMove }: BubbleProps) {
  const { idea, radius, screenX, screenY, color, elapsedLabel } = data;

  const absX = useSharedValue(screenX - radius);
  const absY = useSharedValue(screenY - radius);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  // Sync position from props when not dragging
  useEffect(() => {
    if (!isDragging.value) {
      absX.value = screenX - radius;
      absY.value = screenY - radius;
    }
  }, [screenX, screenY, radius]);

  const diameter = radius * 2;

  const handleTap = () => {
    onTap(data);
  };

  const handleDragEnd = (finalX: number, finalY: number) => {
    onDragEnd(idea.id, finalX, finalY);
  };

  const handleDragMove = (currentX: number, currentY: number) => {
    if (onDragMove) {
      onDragMove(idea.id, currentX, currentY);
    }
  };

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(handleTap)();
  });

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startX.value = absX.value;
      startY.value = absY.value;
      scale.value = withSpring(1.08, { damping: 15 });
    })
    .onUpdate((e) => {
      absX.value = startX.value + e.translationX;
      absY.value = startY.value + e.translationY;
      runOnJS(handleDragMove)(
        startX.value + radius + e.translationX,
        startY.value + radius + e.translationY
      );
    })
    .onEnd((e) => {
      const finalCenterX = startX.value + radius + e.translationX;
      const finalCenterY = startY.value + radius + e.translationY;
      isDragging.value = false;
      scale.value = withSpring(1, { damping: 15 });
      runOnJS(handleDragEnd)(finalCenterX, finalCenterY);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    left: absX.value,
    top: absY.value,
    transform: [
      { scale: scale.value },
    ],
  }));

  // Compute font size based on radius
  const fontSize = Math.max(8, Math.min(14, radius * 0.3));
  // Max characters that fit roughly
  const maxChars = Math.max(3, Math.floor((radius * 1.4) / (fontSize * 0.55)));
  const displayTitle =
    idea.title.length > maxChars
      ? idea.title.substring(0, maxChars - 1) + '…'
      : idea.title;

  // Determine text color based on background brightness
  const needsDarkText = isLightColor(color);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.bubble,
          {
            width: diameter,
            height: diameter,
            borderRadius: radius,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              fontSize,
              color: needsDarkText ? Colors.textPrimary : Colors.textOnPrimary,
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {displayTitle || 'New Idea'}
        </Text>
        <Text
          style={[
            styles.elapsed,
            {
              fontSize: Math.max(7, fontSize - 2),
              color: needsDarkText
                ? Colors.textSecondary
                : 'rgba(255,255,255,0.8)',
            },
          ]}
        >
          {elapsedLabel}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

/** Check if a color string is "light" enough for dark text */
function isLightColor(color: string): boolean {
  // Parse rgb(r,g,b)
  const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!match) return true;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  // Perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160;
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 4,
  },
  title: {
    textAlign: 'center',
    ...Typography.bubbleLabel,
  },
  elapsed: {
    textAlign: 'center',
    marginTop: 1,
  },
});
