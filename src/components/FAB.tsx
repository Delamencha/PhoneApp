import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BubbleConfig, Shadow } from '../theme';

interface FABProps {
  onPress: () => void;
}

export default function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: BubbleConfig.fabMargin,
    right: BubbleConfig.fabMargin,
    width: BubbleConfig.fabSize,
    height: BubbleConfig.fabSize,
    borderRadius: BubbleConfig.fabSize / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.large,
  },
});
