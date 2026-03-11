import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, Idea } from '../models/types';
import {
  Colors,
  CompletionColors,
  CompletionLabels,
  Spacing,
  BorderRadius,
  Shadow,
} from '../theme';

interface CompletedListProps {
  ideas: Idea[];
  categories: Category[];
  onPress: (idea: Idea) => void;
  onDelete: (id: number) => void;
}

type SortKey = 'createdAt' | 'completedAt' | 'duration';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'createdAt', label: 'Created Time', icon: 'calendar-outline' },
  { key: 'completedAt', label: 'Completed Time', icon: 'checkmark-circle-outline' },
  { key: 'duration', label: 'Duration (days)', icon: 'hourglass-outline' },
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}/${mm}/${dd}`;
}

function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 86_400_000;
  return Math.floor(
    (new Date(isoB).getTime() - new Date(isoA).getTime()) / msPerDay,
  );
}

function sortIdeas(
  ideas: Idea[],
  sortKey: SortKey,
  ascending: boolean,
): Idea[] {
  const sorted = [...ideas].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'completedAt':
        cmp =
          new Date(a.completedAt ?? 0).getTime() -
          new Date(b.completedAt ?? 0).getTime();
        break;
      case 'duration': {
        const dA = daysBetween(a.createdAt, a.completedAt ?? a.createdAt);
        const dB = daysBetween(b.createdAt, b.completedAt ?? b.createdAt);
        cmp = dA - dB;
        break;
      }
    }
    return cmp;
  });
  return ascending ? sorted : sorted.reverse();
}

export default function CompletedList({
  ideas,
  categories,
  onPress,
  onDelete,
}: CompletedListProps) {
  const insets = useSafeAreaInsets();
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [ascending, setAscending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const sortedIdeas = useMemo(
    () => sortIdeas(ideas, sortKey, ascending),
    [ideas, sortKey, ascending],
  );

  const handleSortSelect = (key: SortKey) => {
    if (key === sortKey) {
      setAscending((prev) => !prev);
    } else {
      setSortKey(key);
      const defaultAsc = key === 'duration';
      setAscending(defaultAsc);
    }
    setMenuVisible(false);
  };

  const handleLongPress = (idea: Idea) => {
    Alert.alert('Delete', `Delete "${idea.title || 'this idea'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(idea.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Idea }) => {
    const statusColor = item.completionStatus
      ? CompletionColors[item.completionStatus]
      : Colors.textTertiary;
    const statusLabel = item.completionStatus
      ? CompletionLabels[item.completionStatus]
      : '';
    const durationDays =
      item.completedAt
        ? daysBetween(item.createdAt, item.completedAt)
        : null;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.rowContent}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formatShortDate(item.createdAt)}
            </Text>
            {item.completedAt && (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={statusColor}
                  style={{ marginLeft: 8, marginRight: 2 }}
                />
                <Text style={[styles.metaText, { color: statusColor }]}>
                  {formatShortDate(item.completedAt)}
                </Text>
              </>
            )}
            {durationDays !== null && (
              <Text style={[styles.metaText, { marginLeft: 8 }]}>
                {durationDays}d
              </Text>
            )}
          </View>
        </View>
        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.categoryText}>
            {catMap.get(item.categoryId) ?? ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const currentOpt = SORT_OPTIONS.find((o) => o.key === sortKey)!;

  return (
    <View style={styles.container}>
      {/* Sort button – top right */}
      <View style={[styles.sortBtnWrapper, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentOpt.icon as any}
            size={14}
            color={Colors.primary}
          />
          <Text style={styles.sortBtnLabel}>{currentOpt.label}</Text>
          <Ionicons
            name={ascending ? 'arrow-up' : 'arrow-down'}
            size={13}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedIdeas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 52 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No completed ideas</Text>
          </View>
        }
      />

      {/* Sort dropdown menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuCard,
              { top: insets.top + Spacing.sm + 38 },
            ]}
          >
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleSortSelect(opt.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isActive ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name={ascending ? 'arrow-up' : 'arrow-down'}
                      size={14}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  // ─── Sort button ───
  sortBtnWrapper: {
    position: 'absolute',
    right: Spacing.sm,
    zIndex: 11,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.xl,
    gap: 4,
    ...Shadow.small,
  },
  sortBtnLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primary,
  },
  // ─── Dropdown menu ───
  menuOverlay: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    right: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    minWidth: 190,
    ...Shadow.large,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  menuItemActive: {
    backgroundColor: 'rgba(74, 144, 217, 0.08)',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // ─── List rows ───
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm + 2,
    ...Shadow.small,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});
