import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../models/types';
import { Colors, Spacing, BorderRadius, Shadow } from '../theme';

interface CategoryManagerProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: number, name: string) => Promise<void>;
  onRemove: (id: number) => Promise<boolean>;
}

export default function CategoryManager({
  visible,
  categories,
  onClose,
  onAdd,
  onEdit,
  onRemove,
}: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setNewName('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    await onEdit(editingId, trimmed);
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRemove = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Categories with ideas cannot be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await onRemove(cat.id);
            if (!success) {
              Alert.alert(
                'Cannot Delete',
                'This category still has ideas. Move or delete them first.'
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Category }) => {
    const isEditing = editingId === item.id;

    return (
      <View style={styles.row}>
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editingName}
              onChangeText={setEditingName}
              autoFocus
              onSubmitEditing={handleSaveEdit}
            />
            <TouchableOpacity onPress={handleSaveEdit} style={styles.iconBtn}>
              <Ionicons name="checkmark" size={22} color={Colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.displayRow}>
            <Text style={styles.catName}>{item.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleStartEdit(item)}
                style={styles.iconBtn}
              >
                <Ionicons name="pencil" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                style={styles.iconBtn}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Manage Categories</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Category list */}
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Add new */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="New category name"
              placeholderTextColor={Colors.placeholder}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              style={[styles.addBtn, !newName.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!newName.trim()}
            >
              <Ionicons name="add" size={22} color={Colors.textOnPrimary} />
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
  dialog: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  list: {
    maxHeight: 300,
  },
  row: {
    paddingVertical: Spacing.sm,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catName: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 4,
    color: Colors.textPrimary,
  },
  iconBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  addInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
  },
  addBtn: {
    marginLeft: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: Colors.placeholder,
  },
});
