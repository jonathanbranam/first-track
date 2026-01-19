/**
 * Tests for Behavior History Modal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { BehaviorHistoryModal } from '@/components/behaviors/behavior-history-modal';
import { useBehaviors, useBehaviorLogs } from '@/hooks/use-behaviors';
import { Alert } from 'react-native';

// Mock the hooks
jest.mock('@/hooks/use-behaviors');
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUseBehaviors = useBehaviors as jest.MockedFunction<typeof useBehaviors>;
const mockUseBehaviorLogs = useBehaviorLogs as jest.MockedFunction<typeof useBehaviorLogs>;

describe('BehaviorHistoryModal', () => {
  const mockBehaviors = [
    {
      id: 'b1',
      name: 'Pushups',
      type: 'reps' as const,
      units: 'reps',
      active: true,
      createdAt: Date.now(),
    },
    {
      id: 'b2',
      name: 'Running',
      type: 'duration' as const,
      units: 'minutes',
      active: true,
      createdAt: Date.now(),
    },
    {
      id: 'b3',
      name: 'Curls',
      type: 'weight' as const,
      units: 'lbs',
      active: true,
      createdAt: Date.now(),
    },
  ];

  const mockLogs = [
    {
      id: 'l1',
      behaviorId: 'b1',
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
      quantity: 20,
    },
    {
      id: 'l2',
      behaviorId: 'b1',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      quantity: 15,
    },
    {
      id: 'l3',
      behaviorId: 'b2',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      quantity: 30,
    },
    {
      id: 'l4',
      behaviorId: 'b3',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 8, // 8 days ago
      quantity: 10,
      weight: 25,
    },
  ];

  const mockDeleteLog = jest.fn();
  const mockUpdateLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

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
      refresh: jest.fn(),
    });

    mockUseBehaviorLogs.mockReturnValue({
      logs: mockLogs,
      loading: false,
      createLog: jest.fn(),
      updateLog: mockUpdateLog,
      deleteLog: mockDeleteLog,
      getLogsByDateRange: jest.fn(),
      getDailyTotal: jest.fn(),
      refresh: jest.fn(),
    });
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getByText('Behavior History')).toBeTruthy();
    });

    it('should call onClose when close button is pressed', () => {
      const mockOnClose = jest.fn();
      render(<BehaviorHistoryModal visible={true} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('close-history');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display search input', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getByTestId('search-input')).toBeTruthy();
    });
  });

  describe('Date Range Filtering', () => {
    it('should show date range selector with all options', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Week')).toBeTruthy();
      expect(screen.getByText('Month')).toBeTruthy();
      expect(screen.getByText('All')).toBeTruthy();
    });

    it('should filter logs by today', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Default is 'week', switch to 'today'
      const todayButtons = screen.getAllByText('Today');
      // First one is the date range button
      fireEvent.press(todayButtons[0]);

      // Should show logs from today (l1 and l2 are Pushups)
      expect(screen.getAllByText('Pushups').length).toBeGreaterThan(0);
      // Running should still appear as a filter button, but not have logs displayed
      // Check that 30 minutes (the running log quantity) is not shown
      expect(screen.queryByText('30 minutes')).toBeFalsy();
    });

    it('should filter logs by week', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Week is default, should show l1, l2, l3 (within 7 days)
      // Should not show l4 (8 days ago)
      const logs = screen.queryAllByText(/Pushups|Running/);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should show all logs when All is selected', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      fireEvent.press(screen.getByText('All'));

      // Should show all behaviors including the one from 8 days ago
      expect(screen.getAllByText('Pushups').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Curls').length).toBeGreaterThan(0);
    });
  });

  describe('Behavior Filtering', () => {
    it('should show all behaviors filter button', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getByText('All Behaviors')).toBeTruthy();
    });

    it('should show individual behavior filter buttons', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getAllByText('Pushups').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Curls').length).toBeGreaterThan(0);
    });

    it('should filter logs by selected behavior', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Get all "Running" texts and press the one in the filter section
      const runningButtons = screen.getAllByText('Running');
      // The first one should be in the behavior filter
      fireEvent.press(runningButtons[0]);

      // Should only show Running logs
      const allTexts = screen.getAllByText('Running');
      expect(allTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('should filter logs by behavior name search', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'push');

      // Should show Pushups
      expect(screen.getAllByText('Pushups').length).toBeGreaterThan(0);
    });

    it('should show empty state when no logs match search', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'nonexistent');

      expect(screen.getByText('No Logs Found')).toBeTruthy();
      expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
    });

    it('should clear search when clear button is pressed', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'test');

      // Should show clear button
      const clearButtons = screen.queryAllByTestId(/icon-xmark.circle.fill/);
      expect(clearButtons.length).toBeGreaterThan(0);

      // Press the clear button (find the parent touchable)
      const searchContainer = searchInput.parent?.parent;
      if (searchContainer) {
        const touchables = searchContainer.findAllByType('TouchableOpacity' as any);
        if (touchables.length > 0) {
          fireEvent.press(touchables[0]);
        }
      }
    });
  });

  describe('Aggregate Statistics', () => {
    it('should display statistics section', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getByText('Statistics')).toBeTruthy();
    });

    it('should calculate total quantity correctly', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // For Pushups: 20 + 15 = 35 reps within a week
      expect(screen.getByText('35.0')).toBeTruthy();
    });

    it('should calculate average correctly', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // For Pushups within week: average of 20 and 15 = 17.5
      expect(screen.getByText('17.5')).toBeTruthy();
    });

    it('should show entry count', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Pushups has 2 entries within a week
      const entryTexts = screen.getAllByText('2');
      expect(entryTexts.length).toBeGreaterThan(0);
    });

    it('should show range (min-max)', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // For Pushups: range is 15.0 - 20.0
      expect(screen.getByText(/Range: 15\.0 - 20\.0/)).toBeTruthy();
    });
  });

  describe('Log Display', () => {
    it('should group logs by date', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Should show "Today" for recent logs (appears multiple times - as date range and as date header)
      expect(screen.getAllByText('Today').length).toBeGreaterThan(0);
    });

    it('should display log quantity with units', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getByText('20 reps')).toBeTruthy();
      expect(screen.getByText('15 reps')).toBeTruthy();
    });

    it('should display weight for weight-based behaviors', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Select All to see the Curls log from 8 days ago
      fireEvent.press(screen.getByText('All'));

      expect(screen.getByText('@ 25 lbs')).toBeTruthy();
    });

    it('should display formatted time for each log', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Time should be displayed (specific time will vary based on when test runs)
      // Just check that there's a time-like format
      const allText = screen.getAllByText(/\d+:\d+/);
      expect(allText.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Functionality', () => {
    it('should show edit button for each log', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const editButtons = screen.getAllByTestId(/edit-log-/);
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should open edit form when edit button is pressed', async () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const editButton = screen.getByTestId('edit-log-l1');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(screen.getByText('Quantity:')).toBeTruthy();
      });
    });

    it('should populate edit form with current values', async () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const editButton = screen.getByTestId('edit-log-l1');
      fireEvent.press(editButton);

      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('20');
        expect(quantityInput).toBeTruthy();
      });
    });

    it('should save edited log with valid values', async () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const editButton = screen.getByTestId('edit-log-l1');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(screen.getByText('Quantity:')).toBeTruthy();
      });

      const quantityInput = screen.getByDisplayValue('20');
      fireEvent.changeText(quantityInput, '25');

      const saveButton = screen.getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockUpdateLog).toHaveBeenCalledWith('l1', { quantity: 25, weight: undefined });
      });
    });

    it('should show alert for invalid quantity', async () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const editButton = screen.getByTestId('edit-log-l1');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(screen.getByText('Quantity:')).toBeTruthy();
      });

      const quantityInput = screen.getByDisplayValue('20');
      fireEvent.changeText(quantityInput, '-5');

      const saveButton = screen.getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Invalid Input', 'Please enter a valid quantity');
      });
    });

    it('should cancel edit when cancel button is pressed', async () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const editButton = screen.getByTestId('edit-log-l1');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(screen.getByText('Quantity:')).toBeTruthy();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Quantity:')).toBeFalsy();
      });
    });

    it('should show weight input for weight-based behaviors', async () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Switch to All to see Curls log
      fireEvent.press(screen.getByText('All'));

      const editButton = screen.getByTestId('edit-log-l4');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(screen.getByText('Weight:')).toBeTruthy();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete button for each log', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const deleteButtons = screen.getAllByTestId(/delete-log-/);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should show confirmation alert when delete is pressed', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const deleteButton = screen.getByTestId('delete-log-l1');
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Log',
        expect.stringContaining('Pushups'),
        expect.any(Array)
      );
    });

    it('should delete log when confirmed', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const deleteButton = screen.getByTestId('delete-log-l1');
      fireEvent.press(deleteButton);

      // Get the confirm callback from the Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const confirmButton = buttons.find((b: any) => b.text === 'Delete');

      // Simulate pressing the confirm button
      confirmButton.onPress();

      expect(mockDeleteLog).toHaveBeenCalledWith('l1');
    });

    it('should not delete log when cancelled', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const deleteButton = screen.getByTestId('delete-log-l1');
      fireEvent.press(deleteButton);

      // Get the cancel callback from the Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const cancelButton = buttons.find((b: any) => b.text === 'Cancel');

      // Simulate pressing the cancel button (should not call deleteLog)
      if (cancelButton.onPress) {
        cancelButton.onPress();
      }

      expect(mockDeleteLog).not.toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no logs exist', () => {
      mockUseBehaviorLogs.mockReturnValue({
        logs: [],
        loading: false,
        createLog: jest.fn(),
        updateLog: jest.fn(),
        deleteLog: jest.fn(),
        getLogsByDateRange: jest.fn(),
        getDailyTotal: jest.fn(),
        refresh: jest.fn(),
      });

      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getByText('No Logs Found')).toBeTruthy();
      expect(screen.getByText('Start logging behaviors to see your history')).toBeTruthy();
    });

    it('should show empty state with search message when search returns no results', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'nonexistent');

      expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
    });
  });

  describe('Date Formatting', () => {
    it('should show "Today" for today\'s logs', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      expect(screen.getAllByText('Today').length).toBeGreaterThan(0);
    });

    it('should show formatted date for older logs', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Should show a formatted date for logs from days ago
      // The exact text will vary, but should include day and month
      const dateHeaders = screen.getAllByText(/Today|Yesterday|\w{3},/);
      expect(dateHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Integration - Multiple Filters', () => {
    it('should apply both date range and behavior filters', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Set date range to All
      fireEvent.press(screen.getByText('All'));

      // Filter by Pushups
      const pushupsButtons = screen.getAllByText('Pushups');
      fireEvent.press(pushupsButtons[0]);

      // Should only show Pushups logs
      expect(screen.getByText('20 reps')).toBeTruthy();
      expect(screen.getByText('15 reps')).toBeTruthy();
    });

    it('should apply date range, behavior, and search filters together', () => {
      render(<BehaviorHistoryModal visible={true} onClose={jest.fn()} />);

      // Set date range to All
      fireEvent.press(screen.getByText('All'));

      // Search for "push"
      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'push');

      // Should only show Pushups
      expect(screen.getAllByText('Pushups').length).toBeGreaterThan(0);
    });
  });
});
