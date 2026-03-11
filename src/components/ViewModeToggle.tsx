import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadow, Spacing } from '../theme';

export type ViewMode = 'ideas' | 'completed';

interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { top: insets.top + Spacing.sm }]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.segment, mode === 'ideas' && styles.segmentActive]}
          onPress={() => onModeChange('ideas')}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, mode === 'ideas' && styles.labelActive]}>
            Ideas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, mode === 'completed' && styles.segmentActive]}
          onPress={() => onModeChange('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, mode === 'completed' && styles.labelActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.sm,
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: BorderRadius.xl,
    padding: 3,
    ...Shadow.small,
  },
  segment: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.xl - 2,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
});
