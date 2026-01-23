/**
 * Custom hook for managing activities and activity logs
 */

import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityInstance, ActivityType, ActivityLog, ActivitySession } from '@/types/activity';
import { useStorage, getStorageItem, setStorageItem, removeStorageItem } from './use-storage';

const ACTIVITY_TYPES_LIST_KEY = 'all';
const ACTIVITY_TYPES_LABEL = 'activity-types';
const ACTIVITY_TYPE_LABEL = 'activity-type';
const ACTIVITIES_LIST_KEY = 'all';
const ACTIVITIES_LABEL = 'activities';
const ACTIVITY_LABEL = 'activity';
const ACTIVITY_INSTANCES_LIST_KEY = 'all';
const ACTIVITY_INSTANCES_LABEL = 'activity-instances';
const ACTIVITY_INSTANCE_LABEL = 'activity-instance';
const ACTIVITY_LOGS_LABEL = 'activity-logs';
const ACTIVITY_LOG_LABEL = 'activity-log';
const ACTIVITY_SESSION_LABEL = 'activity-session';
const ACTIVITY_SESSION_KEY = 'current';

/**
 * Hook for managing activity types
 */
export function useActivityTypes() {
  const { data: activityTypeIds, loading, save: saveActivityTypeIds, refresh } = useStorage<string[]>(
    ACTIVITY_TYPES_LABEL,
    ACTIVITY_TYPES_LIST_KEY
  );
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  // Load all activity types whenever activityTypeIds changes
  useEffect(() => {
    if (!activityTypeIds || loading) return;

    async function loadActivityTypes() {
      const loaded = await Promise.all(
        activityTypeIds.map((id) => getStorageItem<ActivityType>(ACTIVITY_TYPE_LABEL, id))
      );
      const validActivityTypes = loaded.filter((type): type is ActivityType => type !== null);
      setActivityTypes(validActivityTypes);
    }

    loadActivityTypes();
  }, [activityTypeIds, loading]);

  /**
   * Create a new activity type
   */
  const createActivityType = useCallback(
    async (activityType: Omit<ActivityType, 'id' | 'createdAt' | 'active'>) => {
      const newActivityType: ActivityType = {
        ...activityType,
        id: Date.now().toString(),
        createdAt: Date.now(),
        active: true,
      };

      // Save the activity type
      await setStorageItem(ACTIVITY_TYPE_LABEL, newActivityType.id, newActivityType);

      // Update the activity types list - read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(ACTIVITY_TYPES_LABEL, ACTIVITY_TYPES_LIST_KEY);
      const updatedIds = [...(currentIds || []), newActivityType.id];
      await saveActivityTypeIds(updatedIds);

      setActivityTypes((prev) => [...prev, newActivityType]);
      return newActivityType;
    },
    [saveActivityTypeIds]
  );

  /**
   * Update an existing activity type
   */
  const updateActivityType = useCallback(async (id: string, updates: Partial<ActivityType>) => {
    const existing = await getStorageItem<ActivityType>(ACTIVITY_TYPE_LABEL, id);
    if (!existing) throw new Error('Activity type not found');

    const updated: ActivityType = { ...existing, ...updates };
    await setStorageItem(ACTIVITY_TYPE_LABEL, id, updated);

    setActivityTypes((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  /**
   * Delete an activity type
   */
  const deleteActivityType = useCallback(
    async (id: string) => {
      await removeStorageItem(ACTIVITY_TYPE_LABEL, id);

      // Read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(ACTIVITY_TYPES_LABEL, ACTIVITY_TYPES_LIST_KEY);
      const updatedIds = (currentIds || []).filter((typeId) => typeId !== id);
      await saveActivityTypeIds(updatedIds);

      setActivityTypes((prev) => prev.filter((t) => t.id !== id));
    },
    [saveActivityTypeIds]
  );

  /**
   * Deactivate an activity type (soft delete - keeps it in system but marks as inactive)
   */
  const deactivateActivityType = useCallback(
    async (id: string) => {
      return updateActivityType(id, { active: false, deactivatedAt: Date.now() });
    },
    [updateActivityType]
  );

  /**
   * Reactivate an activity type
   */
  const reactivateActivityType = useCallback(
    async (id: string) => {
      return updateActivityType(id, { active: true, deactivatedAt: undefined });
    },
    [updateActivityType]
  );

  /**
   * Create default seed activity types
   */
  const createDefaultActivityTypes = useCallback(async () => {
    const defaultTypes = [
      { name: 'Work', color: '#4ECDC4' },
      { name: 'Exercise', color: '#98D8C8' },
      { name: 'Learning', color: '#F7DC6F' },
      { name: 'Personal', color: '#BB8FCE' },
      { name: 'Home', color: '#FFA07A' },
      { name: 'Social', color: '#FF6B6B' },
    ];

    for (const type of defaultTypes) {
      await createActivityType(type);
      // Small delay to ensure storage writes complete before next read
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }, [createActivityType]);

  return {
    activityTypes,
    activeActivityTypes: activityTypes.filter((t) => t.active),
    inactiveActivityTypes: activityTypes.filter((t) => !t.active),
    loading,
    createActivityType,
    updateActivityType,
    deleteActivityType,
    deactivateActivityType,
    reactivateActivityType,
    createDefaultActivityTypes,
    refresh,
  };
}

/**
 * Utility function to get the current "day" timestamp based on 4am boundary
 * Days start at 4am, not midnight. So 3:59am is still "yesterday"
 * and 4:00am is the start of "today"
 * @returns timestamp of the current day's 4am boundary
 */
export function getCurrentDayBoundary(): number {
  const now = new Date();
  const currentHour = now.getHours();

  // If current time is before 4am, the "current day" started at 4am yesterday
  if (currentHour < 4) {
    const dayBoundary = new Date(now);
    dayBoundary.setDate(dayBoundary.getDate() - 1);
    dayBoundary.setHours(4, 0, 0, 0);
    return dayBoundary.getTime();
  }

  // Otherwise, the "current day" started at 4am today
  const dayBoundary = new Date(now);
  dayBoundary.setHours(4, 0, 0, 0);
  return dayBoundary.getTime();
}

/**
 * Check if a timestamp is from the current "day" (4am boundary)
 * @param timestamp - timestamp to check
 * @returns true if the timestamp is from the current day
 */
export function isCurrentDay(timestamp: number): boolean {
  const currentDayBoundary = getCurrentDayBoundary();
  return timestamp >= currentDayBoundary;
}

/**
 * Hook for managing the list of all activities
 * @deprecated Use useActivityInstances instead
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
 * Hook for managing activity instances
 */
export function useActivityInstances() {
  const { data: instanceIds, loading, save: saveInstanceIds, refresh } = useStorage<string[]>(
    ACTIVITY_INSTANCES_LABEL,
    ACTIVITY_INSTANCES_LIST_KEY
  );
  const [instances, setInstances] = useState<ActivityInstance[]>([]);

  // Load all instances whenever instanceIds changes
  useEffect(() => {
    if (!instanceIds || loading) return;

    async function loadInstances() {
      const loaded = await Promise.all(
        instanceIds.map((id) => getStorageItem<ActivityInstance>(ACTIVITY_INSTANCE_LABEL, id))
      );
      const validInstances = loaded.filter((instance): instance is ActivityInstance => instance !== null);
      setInstances(validInstances);
    }

    loadInstances();
  }, [instanceIds, loading]);

  /**
   * Create a new activity instance
   */
  const createInstance = useCallback(
    async (instance: Omit<ActivityInstance, 'id' | 'createdAt' | 'lastActiveAt' | 'completed'>) => {
      const now = Date.now();
      const newInstance: ActivityInstance = {
        ...instance,
        id: now.toString(),
        createdAt: now,
        lastActiveAt: now,
        completed: false,
      };

      // Save the instance
      await setStorageItem(ACTIVITY_INSTANCE_LABEL, newInstance.id, newInstance);

      // Update the instances list - read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(ACTIVITY_INSTANCES_LABEL, ACTIVITY_INSTANCES_LIST_KEY);
      const updatedIds = [...(currentIds || []), newInstance.id];
      await saveInstanceIds(updatedIds);

      setInstances((prev) => [...prev, newInstance]);
      return newInstance;
    },
    [saveInstanceIds]
  );

  /**
   * Update an existing activity instance
   */
  const updateInstance = useCallback(async (id: string, updates: Partial<ActivityInstance>) => {
    const existing = await getStorageItem<ActivityInstance>(ACTIVITY_INSTANCE_LABEL, id);
    if (!existing) throw new Error('Activity instance not found');

    const updated: ActivityInstance = { ...existing, ...updates };
    await setStorageItem(ACTIVITY_INSTANCE_LABEL, id, updated);

    setInstances((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  /**
   * Delete an activity instance
   */
  const deleteInstance = useCallback(
    async (id: string) => {
      await removeStorageItem(ACTIVITY_INSTANCE_LABEL, id);

      // Read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(ACTIVITY_INSTANCES_LABEL, ACTIVITY_INSTANCES_LIST_KEY);
      const updatedIds = (currentIds || []).filter((instanceId) => instanceId !== id);
      await saveInstanceIds(updatedIds);

      setInstances((prev) => prev.filter((i) => i.id !== id));
    },
    [saveInstanceIds]
  );

  /**
   * Mark an activity instance as completed
   */
  const completeInstance = useCallback(
    async (id: string) => {
      return updateInstance(id, { completed: true, completedAt: Date.now() });
    },
    [updateInstance]
  );

  /**
   * Mark an activity instance as not completed
   */
  const uncompleteInstance = useCallback(
    async (id: string) => {
      return updateInstance(id, { completed: false, completedAt: undefined });
    },
    [updateInstance]
  );

  /**
   * Restart a completed activity instance (only if completed today)
   */
  const restartInstance = useCallback(
    async (id: string) => {
      const existing = await getStorageItem<ActivityInstance>(ACTIVITY_INSTANCE_LABEL, id);
      if (!existing) throw new Error('Activity instance not found');
      if (!existing.completed) throw new Error('Activity instance is not completed');

      // Check if completed today (4am boundary)
      if (existing.completedAt && !isCurrentDay(existing.completedAt)) {
        throw new Error('Cannot restart activity from a previous day');
      }

      return updateInstance(id, {
        completed: false,
        completedAt: undefined,
        lastActiveAt: Date.now()
      });
    },
    [updateInstance]
  );

  /**
   * Update lastActiveAt timestamp for an instance
   */
  const touchInstance = useCallback(
    async (id: string) => {
      return updateInstance(id, { lastActiveAt: Date.now() });
    },
    [updateInstance]
  );

  /**
   * Get instances for the current day (4am boundary)
   * Returns incomplete instances + completed instances from today
   */
  const getCurrentDayInstances = useCallback(() => {
    return instances.filter((instance) => {
      // Always show incomplete instances
      if (!instance.completed) return true;

      // Show completed instances only if completed today
      if (instance.completedAt && isCurrentDay(instance.completedAt)) return true;

      return false;
    });
  }, [instances]);

  /**
   * Get instances sorted by status and last active time
   * Incomplete instances first, then by most recent lastActiveAt
   */
  const getSortedInstances = useCallback((instancesToSort?: ActivityInstance[]) => {
    const toSort = instancesToSort || instances;
    return [...toSort].sort((a, b) => {
      // Incomplete before completed
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Most recently active first
      return b.lastActiveAt - a.lastActiveAt;
    });
  }, [instances]);

  return {
    instances,
    incompleteInstances: instances.filter((i) => !i.completed),
    completedInstances: instances.filter((i) => i.completed),
    currentDayInstances: getCurrentDayInstances(),
    sortedInstances: getSortedInstances(),
    loading,
    createInstance,
    updateInstance,
    deleteInstance,
    completeInstance,
    uncompleteInstance,
    restartInstance,
    touchInstance,
    getCurrentDayInstances,
    getSortedInstances,
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

  /**
   * Switch to a different activity (auto-pause current and start new)
   */
  const switchActivity = useCallback(
    async (activityId: string) => {
      if (!session) {
        // No current session, just start the new activity
        return startActivity(activityId);
      }

      // Pause the current activity if it's running
      let currentLog = session.currentLog;
      if (!session.isPaused) {
        // Add pause interval
        currentLog = {
          ...currentLog,
          pauseIntervals: [
            ...currentLog.pauseIntervals,
            { pausedAt: Date.now() },
          ],
        };
      }

      // Create new activity log
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        activityId,
        startTime: Date.now(),
        duration: 0,
        pauseIntervals: [],
      };

      // Push current activity to stack and start new one
      const newSession: ActivitySession = {
        currentLog: newLog,
        isPaused: false,
        pausedActivityStack: [...session.pausedActivityStack, currentLog],
      };

      await saveSession(newSession);
      return newSession;
    },
    [session, saveSession, startActivity]
  );

  /**
   * Resume an activity from the paused stack
   */
  const resumeFromStack = useCallback(
    async (stackIndex?: number) => {
      if (!session || session.pausedActivityStack.length === 0) {
        return session;
      }

      // Default to the most recent paused activity (top of stack)
      const index = stackIndex !== undefined ? stackIndex : session.pausedActivityStack.length - 1;

      if (index < 0 || index >= session.pausedActivityStack.length) {
        throw new Error('Invalid stack index');
      }

      // Get the activity to resume from the stack
      const activityToResume = session.pausedActivityStack[index];

      // Remove the activity from the stack
      const newStack = session.pausedActivityStack.filter((_, i) => i !== index);

      // Pause the current activity if it's running
      let currentLog = session.currentLog;
      if (!session.isPaused) {
        currentLog = {
          ...currentLog,
          pauseIntervals: [
            ...currentLog.pauseIntervals,
            { pausedAt: Date.now() },
          ],
        };
      }

      // Resume the selected activity
      const lastPauseIndex = activityToResume.pauseIntervals.length - 1;
      const updatedPauseIntervals = [...activityToResume.pauseIntervals];
      if (lastPauseIndex >= 0 && !updatedPauseIntervals[lastPauseIndex].resumedAt) {
        updatedPauseIntervals[lastPauseIndex] = {
          ...updatedPauseIntervals[lastPauseIndex],
          resumedAt: Date.now(),
        };
      }

      const resumedLog: ActivityLog = {
        ...activityToResume,
        pauseIntervals: updatedPauseIntervals,
      };

      // Update session with resumed activity as current and previous current added to stack
      const newSession: ActivitySession = {
        currentLog: resumedLog,
        isPaused: false,
        pausedActivityStack: [...newStack, currentLog],
      };

      await saveSession(newSession);
      return newSession;
    },
    [session, saveSession]
  );

  return {
    session,
    loading,
    startActivity,
    pauseActivity,
    resumeActivity,
    stopActivity,
    switchActivity,
    resumeFromStack,
  };
}
