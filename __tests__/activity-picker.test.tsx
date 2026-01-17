import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityPicker } from '@/components/activity-picker';
import { Activity } from '@/types/activity';

describe('ActivityPicker', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      name: 'Coding',
      category: 'Work',
      color: '#4ECDC4',
      active: true,
      createdAt: Date.now(),
    },
    {
      id: '2',
      name: 'Exercise',
      category: 'Health',
      color: '#98D8C8',
      active: true,
      createdAt: Date.now(),
    },
    {
      id: '3',
      name: 'Reading',
      category: 'Personal',
      active: true,
      createdAt: Date.now(),
    },
  ];

  const mockOnSelectActivity = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible is true', () => {
    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={mockActivities}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Select Activity')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <ActivityPicker
        visible={false}
        activities={mockActivities}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Select Activity')).toBeNull();
  });

  it('should display all activities', () => {
    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={mockActivities}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Coding')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
    expect(getByText('Exercise')).toBeTruthy();
    expect(getByText('Health')).toBeTruthy();
    expect(getByText('Reading')).toBeTruthy();
    expect(getByText('Personal')).toBeTruthy();
  });

  it('should call onSelectActivity when activity is tapped', () => {
    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={mockActivities}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Coding'));

    expect(mockOnSelectActivity).toHaveBeenCalledWith(mockActivities[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Cancel is pressed', () => {
    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={mockActivities}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Cancel'));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSelectActivity).not.toHaveBeenCalled();
  });

  it('should display empty state when no activities', () => {
    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={[]}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    expect(getByText('No active activities. Create one in Settings.')).toBeTruthy();
  });

  it('should display activity without category', () => {
    const activityWithoutCategory: Activity = {
      id: '4',
      name: 'Task',
      active: true,
      createdAt: Date.now(),
    };

    const { getByText, queryByText } = render(
      <ActivityPicker
        visible={true}
        activities={[activityWithoutCategory]}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Task')).toBeTruthy();
  });

  it('should display activity without color', () => {
    const activityWithoutColor: Activity = {
      id: '5',
      name: 'Task',
      category: 'Work',
      active: true,
      createdAt: Date.now(),
    };

    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={[activityWithoutColor]}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Task')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
  });

  it('should handle rapid selection', () => {
    const { getByText } = render(
      <ActivityPicker
        visible={true}
        activities={mockActivities}
        onSelectActivity={mockOnSelectActivity}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Coding'));
    fireEvent.press(getByText('Exercise'));

    // Should only register first press
    expect(mockOnSelectActivity).toHaveBeenCalledTimes(2);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
