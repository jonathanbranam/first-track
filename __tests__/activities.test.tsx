import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useActivities,
  useActivityTypes,
  useActivityLogs,
  useActivitySession,
  useActivityInstances,
  getCurrentDayBoundary,
  isCurrentDay,
} from '@/hooks/use-activities';
import { Activity, ActivityType, ActivityLog, ActivityInstance } from '@/types/activity';

describe('Activity Hooks', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('useActivities', () => {
    it('should start with empty activities list', async () => {
      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toEqual([]);
      expect(result.current.activeActivities).toEqual([]);
    });

    it('should create a new activity', async () => {
      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdActivity: Activity | undefined;
      await act(async () => {
        createdActivity = await result.current.createActivity({
          name: 'Coding',
          category: 'work',
          color: '#FF6B6B',
        });
      });

      expect(createdActivity).toBeDefined();
      expect(createdActivity?.name).toBe('Coding');
      expect(createdActivity?.category).toBe('work');
      expect(createdActivity?.active).toBe(true);
      expect(createdActivity?.id).toBeDefined();
      expect(createdActivity?.createdAt).toBeDefined();

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(1);
        expect(result.current.activities[0].name).toBe('Coding');
      });
    });

    it('should update an activity', async () => {
      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let activityId: string = '';
      await act(async () => {
        const activity = await result.current.createActivity({
          name: 'Coding',
          category: 'work',
        });
        activityId = activity.id;
      });

      await act(async () => {
        await result.current.updateActivity(activityId, {
          name: 'Programming',
          category: 'personal',
        });
      });

      await waitFor(() => {
        const updatedActivity = result.current.activities.find((a) => a.id === activityId);
        expect(updatedActivity?.name).toBe('Programming');
        expect(updatedActivity?.category).toBe('personal');
      });
    });

    it('should deactivate an activity', async () => {
      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let activityId: string = '';
      await act(async () => {
        const activity = await result.current.createActivity({
          name: 'Coding',
        });
        activityId = activity.id;
      });

      await act(async () => {
        await result.current.deactivateActivity(activityId);
      });

      await waitFor(() => {
        expect(result.current.activeActivities).toHaveLength(0);
        expect(result.current.inactiveActivities).toHaveLength(1);
        const deactivated = result.current.inactiveActivities[0];
        expect(deactivated.active).toBe(false);
        expect(deactivated.deactivatedAt).toBeDefined();
      });
    });

    it('should reactivate an activity', async () => {
      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let activityId: string = '';
      await act(async () => {
        const activity = await result.current.createActivity({
          name: 'Coding',
        });
        activityId = activity.id;
      });

      await act(async () => {
        await result.current.deactivateActivity(activityId);
      });

      await act(async () => {
        await result.current.reactivateActivity(activityId);
      });

      await waitFor(() => {
        expect(result.current.activeActivities).toHaveLength(1);
        expect(result.current.inactiveActivities).toHaveLength(0);
        const reactivated = result.current.activeActivities[0];
        expect(reactivated.active).toBe(true);
        expect(reactivated.deactivatedAt).toBeUndefined();
      });
    });

    it('should delete an activity', async () => {
      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let activityId: string = '';
      await act(async () => {
        const activity = await result.current.createActivity({
          name: 'Coding',
        });
        activityId = activity.id;
      });

      await act(async () => {
        await result.current.deleteActivity(activityId);
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(0);
      });

      // Verify it's actually deleted from storage
      const stored = await AsyncStorage.getItem(`activity-${activityId}`);
      expect(stored).toBeNull();
    });

    it('should load existing activities from storage', async () => {
      const activity1: Activity = {
        id: '1',
        name: 'Coding',
        category: 'work',
        active: true,
        createdAt: Date.now(),
      };
      const activity2: Activity = {
        id: '2',
        name: 'Exercise',
        category: 'personal',
        active: true,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('activities-all', JSON.stringify(['1', '2']));
      await AsyncStorage.setItem('activity-1', JSON.stringify(activity1));
      await AsyncStorage.setItem('activity-2', JSON.stringify(activity2));

      const { result } = renderHook(() => useActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toHaveLength(2);
      expect(result.current.activities[0].name).toBe('Coding');
      expect(result.current.activities[1].name).toBe('Exercise');
    });
  });

  describe('useActivityLogs', () => {
    it('should start with empty logs list', async () => {
      const { result } = renderHook(() => useActivityLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.logs).toEqual([]);
    });

    it('should create a new activity log', async () => {
      const { result } = renderHook(() => useActivityLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdLog: ActivityLog | undefined;
      await act(async () => {
        createdLog = await result.current.createLog({
          activityId: 'activity-1',
          startTime: Date.now(),
          duration: 3600000, // 1 hour
          pauseIntervals: [],
        });
      });

      expect(createdLog).toBeDefined();
      expect(createdLog?.activityId).toBe('activity-1');
      expect(createdLog?.duration).toBe(3600000);
      expect(createdLog?.id).toBeDefined();

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(1);
      });
    });

    it('should update an activity log', async () => {
      const { result } = renderHook(() => useActivityLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let logId: string = '';
      await act(async () => {
        const log = await result.current.createLog({
          activityId: 'activity-1',
          startTime: Date.now(),
          duration: 3600000,
          pauseIntervals: [],
        });
        logId = log.id;
      });

      await act(async () => {
        await result.current.updateLog(logId, {
          duration: 7200000, // 2 hours
          notes: 'Updated log',
        });
      });

      await waitFor(() => {
        const updatedLog = result.current.logs.find((l) => l.id === logId);
        expect(updatedLog?.duration).toBe(7200000);
        expect(updatedLog?.notes).toBe('Updated log');
      });
    });

    it('should delete an activity log', async () => {
      const { result } = renderHook(() => useActivityLogs());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let logId: string = '';
      await act(async () => {
        const log = await result.current.createLog({
          activityId: 'activity-1',
          startTime: Date.now(),
          duration: 3600000,
          pauseIntervals: [],
        });
        logId = log.id;
      });

      await act(async () => {
        await result.current.deleteLog(logId);
      });

      await waitFor(() => {
        expect(result.current.logs).toHaveLength(0);
      });
    });
  });

  describe('useActivitySession', () => {
    it('should start with no active session', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeNull();
    });

    it('should start a new activity session', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await waitFor(() => {
        expect(result.current.session).toBeDefined();
        expect(result.current.session?.currentLog.activityId).toBe('activity-1');
        expect(result.current.session?.isPaused).toBe(false);
        expect(result.current.session?.currentLog.startTime).toBeDefined();
      });
    });

    it('should pause an active session', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await act(async () => {
        await result.current.pauseActivity();
      });

      await waitFor(() => {
        expect(result.current.session?.isPaused).toBe(true);
        expect(result.current.session?.currentLog.pauseIntervals).toHaveLength(1);
        expect(result.current.session?.currentLog.pauseIntervals[0].pausedAt).toBeDefined();
        expect(result.current.session?.currentLog.pauseIntervals[0].resumedAt).toBeUndefined();
      });
    });

    it('should resume a paused session', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await act(async () => {
        await result.current.pauseActivity();
      });

      await act(async () => {
        await result.current.resumeActivity();
      });

      await waitFor(() => {
        expect(result.current.session?.isPaused).toBe(false);
        expect(result.current.session?.currentLog.pauseIntervals).toHaveLength(1);
        expect(result.current.session?.currentLog.pauseIntervals[0].resumedAt).toBeDefined();
      });
    });

    it('should calculate duration correctly when stopping', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const startTime = Date.now();
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      let finalLog: ActivityLog | null = null;
      await act(async () => {
        finalLog = await result.current.stopActivity();
      });

      expect(finalLog).toBeDefined();
      expect(finalLog!.endTime).toBeDefined();
      expect(finalLog!.duration).toBeGreaterThan(0);
      expect(finalLog!.duration).toBeLessThanOrEqual(Date.now() - startTime);

      // Session should be cleared
      await waitFor(() => {
        expect(result.current.session).toBeNull();
      });
    });

    it('should calculate duration excluding paused time', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      await act(async () => {
        await result.current.pauseActivity();
      });

      // Paused for some time
      await new Promise((resolve) => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.resumeActivity();
      });

      // Wait a bit more
      await new Promise((resolve) => setTimeout(resolve, 50));

      let finalLog: ActivityLog | null = null;
      await act(async () => {
        finalLog = await result.current.stopActivity();
      });

      expect(finalLog).toBeDefined();
      // Duration should be less than total elapsed time since we paused
      const totalElapsed = finalLog!.endTime! - finalLog!.startTime;
      expect(finalLog!.duration).toBeLessThan(totalElapsed);
    });

    it('should handle multiple pause/resume cycles', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // First pause/resume
      await act(async () => {
        await result.current.pauseActivity();
      });
      await act(async () => {
        await result.current.resumeActivity();
      });

      // Second pause/resume
      await act(async () => {
        await result.current.pauseActivity();
      });
      await act(async () => {
        await result.current.resumeActivity();
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.pauseIntervals).toHaveLength(2);
        expect(result.current.session?.currentLog.pauseIntervals[0].resumedAt).toBeDefined();
        expect(result.current.session?.currentLog.pauseIntervals[1].resumedAt).toBeDefined();
      });
    });

    it('should save activity session to storage', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Check that session is saved in AsyncStorage
      const stored = await AsyncStorage.getItem('activity-session-current');
      expect(stored).not.toBeNull();

      const session = JSON.parse(stored!);
      expect(session.currentLog.activityId).toBe('activity-1');
    });

    it('should load existing session from storage', async () => {
      const existingSession = {
        currentLog: {
          id: '123',
          activityId: 'activity-1',
          startTime: Date.now() - 3600000,
          duration: 0,
          pauseIntervals: [],
        },
        isPaused: false,
        pausedActivityStack: [],
      };

      await AsyncStorage.setItem('activity-session-current', JSON.stringify(existingSession));

      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeDefined();
      expect(result.current.session?.currentLog.activityId).toBe('activity-1');
      expect(result.current.session?.isPaused).toBe(false);
    });

    it('should switch to a different activity', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start first activity
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-1');
      });

      // Switch to second activity
      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-2');
        expect(result.current.session?.isPaused).toBe(false);
        expect(result.current.session?.pausedActivityStack).toHaveLength(1);
        expect(result.current.session?.pausedActivityStack[0].activityId).toBe('activity-1');
        // First activity should be paused
        expect(result.current.session?.pausedActivityStack[0].pauseIntervals.length).toBeGreaterThan(0);
      });
    });

    it('should switch activity when already paused', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start and pause first activity
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await act(async () => {
        await result.current.pauseActivity();
      });

      // Switch to second activity
      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-2');
        expect(result.current.session?.isPaused).toBe(false);
        expect(result.current.session?.pausedActivityStack).toHaveLength(1);
        expect(result.current.session?.pausedActivityStack[0].activityId).toBe('activity-1');
      });
    });

    it('should handle multiple activity switches (activity stack)', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start first activity
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Switch to second activity
      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      // Switch to third activity
      await act(async () => {
        await result.current.switchActivity('activity-3');
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-3');
        expect(result.current.session?.pausedActivityStack).toHaveLength(2);
        expect(result.current.session?.pausedActivityStack[0].activityId).toBe('activity-1');
        expect(result.current.session?.pausedActivityStack[1].activityId).toBe('activity-2');
      });
    });

    it('should resume from stack (most recent)', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start first activity
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Switch to second activity
      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      // Resume from stack (should resume activity-1)
      await act(async () => {
        await result.current.resumeFromStack();
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-1');
        expect(result.current.session?.isPaused).toBe(false);
        expect(result.current.session?.pausedActivityStack).toHaveLength(1);
        expect(result.current.session?.pausedActivityStack[0].activityId).toBe('activity-2');
        // Activity-1 should have its pause interval resumed
        const activity1 = result.current.session?.currentLog;
        expect(activity1?.pauseIntervals.length).toBeGreaterThan(0);
        expect(activity1?.pauseIntervals[activity1.pauseIntervals.length - 1].resumedAt).toBeDefined();
      });
    });

    it('should resume from stack by index', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a stack with 3 activities
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      await act(async () => {
        await result.current.switchActivity('activity-3');
      });

      // Stack should be [activity-1, activity-2], current is activity-3
      await waitFor(() => {
        expect(result.current.session?.pausedActivityStack).toHaveLength(2);
      });

      // Resume activity-1 (index 0)
      await act(async () => {
        await result.current.resumeFromStack(0);
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-1');
        expect(result.current.session?.pausedActivityStack).toHaveLength(2);
        // Stack should now be [activity-2, activity-3]
        expect(result.current.session?.pausedActivityStack[0].activityId).toBe('activity-2');
        expect(result.current.session?.pausedActivityStack[1].activityId).toBe('activity-3');
      });
    });

    it('should handle resumeFromStack with empty stack', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start an activity
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Try to resume from empty stack
      await act(async () => {
        await result.current.resumeFromStack();
      });

      // Should not throw, session should remain unchanged
      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-1');
        expect(result.current.session?.pausedActivityStack).toHaveLength(0);
      });
    });

    it('should throw error for invalid stack index', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start and switch activities to create a stack
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      // Try to resume with invalid index
      await expect(async () => {
        await act(async () => {
          await result.current.resumeFromStack(10);
        });
      }).rejects.toThrow('Invalid stack index');
    });

    it('should start new activity when switching with no active session', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Switch activity when no session exists
      await act(async () => {
        await result.current.switchActivity('activity-1');
      });

      await waitFor(() => {
        expect(result.current.session?.currentLog.activityId).toBe('activity-1');
        expect(result.current.session?.pausedActivityStack).toHaveLength(0);
      });
    });

    it('should maintain pause timestamps through switch and resume', async () => {
      const { result } = renderHook(() => useActivitySession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start first activity
      const startTime = Date.now();
      await act(async () => {
        await result.current.startActivity('activity-1');
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch to second activity (this pauses activity-1)
      const switchTime = Date.now();
      await act(async () => {
        await result.current.switchActivity('activity-2');
      });

      await waitFor(() => {
        const pausedActivity = result.current.session?.pausedActivityStack[0];
        expect(pausedActivity).toBeDefined();
        expect(pausedActivity?.pauseIntervals).toHaveLength(1);
        const pauseInterval = pausedActivity?.pauseIntervals[0];
        expect(pauseInterval?.pausedAt).toBeGreaterThanOrEqual(switchTime - 10);
        expect(pauseInterval?.pausedAt).toBeLessThanOrEqual(switchTime + 10);
        expect(pauseInterval?.resumedAt).toBeUndefined();
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Resume from stack
      const resumeTime = Date.now();
      await act(async () => {
        await result.current.resumeFromStack();
      });

      await waitFor(() => {
        const resumedActivity = result.current.session?.currentLog;
        expect(resumedActivity?.activityId).toBe('activity-1');
        expect(resumedActivity?.pauseIntervals).toHaveLength(1);
        const pauseInterval = resumedActivity?.pauseIntervals[0];
        expect(pauseInterval?.resumedAt).toBeGreaterThanOrEqual(resumeTime - 10);
        expect(pauseInterval?.resumedAt).toBeLessThanOrEqual(resumeTime + 10);
      });
    });
  });

  describe('useActivityTypes', () => {
    it('should start with empty activity types list', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activityTypes).toEqual([]);
      expect(result.current.activeActivityTypes).toEqual([]);
    });

    it('should create a new activity type', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdType: ActivityType | undefined;
      await act(async () => {
        createdType = await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
      });

      expect(createdType).toBeDefined();
      expect(createdType?.name).toBe('Work');
      expect(createdType?.color).toBe('#4ECDC4');
      expect(createdType?.active).toBe(true);
      expect(createdType?.id).toBeDefined();
      expect(createdType?.createdAt).toBeDefined();

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(1);
        expect(result.current.activityTypes[0].name).toBe('Work');
      });
    });

    it('should create multiple activity types', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
      });

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(1);
      });

      // Add small delay to ensure storage writes complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.createActivityType({
          name: 'Exercise',
          color: '#98D8C8',
        });
      });

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(2);
      });

      // Add small delay to ensure storage writes complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.createActivityType({
          name: 'Learning',
          color: '#F7DC6F',
        });
      });

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(3);
        expect(result.current.activityTypes.map((t) => t.name)).toEqual([
          'Work',
          'Exercise',
          'Learning',
        ]);
      });
    });

    it('should update an activity type', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let typeId: string = '';
      await act(async () => {
        const type = await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
        typeId = type.id;
      });

      await act(async () => {
        await result.current.updateActivityType(typeId, {
          name: 'Professional',
          color: '#FF6B6B',
        });
      });

      await waitFor(() => {
        const updatedType = result.current.activityTypes.find((t) => t.id === typeId);
        expect(updatedType?.name).toBe('Professional');
        expect(updatedType?.color).toBe('#FF6B6B');
      });
    });

    it('should deactivate an activity type', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let typeId: string = '';
      await act(async () => {
        const type = await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
        typeId = type.id;
      });

      await act(async () => {
        await result.current.deactivateActivityType(typeId);
      });

      await waitFor(() => {
        expect(result.current.activeActivityTypes).toHaveLength(0);
        expect(result.current.inactiveActivityTypes).toHaveLength(1);
        const deactivated = result.current.inactiveActivityTypes[0];
        expect(deactivated.active).toBe(false);
        expect(deactivated.deactivatedAt).toBeDefined();
      });
    });

    it('should reactivate an activity type', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let typeId: string = '';
      await act(async () => {
        const type = await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
        typeId = type.id;
      });

      await act(async () => {
        await result.current.deactivateActivityType(typeId);
      });

      await act(async () => {
        await result.current.reactivateActivityType(typeId);
      });

      await waitFor(() => {
        expect(result.current.activeActivityTypes).toHaveLength(1);
        expect(result.current.inactiveActivityTypes).toHaveLength(0);
        const reactivated = result.current.activeActivityTypes[0];
        expect(reactivated.active).toBe(true);
        expect(reactivated.deactivatedAt).toBeUndefined();
      });
    });

    it('should delete an activity type', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let typeId: string = '';
      await act(async () => {
        const type = await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
        typeId = type.id;
      });

      await act(async () => {
        await result.current.deleteActivityType(typeId);
      });

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(0);
      });
    });

    it('should create default activity types', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createDefaultActivityTypes();
      });

      // Give time for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Manually refresh to load all activity types from storage
      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify that default types were created by checking storage directly
      const stored = await AsyncStorage.getItem('activity-types-all');
      expect(stored).not.toBeNull();
      const typeIds = JSON.parse(stored!);
      expect(typeIds.length).toBe(6);

      // Should have created 6 default types
      await waitFor(() => {
        expect(result.current.activityTypes.length).toBe(6);
      });

      const names = result.current.activityTypes.map((t) => t.name);
      expect(names).toContain('Work');
      expect(names).toContain('Exercise');
      expect(names).toContain('Learning');
      expect(names).toContain('Personal');
      expect(names).toContain('Home');
      expect(names).toContain('Social');

      // All should be active and have colors
      expect(result.current.activityTypes.every((t) => t.active)).toBe(true);
      expect(result.current.activityTypes.every((t) => t.color)).toBe(true);
    });

    it('should handle multiple simultaneous operations', async () => {
      const { result } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let typeIds: string[] = [];
      await act(async () => {
        const type1 = await result.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
        typeIds.push(type1.id);
      });

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(1);
      });

      await act(async () => {
        const type2 = await result.current.createActivityType({
          name: 'Exercise',
          color: '#98D8C8',
        });
        typeIds.push(type2.id);
      });

      await waitFor(() => {
        expect(result.current.activityTypes).toHaveLength(2);
      });

      await act(async () => {
        await result.current.updateActivityType(typeIds[0], { name: 'Professional' });
      });

      await act(async () => {
        await result.current.deactivateActivityType(typeIds[1]);
      });

      await waitFor(() => {
        const type1 = result.current.activityTypes.find((t) => t.id === typeIds[0]);
        const type2 = result.current.activityTypes.find((t) => t.id === typeIds[1]);
        expect(type1?.name).toBe('Professional');
        expect(type1?.active).toBe(true);
        expect(type2?.active).toBe(false);
      });
    });

    it('should persist activity types across hook remounts', async () => {
      const { result: result1 } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      await act(async () => {
        await result1.current.createActivityType({
          name: 'Work',
          color: '#4ECDC4',
        });
      });

      await waitFor(() => {
        expect(result1.current.activityTypes).toHaveLength(1);
      });

      // Unmount and remount
      const { result: result2 } = renderHook(() => useActivityTypes());

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      expect(result2.current.activityTypes).toHaveLength(1);
      expect(result2.current.activityTypes[0].name).toBe('Work');
    });
  });

  describe('useActivityInstances', () => {
    describe('Basic CRUD Operations', () => {
      it('should start with empty instances list', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.instances).toEqual([]);
        expect(result.current.incompleteInstances).toEqual([]);
        expect(result.current.completedInstances).toEqual([]);
      });

      it('should create a new activity instance', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let createdInstance: ActivityInstance | undefined;
        await act(async () => {
          createdInstance = await result.current.createInstance({
            title: 'Review PRs',
            description: 'Review team pull requests',
            typeId: 'work-type-id',
          });
        });

        expect(createdInstance).toBeDefined();
        expect(createdInstance?.title).toBe('Review PRs');
        expect(createdInstance?.description).toBe('Review team pull requests');
        expect(createdInstance?.typeId).toBe('work-type-id');
        expect(createdInstance?.completed).toBe(false);
        expect(createdInstance?.completedAt).toBeUndefined();
        expect(createdInstance?.id).toBeDefined();
        expect(createdInstance?.createdAt).toBeDefined();
        expect(createdInstance?.lastActiveAt).toBeDefined();

        await waitFor(() => {
          expect(result.current.instances).toHaveLength(1);
          expect(result.current.incompleteInstances).toHaveLength(1);
          expect(result.current.completedInstances).toHaveLength(0);
        });
      });

      it('should create instance without description', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let createdInstance: ActivityInstance | undefined;
        await act(async () => {
          createdInstance = await result.current.createInstance({
            title: 'Quick task',
            typeId: 'work-type-id',
          });
        });

        expect(createdInstance).toBeDefined();
        expect(createdInstance?.title).toBe('Quick task');
        expect(createdInstance?.description).toBeUndefined();
        expect(createdInstance?.completed).toBe(false);
      });

      it('should update an activity instance', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
        });

        await act(async () => {
          await result.current.updateInstance(instanceId, {
            title: 'Review and Merge PRs',
            description: 'Updated description',
          });
        });

        await waitFor(() => {
          const updatedInstance = result.current.instances.find((i) => i.id === instanceId);
          expect(updatedInstance?.title).toBe('Review and Merge PRs');
          expect(updatedInstance?.description).toBe('Updated description');
        });
      });

      it('should delete an activity instance', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
        });

        await waitFor(() => {
          expect(result.current.instances).toHaveLength(1);
        });

        await act(async () => {
          await result.current.deleteInstance(instanceId);
        });

        await waitFor(() => {
          expect(result.current.instances).toHaveLength(0);
        });
      });
    });

    describe('Complete/Uncomplete/Restart Operations', () => {
      it('should mark an instance as completed', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
        });

        await act(async () => {
          await result.current.completeInstance(instanceId);
        });

        await waitFor(() => {
          const completedInstance = result.current.instances.find((i) => i.id === instanceId);
          expect(completedInstance?.completed).toBe(true);
          expect(completedInstance?.completedAt).toBeDefined();
          expect(result.current.completedInstances).toHaveLength(1);
          expect(result.current.incompleteInstances).toHaveLength(0);
        });
      });

      it('should mark an instance as uncompleted', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
        });

        await act(async () => {
          await result.current.completeInstance(instanceId);
        });

        await waitFor(() => {
          expect(result.current.completedInstances).toHaveLength(1);
        });

        await act(async () => {
          await result.current.uncompleteInstance(instanceId);
        });

        await waitFor(() => {
          const uncompletedInstance = result.current.instances.find((i) => i.id === instanceId);
          expect(uncompletedInstance?.completed).toBe(false);
          expect(uncompletedInstance?.completedAt).toBeUndefined();
          expect(result.current.incompleteInstances).toHaveLength(1);
          expect(result.current.completedInstances).toHaveLength(0);
        });
      });

      it('should restart a completed instance from today', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
        });

        await act(async () => {
          await result.current.completeInstance(instanceId);
        });

        await waitFor(() => {
          expect(result.current.completedInstances).toHaveLength(1);
        });

        await act(async () => {
          await result.current.restartInstance(instanceId);
        });

        await waitFor(() => {
          const restartedInstance = result.current.instances.find((i) => i.id === instanceId);
          expect(restartedInstance?.completed).toBe(false);
          expect(restartedInstance?.completedAt).toBeUndefined();
          expect(result.current.incompleteInstances).toHaveLength(1);
        });
      });

      it('should throw error when restarting non-completed instance', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
        });

        await expect(
          act(async () => {
            await result.current.restartInstance(instanceId);
          })
        ).rejects.toThrow('Activity instance is not completed');
      });

      it('should throw error when restarting instance from previous day', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;

        // Create instance directly in storage with yesterday's completedAt
        await act(async () => {
          const instance: ActivityInstance = {
            id: Date.now().toString(),
            title: 'Old task',
            typeId: 'work-type-id',
            completed: true,
            completedAt: yesterday,
            lastActiveAt: yesterday,
            createdAt: yesterday,
          };
          instanceId = instance.id;

          await AsyncStorage.setItem(
            `activity-instance-${instance.id}`,
            JSON.stringify(instance)
          );
          await AsyncStorage.setItem(
            'activity-instances-all',
            JSON.stringify([instance.id])
          );
          await result.current.refresh();
        });

        await waitFor(() => {
          expect(result.current.instances).toHaveLength(1);
        });

        await expect(
          act(async () => {
            await result.current.restartInstance(instanceId);
          })
        ).rejects.toThrow('Cannot restart activity from a previous day');
      });
    });

    describe('Touch and LastActiveAt', () => {
      it('should update lastActiveAt when touching instance', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let instanceId: string = '';
        let originalLastActiveAt: number = 0;

        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Review PRs',
            typeId: 'work-type-id',
          });
          instanceId = instance.id;
          originalLastActiveAt = instance.lastActiveAt;
        });

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));

        await act(async () => {
          await result.current.touchInstance(instanceId);
        });

        await waitFor(() => {
          const touchedInstance = result.current.instances.find((i) => i.id === instanceId);
          expect(touchedInstance?.lastActiveAt).toBeGreaterThan(originalLastActiveAt);
        });
      });
    });

    describe('Sorting and Filtering', () => {
      it('should sort instances by completion status and lastActiveAt', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // Create instances with delays to ensure different lastActiveAt
        let ids: string[] = [];

        await act(async () => {
          const instance1 = await result.current.createInstance({
            title: 'Task 1',
            typeId: 'work-type-id',
          });
          ids.push(instance1.id);
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        await act(async () => {
          const instance2 = await result.current.createInstance({
            title: 'Task 2',
            typeId: 'work-type-id',
          });
          ids.push(instance2.id);
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        await act(async () => {
          const instance3 = await result.current.createInstance({
            title: 'Task 3',
            typeId: 'work-type-id',
          });
          ids.push(instance3.id);
        });

        // Complete the first two
        await act(async () => {
          await result.current.completeInstance(ids[0]);
        });

        await act(async () => {
          await result.current.completeInstance(ids[1]);
        });

        await waitFor(() => {
          expect(result.current.instances).toHaveLength(3);
        });

        // Get sorted instances
        const sorted = result.current.sortedInstances;

        // Incomplete should come first (Task 3)
        expect(sorted[0].title).toBe('Task 3');
        expect(sorted[0].completed).toBe(false);

        // Completed instances should come after, sorted by most recent
        expect(sorted[1].completed).toBe(true);
        expect(sorted[2].completed).toBe(true);

        // Task 2 should be before Task 1 (more recent)
        expect(sorted[1].title).toBe('Task 2');
        expect(sorted[2].title).toBe('Task 1');
      });

      it('should filter current day instances correctly', async () => {
        const { result } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // Create today's incomplete instance
        await act(async () => {
          await result.current.createInstance({
            title: 'Today incomplete',
            typeId: 'work-type-id',
          });
        });

        // Create today's completed instance
        let todayCompletedId: string = '';
        await act(async () => {
          const instance = await result.current.createInstance({
            title: 'Today completed',
            typeId: 'work-type-id',
          });
          todayCompletedId = instance.id;
        });

        await act(async () => {
          await result.current.completeInstance(todayCompletedId);
        });

        // Create yesterday's completed instance
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;
        await act(async () => {
          const oldInstance: ActivityInstance = {
            id: 'old-instance',
            title: 'Yesterday completed',
            typeId: 'work-type-id',
            completed: true,
            completedAt: yesterday,
            lastActiveAt: yesterday,
            createdAt: yesterday,
          };

          await AsyncStorage.setItem(
            'activity-instance-old-instance',
            JSON.stringify(oldInstance)
          );

          const currentIds = await AsyncStorage.getItem('activity-instances-all');
          const ids = currentIds ? JSON.parse(currentIds) : [];
          await AsyncStorage.setItem(
            'activity-instances-all',
            JSON.stringify([...ids, 'old-instance'])
          );

          await result.current.refresh();
        });

        await waitFor(() => {
          expect(result.current.instances).toHaveLength(3);
        });

        // Current day instances should include incomplete + today's completed
        await waitFor(() => {
          const currentDay = result.current.currentDayInstances;
          expect(currentDay).toHaveLength(2);
          expect(currentDay.some((i) => i.title === 'Today incomplete')).toBe(true);
          expect(currentDay.some((i) => i.title === 'Today completed')).toBe(true);
          expect(currentDay.some((i) => i.title === 'Yesterday completed')).toBe(false);
        });
      });
    });

    describe('Persistence', () => {
      it('should persist instances across hook remounts', async () => {
        const { result: result1 } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result1.current.loading).toBe(false);
        });

        await act(async () => {
          await result1.current.createInstance({
            title: 'Persistent task',
            description: 'This should persist',
            typeId: 'work-type-id',
          });
        });

        await waitFor(() => {
          expect(result1.current.instances).toHaveLength(1);
        });

        // Unmount and remount
        const { result: result2 } = renderHook(() => useActivityInstances());

        await waitFor(() => {
          expect(result2.current.loading).toBe(false);
        });

        expect(result2.current.instances).toHaveLength(1);
        expect(result2.current.instances[0].title).toBe('Persistent task');
        expect(result2.current.instances[0].description).toBe('This should persist');
      });
    });
  });

  describe('Day Boundary Utilities', () => {
    it('should calculate current day boundary at 4am', () => {
      const now = new Date('2026-01-23T05:00:00'); // 5am
      const boundary = new Date('2026-01-23T04:00:00'); // 4am today

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = getCurrentDayBoundary();
      expect(result).toBe(boundary.getTime());

      jest.useRealTimers();
    });

    it('should use previous day boundary before 4am', () => {
      const now = new Date('2026-01-23T03:00:00'); // 3am
      const boundary = new Date('2026-01-22T04:00:00'); // 4am yesterday

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = getCurrentDayBoundary();
      expect(result).toBe(boundary.getTime());

      jest.useRealTimers();
    });

    it('should check if timestamp is from current day', () => {
      const now = new Date('2026-01-23T10:00:00'); // 10am
      const todayTimestamp = new Date('2026-01-23T08:00:00').getTime(); // 8am today
      const yesterdayTimestamp = new Date('2026-01-22T10:00:00').getTime(); // yesterday

      jest.useFakeTimers();
      jest.setSystemTime(now);

      expect(isCurrentDay(todayTimestamp)).toBe(true);
      expect(isCurrentDay(yesterdayTimestamp)).toBe(false);

      jest.useRealTimers();
    });

    it('should handle edge case at exactly 4am', () => {
      const now = new Date('2026-01-23T04:00:00'); // exactly 4am
      const boundary = new Date('2026-01-23T04:00:00'); // 4am today

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = getCurrentDayBoundary();
      expect(result).toBe(boundary.getTime());

      jest.useRealTimers();
    });
  });
});
