import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '@/app/(tabs)/settings';

// Mock the hooks
jest.mock('@/hooks/use-activities', () => ({
  useActivityTypes: () => ({
    activityTypes: [],
    activeActivityTypes: [],
    inactiveActivityTypes: [],
    loading: false,
    createActivityType: jest.fn(),
    updateActivityType: jest.fn(),
    deleteActivityType: jest.fn(),
    deactivateActivityType: jest.fn(),
    reactivateActivityType: jest.fn(),
    createDefaultActivityTypes: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-behaviors');

jest.mock('@/hooks/use-reflections', () => ({
  useReflectionQuestions: () => ({
    questions: [],
    activeQuestions: [],
    inactiveQuestions: [],
    loading: false,
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    deactivateQuestion: jest.fn(),
    reactivateQuestion: jest.fn(),
    createDefaultQuestions: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('SettingsScreen - Behavior Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render behaviors section', () => {
    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Behaviors')).toBeTruthy();
  });

  it('should display empty state when no behaviors exist', () => {
    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('No behaviors yet. Tap + to create one.')).toBeTruthy();
    expect(getByText('Create Default Behaviors')).toBeTruthy();
  });

  it('should display active behaviors', () => {
    const mockBehaviors = [
      {
        id: '1',
        name: 'Pushups',
        type: 'reps' as const,
        units: 'reps',
        active: true,
        createdAt: Date.now(),
      },
      {
        id: '2',
        name: 'Meditation',
        type: 'duration' as const,
        units: 'minutes',
        active: true,
        createdAt: Date.now(),
      },
    ];

    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: mockBehaviors,
      activeBehaviors: mockBehaviors,
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Pushups')).toBeTruthy();
    expect(getByText('Meditation')).toBeTruthy();
    expect(getByText('Reps • reps')).toBeTruthy();
    expect(getByText('Duration • minutes')).toBeTruthy();
  });

  it('should display inactive behaviors separately', () => {
    const activeBehavior = {
      id: '1',
      name: 'Pushups',
      type: 'reps' as const,
      units: 'reps',
      active: true,
      createdAt: Date.now(),
    };

    const inactiveBehavior = {
      id: '2',
      name: 'Meditation',
      type: 'duration' as const,
      units: 'minutes',
      active: false,
      createdAt: Date.now(),
      deactivatedAt: Date.now(),
    };

    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [activeBehavior, inactiveBehavior],
      activeBehaviors: [activeBehavior],
      inactiveBehaviors: [inactiveBehavior],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Active Behaviors')).toBeTruthy();
    expect(getByText('Inactive Behaviors')).toBeTruthy();
  });

  it('should open create behavior form when + button is pressed', async () => {
    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getAllByTestId, getByPlaceholderText } = render(<SettingsScreen />);

    // Get all plus buttons (one for activities, one for behaviors)
    const addButtons = getAllByTestId('icon-plus');
    const behaviorsAddButton = addButtons[1]; // Second plus button is for behaviors

    fireEvent.press(behaviorsAddButton);

    await waitFor(() => {
      expect(getByPlaceholderText('Enter behavior name')).toBeTruthy();
    });
  });

  it('should create a new behavior', async () => {
    const mockCreateBehavior = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Pushups',
      type: 'reps',
      units: 'reps',
      active: true,
      createdAt: Date.now(),
    });

    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: mockCreateBehavior,
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getAllByTestId, getByPlaceholderText, getByText } = render(<SettingsScreen />);

    // Open form
    const addButtons = getAllByTestId('icon-plus');
    fireEvent.press(addButtons[1]);

    await waitFor(() => {
      expect(getByPlaceholderText('Enter behavior name')).toBeTruthy();
    });

    // Fill in form
    const nameInput = getByPlaceholderText('Enter behavior name');
    fireEvent.changeText(nameInput, 'Pushups');

    // Save
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateBehavior).toHaveBeenCalledWith({
        name: 'Pushups',
        type: 'reps',
        units: 'reps',
      });
    });
  });

  it('should show error when creating behavior without name', async () => {
    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getAllByTestId, getByText } = render(<SettingsScreen />);

    // Open form
    const addButtons = getAllByTestId('icon-plus');
    fireEvent.press(addButtons[1]);

    await waitFor(() => {
      expect(getByText('New Behavior')).toBeTruthy();
    });

    // Try to save without entering name
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Behavior name is required');
    });
  });

  it('should update units when behavior type changes', async () => {
    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getAllByTestId, getByText } = render(<SettingsScreen />);

    // Open form
    const addButtons = getAllByTestId('icon-plus');
    fireEvent.press(addButtons[1]);

    await waitFor(() => {
      expect(getByText('New Behavior')).toBeTruthy();
    });

    // Change type to duration
    const durationButton = getByText('Duration');
    fireEvent.press(durationButton);

    // Check that units changed to minutes (first option for duration)
    await waitFor(() => {
      expect(getByText('minutes')).toBeTruthy();
    });
  });

  it('should delete behavior with confirmation', async () => {
    const mockDeleteBehavior = jest.fn();
    const mockBehavior = {
      id: '1',
      name: 'Pushups',
      type: 'reps' as const,
      units: 'reps',
      active: true,
      createdAt: Date.now(),
    };

    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [mockBehavior],
      activeBehaviors: [mockBehavior],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: mockDeleteBehavior,
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getByTestId } = render(<SettingsScreen />);

    // Click delete button
    const deleteButton = getByTestId('delete-behavior-1');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Behavior',
        'Are you sure you want to delete "Pushups"? This will also delete all associated logs.',
        expect.any(Array)
      );
    });
  });

  it('should toggle behavior active status', async () => {
    const mockDeactivateBehavior = jest.fn();
    const mockBehavior = {
      id: '1',
      name: 'Pushups',
      type: 'reps' as const,
      units: 'reps',
      active: true,
      createdAt: Date.now(),
    };

    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [mockBehavior],
      activeBehaviors: [mockBehavior],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: mockDeactivateBehavior,
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: jest.fn(),
    });

    const { getAllByText } = render(<SettingsScreen />);

    // Click Active button
    const activeButtons = getAllByText('Active');
    const behaviorActiveButton = activeButtons[activeButtons.length - 1]; // Last Active button
    fireEvent.press(behaviorActiveButton);

    await waitFor(() => {
      expect(mockDeactivateBehavior).toHaveBeenCalledWith('1');
    });
  });

  it('should create default behaviors', async () => {
    const mockCreateDefaultBehaviors = jest.fn();

    const mockUseBehaviors = require('@/hooks/use-behaviors').useBehaviors;
    mockUseBehaviors.mockReturnValue({
      behaviors: [],
      activeBehaviors: [],
      inactiveBehaviors: [],
      loading: false,
      createBehavior: jest.fn(),
      updateBehavior: jest.fn(),
      deleteBehavior: jest.fn(),
      deactivateBehavior: jest.fn(),
      reactivateBehavior: jest.fn(),
      createDefaultBehaviors: mockCreateDefaultBehaviors,
    });

    const { getByText } = render(<SettingsScreen />);

    const createDefaultButton = getByText('Create Default Behaviors');
    fireEvent.press(createDefaultButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Create Default Behaviors',
        'This will create 8 sample behaviors to help you get started. You can edit or delete them later.',
        expect.any(Array)
      );
    });
  });
});
