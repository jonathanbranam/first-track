import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { TaskList } from '@/types/task-list';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TaskListPickerModalProps {
  visible: boolean;
  taskLists: TaskList[];
  currentListId: string;
  onSelect: (listId: string) => void;
  onClose: () => void;
}

export function TaskListPickerModal({
  visible,
  taskLists,
  currentListId,
  onSelect,
  onClose,
}: TaskListPickerModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: '#e0e0e0', dark: '#333' },
    'background'
  );

  // Filter out the current list
  const availableLists = taskLists.filter((list) => list.id !== currentListId);

  const renderListItem = ({ item }: { item: TaskList }) => (
    <TouchableOpacity
      style={[styles.listItem, { borderBottomColor: borderColor }]}
      onPress={() => {
        onSelect(item.id);
        onClose();
      }}
      testID={`list-picker-item-${item.id}`}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={[styles.listName, { color: textColor }]}>
          {item.name}
        </Text>
      </View>
      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="task-list-picker-modal"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modalContainer, { backgroundColor }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Move to List
            </Text>
          </View>

          {availableLists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: textColor }]}>
                No other lists available
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableLists}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              testID="task-list-picker-list"
            />
          )}

          <TouchableOpacity
            style={[styles.cancelButton, { borderTopColor: borderColor }]}
            onPress={onClose}
            testID="task-list-picker-cancel"
          >
            <Text style={[styles.cancelText, { color: textColor }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    maxHeight: 400,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
  cancelButton: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
