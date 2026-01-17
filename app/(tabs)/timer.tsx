/**
 * Activity Timer screen - for tracking time spent on activities
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimerDisplay } from '@/components/timer-display';
import { ActivityPicker } from '@/components/activity-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useActivities, useActivitySession } from '@/hooks/use-activities';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Activity } from '@/types/activity';

export default function TimerScreen() {
  const { activeActivities, loading: activitiesLoading } = useActivities();
  const { session, startActivity, pauseActivity, resumeActivity, stopActivity } = useActivitySession();
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');

  // Load current activity details
  useEffect(() => {
    if (session?.currentLog.activityId && activeActivities.length > 0) {
      const activity = activeActivities.find(a => a.id === session.currentLog.activityId);
      setCurrentActivity(activity || null);
    } else {
      setCurrentActivity(null);
    }
  }, [session, activeActivities]);

  const handleStartActivity = async (activity: Activity) => {
    await startActivity(activity.id);
    // currentActivity will be updated by the useEffect when session changes
  };

  const handlePause = async () => {
    await pauseActivity();
  };

  const handleResume = async () => {
    await resumeActivity();
  };

  const handleStop = async () => {
    await stopActivity();
    // currentActivity will be updated by the useEffect when session changes
  };

  const hasActiveSession = session !== null && session !== undefined;
  const isPaused = session?.isPaused || false;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Activity Timer</ThemedText>
        </View>

        {hasActiveSession && currentActivity ? (
          <View style={styles.timerSection}>
            {/* Current Activity Name */}
            <View style={styles.activityHeader}>
              {currentActivity.color && (
                <View style={[styles.colorIndicator, { backgroundColor: currentActivity.color }]} />
              )}
              <View style={styles.activityInfo}>
                <ThemedText style={styles.activityName}>{currentActivity.name}</ThemedText>
                {currentActivity.category && (
                  <ThemedText style={styles.activityCategory}>{currentActivity.category}</ThemedText>
                )}
              </View>
            </View>

            {/* Timer Display */}
            <TimerDisplay
              startTime={session.currentLog.startTime}
              pauseIntervals={session.currentLog.pauseIntervals}
              isPaused={isPaused}
              style={styles.timer}
            />

            {/* Status Indicator */}
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isPaused ? '#FFA500' : '#4CAF50' }
              ]} />
              <ThemedText style={styles.statusText}>
                {isPaused ? 'Paused' : 'Running'}
              </ThemedText>
            </View>

            {/* Control Buttons */}
            <View style={styles.controls}>
              {!isPaused ? (
                <TouchableOpacity
                  style={[styles.button, styles.pauseButton]}
                  onPress={handlePause}
                >
                  <IconSymbol name="pause" size={24} color="#fff" />
                  <ThemedText style={styles.buttonText}>Pause</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.resumeButton, { backgroundColor: tintColor }]}
                  onPress={handleResume}
                >
                  <IconSymbol name="play" size={24} color="#fff" />
                  <ThemedText style={styles.buttonText}>Resume</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={handleStop}
              >
                <IconSymbol name="stop" size={24} color="#fff" />
                <ThemedText style={styles.buttonText}>Stop & Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="clock" size={80} color={borderColor} />
            <ThemedText style={styles.emptyTitle}>No Active Timer</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Start tracking time on an activity
            </ThemedText>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: tintColor }]}
              onPress={() => setShowActivityPicker(true)}
              disabled={activitiesLoading || activeActivities.length === 0}
            >
              <IconSymbol name="plus" size={24} color="#fff" />
              <ThemedText style={styles.startButtonText}>Start Activity</ThemedText>
            </TouchableOpacity>

            {!activitiesLoading && activeActivities.length === 0 && (
              <ThemedText style={styles.noActivitiesText}>
                No active activities. Create one in Settings.
              </ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      {/* Activity Picker Modal */}
      <ActivityPicker
        visible={showActivityPicker}
        activities={activeActivities}
        onSelectActivity={handleStartActivity}
        onClose={() => setShowActivityPicker(false)}
      />
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
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  activityInfo: {
    alignItems: 'center',
  },
  activityName: {
    fontSize: 24,
    fontWeight: '600',
  },
  activityCategory: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
  timer: {
    marginVertical: 40,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
  },
  controls: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  pauseButton: {
    backgroundColor: '#FFA500',
  },
  resumeButton: {
    // backgroundColor set dynamically with tintColor
  },
  stopButton: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  noActivitiesText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 20,
  },
});
