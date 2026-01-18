import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useBehaviors, useBehaviorLogs } from '@/hooks/use-behaviors';
import { Behavior, BehaviorLog } from '@/types/behavior';

describe('Behavior Hooks', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('useBehaviors', () => {
    it('should start with empty behaviors list', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.behaviors).toEqual([]);
      expect(result.current.activeBehaviors).toEqual([]);
    });

    it('should create a new behavior', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdBehavior: Behavior | undefined;
      await act(async () => {
        createdBehavior = await result.current.createBehavior({
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
        });
      });

      expect(createdBehavior).toBeDefined();
      expect(createdBehavior?.name).toBe('Pushups');
      expect(createdBehavior?.type).toBe('reps');
      expect(createdBehavior?.units).toBe('reps');
      expect(createdBehavior?.active).toBe(true);
      expect(createdBehavior?.id).toBeDefined();
      expect(createdBehavior?.createdAt).toBeDefined();

      await waitFor(() => {
        expect(result.current.behaviors).toHaveLength(1);
        expect(result.current.behaviors[0].name).toBe('Pushups');
      });
    });

    it('should create behaviors with different types', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create reps-based behavior
      await act(async () => {
        await result.current.createBehavior({
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
        });
      });

      await waitFor(() => {
        expect(result.current.behaviors).toHaveLength(1);
      });

      // Create duration-based behavior
      await act(async () => {
        await result.current.createBehavior({
          name: 'Meditation',
          type: 'duration',
          units: 'minutes',
        });
      });

      await waitFor(() => {
        expect(result.current.behaviors).toHaveLength(2);
      });

      // Create weight-based behavior
      await act(async () => {
        await result.current.createBehavior({
          name: 'Curls',
          type: 'weight',
          units: 'lbs',
        });
      });

      await waitFor(() => {
        expect(result.current.behaviors).toHaveLength(3);
      });

      // Create count-based behavior
      await act(async () => {
        await result.current.createBehavior({
          name: 'Water Intake',
          type: 'count',
          units: 'glasses',
        });
      });

      await waitFor(() => {
        expect(result.current.behaviors).toHaveLength(4);
        expect(result.current.behaviors.find((b) => b.name === 'Pushups')?.type).toBe('reps');
        expect(result.current.behaviors.find((b) => b.name === 'Meditation')?.type).toBe('duration');
        expect(result.current.behaviors.find((b) => b.name === 'Curls')?.type).toBe('weight');
        expect(result.current.behaviors.find((b) => b.name === 'Water Intake')?.type).toBe('count');
      });
    });

    it('should update an existing behavior', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let behaviorId: string = '';
      await act(async () => {
        const behavior = await result.current.createBehavior({
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
        });
        behaviorId = behavior.id;
      });

      await act(async () => {
        await result.current.updateBehavior(behaviorId, {
          name: 'Modified Pushups',
          units: 'sets',
        });
      });

      await waitFor(() => {
        const updatedBehavior = result.current.behaviors.find((b) => b.id === behaviorId);
        expect(updatedBehavior?.name).toBe('Modified Pushups');
        expect(updatedBehavior?.units).toBe('sets');
        expect(updatedBehavior?.type).toBe('reps'); // Type should remain unchanged
      });
    });

    it('should deactivate a behavior', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let behaviorId: string = '';
      await act(async () => {
        const behavior = await result.current.createBehavior({
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
        });
        behaviorId = behavior.id;
      });

      await act(async () => {
        await result.current.deactivateBehavior(behaviorId);
      });

      await waitFor(() => {
        expect(result.current.activeBehaviors).toHaveLength(0);
        expect(result.current.inactiveBehaviors).toHaveLength(1);
        const deactivated = result.current.inactiveBehaviors[0];
        expect(deactivated.active).toBe(false);
        expect(deactivated.deactivatedAt).toBeDefined();
      });
    });

    it('should reactivate a behavior', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let behaviorId: string = '';
      await act(async () => {
        const behavior = await result.current.createBehavior({
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
        });
        behaviorId = behavior.id;
      });

      await act(async () => {
        await result.current.deactivateBehavior(behaviorId);
      });

      await act(async () => {
        await result.current.reactivateBehavior(behaviorId);
      });

      await waitFor(() => {
        expect(result.current.activeBehaviors).toHaveLength(1);
        expect(result.current.inactiveBehaviors).toHaveLength(0);
        const reactivated = result.current.activeBehaviors[0];
        expect(reactivated.active).toBe(true);
        expect(reactivated.deactivatedAt).toBeUndefined();
      });
    });

    it('should delete a behavior', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let behaviorId: string = '';
      await act(async () => {
        const behavior = await result.current.createBehavior({
          name: 'Pushups',
          type: 'reps',
          units: 'reps',
        });
        behaviorId = behavior.id;
      });

      await act(async () => {
        await result.current.deleteBehavior(behaviorId);
      });

      await waitFor(() => {
        expect(result.current.behaviors).toHaveLength(0);
      });

      // Verify it's actually deleted from storage
      const stored = await AsyncStorage.getItem(`behavior-${behaviorId}`);
      expect(stored).toBeNull();
    });

    it('should load existing behaviors from storage', async () => {
      const behavior1: Behavior = {
        id: '1',
        name: 'Pushups',
        type: 'reps',
        units: 'reps',
        active: true,
        createdAt: Date.now(),
      };
      const behavior2: Behavior = {
        id: '2',
        name: 'Meditation',
        type: 'duration',
        units: 'minutes',
        active: true,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('behaviors-all', JSON.stringify(['1', '2']));
      await AsyncStorage.setItem('behavior-1', JSON.stringify(behavior1));
      await AsyncStorage.setItem('behavior-2', JSON.stringify(behavior2));

      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.behaviors).toHaveLength(2);
      expect(result.current.behaviors[0].name).toBe('Pushups');
      expect(result.current.behaviors[1].name).toBe('Meditation');
    });

    it('should create default behaviors', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call createDefaultBehaviors
      await act(async () => {
        await result.current.createDefaultBehaviors();
      });

      // Give time for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Manually refresh to load all behaviors from storage
      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify that default behaviors were created by checking storage directly
      const stored = await AsyncStorage.getItem('behaviors-all');
      expect(stored).not.toBeNull();
      const behaviorIds = JSON.parse(stored!);
      expect(behaviorIds.length).toBeGreaterThanOrEqual(8);

      // Verify some specific behaviors exist in the loaded list
      await waitFor(() => {
        expect(result.current.behaviors.length).toBeGreaterThanOrEqual(8);
      });
    }, 15000);

    it('should throw error when updating non-existent behavior', async () => {
      const { result } = renderHook(() => useBehaviors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateBehavior('non-existent-id', { name: 'New Name' });
        });
      }).rejects.toThrow('Behavior not found');
    });
  });

  describe('useBehaviorLogs', () => {
    it('should start with empty logs list', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toEqual([]);
    });

    it('should create a new behavior log', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const timestamp = Date.now();
      let createdLog: BehaviorLog | undefined;
      await act(async () => {
        createdLog = await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp,
          quantity: 15,
          notes: 'Morning set',
        });
      });

      expect(createdLog).toBeDefined();
      expect(createdLog?.behaviorId).toBe('behavior-1');
      expect(createdLog?.quantity).toBe(15);
      expect(createdLog?.timestamp).toBe(timestamp);
      expect(createdLog?.notes).toBe('Morning set');
      expect(createdLog?.id).toBeDefined();

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(1);
      });
    });

    it('should create behavior log with weight', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdLog: BehaviorLog | undefined;
      await act(async () => {
        createdLog = await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: Date.now(),
          quantity: 10,
          weight: 25,
          notes: 'Curls with 25 lbs',
        });
      });

      expect(createdLog).toBeDefined();
      expect(createdLog?.quantity).toBe(10);
      expect(createdLog?.weight).toBe(25);

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(1);
        expect(result.current.logs[0].weight).toBe(25);
      });
    });

    it('should update an existing log', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let logId: string = '';
      await act(async () => {
        const log = await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: Date.now(),
          quantity: 15,
        });
        logId = log.id;
      });

      await act(async () => {
        await result.current.updateLog(logId, {
          quantity: 20,
          notes: 'Updated quantity',
        });
      });

      await waitFor(() => {
        const updatedLog = result.current.logs.find((l) => l.id === logId);
        expect(updatedLog?.quantity).toBe(20);
        expect(updatedLog?.notes).toBe('Updated quantity');
      });
    });

    it('should delete a behavior log', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let logId: string = '';
      await act(async () => {
        const log = await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: Date.now(),
          quantity: 15,
        });
        logId = log.id;
      });

      await act(async () => {
        await result.current.deleteLog(logId);
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(0);
      });

      // Verify it's deleted from storage
      const stored = await AsyncStorage.getItem(`behavior-log-${logId}`);
      expect(stored).toBeNull();
    });

    it('should filter logs by date range', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      // Create logs at different times
      await act(async () => {
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: twoDaysAgo,
          quantity: 10,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: yesterday,
          quantity: 15,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: now,
          quantity: 20,
        });
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(3);
      });

      // Get logs from yesterday onwards
      const recentLogs = result.current.getLogsByDateRange(yesterday - 1000, now + 1000);
      expect(recentLogs).toHaveLength(2);
      expect(recentLogs.some((l) => l.quantity === 15)).toBe(true);
      expect(recentLogs.some((l) => l.quantity === 20)).toBe(true);
    });

    it('should calculate daily total for a behavior', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const morning = today.getTime();

      today.setHours(14, 0, 0, 0);
      const afternoon = today.getTime();

      today.setHours(18, 0, 0, 0);
      const evening = today.getTime();

      // Create multiple logs for the same behavior on the same day
      await act(async () => {
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: morning,
          quantity: 15,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: afternoon,
          quantity: 20,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: evening,
          quantity: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(3);
      });

      const dailyTotal = result.current.getDailyTotal('behavior-1', today);
      expect(dailyTotal).toBe(45); // 15 + 20 + 10
    });

    it('should calculate daily total only for specified behavior', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(10, 0, 0, 0);

      // Create logs for different behaviors
      await act(async () => {
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: today.getTime(),
          quantity: 15,
        });
        await result.current.createLog({
          behaviorId: 'behavior-2',
          timestamp: today.getTime(),
          quantity: 20,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: today.getTime(),
          quantity: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(3);
      });

      const behavior1Total = result.current.getDailyTotal('behavior-1', today);
      const behavior2Total = result.current.getDailyTotal('behavior-2', today);

      expect(behavior1Total).toBe(25); // 15 + 10
      expect(behavior2Total).toBe(20);
    });

    it('should calculate daily total for different days separately', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayTimestamp = yesterday.getTime();

      // Create logs for different days
      await act(async () => {
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: yesterdayTimestamp,
          quantity: 30,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: todayTimestamp,
          quantity: 15,
        });
        await result.current.createLog({
          behaviorId: 'behavior-1',
          timestamp: todayTimestamp,
          quantity: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(3);
      });

      const todayTotal = result.current.getDailyTotal('behavior-1', today);
      const yesterdayTotal = result.current.getDailyTotal('behavior-1', yesterday);

      expect(todayTotal).toBe(25); // 15 + 10
      expect(yesterdayTotal).toBe(30);
    });

    it('should load existing logs from storage', async () => {
      const log1: BehaviorLog = {
        id: '1',
        behaviorId: 'behavior-1',
        timestamp: Date.now(),
        quantity: 15,
      };
      const log2: BehaviorLog = {
        id: '2',
        behaviorId: 'behavior-1',
        timestamp: Date.now(),
        quantity: 20,
        weight: 25,
      };

      await AsyncStorage.setItem('behavior-logs-all', JSON.stringify(['1', '2']));
      await AsyncStorage.setItem('behavior-log-1', JSON.stringify(log1));
      await AsyncStorage.setItem('behavior-log-2', JSON.stringify(log2));

      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0].quantity).toBe(15);
      expect(result.current.logs[1].quantity).toBe(20);
      expect(result.current.logs[1].weight).toBe(25);
    });

    it('should throw error when updating non-existent log', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateLog('non-existent-id', { quantity: 10 });
        });
      }).rejects.toThrow('Behavior log not found');
    });

    it('should handle creating multiple logs in quick succession', async () => {
      const { result } = renderHook(() => useBehaviorLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create multiple logs quickly
      await act(async () => {
        await Promise.all([
          result.current.createLog({
            behaviorId: 'behavior-1',
            timestamp: Date.now(),
            quantity: 10,
          }),
          result.current.createLog({
            behaviorId: 'behavior-1',
            timestamp: Date.now(),
            quantity: 15,
          }),
          result.current.createLog({
            behaviorId: 'behavior-1',
            timestamp: Date.now(),
            quantity: 20,
          }),
        ]);
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(3);
      });
    });
  });
});
