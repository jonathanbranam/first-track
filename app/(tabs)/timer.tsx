/**
 * Activity Timer screen - for tracking time spent on activity instances
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuickLogFAB } from '@/components/behaviors/quick-log-fab';
import { ActivityInstanceModal } from '@/components/activities/activity-instance-modal';
import { ActivityInstanceItem } from '@/components/activities/activity-instance-item';
import {
  useActivityInstances,
  useActivityTypes,
  useActivitySession,
  useActivityLogs,
  calculateAccumulatedDuration,
} from '@/hooks/use-activities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ActivityInstance, ActivityLog } from '@/types/activity';

export default function TimerScreen() {
  const { currentDayInstances, getSortedInstances, createInstance, updateInstance, deleteInstance, completeInstance, restartInstance, refresh: refreshInstances } = useActivityInstances();
  const { activeActivityTypes, createActivityType } = useActivityTypes();
  const { session, startActivity, pauseActivity, resumeActivity, stopActivity } = useActivitySession();
  const { logs } = useActivityLogs('all');

  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ActivityInstance | null>(null);

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const tintContrastColor = backgroundColor;

  // Sort instances: incomplete first, then by lastActiveAt descending
  const sortedInstances = useMemo(() => {
    return getSortedInstances(currentDayInstances);
  }, [currentDayInstances, getSortedInstances]);

  // Get accumulated duration for each paused instance
  const getInstanceAccumulatedDuration = (instanceId: string): number => {
    // If this instance is currently in session (paused), calculate from session log
    if (session && session.currentLog.activityId === instanceId) {
      return calculateAccumulatedDuration(session.currentLog);
    }

    // Check if this instance is in the paused stack
    if (session?.pausedActivityStack) {
      const stackLog = session.pausedActivityStack.find(log => log.activityId === instanceId);
      if (stackLog) {
        return calculateAccumulatedDuration(stackLog);
      }
    }

    // Otherwise, sum up all completed logs for this instance
    const instanceLogs = logs.filter(log => log.activityId === instanceId && log.endTime);
    return instanceLogs.reduce((total, log) => total + log.duration, 0);
  };

  // Handle creating a new activity instance
  const handleCreateInstance = async (title: string, description: string, typeId: string, shouldStartTimer: boolean) => {
    const newInstance = await createInstance({ title, description, typeId });
    setShowInstanceModal(false);

    if (shouldStartTimer) {
      // Start timer immediately
      await handleStartInstance(newInstance.id);
    }

    await refreshInstances();
  };

  // Handle editing an activity instance
  const handleEditInstance = (instance: ActivityInstance) => {
    setEditingInstance(instance);
    setShowInstanceModal(true);
  };

  // Handle saving edited instance
  const handleSaveEditedInstance = async (title: string, description: string, typeId: string) => {
    if (!editingInstance) return;

    await updateInstance(editingInstance.id, { title, description, typeId });
    setEditingInstance(null);
    setShowInstanceModal(false);
    await refreshInstances();
  };

  // Handle starting/resuming an instance
  const handleStartInstance = async (instanceId: string) => {
    // If there's an active session, auto-pause it first
    if (session && !session.isPaused) {
      await pauseActivity();
    }

    // If this instance is already the current one and paused, just resume it
    if (session && session.currentLog.activityId === instanceId && session.isPaused) {
      await resumeActivity();
    } else {
      // Start a new session for this instance
      await startActivity(instanceId);
    }

    await refreshInstances();
  };

  // Handle pausing the current instance
  const handlePauseInstance = async () => {
    await pauseActivity();
    await refreshInstances();
  };

  // Handle completing an instance
  const handleCompleteInstance = async (instanceId: string) => {
    // If this instance is currently active, stop the timer first
    if (session && session.currentLog.activityId === instanceId) {
      await stopActivity();
    }

    await completeInstance(instanceId);
    await refreshInstances();
  };

  // Handle restarting a completed instance
  const handleRestartInstance = async (instanceId: string) => {
    await restartInstance(instanceId);
    await refreshInstances();
  };

  // Handle deleting an instance
  const handleDeleteInstance = (instanceId: string) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity instance? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // If this instance is currently active, stop the timer first
            if (session && session.currentLog.activityId === instanceId) {
              await stopActivity();
            }

            await deleteInstance(instanceId);
            await refreshInstances();
          },
        },
      ]
    );
  };

  // Handle creating a new activity type on-the-fly
  const handleCreateNewType = async (name: string, color: string) => {
    return await createActivityType({ name, color });
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setShowInstanceModal(false);
    setEditingInstance(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Title */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Activity Timer</ThemedText>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: tintColor }]}
            onPress={() => setShowInstanceModal(true)}>
            <IconSymbol name="plus" size={20} color={tintContrastColor} />
            <ThemedText style={[styles.newButtonText, { color: tintContrastColor }]}>
              New Activity
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Activity Instances List */}
        {sortedInstances.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="clock" size={80} color={borderColor} />
            <ThemedText style={styles.emptyTitle}>No Activities Yet</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Create an activity to start tracking your time
            </ThemedText>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: tintColor }]}
              onPress={() => setShowInstanceModal(true)}>
              <IconSymbol name="plus" size={24} color={tintContrastColor} />
              <ThemedText style={[styles.emptyButtonText, { color: tintContrastColor }]}>
                Create Activity
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.instancesList}>
            {sortedInstances.map((instance) => {
              const isActive = session?.currentLog.activityId === instance.id;
              const isPaused = isActive && session?.isPaused;
              const activityType = activeActivityTypes.find(t => t.id === instance.typeId);
              const accumulatedDuration = getInstanceAccumulatedDuration(instance.id);

              return (
                <ActivityInstanceItem
                  key={instance.id}
                  instance={instance}
                  activityType={activityType}
                  isActive={isActive}
                  isPaused={isPaused}
                  currentLog={isActive ? session?.currentLog : undefined}
                  accumulatedDuration={accumulatedDuration}
                  onStart={() => handleStartInstance(instance.id)}
                  onPause={handlePauseInstance}
                  onComplete={() => handleCompleteInstance(instance.id)}
                  onRestart={() => handleRestartInstance(instance.id)}
                  onEdit={() => handleEditInstance(instance)}
                  onDelete={() => handleDeleteInstance(instance.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Activity Instance Modal */}
      <ActivityInstanceModal
        visible={showInstanceModal}
        title={editingInstance?.title}
        description={editingInstance?.description}
        typeId={editingInstance?.typeId}
        mode={editingInstance ? 'edit' : 'create'}
        onClose={handleCloseModal}
        onSave={editingInstance ? handleSaveEditedInstance : handleCreateInstance}
        onCreateNewType={handleCreateNewType}
      />

      <QuickLogFAB />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  instancesList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  emptyButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
