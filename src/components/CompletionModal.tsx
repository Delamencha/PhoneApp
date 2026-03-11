import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompletionStatus } from '../models/types';
import { Colors, CompletionColors, CompletionLabels, Spacing, BorderRadius, Shadow } from '../theme';

interface CompletionModalProps {
  visible: boolean;
  onConfirm: (status: CompletionStatus, note: string) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: CompletionStatus[] = [
  CompletionStatus.Cancelled,
  CompletionStatus.NotWorthCost,
  CompletionStatus.Replaced,
  CompletionStatus.DoneAverage,
  CompletionStatus.DoneGreat,
];

export default function CompletionModal({
  visible,
  onConfirm,
  onCancel,
}: CompletionModalProps) {
  const [selected, setSelected] = useState<CompletionStatus | null>(null);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (selected === null) return;
    onConfirm(selected, note.trim());
    setSelected(null);
    setNote('');
  };

  const handleCancel = () => {
    setSelected(null);
    setNote('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Complete Idea</Text>
          <Text style={styles.subtitle}>How did this idea end up?</Text>

          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => {
              const isActive = selected === s;
              const color = CompletionColors[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={styles.statusItem}
                  onPress={() => setSelected(s)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.statusCircle,
                      { backgroundColor: color },
                      isActive && styles.statusCircleActive,
                    ]}
                  >
                    {isActive && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.statusLabel,
                      isActive && { color, fontWeight: '600' },
                    ]}
                    numberOfLines={2}
                  >
                    {CompletionLabels[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={Colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                selected === null && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selected === null}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.large,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  statusCircleActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
    ...Shadow.medium,
  },
  statusLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 13,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceVariant,
    minHeight: 70,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    ...Shadow.small,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
});
