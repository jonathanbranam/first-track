import { useState, useEffect, useCallback } from 'react';
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
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStorage, getStorageItem, setStorageItem } from '@/hooks/use-storage';

export interface TaskList {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
];

const DEFAULT_EMOJIS = [
  '📝', '✅', '🎯', '💼', '🏠', '💡', '🎨', '📚', '🎵', '⭐',
  '🔥', '💪', '🚀', '📱', '💻', '🎮', '🏃', '🍕', '☕', '🌟',
];

export default function TaskListsScreen() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const colorScheme = useColorScheme() ?? 'light';

  const { data: taskListIds, loading, save: saveTaskListIds } = useStorage<string[]>('tasklists', 'all');

  const colors = Colors[colorScheme];

  // Initialize default task list on first load
  useEffect(() => {
    async function initializeDefaultList() {
      if (loading) return;

      if (!taskListIds || taskListIds.length === 0) {
        const defaultList: TaskList = {
          id: 'default',
          name: 'Default',
          emoji: '📝',
          color: DEFAULT_COLORS[0],
        };

        await setStorageItem('tasklist', defaultList.id, defaultList);
        await saveTaskListIds([defaultList.id]);
      }
    }

    initializeDefaultList();
  }, [loading, taskListIds, saveTaskListIds]);

  useEffect(() => {
    if (loading || !taskListIds) return;

    async function loadTaskLists() {
      const loaded = await Promise.all(
        taskListIds.map((id) => getStorageItem<TaskList>('tasklist', id))
      );
      setTaskLists(loaded.filter((list): list is TaskList => list !== null));
    }

    loadTaskLists();
  }, [taskListIds, loading]);

  const openAddModal = useCallback(() => {
    setEditingList(null);
    setNewListName('');
    setSelectedEmoji('📝');
    setSelectedColor(DEFAULT_COLORS[0]);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((list: TaskList) => {
    setEditingList(list);
    setNewListName(list.name);
    setSelectedEmoji(list.emoji);
    setSelectedColor(list.color);
    setModalVisible(true);
  }, []);

  const saveTaskList = useCallback(async () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;

    if (editingList) {
      // Edit existing list
      const updatedList: TaskList = {
        ...editingList,
        name: trimmed,
        emoji: selectedEmoji,
        color: selectedColor,
      };

      await setStorageItem('tasklist', updatedList.id, updatedList);
      setTaskLists((prev) =>
        prev.map((list) => (list.id === updatedList.id ? updatedList : list))
      );
    } else {
      // Create new list
      const newList: TaskList = {
        id: Date.now().toString(),
        name: trimmed,
        emoji: selectedEmoji,
        color: selectedColor,
      };

      await setStorageItem('tasklist', newList.id, newList);

      const updatedIds = [...(taskListIds || []), newList.id];
      await saveTaskListIds(updatedIds);

      setTaskLists((prev) => [...prev, newList]);
    }

    setModalVisible(false);
    setNewListName('');
  }, [newListName, selectedEmoji, selectedColor, editingList, taskListIds, saveTaskListIds]);

  const deleteTaskList = useCallback(async (id: string) => {
    // Don't allow deleting the default list
    if (id === 'default') return;

    const updatedIds = taskListIds?.filter((listId) => listId !== id) || [];
    await saveTaskListIds(updatedIds);
    setTaskLists((prev) => prev.filter((list) => list.id !== id));
  }, [taskListIds, saveTaskListIds]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Task Lists
        </ThemedText>
        <TouchableOpacity
          testID="add-button"
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={openAddModal}
          activeOpacity={0.8}>
          <IconSymbol
            name="plus"
            size={24}
            color={colorScheme === 'light' ? '#fff' : Colors.dark.background}
            weight="bold"
          />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {taskLists.map((list) => (
          <View
            key={list.id}
            style={[
              styles.listItem,
              { backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2d2e' },
            ]}>
            <View style={styles.listItemLeft}>
              <View style={[styles.emojiContainer, { backgroundColor: list.color }]}>
                <ThemedText style={styles.emoji}>{list.emoji}</ThemedText>
              </View>
              <ThemedText style={styles.listName}>{list.name}</ThemedText>
            </View>
            <View style={styles.listItemActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(list)}
                activeOpacity={0.7}>
                <IconSymbol name="pencil" size={20} color={colors.icon} />
              </TouchableOpacity>
              {list.id !== 'default' && (
                <TouchableOpacity
                  testID={`delete-list-${list.id}`}
                  style={styles.actionButton}
                  onPress={() => deleteTaskList(list.id)}
                  activeOpacity={0.7}>
                  <IconSymbol name="trash" size={20} color="#ff3b30" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}>
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
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />

            <ThemedText style={styles.label}>Emoji</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.emojiScroll}
              contentContainerStyle={styles.emojiScrollContent}>
              {DEFAULT_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                  activeOpacity={0.7}>
                  <ThemedText style={styles.emojiOptionText}>{emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ThemedText style={styles.label}>Color</ThemedText>
            <View style={styles.colorGrid}>
              {DEFAULT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                  activeOpacity={0.7}>
                  {selectedColor === color && (
                    <IconSymbol name="checkmark" size={16} color="#fff" weight="bold" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewListName('');
                }}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.submitButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={saveTaskList}>
                <ThemedText
                  lightColor="#fff"
                  darkColor={Colors.dark.background}>
                  {editingList ? 'Save' : 'Create'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
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
  emojiScroll: {
    marginBottom: 12,
  },
  emojiScrollContent: {
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#0a7ea4',
  },
  emojiOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
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
