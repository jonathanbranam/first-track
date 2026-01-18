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
  const { session, startActivity, pauseActivity, resumeActivity, stopActivity, switchActivity, resumeFromStack } = useActivitySession();
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showSwitchPicker, setShowSwitchPicker] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [stackActivities, setStackActivities] = useState<Activity[]>([]);

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  // Use background color for text/icons on tint-colored backgrounds (for contrast)
  const tintContrastColor = backgroundColor;

  // Load current activity details
  useEffect(() => {
    if (session?.currentLog.activityId && activeActivities.length > 0) {
      const activity = activeActivities.find(a => a.id === session.currentLog.activityId);
      setCurrentActivity(activity || null);
    } else {
      setCurrentActivity(null);
    }
  }, [session, activeActivities]);

  // Load paused stack activities
  useEffect(() => {
    if (session?.pausedActivityStack && activeActivities.length > 0) {
      const stackActs = session.pausedActivityStack
        .map(log => activeActivities.find(a => a.id === log.activityId))
        .filter((a): a is Activity => a !== undefined);
      setStackActivities(stackActs);
    } else {
      setStackActivities([]);
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

  const handleSwitchActivity = async (activity: Activity) => {
    await switchActivity(activity.id);
    setShowSwitchPicker(false);
  };

  const handleResumeFromStack = async (index: number) => {
    await resumeFromStack(index);
  };

  const hasActiveSession = session !== null && session !== undefined;
  const isPaused = session?.isPaused || false;
  const stackDepth = session?.pausedActivityStack.length || 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title}>Activity Timer</ThemedText>
            {stackDepth > 0 && (
              <View style={[styles.stackBadge, { backgroundColor: tintColor }]}>
                <ThemedText style={[styles.stackBadgeText, { color: tintContrastColor }]}>{stackDepth}</ThemedText>
              </View>
            )}
          </View>
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
                  <IconSymbol name="play" size={24} color={tintContrastColor} />
                  <ThemedText style={[styles.buttonText, { color: tintContrastColor }]}>Resume</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.switchButton, { borderColor: tintColor }]}
                onPress={() => setShowSwitchPicker(true)}
              >
                <IconSymbol name="arrow.left.arrow.right" size={24} color={tintColor} />
                <ThemedText style={[styles.switchButtonText, { color: tintColor }]}>Switch Activity</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={handleStop}
              >
                <IconSymbol name="stop" size={24} color="#fff" />
                <ThemedText style={styles.buttonText}>Stop & Save</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Paused Activity Stack */}
            {stackDepth > 0 && (
              <View style={styles.stackSection}>
                <ThemedText style={styles.stackTitle}>
                  Paused Activities ({stackDepth})
                </ThemedText>
                <View style={styles.stackList}>
                  {stackActivities.map((activity, index) => (
                    <TouchableOpacity
                      key={`${activity.id}-${index}`}
                      style={[styles.stackItem, { borderColor: borderColor }]}
                      onPress={() => handleResumeFromStack(index)}
                    >
                      {activity.color && (
                        <View style={[styles.stackColorIndicator, { backgroundColor: activity.color }]} />
                      )}
                      <View style={styles.stackItemInfo}>
                        <ThemedText style={styles.stackItemName}>{activity.name}</ThemedText>
                        {activity.category && (
                          <ThemedText style={styles.stackItemCategory}>{activity.category}</ThemedText>
                        )}
                      </View>
                      <IconSymbol name="play.circle" size={24} color={tintColor} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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
              <IconSymbol name="plus" size={24} color={tintContrastColor} />
              <ThemedText style={[styles.startButtonText, { color: tintContrastColor }]}>Start Activity</ThemedText>
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

      {/* Switch Activity Picker Modal */}
      <ActivityPicker
        visible={showSwitchPicker}
        activities={activeActivities}
        onSelectActivity={handleSwitchActivity}
        onClose={() => setShowSwitchPicker(false)}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  stackBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stackBadgeText: {
    color: '#fff',
    fontSize: 14,
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
  switchButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButtonText: {
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
  stackSection: {
    marginTop: 32,
  },
  stackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stackList: {
    gap: 8,
  },
  stackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  stackColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stackItemInfo: {
    flex: 1,
  },
  stackItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  stackItemCategory: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
});
