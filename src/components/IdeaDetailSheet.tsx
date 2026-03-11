import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Category, CompletionStatus, Idea, IdeaImage } from '../models/types';
import { getElapsedLabel } from '../layout/bubblePacker';
import WillSlider from './WillSlider';
import SourceImageGrid from './SourceImageGrid';
import CompletionModal from './CompletionModal';
import { Colors, CompletionColors, CompletionLabels, Spacing, BorderRadius, Shadow } from '../theme';

interface IdeaDetailSheetProps {
  idea: Idea | null;
  isCreating: boolean;
  isViewingCompleted?: boolean;
  categories: Category[];
  defaultCategoryId: number;
  images: IdeaImage[];
  onSave: (data: {
    title: string;
    source: string;
    willingness: number;
    categoryId: number;
    createdAt: string;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onComplete: (status: CompletionStatus, note: string) => Promise<void>;
  onAddImage: (uri: string) => Promise<void>;
  onRemoveImage: (imageId: number) => Promise<void>;
  onClose: () => void;
}

const IdeaDetailSheet = forwardRef<BottomSheet, IdeaDetailSheetProps>(
  (
    { idea, isCreating, isViewingCompleted, categories, defaultCategoryId, images, onSave, onDelete, onComplete, onAddImage, onRemoveImage, onClose },
    ref
  ) => {
    // ─── Refs ───
    const internalRef = useRef<BottomSheet>(null);
    const setRef = useCallback(
      (node: BottomSheet | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<BottomSheet | null>).current = node;
      },
      [ref]
    );

    // ─── Form state ───
    const [title, setTitle] = useState('');
    const [source, setSource] = useState('');
    const [willingness, setWillingness] = useState(0.5);
    const [categoryId, setCategoryId] = useState(defaultCategoryId);
    const [createdAt, setCreatedAt] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    const readOnly = !!isViewingCompleted;

    const snapPoints = useMemo(() => ['65%', '90%'], []);

    // ─── Sync form with selected idea ───
    useEffect(() => {
      if (idea) {
        setTitle(idea.title);
        setSource(idea.source);
        setWillingness(idea.willingness);
        setCategoryId(idea.categoryId);
        setCreatedAt(new Date(idea.createdAt));
      } else if (isCreating) {
        setTitle('');
        setSource('');
        setWillingness(0.5);
        setCategoryId(defaultCategoryId);
        setCreatedAt(new Date());
      }
    }, [idea, isCreating, defaultCategoryId]);

    // ─── Handlers ───
    const handleBack = useCallback(() => {
      internalRef.current?.close();
    }, []);

    const handleSave = useCallback(async () => {
      await onSave({
        title: title.trim() || 'Untitled Idea',
        source,
        willingness,
        categoryId,
        createdAt: createdAt.toISOString(),
      });
    }, [title, source, willingness, categoryId, createdAt, onSave]);

    const handleDelete = useCallback(() => {
      if (!idea) return;
      Alert.alert('Delete Idea', `Delete "${idea.title || 'this idea'}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(idea.id),
        },
      ]);
    }, [idea, onDelete]);

    const handleDateChange = useCallback(
      (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
          setShowDatePicker(false);
          if (event.type === 'set' && selectedDate) {
            setCreatedAt(selectedDate);
            setShowTimePicker(true);
          }
        } else {
          if (selectedDate) {
            setCreatedAt(selectedDate);
          }
        }
      },
      []
    );

    const handleTimeChange = useCallback(
      (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
          setShowTimePicker(false);
        }
        if (event.type === 'set' && selectedDate) {
          setCreatedAt(selectedDate);
        }
      },
      []
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
        />
      ),
      []
    );

    const elapsedText = idea
      ? getElapsedLabel(idea.createdAt)
      : null;

    const formatDate = (d: Date) =>
      `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
        d.getDate()
      ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes()
      ).padStart(2, '0')}`;

    const headerTitle = readOnly
      ? 'Completed Idea'
      : isCreating
        ? 'New Idea'
        : 'Edit Idea';

    return (
      <BottomSheet
        ref={setRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            {elapsedText ? (
              <View style={styles.elapsedBadge}>
                <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.elapsedText}>{elapsedText} ago</Text>
              </View>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>

          {/* Completion status badge (read-only view) */}
          {readOnly && idea?.completionStatus && (
            <View style={styles.completionBanner}>
              <View
                style={[
                  styles.completionDot,
                  { backgroundColor: CompletionColors[idea.completionStatus] },
                ]}
              />
              <View style={styles.completionBannerContent}>
                <Text
                  style={[
                    styles.completionStatusText,
                    { color: CompletionColors[idea.completionStatus] },
                  ]}
                >
                  {CompletionLabels[idea.completionStatus]}
                </Text>
                {idea.completedAt && (
                  <Text style={styles.completionDateText}>
                    {formatDate(new Date(idea.completedAt))}
                  </Text>
                )}
              </View>
            </View>
          )}

          {readOnly && idea?.completionNote ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Completion Note</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{idea.completionNote}</Text>
              </View>
            </View>
          ) : null}

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title</Text>
            {readOnly ? (
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{title || 'Untitled'}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="What's the idea?"
                placeholderTextColor={Colors.placeholder}
              />
            )}
          </View>

          {/* Source */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Source / Origin</Text>
            {readOnly ? (
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{source || '-'}</Text>
              </View>
            ) : (
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={source}
                onChangeText={setSource}
                placeholder="Where did this idea come from? (article, video, conversation...)"
                placeholderTextColor={Colors.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          </View>

          {/* Source Images */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Source Image</Text>
            <SourceImageGrid
              images={images}
              onAdd={onAddImage}
              onRemove={onRemoveImage}
              disabled={readOnly}
            />
          </View>

          {/* Created time */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Created Time</Text>
            {readOnly ? (
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{formatDate(createdAt)}</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateRow}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={createdAt}
                    mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={createdAt}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}
          </View>

          {/* Willingness slider */}
          {!readOnly && (
            <View style={styles.field}>
              <WillSlider value={willingness} onValueChange={setWillingness} />
            </View>
          )}

          {/* Category selector */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryChips}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    categoryId === cat.id && styles.chipActive,
                  ]}
                  onPress={() => { if (!readOnly) setCategoryId(cat.id); }}
                  activeOpacity={readOnly ? 1 : 0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      categoryId === cat.id && styles.chipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sub-ideas placeholder */}
          {!readOnly && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Sub-ideas</Text>
              <View style={styles.placeholder}>
                <Ionicons name="git-branch-outline" size={20} color={Colors.textTertiary} />
                <Text style={styles.placeholderText}>Coming soon</Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          {!readOnly && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={20} color={Colors.textOnPrimary} />
                <Text style={styles.saveBtnText}>
                  {isCreating ? 'Create' : 'Save'}
                </Text>
              </TouchableOpacity>

              {!isCreating && idea && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => setShowCompletionModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flag-outline" size={18} color={Colors.success} />
                  <Text style={styles.completeBtnText}>Complete</Text>
                </TouchableOpacity>
              )}

              {!isCreating && idea && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </BottomSheetScrollView>

        <CompletionModal
          visible={showCompletionModal}
          onConfirm={(status, note) => {
            setShowCompletionModal(false);
            onComplete(status, note);
          }}
          onCancel={() => setShowCompletionModal(false)}
        />
      </BottomSheet>
    );
  }
);

IdeaDetailSheet.displayName = 'IdeaDetailSheet';
export default IdeaDetailSheet;

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: Colors.border,
    width: 40,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  elapsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  elapsedText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceVariant,
  },
  multilineInput: {
    minHeight: 80,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  completionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  completionBannerContent: {
    flex: 1,
  },
  completionStatusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  completionDateText: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  readOnlyBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  readOnlyText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  actions: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadow.small,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success,
    gap: 6,
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    gap: 6,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.danger,
  },
});
