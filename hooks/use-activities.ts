/**
 * Custom hook for managing activities and activity logs
 */

import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityLog, ActivitySession } from '@/types/activity';
import { useStorage, getStorageItem, setStorageItem, removeStorageItem } from './use-storage';

const ACTIVITIES_LIST_KEY = 'all';
const ACTIVITIES_LABEL = 'activities';
const ACTIVITY_LABEL = 'activity';
const ACTIVITY_LOGS_LABEL = 'activity-logs';
const ACTIVITY_LOG_LABEL = 'activity-log';
const ACTIVITY_SESSION_LABEL = 'activity-session';
const ACTIVITY_SESSION_KEY = 'current';

/**
 * Hook for managing the list of all activities
 */
export function useActivities() {
  const { data: activityIds, loading, save: saveActivityIds, refresh } = useStorage<string[]>(
    ACTIVITIES_LABEL,
    ACTIVITIES_LIST_KEY
  );
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load all activities whenever activityIds changes
  useEffect(() => {
    if (!activityIds || loading) return;

    async function loadActivities() {
      const loaded = await Promise.all(
        activityIds.map((id) => getStorageItem<Activity>(ACTIVITY_LABEL, id))
      );
      const validActivities = loaded.filter((activity): activity is Activity => activity !== null);
      setActivities(validActivities);
    }

    loadActivities();
  }, [activityIds, loading]);

  /**
   * Create a new activity
   */
  const createActivity = useCallback(
    async (activity: Omit<Activity, 'id' | 'createdAt'>) => {
      const newActivity: Activity = {
        ...activity,
        id: Date.now().toString(),
        createdAt: Date.now(),
        active: true,
      };

      // Save the activity
      await setStorageItem(ACTIVITY_LABEL, newActivity.id, newActivity);

      // Update the activities list
      const updatedIds = [...(activityIds || []), newActivity.id];
      await saveActivityIds(updatedIds);

      setActivities((prev) => [...prev, newActivity]);
      return newActivity;
    },
    [activityIds, saveActivityIds]
  );

  /**
   * Update an existing activity
   */
  const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
    const existing = await getStorageItem<Activity>(ACTIVITY_LABEL, id);
    if (!existing) throw new Error('Activity not found');

    const updated: Activity = { ...existing, ...updates };
    await setStorageItem(ACTIVITY_LABEL, id, updated);

    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  /**
   * Delete an activity
   */
  const deleteActivity = useCallback(
    async (id: string) => {
      await removeStorageItem(ACTIVITY_LABEL, id);

      const updatedIds = (activityIds || []).filter((activityId) => activityId !== id);
      await saveActivityIds(updatedIds);

      setActivities((prev) => prev.filter((a) => a.id !== id));
    },
    [activityIds, saveActivityIds]
  );

  /**
   * Deactivate an activity (soft delete - keeps it in system but marks as inactive)
   */
  const deactivateActivity = useCallback(
    async (id: string) => {
      return updateActivity(id, { active: false, deactivatedAt: Date.now() });
    },
    [updateActivity]
  );

  /**
   * Reactivate an activity
   */
  const reactivateActivity = useCallback(
    async (id: string) => {
      return updateActivity(id, { active: true, deactivatedAt: undefined });
    },
    [updateActivity]
  );

  /**
   * Create default seed activities
   */
  const createDefaultActivities = useCallback(async () => {
    const defaultActivities = [
      { name: 'Work - Focus Time', category: 'Work', color: '#4ECDC4' },
      { name: 'Meetings', category: 'Work', color: '#45B7D1' },
      { name: 'Email & Admin', category: 'Work', color: '#85C1E2' },
      { name: 'Exercise', category: 'Exercise', color: '#98D8C8' },
      { name: 'Learning', category: 'Learning', color: '#F7DC6F' },
      { name: 'Personal Projects', category: 'Personal', color: '#BB8FCE' },
      { name: 'Household Tasks', category: 'Home', color: '#FFA07A' },
      { name: 'Social Time', category: 'Social', color: '#FF6B6B' },
    ];

    for (const activity of defaultActivities) {
      await createActivity(activity);
    }
  }, [createActivity]);

  return {
    activities,
    activeActivities: activities.filter((a) => a.active),
    inactiveActivities: activities.filter((a) => !a.active),
    loading,
    createActivity,
    updateActivity,
    deleteActivity,
    deactivateActivity,
    reactivateActivity,
    createDefaultActivities,
    refresh,
  };
}

/**
 * Hook for managing activity logs
 */
export function useActivityLogs(activityId?: string) {
  const { data: allLogIds, loading, save: saveLogIds, refresh } = useStorage<string[]>(
    ACTIVITY_LOGS_LABEL,
    activityId || 'all'
  );
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Load all logs whenever logIds changes
  useEffect(() => {
    if (!allLogIds || loading) return;

    async function loadLogs() {
      const loaded = await Promise.all(
        allLogIds.map((id) => getStorageItem<ActivityLog>(ACTIVITY_LOG_LABEL, id))
      );
      const validLogs = loaded.filter((log): log is ActivityLog => log !== null);
      setLogs(validLogs);
    }

    loadLogs();
  }, [allLogIds, loading]);

  /**
   * Create a new activity log
   */
  const createLog = useCallback(
    async (log: Omit<ActivityLog, 'id'>) => {
      const newLog: ActivityLog = {
        ...log,
        id: Date.now().toString(),
      };

      // Save the log
      await setStorageItem(ACTIVITY_LOG_LABEL, newLog.id, newLog);

      // Update the logs list
      const updatedIds = [...(allLogIds || []), newLog.id];
      await saveLogIds(updatedIds);

      setLogs((prev) => [...prev, newLog]);
      return newLog;
    },
    [allLogIds, saveLogIds]
  );

  /**
   * Update an existing log
   */
  const updateLog = useCallback(async (id: string, updates: Partial<ActivityLog>) => {
    const existing = await getStorageItem<ActivityLog>(ACTIVITY_LOG_LABEL, id);
    if (!existing) throw new Error('Activity log not found');

    const updated: ActivityLog = { ...existing, ...updates };
    await setStorageItem(ACTIVITY_LOG_LABEL, id, updated);

    setLogs((prev) => prev.map((log) => (log.id === id ? updated : log)));
    return updated;
  }, []);

  /**
   * Delete a log
   */
  const deleteLog = useCallback(
    async (id: string) => {
      await removeStorageItem(ACTIVITY_LOG_LABEL, id);

      const updatedIds = (allLogIds || []).filter((logId) => logId !== id);
      await saveLogIds(updatedIds);

      setLogs((prev) => prev.filter((log) => log.id !== id));
    },
    [allLogIds, saveLogIds]
  );

  return {
    logs,
    loading,
    createLog,
    updateLog,
    deleteLog,
    refresh,
  };
}

/**
 * Hook for managing the current activity session (timer state)
 */
export function useActivitySession() {
  const { data: session, loading, save: saveSession, remove: removeSession } = useStorage<ActivitySession>(
    ACTIVITY_SESSION_LABEL,
    ACTIVITY_SESSION_KEY
  );

  /**
   * Start a new activity session
   */
  const startActivity = useCallback(
    async (activityId: string) => {
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        activityId,
        startTime: Date.now(),
        duration: 0,
        pauseIntervals: [],
      };

      const newSession: ActivitySession = {
        currentLog: newLog,
        isPaused: false,
        pausedActivityStack: session?.currentLog ? [session.currentLog] : [],
      };

      await saveSession(newSession);
      return newSession;
    },
    [session, saveSession]
  );

  /**
   * Pause the current activity
   */
  const pauseActivity = useCallback(async () => {
    if (!session || session.isPaused) return session;

    const updatedLog: ActivityLog = {
      ...session.currentLog,
      pauseIntervals: [
        ...session.currentLog.pauseIntervals,
        { pausedAt: Date.now() },
      ],
    };

    const updatedSession: ActivitySession = {
      ...session,
      currentLog: updatedLog,
      isPaused: true,
    };

    await saveSession(updatedSession);
    return updatedSession;
  }, [session, saveSession]);

  /**
   * Resume the current activity
   */
  const resumeActivity = useCallback(async () => {
    if (!session || !session.isPaused) return session;

    const lastPauseIndex = session.currentLog.pauseIntervals.length - 1;
    const updatedPauseIntervals = [...session.currentLog.pauseIntervals];
    updatedPauseIntervals[lastPauseIndex] = {
      ...updatedPauseIntervals[lastPauseIndex],
      resumedAt: Date.now(),
    };

    const updatedLog: ActivityLog = {
      ...session.currentLog,
      pauseIntervals: updatedPauseIntervals,
    };

    const updatedSession: ActivitySession = {
      ...session,
      currentLog: updatedLog,
      isPaused: false,
    };

    await saveSession(updatedSession);
    return updatedSession;
  }, [session, saveSession]);

  /**
   * Stop and save the current activity
   */
  const stopActivity = useCallback(async () => {
    if (!session) return null;

    // Calculate total duration
    const endTime = Date.now();
    const totalElapsed = endTime - session.currentLog.startTime;

    // Calculate total paused time
    let totalPausedTime = 0;
    for (const interval of session.currentLog.pauseIntervals) {
      if (interval.resumedAt) {
        totalPausedTime += interval.resumedAt - interval.pausedAt;
      } else {
        // If still paused, count up to now
        totalPausedTime += endTime - interval.pausedAt;
      }
    }

    const finalLog: ActivityLog = {
      ...session.currentLog,
      endTime,
      duration: totalElapsed - totalPausedTime,
    };

    // Save the log
    await setStorageItem(ACTIVITY_LOG_LABEL, finalLog.id, finalLog);

    // Update the logs list
    const allLogIds = await getStorageItem<string[]>(ACTIVITY_LOGS_LABEL, 'all');
    const updatedIds = [...(allLogIds || []), finalLog.id];
    await setStorageItem(ACTIVITY_LOGS_LABEL, 'all', updatedIds);

    // Clear the session
    await removeSession();

    return finalLog;
  }, [session, removeSession]);

  return {
    session,
    loading,
    startActivity,
    pauseActivity,
    resumeActivity,
    stopActivity,
  };
}
