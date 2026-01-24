/**
 * Custom hook for managing behaviors and behavior logs
 */

import { useState, useEffect, useCallback } from 'react';
import { Behavior, BehaviorLog } from '@/types/behavior';
import { useStorage, getStorageItem, setStorageItem, removeStorageItem } from './use-storage';

const BEHAVIORS_LIST_KEY = 'all';
const BEHAVIORS_LABEL = 'behaviors';
const BEHAVIOR_LABEL = 'behavior';
const BEHAVIOR_LOGS_LABEL = 'behavior-logs';
const BEHAVIOR_LOG_LABEL = 'behavior-log';

/**
 * Hook for managing the list of all behaviors
 */
export function useBehaviors() {
  const { data: behaviorIds, loading, save: saveBehaviorIds, refresh } = useStorage<string[]>(
    BEHAVIORS_LABEL,
    BEHAVIORS_LIST_KEY
  );
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);

  // Load all behaviors whenever behaviorIds changes
  useEffect(() => {
    if (!behaviorIds || loading) return;

    async function loadBehaviors() {
      const loaded = await Promise.all(
        behaviorIds!.map((id) => getStorageItem<Behavior>(BEHAVIOR_LABEL, id))
      );
      const validBehaviors = loaded.filter((behavior): behavior is Behavior => behavior !== null);
      setBehaviors(validBehaviors);
    }

    loadBehaviors();
  }, [behaviorIds, loading]);

  /**
   * Create a new behavior
   */
  const createBehavior = useCallback(
    async (behavior: Omit<Behavior, 'id' | 'createdAt' | 'active'>) => {
      const newBehavior: Behavior = {
        ...behavior,
        id: Date.now().toString(),
        createdAt: Date.now(),
        active: true,
      };

      // Save the behavior
      await setStorageItem(BEHAVIOR_LABEL, newBehavior.id, newBehavior);

      // Update the behaviors list - read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(BEHAVIORS_LABEL, BEHAVIORS_LIST_KEY);
      const updatedIds = [...(currentIds || []), newBehavior.id];
      await saveBehaviorIds(updatedIds);

      setBehaviors((prev) => [...prev, newBehavior]);
      return newBehavior;
    },
    [saveBehaviorIds]
  );

  /**
   * Update an existing behavior
   */
  const updateBehavior = useCallback(async (id: string, updates: Partial<Behavior>) => {
    const existing = await getStorageItem<Behavior>(BEHAVIOR_LABEL, id);
    if (!existing) throw new Error('Behavior not found');

    const updated: Behavior = { ...existing, ...updates };
    await setStorageItem(BEHAVIOR_LABEL, id, updated);

    setBehaviors((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  /**
   * Delete a behavior
   */
  const deleteBehavior = useCallback(
    async (id: string) => {
      await removeStorageItem(BEHAVIOR_LABEL, id);

      // Read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(BEHAVIORS_LABEL, BEHAVIORS_LIST_KEY);
      const updatedIds = (currentIds || []).filter((behaviorId) => behaviorId !== id);
      await saveBehaviorIds(updatedIds);

      setBehaviors((prev) => prev.filter((b) => b.id !== id));
    },
    [saveBehaviorIds]
  );

  /**
   * Deactivate a behavior (soft delete - keeps it in system but marks as inactive)
   */
  const deactivateBehavior = useCallback(
    async (id: string) => {
      return updateBehavior(id, { active: false, deactivatedAt: Date.now() });
    },
    [updateBehavior]
  );

  /**
   * Reactivate a behavior
   */
  const reactivateBehavior = useCallback(
    async (id: string) => {
      return updateBehavior(id, { active: true, deactivatedAt: undefined });
    },
    [updateBehavior]
  );

  /**
   * Create default seed behaviors
   */
  const createDefaultBehaviors = useCallback(async () => {
    const defaultBehaviors = [
      { name: 'Pushups', type: 'reps' as const, units: 'reps' },
      { name: 'Squats', type: 'reps' as const, units: 'reps' },
      { name: 'Curls', type: 'weight' as const, units: 'lbs' },
      { name: 'Meditation', type: 'duration' as const, units: 'minutes' },
      { name: 'Walking', type: 'duration' as const, units: 'minutes' },
      { name: 'Running', type: 'duration' as const, units: 'minutes' },
      { name: 'Biking', type: 'duration' as const, units: 'minutes' },
      { name: 'Water Intake', type: 'count' as const, units: 'glasses' },
    ];

    for (const behavior of defaultBehaviors) {
      await createBehavior(behavior);
    }
  }, [createBehavior]);

  return {
    behaviors,
    activeBehaviors: behaviors.filter((b) => b.active),
    inactiveBehaviors: behaviors.filter((b) => !b.active),
    loading,
    createBehavior,
    updateBehavior,
    deleteBehavior,
    deactivateBehavior,
    reactivateBehavior,
    createDefaultBehaviors,
    refresh,
  };
}

/**
 * Hook for managing behavior logs
 */
export function useBehaviorLogs(behaviorId?: string) {
  const { data: allLogIds, loading, save: saveLogIds, refresh } = useStorage<string[]>(
    BEHAVIOR_LOGS_LABEL,
    behaviorId || 'all'
  );
  const [logs, setLogs] = useState<BehaviorLog[]>([]);

  // Load all logs whenever logIds changes
  useEffect(() => {
    if (!allLogIds || loading) return;

    async function loadLogs() {
      const loaded = await Promise.all(
        allLogIds!.map((id) => getStorageItem<BehaviorLog>(BEHAVIOR_LOG_LABEL, id))
      );
      const validLogs = loaded.filter((log): log is BehaviorLog => log !== null);
      setLogs(validLogs);
    }

    loadLogs();
  }, [allLogIds, loading]);

  /**
   * Create a new behavior log
   */
  const createLog = useCallback(
    async (log: Omit<BehaviorLog, 'id'>) => {
      const newLog: BehaviorLog = {
        ...log,
        id: Date.now().toString(),
      };

      // Save the log
      await setStorageItem(BEHAVIOR_LOG_LABEL, newLog.id, newLog);

      // Update the logs list for 'all'
      const allLogsKey = 'all';
      const allLogIds = await getStorageItem<string[]>(BEHAVIOR_LOGS_LABEL, allLogsKey);
      const updatedAllIds = [...(allLogIds || []), newLog.id];
      await setStorageItem(BEHAVIOR_LOGS_LABEL, allLogsKey, updatedAllIds);

      // Update the logs list for this specific behavior
      if (log.behaviorId) {
        const behaviorLogIds = await getStorageItem<string[]>(BEHAVIOR_LOGS_LABEL, log.behaviorId);
        const updatedBehaviorIds = [...(behaviorLogIds || []), newLog.id];
        await setStorageItem(BEHAVIOR_LOGS_LABEL, log.behaviorId, updatedBehaviorIds);
      }

      setLogs((prev) => [...prev, newLog]);
      return newLog;
    },
    []
  );

  /**
   * Update an existing log
   */
  const updateLog = useCallback(async (id: string, updates: Partial<BehaviorLog>) => {
    const existing = await getStorageItem<BehaviorLog>(BEHAVIOR_LOG_LABEL, id);
    if (!existing) throw new Error('Behavior log not found');

    const updated: BehaviorLog = { ...existing, ...updates };
    await setStorageItem(BEHAVIOR_LOG_LABEL, id, updated);

    setLogs((prev) => prev.map((log) => (log.id === id ? updated : log)));
    return updated;
  }, []);

  /**
   * Delete a log
   */
  const deleteLog = useCallback(
    async (id: string) => {
      const existing = await getStorageItem<BehaviorLog>(BEHAVIOR_LOG_LABEL, id);
      if (!existing) return;

      await removeStorageItem(BEHAVIOR_LOG_LABEL, id);

      // Remove from 'all' logs list
      const allLogsKey = 'all';
      const allLogIds = await getStorageItem<string[]>(BEHAVIOR_LOGS_LABEL, allLogsKey);
      if (allLogIds) {
        const updatedAllIds = allLogIds.filter((logId) => logId !== id);
        await setStorageItem(BEHAVIOR_LOGS_LABEL, allLogsKey, updatedAllIds);
      }

      // Remove from specific behavior logs list
      if (existing.behaviorId) {
        const behaviorLogIds = await getStorageItem<string[]>(BEHAVIOR_LOGS_LABEL, existing.behaviorId);
        if (behaviorLogIds) {
          const updatedBehaviorIds = behaviorLogIds.filter((logId) => logId !== id);
          await setStorageItem(BEHAVIOR_LOGS_LABEL, existing.behaviorId, updatedBehaviorIds);
        }
      }

      setLogs((prev) => prev.filter((log) => log.id !== id));
    },
    []
  );

  /**
   * Get logs for a specific date range
   */
  const getLogsByDateRange = useCallback(
    (startDate: number, endDate: number) => {
      return logs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);
    },
    [logs]
  );

  /**
   * Get daily total for a specific behavior
   */
  const getDailyTotal = useCallback(
    (behaviorId: string, date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dailyLogs = logs.filter(
        (log) =>
          log.behaviorId === behaviorId &&
          log.timestamp >= startOfDay.getTime() &&
          log.timestamp <= endOfDay.getTime()
      );

      return dailyLogs.reduce((total, log) => total + log.quantity, 0);
    },
    [logs]
  );

  return {
    logs,
    loading,
    createLog,
    updateLog,
    deleteLog,
    getLogsByDateRange,
    getDailyTotal,
    refresh,
  };
}
