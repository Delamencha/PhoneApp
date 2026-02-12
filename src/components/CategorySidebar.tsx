import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../models/types';
import { Colors, Spacing, BubbleConfig } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CategorySidebarProps {
  categories: Category[];
  selectedId: number | null; // null = "All"
  onSelect: (id: number | null) => void;
  onLongPress: () => void;
}

export default function CategorySidebar({
  categories,
  selectedId,
  onSelect,
  onLongPress,
}: CategorySidebarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* "All" button */}
      <TouchableOpacity
        style={[styles.tab, selectedId === null && styles.tabActive]}
        onPress={() => onSelect(null)}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="grid-outline"
          size={20}
          color={selectedId === null ? Colors.sidebarText : Colors.sidebarTextInactive}
        />
        <Text
          style={[
            styles.tabText,
            selectedId === null && styles.tabTextActive,
          ]}
          numberOfLines={1}
        >
          All
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Category tabs */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat, index) => {
          const isActive = selectedId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelect(cat.id)}
              onLongPress={onLongPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.indexBadge,
                  isActive && styles.indexBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.indexText,
                    isActive && styles.indexTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
                numberOfLines={2}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Settings icon at bottom */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={onLongPress}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={20} color={Colors.sidebarTextInactive} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BubbleConfig.sidebarWidth,
    backgroundColor: Colors.sidebarBg,
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  scrollArea: {
    flex: 1,
    width: '100%',
  },
  tab: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(74, 144, 217, 0.25)',
    borderRightWidth: 3,
    borderRightColor: Colors.sidebarActive,
  },
  tabText: {
    fontSize: 9,
    color: Colors.sidebarTextInactive,
    textAlign: 'center',
    marginTop: 3,
  },
  tabTextActive: {
    color: Colors.sidebarText,
    fontWeight: '600',
  },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeActive: {
    backgroundColor: Colors.sidebarActive,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.sidebarTextInactive,
  },
  indexTextActive: {
    color: Colors.sidebarText,
  },
  divider: {
    width: '70%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: Spacing.xs,
  },
  settingsBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
});
