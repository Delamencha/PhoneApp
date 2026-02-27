import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../theme';

interface WillSliderProps {
  value: number;
  onValueChange: (v: number) => void;
}

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;
const MIN_VALUE = 0.05;
const MAX_VALUE = 1;
const VALUE_RANGE = MAX_VALUE - MIN_VALUE;

export default function WillSlider({ value, onValueChange }: WillSliderProps) {
  const displayValue = Math.round(value * 100);
  const trackWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const startThumbX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      trackWidth.value = w;
      thumbX.value = ((value - MIN_VALUE) / VALUE_RANGE) * w;
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging.value && trackWidth.value > 0) {
      thumbX.value = ((value - MIN_VALUE) / VALUE_RANGE) * trackWidth.value;
    }
  }, [value]);

  const emitValue = useCallback(
    (v: number) => {
      const clamped = Math.max(MIN_VALUE, Math.min(MAX_VALUE, Math.round(v * 100) / 100));
      onValueChange(clamped);
    },
    [onValueChange]
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      startThumbX.value = thumbX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newX = clamp(startThumbX.value + e.translationX, 0, trackWidth.value);
      thumbX.value = newX;
      const w = trackWidth.value;
      if (w > 0) {
        const newVal = MIN_VALUE + (newX / w) * VALUE_RANGE;
        runOnJS(emitValue)(newVal);
      }
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
    })
    .activeOffsetX([-5, 5])
    .failOffsetY([-15, 15]);

  const tap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const newX = clamp(e.x, 0, trackWidth.value);
    thumbX.value = newX;
    const w = trackWidth.value;
    if (w > 0) {
      const newVal = MIN_VALUE + (newX / w) * VALUE_RANGE;
      runOnJS(emitValue)(newVal);
    }
  });

  const gesture = Gesture.Exclusive(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Willingness</Text>
        <View style={styles.valueBadge}>
          <Text style={styles.valueText}>{displayValue}%</Text>
        </View>
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.minLabel}>Low</Text>

        <GestureDetector gesture={gesture}>
          <View style={styles.trackContainer} onLayout={handleLayout}>
            <View style={styles.track} />
            <Animated.View style={[styles.trackFill, fillStyle]} />
            <Animated.View style={[styles.thumb, thumbStyle]} />
          </View>
        </GestureDetector>

        <Text style={styles.maxLabel}>High</Text>
      </View>

      <Text style={styles.hint}>Controls the bubble size on canvas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  valueBadge: {
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.border,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: (40 - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  minLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginRight: 4,
  },
  maxLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  hint: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
