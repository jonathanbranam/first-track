import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { TaskListItem } from '@/components/task-list/task-list-item';
import { TaskListModal } from '@/components/task-list/task-list-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStorage, getStorageItem, setStorageItem } from '@/hooks/use-storage';
import { TaskList, DEFAULT_COLORS, ListType } from '@/types/task-list';

export default function TaskListsScreen() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [selectedListType, setSelectedListType] = useState<ListType>('permanent');
  const colorScheme = useColorScheme() ?? 'light';

  const { data: taskListIds, loading, save: saveTaskListIds } = useStorage<string[]>('tasklists', 'all');

  const colors = Colors[colorScheme];

  // Initialize default task list and someday list on first load
  useEffect(() => {
    async function initializeDefaultLists() {
      if (loading) return;

      if (!taskListIds || taskListIds.length === 0) {
        const defaultList: TaskList = {
          id: 'default',
          name: 'Default',
          emoji: '📝',
          color: DEFAULT_COLORS[0],
          listType: 'permanent',
        };

        const somedayList: TaskList = {
          id: 'someday',
          name: 'Someday',
          emoji: '📦',
          color: DEFAULT_COLORS[5], // Light gray color
          listType: 'someday',
        };

        await setStorageItem('tasklist', defaultList.id, defaultList);
        await setStorageItem('tasklist', somedayList.id, somedayList);
        await saveTaskListIds([defaultList.id, somedayList.id]);
      } else {
        // Check if someday list exists, if not create it
        const somedayExists = taskListIds.includes('someday');
        if (!somedayExists) {
          const somedayList: TaskList = {
            id: 'someday',
            name: 'Someday',
            emoji: '📦',
            color: DEFAULT_COLORS[5],
            listType: 'someday',
          };
          await setStorageItem('tasklist', somedayList.id, somedayList);
          await saveTaskListIds([...taskListIds, somedayList.id]);
        }
      }
    }

    initializeDefaultLists();
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
    setSelectedListType('permanent');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((list: TaskList) => {
    setEditingList(list);
    setNewListName(list.name);
    setSelectedEmoji(list.emoji);
    setSelectedColor(list.color);
    setSelectedListType(list.listType || 'permanent');
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
        listType: selectedListType,
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
        listType: selectedListType,
      };

      await setStorageItem('tasklist', newList.id, newList);

      const updatedIds = [...(taskListIds || []), newList.id];
      await saveTaskListIds(updatedIds);

      setTaskLists((prev) => [...prev, newList]);
    }

    setModalVisible(false);
    setNewListName('');
  }, [newListName, selectedEmoji, selectedColor, selectedListType, editingList, taskListIds, saveTaskListIds]);

  const deleteTaskList = useCallback(async (id: string) => {
    // Don't allow deleting the default list
    if (id === 'default') return;

    const updatedIds = taskListIds?.filter((listId) => listId !== id) || [];
    await saveTaskListIds(updatedIds);
    setTaskLists((prev) => prev.filter((list) => list.id !== id));
  }, [taskListIds, saveTaskListIds]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setNewListName('');
  }, []);

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
          <TaskListItem
            key={list.id}
            list={list}
            onEdit={openEditModal}
            onDelete={deleteTaskList}
            iconColor={colors.icon}
          />
        ))}
      </ScrollView>

      <TaskListModal
        visible={modalVisible}
        editingList={editingList}
        listName={newListName}
        selectedEmoji={selectedEmoji}
        selectedColor={selectedColor}
        selectedListType={selectedListType}
        onClose={handleCloseModal}
        onSave={saveTaskList}
        onNameChange={setNewListName}
        onEmojiChange={setSelectedEmoji}
        onColorChange={setSelectedColor}
        onListTypeChange={setSelectedListType}
      />
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
});
