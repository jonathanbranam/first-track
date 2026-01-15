import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TasksScreen from '@/app/(tabs)/tasks';

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

describe('TasksScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

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

  it('opens modal when add button is pressed', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));

    expect(screen.getByText('New Task')).toBeTruthy();
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeTruthy();
  });

  it('closes modal when Cancel is pressed', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    expect(screen.getByText('New Task')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('New Task')).toBeNull();
    });
  });

  it('adds a task when description is entered and Add is pressed', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Buy groceries'
    );
    fireEvent.press(screen.getByText('Add'));

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

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.press(screen.getByText('Add'));

    // Modal should stay open
    expect(screen.getByText('New Task')).toBeTruthy();
  });

  it('does not add a task when description is only whitespace', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      '   '
    );
    fireEvent.press(screen.getByText('Add'));

    expect(screen.getByText('New Task')).toBeTruthy();
  });

  it('clears input and closes modal after adding a task', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Test task'
    );
    fireEvent.press(screen.getByText('Add'));

    // Wait for the task to appear (indicating async save completed)
    await waitFor(() => {
      expect(screen.getByText('Test task')).toBeTruthy();
    });

    // Modal should now be closed
    expect(screen.queryByText('New Task')).toBeNull();

    fireEvent.press(screen.getByTestId('add-button'));
    expect(screen.getByPlaceholderText('What needs to be done?').props.value).toBe('');
  });

  it('clears input when Cancel is pressed', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Some text'
    );
    fireEvent.press(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('New Task')).toBeNull();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    expect(screen.getByPlaceholderText('What needs to be done?').props.value).toBe('');
  });

  it('toggles task completion when task is pressed', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Complete me'
    );
    fireEvent.press(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Complete me')).toBeTruthy();
    });

    const taskText = screen.getByText('Complete me');
    fireEvent.press(taskText);

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

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Toggle me'
    );
    fireEvent.press(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Toggle me')).toBeTruthy();
    });

    // Complete the task
    fireEvent.press(screen.getByText('Toggle me'));

    await waitFor(() => {
      const completedTask = screen.getByText('Toggle me');
      expect(hasStyleProperty(completedTask.props.style, 'opacity', 0.5)).toBe(true);
    });

    // Uncomplete the task
    fireEvent.press(screen.getByText('Toggle me'));

    await waitFor(() => {
      const updatedTaskText = screen.getByText('Toggle me');
      expect(hasStyleProperty(updatedTaskText.props.style, 'opacity', 0.5)).toBe(false);
    });
  });

  it('can add multiple tasks', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    // Add first task
    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Task 1'
    );
    fireEvent.press(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeTruthy();
    });

    // Add second task
    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Task 2'
    );
    fireEvent.press(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Task 2')).toBeTruthy();
    });

    expect(screen.getByText('Task 1')).toBeTruthy();
    expect(screen.getByText('Task 2')).toBeTruthy();
  });

  it('toggling one task does not affect other tasks', async () => {
    render(<TasksScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeTruthy();
    });

    // Add two tasks
    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'First task'
    );
    fireEvent.press(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('First task')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-button'));
    fireEvent.changeText(
      screen.getByPlaceholderText('What needs to be done?'),
      'Second task'
    );
    fireEvent.press(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Second task')).toBeTruthy();
    });

    // Complete only the first task
    fireEvent.press(screen.getByText('First task'));

    await waitFor(() => {
      const firstTask = screen.getByText('First task');
      expect(hasStyleProperty(firstTask.props.style, 'opacity', 0.5)).toBe(true);
    });

    // Second task should remain incomplete
    const secondTask = screen.getByText('Second task');
    expect(hasStyleProperty(secondTask.props.style, 'opacity', 0.5)).toBe(false);
  });
});
