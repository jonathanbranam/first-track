import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from 'expo-router';

import { EmptyState } from '@/components/tasks/empty-state';
import { TaskItem } from '@/components/tasks/task-item';
import { TaskListDropdown } from '@/components/tasks/task-list-dropdown';
import { TaskModal } from '@/components/tasks/task-modal';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { TaskListPickerModal } from '@/components/tasks/task-list-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStorage, getStorageItem, setStorageItem } from '@/hooks/use-storage';
import { Task } from '@/types/task';
import { TaskList } from '@/types/task-list';
import { moveTask } from '@/utils/task-operations';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<TaskList | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const { data: taskListIds, refresh: refreshTaskListIds } = useStorage<string[]>('tasklists', 'all');
  const { data: taskIds, loading, save: saveTaskList } = useStorage<string[]>(
    'tasklist-tasks',
    selectedTaskList?.id || 'default'
  );

  const colors = Colors[colorScheme];

  // Refresh task lists when screen gains focus (e.g., switching tabs)
  useFocusEffect(
    useCallback(() => {
      refreshTaskListIds();
    }, [refreshTaskListIds])
  );

  // Load task lists
  useEffect(() => {
    if (!taskListIds) return;

    async function loadTaskLists() {
      const loaded = await Promise.all(
        taskListIds.map((id) => getStorageItem<TaskList>('tasklist', id))
      );
      const validLists = loaded.filter((list): list is TaskList => list !== null);
      setTaskLists(validLists);

      // Select default list or first available list
      if (!selectedTaskList && validLists.length > 0) {
        const defaultList = validLists.find(list => list.id === 'default');
        setSelectedTaskList(defaultList || validLists[0]);
      }
    }

    loadTaskLists();
  }, [taskListIds]);

  // Load tasks for selected list
  useEffect(() => {
    if (loading || !taskIds || !selectedTaskList) return;

    async function loadTasks() {
      const loadedTasks = await Promise.all(
        taskIds.map((id) => getStorageItem<Task>(`task-${selectedTaskList.id}`, id))
      );
      // Filter out null tasks and deleted tasks
      setTasks(loadedTasks.filter((task): task is Task => task !== null && !task.deletedAt));
    }

    loadTasks();
  }, [taskIds, loading, selectedTaskList]);

  const addTask = useCallback(async () => {
    const trimmed = newTaskDescription.trim();
    if (!trimmed || !selectedTaskList) return;

    const trimmedNotes = newTaskNotes.trim();
    const newTask: Task = {
      id: Date.now().toString(),
      description: trimmed,
      notes: trimmedNotes || undefined,
      completed: false,
    };

    await setStorageItem(`task-${selectedTaskList.id}`, newTask.id, newTask);

    const updatedIds = [...(taskIds || []), newTask.id];
    await saveTaskList(updatedIds);

    setTasks((prev) => [...prev, newTask]);
    setNewTaskDescription('');
    setNewTaskNotes('');
    setModalVisible(false);
  }, [newTaskDescription, newTaskNotes, taskIds, saveTaskList, selectedTaskList]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || !selectedTaskList) return;

    const updatedTask = { ...task, completed: !task.completed };
    await setStorageItem(`task-${selectedTaskList.id}`, id, updatedTask);

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? updatedTask : t))
    );
  }, [tasks, selectedTaskList]);

  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || !selectedTaskList) return;

    const updatedTask = { ...task, deletedAt: Date.now() };
    await setStorageItem(`task-${selectedTaskList.id}`, id, updatedTask);

    // Close the swipeable
    swipeableRefs.current.get(id)?.close();

    // Remove from local state
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [tasks, selectedTaskList]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !selectedTaskList) return;

    const updatedTask = { ...task, ...updates };
    await setStorageItem(`task-${selectedTaskList.id}`, taskId, updatedTask);

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? updatedTask : t))
    );
  }, [tasks, selectedTaskList]);

  const handleInfoPress = useCallback((task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedTask(null);
  }, []);

  const handleDragEnd = useCallback(async ({ data }: { data: Task[] }) => {
    setTasks(data);
    const newTaskIds = data.map(task => task.id);
    await saveTaskList(newTaskIds);
  }, [saveTaskList]);

  const handleSwipeableRef = useCallback((ref: Swipeable | null, id: string) => {
    if (ref) {
      swipeableRefs.current.set(id, ref);
    } else {
      swipeableRefs.current.delete(id);
    }
  }, []);

  const handleSelectTaskList = useCallback((list: TaskList) => {
    setSelectedTaskList(list);
    setDropdownVisible(false);
  }, []);

  const handleMovePress = useCallback((task: Task) => {
    setTaskToMove(task);
    setMoveModalVisible(true);
  }, []);

  const handleMoveToList = useCallback(async (destinationListId: string) => {
    if (!taskToMove || !selectedTaskList) return;

    try {
      // Move task to new list
      await moveTask(taskToMove, selectedTaskList.id, destinationListId);

      // Remove task from current list's local state
      setTasks((prev) => prev.filter((t) => t.id !== taskToMove.id));

      // Close modal and reset state
      setMoveModalVisible(false);
      setTaskToMove(null);
    } catch (error) {
      console.error('Error moving task:', error);
    }
  }, [taskToMove, selectedTaskList]);

  const renderTask = useCallback((params: any) => (
    <TaskItem
      {...params}
      onToggle={toggleTask}
      onDelete={deleteTask}
      onInfoPress={handleInfoPress}
      onMovePress={handleMovePress}
      swipeableRef={handleSwipeableRef}
    />
  ), [toggleTask, deleteTask, handleInfoPress, handleMovePress, handleSwipeableRef]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Tasks
        </ThemedText>
        <TouchableOpacity
          testID="add-button"
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}>
          <IconSymbol
            name="plus"
            size={24}
            color={colorScheme === 'light' ? '#fff' : Colors.dark.background}
            weight="bold"
          />
        </TouchableOpacity>
      </ThemedView>

      <TaskListDropdown
        taskLists={taskLists}
        selectedTaskList={selectedTaskList}
        isOpen={dropdownVisible}
        onToggle={() => setDropdownVisible(!dropdownVisible)}
        onSelect={handleSelectTaskList}
        iconColor={colors.icon}
        tintColor={colors.tint}
      />

      {tasks.length === 0 ? (
        <EmptyState iconColor={colors.icon} />
      ) : (
        <DraggableFlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          activationDistance={10}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TaskModal
        visible={modalVisible}
        taskDescription={newTaskDescription}
        taskNotes={newTaskNotes}
        onClose={() => setModalVisible(false)}
        onSave={addTask}
        onDescriptionChange={setNewTaskDescription}
        onNotesChange={setNewTaskNotes}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        task={selectedTask}
        onClose={handleCloseDetailModal}
        onSave={updateTask}
      />

      <TaskListPickerModal
        visible={moveModalVisible}
        taskLists={taskLists}
        currentListId={selectedTaskList?.id || ''}
        onSelect={handleMoveToList}
        onClose={() => {
          setMoveModalVisible(false);
          setTaskToMove(null);
        }}
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
  listContent: {
    paddingRight: 20,
  },
});
