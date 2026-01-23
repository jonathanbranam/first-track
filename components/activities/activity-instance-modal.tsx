/**
 * Modal for creating/editing activity instances
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useActivityTypes } from '@/hooks/use-activities';
import { ActivityType } from '@/types/activity';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ActivityInstanceModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  typeId?: string;
  mode?: 'create' | 'edit';
  onClose: () => void;
  onSave: (title: string, description: string, typeId: string, shouldStartTimer: boolean) => void;
  onCreateNewType?: (name: string, color: string) => Promise<ActivityType>;
}

export function ActivityInstanceModal({
  visible,
  title = '',
  description = '',
  typeId = '',
  mode = 'create',
  onClose,
  onSave,
  onCreateNewType,
}: ActivityInstanceModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { activeActivityTypes } = useActivityTypes();

  const [activityTitle, setActivityTitle] = useState(title);
  const [activityDescription, setActivityDescription] = useState(description);
  const [selectedTypeId, setSelectedTypeId] = useState(typeId);
  const [shouldStartTimer, setShouldStartTimer] = useState(mode === 'create');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isCreatingNewType, setIsCreatingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#4ECDC4');

  // Predefined color palette for new types
  const colorPalette = [
    '#4ECDC4', '#98D8C8', '#F7DC6F', '#BB8FCE',
    '#FFA07A', '#FF6B6B', '#45B7D1', '#85C1E2',
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setActivityTitle(title);
      setActivityDescription(description);
      setSelectedTypeId(typeId);
      setShouldStartTimer(mode === 'create');
      setIsCreatingNewType(false);
      setNewTypeName('');
      setNewTypeColor('#4ECDC4');
    }
  }, [visible, title, description, typeId, mode]);

  const handleClose = () => {
    setActivityTitle('');
    setActivityDescription('');
    setSelectedTypeId('');
    setShouldStartTimer(mode === 'create');
    setShowTypePicker(false);
    setIsCreatingNewType(false);
    onClose();
  };

  const handleSave = () => {
    if (!activityTitle.trim() || !selectedTypeId) return;
    onSave(activityTitle.trim(), activityDescription.trim(), selectedTypeId, shouldStartTimer);
    handleClose();
  };

  const handleCreateNewType = async () => {
    if (!newTypeName.trim() || !onCreateNewType) return;
    const newType = await onCreateNewType(newTypeName.trim(), newTypeColor);
    setSelectedTypeId(newType.id);
    setIsCreatingNewType(false);
    setNewTypeName('');
    setShowTypePicker(false);
  };

  const selectedType = activeActivityTypes.find((t) => t.id === selectedTypeId);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}>
          <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
            {mode === 'create' ? 'New Activity' : 'Edit Activity'}
          </ThemedText>

          {/* Title Input */}
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.icon,
                color: colors.text,
              },
            ]}
            placeholder="Activity title (required)"
            placeholderTextColor={colors.icon}
            value={activityTitle}
            onChangeText={setActivityTitle}
            autoFocus
            returnKeyType="next"
          />

          {/* Description Input */}
          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
              {
                borderColor: colors.icon,
                color: colors.text,
              },
            ]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.icon}
            value={activityDescription}
            onChangeText={setActivityDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Activity Type Selector */}
          <TouchableOpacity
            style={[styles.typeSelectorButton, { borderColor: colors.icon }]}
            onPress={() => setShowTypePicker(!showTypePicker)}>
            {selectedType ? (
              <View style={styles.selectedTypeContent}>
                <View style={[styles.typeColorDot, { backgroundColor: selectedType.color }]} />
                <ThemedText style={styles.selectedTypeText}>{selectedType.name}</ThemedText>
              </View>
            ) : (
              <ThemedText style={[styles.placeholderText, { color: colors.icon }]}>
                Select activity type
              </ThemedText>
            )}
            <IconSymbol
              name={showTypePicker ? 'chevron.up' : 'chevron.down'}
              size={20}
              color={colors.icon}
            />
          </TouchableOpacity>

          {/* Type Picker Dropdown */}
          {showTypePicker && (
            <View style={[styles.typePickerContainer, { backgroundColor: colors.background, borderColor: colors.icon }]}>
              <ScrollView style={styles.typeList}>
                {activeActivityTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeItem,
                      { borderBottomColor: colors.icon },
                      selectedTypeId === type.id && { backgroundColor: colors.tint + '20' },
                    ]}
                    onPress={() => {
                      setSelectedTypeId(type.id);
                      setShowTypePicker(false);
                    }}>
                    <View style={[styles.typeColorDot, { backgroundColor: type.color }]} />
                    <ThemedText>{type.name}</ThemedText>
                  </TouchableOpacity>
                ))}

                {/* Create New Type Option */}
                {onCreateNewType && (
                  <TouchableOpacity
                    style={[styles.typeItem, styles.createNewTypeItem, { borderBottomColor: colors.icon }]}
                    onPress={() => setIsCreatingNewType(true)}>
                    <IconSymbol name="plus.circle" size={20} color={colors.tint} />
                    <ThemedText style={{ color: colors.tint, marginLeft: 8 }}>
                      Create New Type
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Create New Type Form */}
          {isCreatingNewType && (
            <View style={[styles.newTypeForm, { backgroundColor: colors.background, borderColor: colors.icon }]}>
              <ThemedText style={styles.newTypeTitle}>Create New Type</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.icon,
                    color: colors.text,
                  },
                ]}
                placeholder="Type name"
                placeholderTextColor={colors.icon}
                value={newTypeName}
                onChangeText={setNewTypeName}
                autoFocus
              />
              <View style={styles.colorPaletteContainer}>
                {colorPalette.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newTypeColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewTypeColor(color)}
                  />
                ))}
              </View>
              <View style={styles.newTypeButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsCreatingNewType(false);
                    setNewTypeName('');
                  }}>
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={handleCreateNewType}
                  disabled={!newTypeName.trim()}>
                  <ThemedText lightColor="#fff" darkColor={Colors.dark.background}>
                    Create
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Start Timer Checkbox (only in create mode) */}
          {mode === 'create' && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setShouldStartTimer(!shouldStartTimer)}>
              <View style={[styles.checkbox, { borderColor: colors.icon }]}>
                {shouldStartTimer && (
                  <IconSymbol name="checkmark" size={18} color={colors.tint} />
                )}
              </View>
              <ThemedText style={styles.checkboxLabel}>Start timer immediately</ThemedText>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleClose}>
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.submitButton,
                { backgroundColor: colors.tint },
                (!activityTitle.trim() || !selectedTypeId) && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={!activityTitle.trim() || !selectedTypeId}>
              <ThemedText lightColor="#fff" darkColor={Colors.dark.background}>
                {mode === 'create' ? 'Create' : 'Save'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '90%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  descriptionInput: {
    minHeight: 80,
  },
  typeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  selectedTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  selectedTypeText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
  },
  typePickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  typeList: {
    flex: 1,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  createNewTypeItem: {
    borderBottomWidth: 0,
  },
  newTypeForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  newTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
    borderWidth: 3,
  },
  newTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  submitButton: {
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
