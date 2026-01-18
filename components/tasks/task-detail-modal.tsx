import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Task } from '@/types/task';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

/**
 * Modal component for viewing and editing task details
 * Displays task description and notes with edit capability
 */
export function TaskDetailModal({ visible, task, onClose, onSave }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'text');
  const inputBackgroundColor = useThemeColor(
    { light: '#F2F2F7', dark: '#1C1C1E' },
    'background'
  );
  const placeholderColor = useThemeColor({ light: '#8E8E93', dark: '#8E8E93' }, 'text');

  // Reset edit state when modal opens with new task
  useEffect(() => {
    if (visible && task) {
      setIsEditing(false);
      setEditedDescription(task.description);
      setEditedNotes(task.notes || '');
    }
  }, [visible, task]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!task) return;

    const trimmedDescription = editedDescription.trim();
    if (!trimmedDescription) {
      // Don't save if description is empty
      return;
    }

    const updates: Partial<Task> = {
      description: trimmedDescription,
      notes: editedNotes.trim() || undefined,
    };

    onSave(task.id, updates);
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    if (isEditing) {
      // Reset to original values
      setEditedDescription(task?.description || '');
      setEditedNotes(task?.notes || '');
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Task Details</Text>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeButton}
              testID="close-detail-modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Task Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Task</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    styles.descriptionInput,
                    { backgroundColor: inputBackgroundColor, color: textColor, borderColor },
                  ]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Task description"
                  placeholderTextColor={placeholderColor}
                  multiline
                  testID="edit-description-input"
                />
              ) : (
                <Text style={[styles.descriptionText, { color: textColor }]}>
                  {task.description}
                </Text>
              )}
            </View>

            {/* Task Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Notes</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    styles.notesInput,
                    { backgroundColor: inputBackgroundColor, color: textColor, borderColor },
                  ]}
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Additional notes (optional)"
                  placeholderTextColor={placeholderColor}
                  multiline
                  testID="edit-notes-input"
                />
              ) : (
                <Text style={[styles.notesText, { color: textColor }]}>
                  {task.notes || 'No notes'}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor }]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor }]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.cancelButtonText, { color: textColor }]}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={handleEdit}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#8E8E93',
  },
  scrollContent: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  descriptionInput: {
    minHeight: 60,
    fontSize: 18,
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 120,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
