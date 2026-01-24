import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter } from 'expo-router';

import { EmptyState } from '@/components/tasks/empty-state';
import { TaskItem } from '@/components/tasks/task-item';
import { TaskListDropdown } from '@/components/tasks/task-list-dropdown';
import { TaskModal } from '@/components/tasks/task-modal';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { TaskListPickerModal } from '@/components/tasks/task-list-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuickLogFAB } from '@/components/behaviors/quick-log-fab';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStorage, getStorageItem, setStorageItem } from '@/hooks/use-storage';
import { useReflectionQuestions, useReflectionResponses } from '@/hooks/use-reflections';
import { Task } from '@/types/task';
import { TaskList } from '@/types/task-list';
import { moveTask, moveTasks, deleteTasks, setTasksCompleted } from '@/utils/task-operations';

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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkMoveModalVisible, setBulkMoveModalVisible] = useState(false);
  const [reflectionCompleted, setReflectionCompleted] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const router = useRouter();

  const { data: taskListIds, refresh: refreshTaskListIds } = useStorage<string[]>('tasklists', 'all');
  const { data: taskIds, loading, save: saveTaskList } = useStorage<string[]>(
    'tasklist-tasks',
    selectedTaskList?.id || 'default'
  );
  const { activeQuestions } = useReflectionQuestions();
  const { hasResponseForDate } = useReflectionResponses();

  const colors = Colors[colorScheme];

  // Get today's date at midnight
  const getTodayMidnight = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  // Check if today's reflection has been completed
  const checkReflectionCompletion = useCallback(async () => {
    if (activeQuestions.length === 0) {
      setReflectionCompleted(true);
      return;
    }

    const today = getTodayMidnight();
    const completionChecks = await Promise.all(
      activeQuestions.map(async (q) => {
        const hasResponse = await hasResponseForDate(q.id, today);
        return hasResponse;
      })
    );

    const allCompleted = completionChecks.every(Boolean);
    setReflectionCompleted(allCompleted);
  }, [activeQuestions, hasResponseForDate, getTodayMidnight]);

  // Refresh task lists and check reflection when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refreshTaskListIds();
      checkReflectionCompletion();
    }, [refreshTaskListIds, checkReflectionCompletion])
  );

  // Check reflection completion when active questions change
  useEffect(() => {
    checkReflectionCompletion();
  }, [activeQuestions, checkReflectionCompletion]);

  // Load task lists
  useEffect(() => {
    if (!taskListIds) return;

    async function loadTaskLists() {
      const loaded = await Promise.all(
        taskListIds!.map((id) => getStorageItem<TaskList>('tasklist', id))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskListIds]);

  // Load tasks for selected list
  useEffect(() => {
    if (loading || !taskIds || !selectedTaskList) return;

    async function loadTasks() {
      const loadedTasks = await Promise.all(
        taskIds!.map((id) => getStorageItem<Task>(`task-${selectedTaskList!.id}`, id))
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

  const handleArchiveToSomeday = useCallback(async (task: Task) => {
    if (!selectedTaskList) return;

    try {
      // Move task to someday list
      await moveTask(task, selectedTaskList.id, 'someday');

      // Remove task from current list's local state
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  }, [selectedTaskList]);

  // Selection handlers
  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    setSelectedTaskIds(new Set());
  }, []);

  const handleSelectionToggle = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTaskIds(new Set(tasks.map(t => t.id)));
  }, [tasks]);

  const handleSelectNone = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  // Bulk operation handlers
  const handleBulkDelete = useCallback(async () => {
    if (selectedTaskIds.size === 0 || !selectedTaskList) return;

    try {
      const tasksToDelete = tasks.filter(t => selectedTaskIds.has(t.id));
      await deleteTasks(tasksToDelete, selectedTaskList.id);

      // Remove deleted tasks from local state
      setTasks((prev) => prev.filter(t => !selectedTaskIds.has(t.id)));

      // Exit selection mode
      setSelectionMode(false);
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  }, [selectedTaskIds, selectedTaskList, tasks]);

  const handleBulkComplete = useCallback(async (completed: boolean) => {
    if (selectedTaskIds.size === 0 || !selectedTaskList) return;

    try {
      const tasksToUpdate = tasks.filter(t => selectedTaskIds.has(t.id));
      await setTasksCompleted(tasksToUpdate, selectedTaskList.id, completed);

      // Update local state
      setTasks((prev) =>
        prev.map(t => selectedTaskIds.has(t.id) ? { ...t, completed } : t)
      );

      // Exit selection mode
      setSelectionMode(false);
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error('Error updating tasks:', error);
    }
  }, [selectedTaskIds, selectedTaskList, tasks]);

  const handleBulkMoveToList = useCallback(async (destinationListId: string) => {
    if (selectedTaskIds.size === 0 || !selectedTaskList) return;

    try {
      const tasksToMove = tasks.filter(t => selectedTaskIds.has(t.id));
      await moveTasks(tasksToMove, selectedTaskList.id, destinationListId);

      // Remove moved tasks from local state
      setTasks((prev) => prev.filter(t => !selectedTaskIds.has(t.id)));

      // Exit selection mode and close modal
      setSelectionMode(false);
      setSelectedTaskIds(new Set());
      setBulkMoveModalVisible(false);
    } catch (error) {
      console.error('Error moving tasks:', error);
    }
  }, [selectedTaskIds, selectedTaskList, tasks]);

  const handleBulkArchiveToSomeday = useCallback(async () => {
    if (selectedTaskIds.size === 0 || !selectedTaskList) return;

    try {
      const tasksToArchive = tasks.filter(t => selectedTaskIds.has(t.id));
      await moveTasks(tasksToArchive, selectedTaskList.id, 'someday');

      // Remove archived tasks from local state
      setTasks((prev) => prev.filter(t => !selectedTaskIds.has(t.id)));

      // Exit selection mode
      setSelectionMode(false);
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error('Error archiving tasks:', error);
    }
  }, [selectedTaskIds, selectedTaskList, tasks]);

  const handleStartReflection = useCallback(() => {
    router.push('/(tabs)/reflect');
  }, [router]);

  const renderTask = useCallback((params: any) => (
    <TaskItem
      {...params}
      onToggle={toggleTask}
      onDelete={deleteTask}
      onInfoPress={handleInfoPress}
      onMovePress={handleMovePress}
      onArchivePress={handleArchiveToSomeday}
      swipeableRef={handleSwipeableRef}
      selectionMode={selectionMode}
      isSelected={selectedTaskIds.has(params.item.id)}
      onSelectionToggle={handleSelectionToggle}
      isSomedayList={selectedTaskList?.listType === 'someday'}
    />
  ), [toggleTask, deleteTask, handleInfoPress, handleMovePress, handleArchiveToSomeday, handleSwipeableRef, selectionMode, selectedTaskIds, handleSelectionToggle, selectedTaskList]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Tasks
        </ThemedText>
        <ThemedView style={styles.headerButtons}>
          {!selectionMode && (
            <>
              <TouchableOpacity
                testID="select-button"
                style={styles.selectButton}
                onPress={handleToggleSelectionMode}
                activeOpacity={0.8}>
                <IconSymbol
                  name="checklist"
                  size={24}
                  color={colors.tint}
                />
              </TouchableOpacity>
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
            </>
          )}
        </ThemedView>
      </ThemedView>

      {!reflectionCompleted && activeQuestions.length > 0 && (
        <TouchableOpacity
          style={[styles.reflectionBanner, { backgroundColor: colors.tint + '20', borderColor: colors.tint }]}
          onPress={handleStartReflection}
          activeOpacity={0.8}
        >
          <IconSymbol name="lightbulb" size={24} color={colors.tint} />
          <ThemedView style={styles.reflectionBannerContent}>
            <ThemedText style={[styles.reflectionBannerTitle, { color: colors.tint }]}>
              Daily Reflection
            </ThemedText>
            <ThemedText style={styles.reflectionBannerText}>
              Complete today&apos;s reflection
            </ThemedText>
          </ThemedView>
          <IconSymbol name="chevron.right" size={20} color={colors.tint} />
        </TouchableOpacity>
      )}

      <TaskListDropdown
        taskLists={taskLists}
        selectedTaskList={selectedTaskList}
        isOpen={dropdownVisible}
        onToggle={() => setDropdownVisible(!dropdownVisible)}
        onSelect={handleSelectTaskList}
        iconColor={colors.icon}
        tintColor={colors.tint}
      />

      {selectionMode && (
        <ThemedView style={[styles.bulkActionToolbar, { borderBottomColor: colors.icon + '30' }]}>
          <ThemedView style={styles.toolbarLeft}>
            <TouchableOpacity
              testID="cancel-selection-button"
              style={styles.toolbarButton}
              onPress={handleToggleSelectionMode}>
              <IconSymbol name="xmark" size={20} color={colors.icon} />
              <ThemedText style={styles.toolbarButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.selectedCount}>
              {selectedTaskIds.size} selected
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.toolbarRight}>
            {selectedTaskIds.size === tasks.length ? (
              <TouchableOpacity
                testID="select-none-button"
                style={styles.toolbarButton}
                onPress={handleSelectNone}>
                <ThemedText style={[styles.toolbarButtonText, { color: colors.tint }]}>
                  None
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="select-all-button"
                style={styles.toolbarButton}
                onPress={handleSelectAll}>
                <ThemedText style={[styles.toolbarButtonText, { color: colors.tint }]}>
                  All
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>
      )}

      {selectionMode && selectedTaskIds.size > 0 && (
        <ThemedView style={[styles.bulkActionsBar, { backgroundColor: colors.tint + '15', borderBottomColor: colors.icon + '30' }]}>
          <TouchableOpacity
            testID="bulk-complete-button"
            style={styles.bulkActionButton}
            onPress={() => handleBulkComplete(true)}>
            <IconSymbol name="checkmark.circle" size={20} color={colors.tint} />
            <ThemedText style={[styles.bulkActionText, { color: colors.tint }]}>
              Complete
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            testID="bulk-uncomplete-button"
            style={styles.bulkActionButton}
            onPress={() => handleBulkComplete(false)}>
            <IconSymbol name="circle" size={20} color={colors.tint} />
            <ThemedText style={[styles.bulkActionText, { color: colors.tint }]}>
              Uncomplete
            </ThemedText>
          </TouchableOpacity>
          {selectedTaskList?.listType !== 'someday' && (
            <TouchableOpacity
              testID="bulk-archive-button"
              style={styles.bulkActionButton}
              onPress={handleBulkArchiveToSomeday}>
              <IconSymbol name="archivebox" size={20} color={colors.tint} />
              <ThemedText style={[styles.bulkActionText, { color: colors.tint }]}>
                Archive
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="bulk-move-button"
            style={styles.bulkActionButton}
            onPress={() => setBulkMoveModalVisible(true)}>
            <IconSymbol name="arrow.right.square" size={20} color={colors.tint} />
            <ThemedText style={[styles.bulkActionText, { color: colors.tint }]}>
              Move
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            testID="bulk-delete-button"
            style={styles.bulkActionButton}
            onPress={handleBulkDelete}>
            <IconSymbol name="trash" size={20} color="#ff3b30" />
            <ThemedText style={[styles.bulkActionText, { color: '#ff3b30' }]}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

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

      <TaskListPickerModal
        visible={bulkMoveModalVisible}
        taskLists={taskLists}
        currentListId={selectedTaskList?.id || ''}
        onSelect={handleBulkMoveToList}
        onClose={() => setBulkMoveModalVisible(false)}
      />
      <QuickLogFAB />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkActionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toolbarButtonText: {
    fontSize: 16,
  },
  selectedCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bulkActionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingRight: 20,
  },
  reflectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  reflectionBannerContent: {
    flex: 1,
  },
  reflectionBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reflectionBannerText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
