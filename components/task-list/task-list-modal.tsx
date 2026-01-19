import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskList, ListType } from '@/types/task-list';

import { ColorPicker } from './color-picker';
import { EmojiPicker } from './emoji-picker';

interface TaskListModalProps {
  visible: boolean;
  editingList: TaskList | null;
  listName: string;
  selectedEmoji: string;
  selectedColor: string;
  selectedListType?: ListType;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
  onEmojiChange: (emoji: string) => void;
  onColorChange: (color: string) => void;
  onListTypeChange?: (listType: ListType) => void;
}

export function TaskListModal({
  visible,
  editingList,
  listName,
  selectedEmoji,
  selectedColor,
  selectedListType = 'permanent',
  onClose,
  onSave,
  onNameChange,
  onEmojiChange,
  onColorChange,
  onListTypeChange,
}: TaskListModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Don't allow editing list type for default and someday lists
  const canEditListType = editingList?.id !== 'default' && editingList?.id !== 'someday';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}>
          <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
            {editingList ? 'Edit Task List' : 'New Task List'}
          </ThemedText>

          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.icon,
                color: colors.text,
              },
            ]}
            placeholder="List name"
            placeholderTextColor={colors.icon}
            value={listName}
            onChangeText={onNameChange}
            autoFocus
          />

          <ThemedText style={styles.label}>Emoji</ThemedText>
          <EmojiPicker selectedEmoji={selectedEmoji} onSelectEmoji={onEmojiChange} />

          <ThemedText style={styles.label}>Color</ThemedText>
          <ColorPicker selectedColor={selectedColor} onSelectColor={onColorChange} />

          {(!editingList || canEditListType) && onListTypeChange && (
            <>
              <ThemedText style={styles.label}>List Type</ThemedText>
              <View style={styles.listTypePicker}>
                <TouchableOpacity
                  style={[
                    styles.listTypeButton,
                    {
                      borderColor: colors.icon,
                      backgroundColor: selectedListType === 'permanent' ? colors.tint + '20' : 'transparent',
                    },
                  ]}
                  onPress={() => onListTypeChange('permanent')}>
                  <ThemedText style={[
                    styles.listTypeText,
                    selectedListType === 'permanent' && { color: colors.tint, fontWeight: '600' }
                  ]}>
                    Permanent
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.listTypeButton,
                    {
                      borderColor: colors.icon,
                      backgroundColor: selectedListType === 'temporary' ? colors.tint + '20' : 'transparent',
                    },
                  ]}
                  onPress={() => onListTypeChange('temporary')}>
                  <ThemedText style={[
                    styles.listTypeText,
                    selectedListType === 'temporary' && { color: colors.tint, fontWeight: '600' }
                  ]}>
                    Temporary
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.submitButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={onSave}>
              <ThemedText lightColor="#fff" darkColor={Colors.dark.background}>
                {editingList ? 'Save' : 'Create'}
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
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
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
  listTypePicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  listTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  listTypeText: {
    fontSize: 14,
  },
});
