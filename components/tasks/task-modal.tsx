import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TaskModalProps {
  visible: boolean;
  taskDescription: string;
  onClose: () => void;
  onSave: () => void;
  onDescriptionChange: (description: string) => void;
}

export function TaskModal({
  visible,
  taskDescription,
  onClose,
  onSave,
  onDescriptionChange,
}: TaskModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleClose = () => {
    onDescriptionChange('');
    onClose();
  };

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
            New Task
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.icon,
                color: colors.text,
              },
            ]}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.icon}
            value={taskDescription}
            onChangeText={onDescriptionChange}
            autoFocus
            onSubmitEditing={onSave}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleClose}>
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
                Add
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
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
});
