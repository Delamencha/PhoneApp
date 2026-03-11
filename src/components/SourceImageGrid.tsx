import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { IdeaImage } from '../models/types';
import { Colors, Spacing, BorderRadius, Shadow } from '../theme';

const MAX_IMAGES = 6;
const COLUMNS = 3;

interface SourceImageGridProps {
  images: IdeaImage[];
  onAdd: (uri: string) => Promise<void>;
  onRemove: (imageId: number) => Promise<void>;
  disabled?: boolean;
}

export default function SourceImageGrid({
  images,
  onAdd,
  onRemove,
  disabled,
}: SourceImageGridProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to add images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        await onAdd(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Image pick error:', error);
      Alert.alert('Error', error.message ?? 'Failed to pick image.');
    }
  }, [onAdd]);

  const handleLongPress = useCallback(
    (img: IdeaImage) => {
      Alert.alert('Remove Image', 'Delete this image?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onRemove(img.id),
        },
      ]);
    },
    [onRemove]
  );

  const canAdd = !disabled && images.length < MAX_IMAGES;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {images.map((img) => (
          <TouchableOpacity
            key={img.id}
            style={styles.imageWrapper}
            onPress={() => setPreviewUri(img.uri)}
            onLongPress={disabled ? undefined : () => handleLongPress(img)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: img.uri }} style={styles.image} />
          </TouchableOpacity>
        ))}

        {canAdd && (
          <Pressable
            style={[styles.imageWrapper, styles.addButton]}
            onPress={handlePickImage}
          >
            <View style={styles.addIconContainer}>
              <Ionicons name="add" size={28} color={Colors.textTertiary} />
            </View>
          </Pressable>
        )}
      </View>

      {images.length > 0 && (
        <Text style={styles.hint}>
          {images.length}/{MAX_IMAGES} images. Tap to preview, long-press to delete.
        </Text>
      )}

      {/* Full-screen preview modal */}
      <Modal
        visible={previewUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.previewClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  imageWrapper: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.small,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  hint: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  previewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
