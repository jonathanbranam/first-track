import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStorage, getStorageItem, setStorageItem } from '@/hooks/use-storage';

interface Task {
  id: string;
  description: string;
  completed: boolean;
  deletedAt?: number;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const { data: taskIds, loading, save: saveTaskList } = useStorage<string[]>('tasklist', 'default');

  const colors = Colors[colorScheme];

  useEffect(() => {
    if (loading || !taskIds) return;

    async function loadTasks() {
      const loadedTasks = await Promise.all(
        taskIds.map((id) => getStorageItem<Task>('task', id))
      );
      // Filter out null tasks and deleted tasks
      setTasks(loadedTasks.filter((task): task is Task => task !== null && !task.deletedAt));
    }

    loadTasks();
  }, [taskIds, loading]);

  const addTask = useCallback(async () => {
    const trimmed = newTaskDescription.trim();
    if (!trimmed) return;

    const newTask: Task = {
      id: Date.now().toString(),
      description: trimmed,
      completed: false,
    };

    await setStorageItem('task', newTask.id, newTask);

    const updatedIds = [...(taskIds || []), newTask.id];
    await saveTaskList(updatedIds);

    setTasks((prev) => [...prev, newTask]);
    setNewTaskDescription('');
    setModalVisible(false);
  }, [newTaskDescription, taskIds, saveTaskList]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed };
    await setStorageItem('task', id, updatedTask);

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? updatedTask : t))
    );
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, deletedAt: Date.now() };
    await setStorageItem('task', id, updatedTask);

    // Close the swipeable
    swipeableRefs.current.get(id)?.close();

    // Remove from local state
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [tasks]);

  const renderRightActions = (id: string) => (
    <TouchableOpacity
      testID={`delete-action-${id}`}
      style={styles.deleteAction}
      onPress={() => deleteTask(id)}>
      <IconSymbol name="trash" size={24} color="#fff" />
    </TouchableOpacity>
  );

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) {
          swipeableRefs.current.set(item.id, ref);
        } else {
          swipeableRefs.current.delete(item.id);
        }
      }}
      renderRightActions={() => renderRightActions(item.id)}
      overshootRight={false}>
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => toggleTask(item.id)}
      activeOpacity={0.7}>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: colors.icon,
            backgroundColor: item.completed ? colors.tint : 'transparent',
          },
        ]}>
        {item.completed && (
          <IconSymbol
            name="checkmark"
            size={14}
            color={colorScheme === 'light' ? '#fff' : Colors.dark.background}
            weight="bold"
          />
        )}
      </View>
      <ThemedText
        style={[
          styles.taskText,
          item.completed && {
            opacity: 0.5,
            textDecorationLine: 'line-through',
          },
        ]}>
        {item.description}
      </ThemedText>
    </TouchableOpacity>
    </Swipeable>
  );

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

      {tasks.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <IconSymbol
            name="checklist"
            size={64}
            color={colors.icon}
            style={{ marginBottom: 16 }}
          />
          <ThemedText style={{ opacity: 0.6, textAlign: 'center' }}>
            No tasks yet.{'\n'}Tap the + button to add one.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          extraData={colorScheme}
          contentContainerStyle={styles.listContent}
        />
      )}

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
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              autoFocus
              onSubmitEditing={addTask}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewTaskDescription('');
                  setModalVisible(false);
                }}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.submitButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={addTask}>
                <ThemedText
                  lightColor="#fff"
                  darkColor={Colors.dark.background}>
                  Add
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
  listContent: {
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
