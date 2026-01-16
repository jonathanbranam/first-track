import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TasksScreen from '@/app/(tabs)/tasks';

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
      render(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tasks')).toBeTruthy();
      });
    });

    it('shows empty state when no tasks exist', async () => {
      render(<TasksScreen />);

      await waitFor(() => {
        expect(screen.getByText(/No tasks yet/)).toBeTruthy();
      });
    });
  });

  describe('modal', () => {
    it('opens modal when add button is pressed', async () => {
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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

  describe('task completion', () => {
    it('toggles task completion when task is pressed', async () => {
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      const { unmount } = render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      const { unmount } = render(<TasksScreen />);

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
      render(<TasksScreen />);

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
      render(<TasksScreen />);

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
});
