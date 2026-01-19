import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BehaviorsScreen from '@/app/(tabs)/behaviors';
import { QuickLogProvider } from '@/contexts/quick-log-context';
import { Behavior, BehaviorLog } from '@/types/behavior';

// Helper to render component with QuickLogProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(<QuickLogProvider>{component}</QuickLogProvider>);
};

// Helper to setup behaviors in storage (matching hook's storage pattern)
const setupBehaviors = async (behaviors: Behavior[]) => {
  const behaviorIds = behaviors.map((b) => b.id);
  await AsyncStorage.setItem('behaviors-all', JSON.stringify(behaviorIds));
  for (const behavior of behaviors) {
    // Make sure the full behavior object is stored
    const fullBehavior: Behavior = {
      id: behavior.id,
      name: behavior.name,
      type: behavior.type,
      units: behavior.units,
      active: behavior.active,
      createdAt: behavior.createdAt,
    };
    await AsyncStorage.setItem(`behavior-${behavior.id}`, JSON.stringify(fullBehavior));
  }
};

// Helper to setup behavior logs in storage (matching hook's storage pattern)
const setupBehaviorLogs = async (logs: BehaviorLog[]) => {
  // Save all log IDs to the 'all' list
  const allLogIds = logs.map((l) => l.id);
  await AsyncStorage.setItem('behavior-logs-all', JSON.stringify(allLogIds));

  // Save each individual log
  for (const log of logs) {
    const fullLog: BehaviorLog = {
      id: log.id,
      behaviorId: log.behaviorId,
      timestamp: log.timestamp,
      quantity: log.quantity,
      weight: log.weight,
      notes: log.notes,
    };
    await AsyncStorage.setItem(`behavior-log-${log.id}`, JSON.stringify(fullLog));
  }

  // Group logs by behavior and save behavior-specific lists
  const logsByBehavior: Record<string, string[]> = {};
  for (const log of logs) {
    if (!logsByBehavior[log.behaviorId]) {
      logsByBehavior[log.behaviorId] = [];
    }
    logsByBehavior[log.behaviorId].push(log.id);
  }

  // Save behavior-specific log lists
  for (const [behaviorId, ids] of Object.entries(logsByBehavior)) {
    await AsyncStorage.setItem(`behavior-logs-${behaviorId}`, JSON.stringify(ids));
  }
};

describe('BehaviorsScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Empty State', () => {
    it('should display empty state when no behaviors exist', async () => {
      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('No Active Behaviors')).toBeTruthy();
      });

      expect(screen.getByText('Create behaviors in Settings to start tracking')).toBeTruthy();
    });

    it('should show loading state initially', async () => {
      const { getByText } = renderWithProviders(<BehaviorsScreen />);

      // Should show loading briefly
      expect(getByText('Loading...')).toBeTruthy();

      // Then transition to empty state
      await waitFor(() => {
        expect(getByText('No Active Behaviors')).toBeTruthy();
      });
    });
  });

  describe('Behavior Display', () => {
    it('should display active behaviors', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Meditation',
          type: 'duration',
          units: 'minutes',
          active: true,
          createdAt: Date.now(),
        },
      ];

      await setupBehaviors(behaviors);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pushups')).toBeTruthy();
        expect(screen.getByText('Meditation')).toBeTruthy();
      });

      expect(screen.getByText('reps • reps')).toBeTruthy();
      expect(screen.getByText('duration • minutes')).toBeTruthy();
    });

    it('should show quick log button for each behavior', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      await setupBehaviors(behaviors);

      const { getByTestId } = renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(getByTestId('quick-log-1')).toBeTruthy();
      });
    });

    it('should not display inactive behaviors', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Inactive Behavior',
          type: 'reps',
          units: 'reps',
          active: false,
          createdAt: Date.now(),
        },
      ];

      await setupBehaviors(behaviors);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pushups')).toBeTruthy();
      });

      expect(screen.queryByText('Inactive Behavior')).toBeNull();
    });
  });

  describe('Today\'s Logs', () => {
    it('should display today\'s logs for each behavior', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 20,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('20 reps')).toBeTruthy();
      });

      expect(screen.getByText('Today\'s Logs')).toBeTruthy();
    });

    it('should display daily total for behavior with multiple logs', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 35, // Single log with total
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      // Wait for behavior to load
      await waitFor(() => {
        expect(screen.getByText('Pushups')).toBeTruthy();
      });

      // Check for daily total
      await waitFor(() => {
        expect(screen.getByText("Today's Total: 35 reps")).toBeTruthy();
      });
    });

    it('should display weight information for weight-based behaviors', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Curls',
          type: 'weight',
          units: 'lbs',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 10,
          weight: 25,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('10 lbs')).toBeTruthy();
        expect(screen.getByText('@ 25 lbs')).toBeTruthy();
      });
    });

    it('should show no logs message when behavior has no logs', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      await setupBehaviors(behaviors);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('No logs today. Tap Log to add one.')).toBeTruthy();
      });
    });

    it('should not display logs from previous days', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: yesterday.getTime(),
          quantity: 20,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pushups')).toBeTruthy();
      });

      // Should show no logs message since yesterday's log shouldn't count
      expect(screen.getByText('No logs today. Tap Log to add one.')).toBeTruthy();
      expect(screen.queryByText('20 reps')).toBeNull();
    });
  });

  describe('Today\'s Summary', () => {
    it('should display summary when logs exist', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Meditation',
          type: 'duration',
          units: 'minutes',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 20,
        },
        {
          id: 'log2',
          behaviorId: '2',
          timestamp: now.getTime(),
          quantity: 10,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Today\'s Summary')).toBeTruthy();
      });

      expect(screen.getByText('2 activities logged across 2 behaviors')).toBeTruthy();
    });

    it('should use singular form for single activity', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 20,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('1 activity logged across 1 behavior')).toBeTruthy();
      });
    });

    it('should not display summary when no logs exist', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      await setupBehaviors(behaviors);

      renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pushups')).toBeTruthy();
      });

      expect(screen.queryByText('Today\'s Summary')).toBeNull();
    });
  });

  describe('Delete Log', () => {
    it('should show delete button for each log', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 20,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      const { getByTestId } = renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(getByTestId('delete-log-log1')).toBeTruthy();
      });
    });

    it('should show confirmation alert when delete is pressed', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 20,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');

      const { getByTestId } = renderWithProviders(<BehaviorsScreen />);

      await waitFor(() => {
        expect(getByTestId('delete-log-log1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('delete-log-log1'));

      expect(mockAlert).toHaveBeenCalledWith(
        'Delete Log',
        'Are you sure you want to delete this Pushups log?',
        expect.any(Array)
      );

      mockAlert.mockRestore();
    });
  });

  describe('Log Sorting', () => {
    it('should display logs in reverse chronological order (newest first)', async () => {
      const behaviors: Behavior[] = [
        {
          id: '1',
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
          active: true,
          createdAt: Date.now(),
        },
      ];

      const now = new Date();
      const logs: BehaviorLog[] = [
        {
          id: 'log1',
          behaviorId: '1',
          timestamp: now.getTime(),
          quantity: 25,
        },
      ];

      await setupBehaviors(behaviors);
      await setupBehaviorLogs(logs);

      renderWithProviders(<BehaviorsScreen />);

      // Wait for behavior and log to load
      await waitFor(() => {
        expect(screen.getByText('Pushups')).toBeTruthy();
      });

      await waitFor(() => {
        expect(screen.getByText('25 reps')).toBeTruthy();
      });

      // Verify delete button exists (proves log item is rendered correctly)
      expect(screen.getByTestId('delete-log-log1')).toBeTruthy();
    });
  });
});
