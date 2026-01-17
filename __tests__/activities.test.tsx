import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useActivities, useActivityLogs, useActivitySession } from '@/hooks/use-activities';
import { Activity, ActivityLog } from '@/types/activity';

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
      expect(finalLog?.endTime).toBeDefined();
      expect(finalLog?.duration).toBeGreaterThan(0);
      expect(finalLog?.duration).toBeLessThanOrEqual(Date.now() - startTime);

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
});
