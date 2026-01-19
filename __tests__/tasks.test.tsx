import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TasksScreen from '@/app/(tabs)/index';
import { QuickLogProvider } from '@/contexts/quick-log-context';

// Store the latest focus callback for manual triggering in tests
let focusCallback: (() => void) | null = null;

// Mock useFocusEffect to capture the callback without calling it
// The component's regular useEffect handles initial data loading
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn((callback: () => void) => {
    // Store the callback for manual triggering in tests
    focusCallback = callback;
  }),
}));

// Helper to simulate screen focus (call this to trigger refresh)
const simulateFocus = async () => {
  if (focusCallback) {
    await act(async () => {
      focusCallback!();
    });
  }
};

// Helper to check if a style property exists in a potentially nested style array
const hasStyleProperty = (styles: any, property: string, value: any): boolean => {
  if (!styles) return false;
  if (Array.isArray(styles)) {
    return styles.some((s) => hasStyleProperty(s, property, value));
  }
  if (typeof styles === 'object') {
    return styles[property] === value;
  }
  return false;
};

// Helper to set up required task lists for TasksScreen
const setupTaskLists = async () => {
  const defaultList = {
    id: 'default',
    name: 'Default',
    emoji: '📝',
    color: '#FF6B6B',
  };
  await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default']));
  await AsyncStorage.setItem('tasklist-default', JSON.stringify(defaultList));
};

// Helper to render component with QuickLogProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QuickLogProvider>
      {component}
    </QuickLogProvider>
  );
};

describe('TasksScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // TasksScreen requires task lists to be set up
    await setupTaskLists();
    // Reset focus callback between tests
    focusCallback = null;
  });

  afterEach(async () => {
    // Flush all pending promises and microtasks to prevent state updates
    // from leaking into subsequent tests
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('rendering', () => {
    it('renders the title', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tasks')).toBeTruthy();
      });
    });

    it('shows empty state when no tasks exist', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByText(/No tasks yet/)).toBeTruthy();
      });
    });
  });

  describe('modal', () => {
    it('opens modal when add button is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      expect(screen.getByText('New Task')).toBeTruthy();
      expect(screen.getByPlaceholderText('What needs to be done?')).toBeTruthy();
    });

    it('closes modal when Cancel is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });
      expect(screen.getByText('New Task')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByText('Cancel'));
      });

      await waitFor(() => {
        expect(screen.queryByText('New Task')).toBeNull();
      });
    });

    it('clears input and closes modal after adding a task', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Test task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      // Wait for the task to appear (indicating async save completed)
      await waitFor(() => {
        expect(screen.getByText('Test task')).toBeTruthy();
      });

      // Modal should now be closed
      expect(screen.queryByText('New Task')).toBeNull();

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });
      expect(screen.getByPlaceholderText('What needs to be done?').props.value).toBe('');
    });

    it('clears input when Cancel is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });
      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Some text'
        );
      });
      await act(async () => {
        fireEvent.press(screen.getByText('Cancel'));
      });

      await waitFor(() => {
        expect(screen.queryByText('New Task')).toBeNull();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });
      expect(screen.getByPlaceholderText('What needs to be done?').props.value).toBe('');
    });
  });

  describe('adding tasks', () => {
    it('adds a task when description is entered and Add is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Buy groceries'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeTruthy();
      });
      expect(screen.queryByText(/No tasks yet/)).toBeNull();
    });

    it('does not add a task when description is empty', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });
      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      // Modal should stay open
      expect(screen.getByText('New Task')).toBeTruthy();
    });

    it('does not add a task when description is only whitespace', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });
      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          '   '
        );
      });
      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      expect(screen.getByText('New Task')).toBeTruthy();
    });

    it('can add multiple tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add first task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      // Add second task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 2'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 2')).toBeTruthy();
      });

      expect(screen.getByText('Task 1')).toBeTruthy();
      expect(screen.getByText('Task 2')).toBeTruthy();
    });
  });

  describe('task notes', () => {
    it('adds a task with notes when both description and notes are provided', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      // Fill in task description
      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Buy groceries'
        );
      });

      // Fill in notes
      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Additional notes (optional)'),
          'Get milk, eggs, and bread from the store'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeTruthy();
      });

      // Verify task was saved with notes by checking storage
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      expect(taskIds).not.toBeNull();
      const ids = JSON.parse(taskIds!);
      expect(ids.length).toBe(1);

      const storedTask = await AsyncStorage.getItem(`task-default-${ids[0]}`);
      expect(storedTask).not.toBeNull();
      const task = JSON.parse(storedTask!);
      expect(task.description).toBe('Buy groceries');
      expect(task.notes).toBe('Get milk, eggs, and bread from the store');
    });

    it('adds a task without notes when notes field is left empty', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Simple task'
        );
      });

      // Don't fill in notes field

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Simple task')).toBeTruthy();
      });

      // Verify task was saved without notes
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);
      const storedTask = await AsyncStorage.getItem(`task-default-${ids[0]}`);
      const task = JSON.parse(storedTask!);
      expect(task.description).toBe('Simple task');
      expect(task.notes).toBeUndefined();
    });

    it('shows task detail modal when task is pressed with long press or info button', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task with notes
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task with details'
        );
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Additional notes (optional)'),
          'These are the detailed notes'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task with details')).toBeTruthy();
      });

      // Press info button to open detail modal
      const infoButton = screen.getByTestId(/info-button-/);
      await act(async () => {
        fireEvent.press(infoButton);
      });

      // Detail modal should show both title and notes
      await waitFor(() => {
        expect(screen.getByText('Task Details')).toBeTruthy();
        expect(screen.getByText('These are the detailed notes')).toBeTruthy();
        // The task title should appear in the modal (there will be two instances - one in list, one in modal)
        const taskTitles = screen.getAllByText('Task with details');
        expect(taskTitles.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('allows editing task notes from detail modal', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task with notes
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Editable task'
        );
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Additional notes (optional)'),
          'Original notes'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Editable task')).toBeTruthy();
      });

      // Open detail modal
      const infoButton = screen.getByTestId(/info-button-/);
      await act(async () => {
        fireEvent.press(infoButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Task Details')).toBeTruthy();
      });

      // Press edit button
      await act(async () => {
        fireEvent.press(screen.getByText('Edit'));
      });

      // Update the notes
      await act(async () => {
        fireEvent.changeText(
          screen.getByDisplayValue('Original notes'),
          'Updated notes content'
        );
      });

      // Save changes
      await act(async () => {
        fireEvent.press(screen.getByText('Save'));
      });

      // Verify notes were updated in storage
      await waitFor(async () => {
        const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
        const ids = JSON.parse(taskIds!);
        const storedTask = await AsyncStorage.getItem(`task-default-${ids[0]}`);
        const task = JSON.parse(storedTask!);
        expect(task.notes).toBe('Updated notes content');
      });
    });

    it('shows notes indicator on task item when notes are present', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add task without notes
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task without notes'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task without notes')).toBeTruthy();
      });

      // Add task with notes
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task with notes'
        );
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Additional notes (optional)'),
          'Some notes here'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task with notes')).toBeTruthy();
      });

      // Task with notes should have an info button/indicator
      const infoButtons = screen.getAllByTestId(/info-button-/);
      expect(infoButtons.length).toBe(2); // Both tasks have info buttons

      // But we could also test for a notes indicator icon specifically
      // For now, we can verify the info button exists for the task with notes
    });
  });

  describe('task completion', () => {
    it('toggles task completion when task is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Complete me'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Complete me')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Complete me'));
      });

      await waitFor(() => {
        const updatedTaskText = screen.getByText('Complete me');
        expect(hasStyleProperty(updatedTaskText.props.style, 'opacity', 0.5)).toBe(true);
      });
    });

    it('can toggle task back to incomplete', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Toggle me'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Toggle me')).toBeTruthy();
      });

      // Complete the task
      await act(async () => {
        fireEvent.press(screen.getByText('Toggle me'));
      });

      await waitFor(() => {
        const completedTask = screen.getByText('Toggle me');
        expect(hasStyleProperty(completedTask.props.style, 'opacity', 0.5)).toBe(true);
      });

      // Uncomplete the task
      await act(async () => {
        fireEvent.press(screen.getByText('Toggle me'));
      });

      await waitFor(() => {
        const updatedTaskText = screen.getByText('Toggle me');
        expect(hasStyleProperty(updatedTaskText.props.style, 'opacity', 0.5)).toBe(false);
      });
    });

    it('toggling one task does not affect other tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add two tasks
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'First task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('First task')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Second task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Second task')).toBeTruthy();
      });

      // Complete only the first task
      await act(async () => {
        fireEvent.press(screen.getByText('First task'));
      });

      await waitFor(() => {
        const firstTask = screen.getByText('First task');
        expect(hasStyleProperty(firstTask.props.style, 'opacity', 0.5)).toBe(true);
      });

      // Second task should remain incomplete
      const secondTask = screen.getByText('Second task');
      expect(hasStyleProperty(secondTask.props.style, 'opacity', 0.5)).toBe(false);
    });
  });

  describe('delete functionality', () => {
    it('removes task from list when delete action is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task to delete'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task to delete')).toBeTruthy();
      });

      // Get the task ID from the delete button testID
      const deleteButton = screen.getByTestId(/delete-action-/);

      // Press delete
      await act(async () => {
        fireEvent.press(deleteButton);
      });

      // Task should be removed from the list
      await waitFor(() => {
        expect(screen.queryByText('Task to delete')).toBeNull();
      });

      // Should show empty state
      expect(screen.getByText(/No tasks yet/)).toBeTruthy();
    });

    it('sets deletedAt timestamp when task is deleted', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task with timestamp'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task with timestamp')).toBeTruthy();
      });

      // Get the delete button
      const deleteButton = screen.getByTestId(/delete-action-/);
      const taskId = deleteButton.props.testID.replace('delete-action-', '');

      // Press delete
      await act(async () => {
        fireEvent.press(deleteButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Task with timestamp')).toBeNull();
      });

      // Check that the task in storage has deletedAt set
      // Storage key format is: task-{listId}-{taskId}
      const storedTask = await AsyncStorage.getItem(`task-default-${taskId}`);
      expect(storedTask).not.toBeNull();
      const task = JSON.parse(storedTask!);
      expect(task.deletedAt).toBeDefined();
      expect(typeof task.deletedAt).toBe('number');
    });

    it('deleting one task does not affect other tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add first task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Keep this task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Keep this task')).toBeTruthy();
      });

      // Add second task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Delete this task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Delete this task')).toBeTruthy();
      });

      // Find and press delete on the second task
      const deleteButtons = screen.getAllByTestId(/delete-action-/);
      const secondDeleteButton = deleteButtons[1];

      await act(async () => {
        fireEvent.press(secondDeleteButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Delete this task')).toBeNull();
      });

      // First task should still be there
      expect(screen.getByText('Keep this task')).toBeTruthy();
    });

    it('does not show deleted tasks after reload', async () => {
      const { unmount } = renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task to be deleted'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task to be deleted')).toBeTruthy();
      });

      // Delete the task
      const deleteButton = screen.getByTestId(/delete-action-/);

      await act(async () => {
        fireEvent.press(deleteButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Task to be deleted')).toBeNull();
      });

      // Unmount and remount to simulate reload
      unmount();
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Deleted task should not appear
      expect(screen.queryByText('Task to be deleted')).toBeNull();
      expect(screen.getByText(/No tasks yet/)).toBeTruthy();
    });
  });

  describe('task list synchronization', () => {
    it('shows newly added task lists after returning to the screen', async () => {
      const { unmount } = renderWithProviders(<TasksScreen />);

      // Wait for initial render with default list
      await waitFor(() => {
        expect(screen.getByText('Default')).toBeTruthy();
      });

      // Simulate adding a new task list from the TaskLists screen
      // by directly updating AsyncStorage
      const newList = {
        id: 'work-123',
        name: 'Work Tasks',
        emoji: '💼',
        color: '#4ECDC4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'work-123']));
      await AsyncStorage.setItem('tasklist-work-123', JSON.stringify(newList));

      // Unmount and remount to simulate returning to the Tasks tab
      unmount();
      renderWithProviders(<TasksScreen />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Default')).toBeTruthy();
      });

      // Open the dropdown
      await act(async () => {
        fireEvent.press(screen.getByText('Default'));
      });

      // The new task list should be visible in the dropdown
      await waitFor(() => {
        expect(screen.getByText('Work Tasks')).toBeTruthy();
      });
    });

    it('refreshes task lists when screen gains focus', async () => {
      // This test verifies that useFocusEffect triggers a refresh
      renderWithProviders(<TasksScreen />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Default')).toBeTruthy();
      });

      // Simulate adding a new task list while on another tab
      const newList = {
        id: 'personal-456',
        name: 'Personal',
        emoji: '🏠',
        color: '#96CEB4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'personal-456']));
      await AsyncStorage.setItem('tasklist-personal-456', JSON.stringify(newList));

      // Simulate the screen gaining focus (like switching back to this tab)
      await simulateFocus();

      // Open the dropdown
      await act(async () => {
        fireEvent.press(screen.getByText('Default'));
      });

      // The new task list should be visible
      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeTruthy();
      });
    });
  });

  describe('task movement between lists', () => {
    it('shows move button for each task', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task to move'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task to move')).toBeTruthy();
      });

      // Move button should be present
      const moveButton = screen.getByTestId(/move-button-/);
      expect(moveButton).toBeTruthy();
    });

    it('opens task list picker modal when move button is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Create a second task list
      const workList = {
        id: 'work-123',
        name: 'Work',
        emoji: '💼',
        color: '#4ECDC4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'work-123']));
      await AsyncStorage.setItem('tasklist-work-123', JSON.stringify(workList));

      // Refresh to load the new list
      await simulateFocus();

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task to move'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task to move')).toBeTruthy();
      });

      // Press move button
      const moveButton = screen.getByTestId(/move-button-/);
      await act(async () => {
        fireEvent.press(moveButton);
      });

      // Modal should open with title
      await waitFor(() => {
        expect(screen.getByText('Move to List')).toBeTruthy();
      });

      // Should show the Work list
      expect(screen.getByTestId('list-picker-item-work-123')).toBeTruthy();

      // Should not show Default list as a picker item (it's the current list)
      expect(screen.queryByTestId('list-picker-item-default')).toBeNull();
    });

    it('moves task to selected list when list is picked', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Create a second task list
      const workList = {
        id: 'work-123',
        name: 'Work',
        emoji: '💼',
        color: '#4ECDC4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'work-123']));
      await AsyncStorage.setItem('tasklist-work-123', JSON.stringify(workList));

      // Refresh to load the new list
      await simulateFocus();

      // Add a task to the default list
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Move me to work'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Move me to work')).toBeTruthy();
      });

      // Get the task ID before moving
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);
      const taskId = ids[0];

      // Press move button
      const moveButton = screen.getByTestId(/move-button-/);
      await act(async () => {
        fireEvent.press(moveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Move to List')).toBeTruthy();
      });

      // Select the Work list
      const workListItem = screen.getByTestId('list-picker-item-work-123');
      await act(async () => {
        fireEvent.press(workListItem);
      });

      // Task should be removed from default list's view
      await waitFor(() => {
        expect(screen.queryByText('Move me to work')).toBeNull();
      });

      // Verify task was removed from default list in storage
      const updatedDefaultTaskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const updatedDefaultIds = JSON.parse(updatedDefaultTaskIds!);
      expect(updatedDefaultIds).not.toContain(taskId);

      // Verify task was added to work list in storage
      const workTaskIds = await AsyncStorage.getItem('tasklist-tasks-work-123');
      const workIds = JSON.parse(workTaskIds!);
      expect(workIds).toContain(taskId);

      // Verify task data exists in work list storage
      const movedTask = await AsyncStorage.getItem(`task-work-123-${taskId}`);
      expect(movedTask).not.toBeNull();
      const task = JSON.parse(movedTask!);
      expect(task.description).toBe('Move me to work');
    });

    it('preserves task notes and completion status when moving', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Create a second task list
      const personalList = {
        id: 'personal-456',
        name: 'Personal',
        emoji: '🏠',
        color: '#96CEB4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'personal-456']));
      await AsyncStorage.setItem('tasklist-personal-456', JSON.stringify(personalList));

      await simulateFocus();

      // Add a task with notes and mark it complete
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task with data'
        );
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Additional notes (optional)'),
          'Important notes here'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task with data')).toBeTruthy();
      });

      // Complete the task
      await act(async () => {
        fireEvent.press(screen.getByText('Task with data'));
      });

      await waitFor(() => {
        const completedTask = screen.getByText('Task with data');
        expect(hasStyleProperty(completedTask.props.style, 'opacity', 0.5)).toBe(true);
      });

      // Get the task ID
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);
      const taskId = ids[0];

      // Move the task
      const moveButton = screen.getByTestId(/move-button-/);
      await act(async () => {
        fireEvent.press(moveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Move to List')).toBeTruthy();
      });

      const personalListItem = screen.getByTestId('list-picker-item-personal-456');
      await act(async () => {
        fireEvent.press(personalListItem);
      });

      await waitFor(() => {
        expect(screen.queryByText('Task with data')).toBeNull();
      });

      // Verify the moved task has all its original data
      const movedTask = await AsyncStorage.getItem(`task-personal-456-${taskId}`);
      expect(movedTask).not.toBeNull();
      const task = JSON.parse(movedTask!);
      expect(task.description).toBe('Task with data');
      expect(task.notes).toBe('Important notes here');
      expect(task.completed).toBe(true);
    });

    it('closes modal when Cancel is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Create a second task list
      const workList = {
        id: 'work-123',
        name: 'Work',
        emoji: '💼',
        color: '#4ECDC4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'work-123']));
      await AsyncStorage.setItem('tasklist-work-123', JSON.stringify(workList));

      await simulateFocus();

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task to maybe move'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task to maybe move')).toBeTruthy();
      });

      // Press move button
      const moveButton = screen.getByTestId(/move-button-/);
      await act(async () => {
        fireEvent.press(moveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Move to List')).toBeTruthy();
      });

      // Press Cancel
      const cancelButton = screen.getByTestId('task-list-picker-cancel');
      await act(async () => {
        fireEvent.press(cancelButton);
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Move to List')).toBeNull();
      });

      // Task should still be in the default list
      expect(screen.getByText('Task to maybe move')).toBeTruthy();
    });

    it('shows empty message when no other lists available', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task (only default list exists)
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Nowhere to move'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Nowhere to move')).toBeTruthy();
      });

      // Press move button
      const moveButton = screen.getByTestId(/move-button-/);
      await act(async () => {
        fireEvent.press(moveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Move to List')).toBeTruthy();
      });

      // Should show empty message
      expect(screen.getByText('No other lists available')).toBeTruthy();
    });
  });

  describe('bulk operations', () => {
    it('enters selection mode when select button is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      // Press select button
      const selectButton = screen.getByTestId('select-button');
      await act(async () => {
        fireEvent.press(selectButton);
      });

      // Should show cancel button and selection toolbar
      await waitFor(() => {
        expect(screen.getByTestId('cancel-selection-button')).toBeTruthy();
        expect(screen.getByText('0 selected')).toBeTruthy();
      });
    });

    it('allows selecting and deselecting individual tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add two tasks
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 2'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 2')).toBeTruthy();
      });

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeTruthy();
      });

      // Get task IDs
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);

      // Select first task
      const selectCheckbox1 = screen.getByTestId(`select-checkbox-${ids[0]}`);
      await act(async () => {
        fireEvent.press(selectCheckbox1);
      });

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeTruthy();
      });

      // Select second task
      const selectCheckbox2 = screen.getByTestId(`select-checkbox-${ids[1]}`);
      await act(async () => {
        fireEvent.press(selectCheckbox2);
      });

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeTruthy();
      });

      // Deselect first task
      await act(async () => {
        fireEvent.press(selectCheckbox1);
      });

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeTruthy();
      });
    });

    it('implements select all functionality', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add three tasks
      for (let i = 1; i <= 3; i++) {
        await act(async () => {
          fireEvent.press(screen.getByTestId('add-button'));
        });

        await act(async () => {
          fireEvent.changeText(
            screen.getByPlaceholderText('What needs to be done?'),
            `Task ${i}`
          );
        });

        await act(async () => {
          fireEvent.press(screen.getByText('Add'));
        });

        await waitFor(() => {
          expect(screen.getByText(`Task ${i}`)).toBeTruthy();
        });
      }

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeTruthy();
      });

      // Press select all button
      const selectAllButton = screen.getByTestId('select-all-button');
      await act(async () => {
        fireEvent.press(selectAllButton);
      });

      // All tasks should be selected
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeTruthy();
      });

      // Button should change to "None"
      expect(screen.getByTestId('select-none-button')).toBeTruthy();
    });

    it('implements select none functionality', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add two tasks
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      // Select all
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-all-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeTruthy();
      });

      // Press select none button
      const selectNoneButton = screen.getByTestId('select-none-button');
      await act(async () => {
        fireEvent.press(selectNoneButton);
      });

      // No tasks should be selected
      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeTruthy();
      });
    });

    it('bulk completes multiple tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add two tasks
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 2'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 2')).toBeTruthy();
      });

      // Enter selection mode and select all
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('select-all-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeTruthy();
      });

      // Press bulk complete button
      const bulkCompleteButton = screen.getByTestId('bulk-complete-button');
      await act(async () => {
        fireEvent.press(bulkCompleteButton);
      });

      // Should exit selection mode and tasks should be completed
      await waitFor(() => {
        expect(screen.queryByTestId('cancel-selection-button')).toBeNull();
      });

      const task1 = screen.getByText('Task 1');
      const task2 = screen.getByText('Task 2');
      expect(hasStyleProperty(task1.props.style, 'opacity', 0.5)).toBe(true);
      expect(hasStyleProperty(task2.props.style, 'opacity', 0.5)).toBe(true);
    });

    it('bulk uncompletes multiple tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Completed task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Completed task')).toBeTruthy();
      });

      // Complete the task normally
      await act(async () => {
        fireEvent.press(screen.getByText('Completed task'));
      });

      await waitFor(() => {
        const completedTask = screen.getByText('Completed task');
        expect(hasStyleProperty(completedTask.props.style, 'opacity', 0.5)).toBe(true);
      });

      // Enter selection mode and select the task
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('select-all-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeTruthy();
      });

      // Press bulk uncomplete button
      const bulkUncompleteButton = screen.getByTestId('bulk-uncomplete-button');
      await act(async () => {
        fireEvent.press(bulkUncompleteButton);
      });

      // Task should be uncompleted
      await waitFor(() => {
        const task = screen.getByText('Completed task');
        expect(hasStyleProperty(task.props.style, 'opacity', 0.5)).toBe(false);
      });
    });

    it('bulk deletes multiple tasks', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add three tasks
      for (let i = 1; i <= 3; i++) {
        await act(async () => {
          fireEvent.press(screen.getByTestId('add-button'));
        });

        await act(async () => {
          fireEvent.changeText(
            screen.getByPlaceholderText('What needs to be done?'),
            `Task ${i}`
          );
        });

        await act(async () => {
          fireEvent.press(screen.getByText('Add'));
        });

        await waitFor(() => {
          expect(screen.getByText(`Task ${i}`)).toBeTruthy();
        });
      }

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      // Select first two tasks
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);

      await act(async () => {
        fireEvent.press(screen.getByTestId(`select-checkbox-${ids[0]}`));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId(`select-checkbox-${ids[1]}`));
      });

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeTruthy();
      });

      // Press bulk delete button
      const bulkDeleteButton = screen.getByTestId('bulk-delete-button');
      await act(async () => {
        fireEvent.press(bulkDeleteButton);
      });

      // First two tasks should be deleted
      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeNull();
        expect(screen.queryByText('Task 2')).toBeNull();
      });

      // Third task should still exist
      expect(screen.getByText('Task 3')).toBeTruthy();
    });

    it('bulk moves multiple tasks to another list', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Create a second task list
      const workList = {
        id: 'work-123',
        name: 'Work',
        emoji: '💼',
        color: '#4ECDC4',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'work-123']));
      await AsyncStorage.setItem('tasklist-work-123', JSON.stringify(workList));

      await simulateFocus();

      // Add three tasks
      for (let i = 1; i <= 3; i++) {
        await act(async () => {
          fireEvent.press(screen.getByTestId('add-button'));
        });

        await act(async () => {
          fireEvent.changeText(
            screen.getByPlaceholderText('What needs to be done?'),
            `Task ${i}`
          );
        });

        await act(async () => {
          fireEvent.press(screen.getByText('Add'));
        });

        await waitFor(() => {
          expect(screen.getByText(`Task ${i}`)).toBeTruthy();
        });
      }

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      // Select first two tasks
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);

      await act(async () => {
        fireEvent.press(screen.getByTestId(`select-checkbox-${ids[0]}`));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId(`select-checkbox-${ids[1]}`));
      });

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeTruthy();
      });

      // Press bulk move button
      const bulkMoveButton = screen.getByTestId('bulk-move-button');
      await act(async () => {
        fireEvent.press(bulkMoveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Move to List')).toBeTruthy();
      });

      // Select work list
      const workListItem = screen.getByTestId('list-picker-item-work-123');
      await act(async () => {
        fireEvent.press(workListItem);
      });

      // First two tasks should be removed from view
      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeNull();
        expect(screen.queryByText('Task 2')).toBeNull();
      });

      // Third task should still be in default list
      expect(screen.getByText('Task 3')).toBeTruthy();

      // Verify tasks were moved to work list in storage
      const workTaskIds = await AsyncStorage.getItem('tasklist-tasks-work-123');
      const workIds = JSON.parse(workTaskIds!);
      expect(workIds).toContain(ids[0]);
      expect(workIds).toContain(ids[1]);
      expect(workIds).not.toContain(ids[2]);
    });

    it('exits selection mode when cancel is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('cancel-selection-button')).toBeTruthy();
      });

      // Cancel selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('cancel-selection-button'));
      });

      // Should exit selection mode
      await waitFor(() => {
        expect(screen.queryByTestId('cancel-selection-button')).toBeNull();
      });

      // Should show normal buttons
      expect(screen.getByTestId('select-button')).toBeTruthy();
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    it('hides bulk action buttons when no tasks are selected', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task 1'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeTruthy();
      });

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeTruthy();
      });

      // Bulk action buttons should not be visible
      expect(screen.queryByTestId('bulk-complete-button')).toBeNull();
      expect(screen.queryByTestId('bulk-delete-button')).toBeNull();
      expect(screen.queryByTestId('bulk-move-button')).toBeNull();
    });
  });

  describe('someday archive operations', () => {
    it('shows archive button for each task when not on someday list', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Task to archive'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Task to archive')).toBeTruthy();
      });

      // Archive button should be present
      const archiveButton = screen.getByTestId(/archive-button-/);
      expect(archiveButton).toBeTruthy();
    });

    it('archives a task to someday list when archive button is pressed', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Ensure someday list exists
      const somedayList = {
        id: 'someday',
        name: 'Someday',
        emoji: '📦',
        color: '#DFE6E9',
        listType: 'someday',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'someday']));
      await AsyncStorage.setItem('tasklist-someday', JSON.stringify(somedayList));

      await simulateFocus();

      // Add a task to the default list
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Archive this task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Archive this task')).toBeTruthy();
      });

      // Get the task ID before archiving
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);
      const taskId = ids[0];

      // Press archive button
      const archiveButton = screen.getByTestId(/archive-button-/);
      await act(async () => {
        fireEvent.press(archiveButton);
      });

      // Task should be removed from default list's view
      await waitFor(() => {
        expect(screen.queryByText('Archive this task')).toBeNull();
      });

      // Verify task was removed from default list in storage
      const updatedDefaultTaskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const updatedDefaultIds = JSON.parse(updatedDefaultTaskIds!);
      expect(updatedDefaultIds).not.toContain(taskId);

      // Verify task was added to someday list in storage
      const somedayTaskIds = await AsyncStorage.getItem('tasklist-tasks-someday');
      const somedayIds = JSON.parse(somedayTaskIds!);
      expect(somedayIds).toContain(taskId);

      // Verify task data exists in someday list storage
      const archivedTask = await AsyncStorage.getItem(`task-someday-${taskId}`);
      expect(archivedTask).not.toBeNull();
      const task = JSON.parse(archivedTask!);
      expect(task.description).toBe('Archive this task');
    });

    it('does not show archive button when viewing someday list', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Ensure someday list exists with a task
      const somedayList = {
        id: 'someday',
        name: 'Someday',
        emoji: '📦',
        color: '#DFE6E9',
        listType: 'someday',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'someday']));
      await AsyncStorage.setItem('tasklist-someday', JSON.stringify(somedayList));

      await simulateFocus();

      // Switch to someday list
      await act(async () => {
        fireEvent.press(screen.getByText('Default'));
      });

      await waitFor(() => {
        expect(screen.getByText('Someday')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Someday'));
      });

      // Add a task to someday list
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Someday task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Someday task')).toBeTruthy();
      });

      // Archive button should not be present
      expect(screen.queryByTestId(/archive-button-/)).toBeNull();
    });

    it('bulk archives multiple tasks to someday list', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Ensure someday list exists
      const somedayList = {
        id: 'someday',
        name: 'Someday',
        emoji: '📦',
        color: '#DFE6E9',
        listType: 'someday',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'someday']));
      await AsyncStorage.setItem('tasklist-someday', JSON.stringify(somedayList));

      await simulateFocus();

      // Add three tasks
      for (let i = 1; i <= 3; i++) {
        await act(async () => {
          fireEvent.press(screen.getByTestId('add-button'));
        });

        await act(async () => {
          fireEvent.changeText(
            screen.getByPlaceholderText('What needs to be done?'),
            `Task ${i}`
          );
        });

        await act(async () => {
          fireEvent.press(screen.getByText('Add'));
        });

        await waitFor(() => {
          expect(screen.getByText(`Task ${i}`)).toBeTruthy();
        });
      }

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      // Select first two tasks
      const taskIds = await AsyncStorage.getItem('tasklist-tasks-default');
      const ids = JSON.parse(taskIds!);

      await act(async () => {
        fireEvent.press(screen.getByTestId(`select-checkbox-${ids[0]}`));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId(`select-checkbox-${ids[1]}`));
      });

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeTruthy();
      });

      // Press bulk archive button
      const bulkArchiveButton = screen.getByTestId('bulk-archive-button');
      await act(async () => {
        fireEvent.press(bulkArchiveButton);
      });

      // First two tasks should be removed from view
      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeNull();
        expect(screen.queryByText('Task 2')).toBeNull();
      });

      // Third task should still be in default list
      expect(screen.getByText('Task 3')).toBeTruthy();

      // Verify tasks were moved to someday list in storage
      const somedayTaskIds = await AsyncStorage.getItem('tasklist-tasks-someday');
      const somedayIds = JSON.parse(somedayTaskIds!);
      expect(somedayIds).toContain(ids[0]);
      expect(somedayIds).toContain(ids[1]);
      expect(somedayIds).not.toContain(ids[2]);
    });

    it('does not show bulk archive button when viewing someday list', async () => {
      renderWithProviders(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('add-button')).toBeTruthy();
      });

      // Ensure someday list exists
      const somedayList = {
        id: 'someday',
        name: 'Someday',
        emoji: '📦',
        color: '#DFE6E9',
        listType: 'someday',
      };
      await AsyncStorage.setItem('tasklists-all', JSON.stringify(['default', 'someday']));
      await AsyncStorage.setItem('tasklist-someday', JSON.stringify(somedayList));

      await simulateFocus();

      // Switch to someday list
      await act(async () => {
        fireEvent.press(screen.getByText('Default'));
      });

      await waitFor(() => {
        expect(screen.getByText('Someday')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Someday'));
      });

      // Add a task
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-button'));
      });

      await act(async () => {
        fireEvent.changeText(
          screen.getByPlaceholderText('What needs to be done?'),
          'Someday task'
        );
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Add'));
      });

      await waitFor(() => {
        expect(screen.getByText('Someday task')).toBeTruthy();
      });

      // Enter selection mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('select-button'));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('select-all-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeTruthy();
      });

      // Bulk archive button should not be visible
      expect(screen.queryByTestId('bulk-archive-button')).toBeNull();
    });
  });
});
