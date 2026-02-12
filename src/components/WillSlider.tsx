import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Spacing } from '../theme';

interface WillSliderProps {
  value: number;           // 0~1
  onValueChange: (v: number) => void;
}

/**
 * Unity-style willingness slider.
 * Shows a labeled horizontal slider with numeric display.
 */
export default function WillSlider({ value, onValueChange }: WillSliderProps) {
  const displayValue = Math.round(value * 100);

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
        <Slider
          style={styles.slider}
          minimumValue={0.05}
          maximumValue={1}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
          step={0.01}
        />
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
  slider: {
    flex: 1,
    height: 40,
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
