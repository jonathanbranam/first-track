/**
 * Activity Instance Item component - displays an activity instance with actions
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { TimerDisplay } from '@/components/timer-display';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ActivityInstance, ActivityType, ActivityLog } from '@/types/activity';
import { isCurrentDay } from '@/hooks/use-activities';

interface ActivityInstanceItemProps {
  instance: ActivityInstance;
  activityType?: ActivityType;
  isActive?: boolean;
  isPaused?: boolean;
  currentLog?: ActivityLog;
  accumulatedDuration?: number; // For paused instances, the total time accumulated so far
  onStart?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onRestart?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActivityInstanceItem({
  instance,
  activityType,
  isActive = false,
  isPaused = false,
  currentLog,
  accumulatedDuration = 0,
  onStart,
  onPause,
  onComplete,
  onRestart,
  onEdit,
  onDelete,
}: ActivityInstanceItemProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const tintContrastColor = backgroundColor;

  const canRestart = instance.completed && instance.completedAt && isCurrentDay(instance.completedAt);
  const typeColor = activityType?.color || '#999';

  // Calculate status text
  let statusText = '';
  let statusColor = '#999';
  if (isActive && !isPaused) {
    statusText = 'Active';
    statusColor = '#4CAF50';
  } else if (isActive && isPaused) {
    statusText = 'Paused';
    statusColor = '#FFA500';
  } else if (instance.completed) {
    statusText = 'Completed';
    statusColor = '#999';
  } else {
    statusText = 'Ready';
    statusColor = '#999';
  }

  // Format accumulated duration for paused instances
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.container,
        { borderColor: borderColor },
        instance.completed && styles.completedContainer,
      ]}>
      {/* Header with type color and title */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeColorDot, { backgroundColor: typeColor }]} />
          <View style={styles.titleContainer}>
            <ThemedText
              style={[
                styles.title,
                instance.completed && styles.completedText,
              ]}>
              {instance.title}
            </ThemedText>
            {activityType && (
              <ThemedText style={styles.typeName}>{activityType.name}</ThemedText>
            )}
            {instance.description && (
              <ThemedText style={styles.description} numberOfLines={2}>
                {instance.description}
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {instance.completed && (
            <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
          )}
        </View>
      </View>

      {/* Timer Display or Accumulated Time */}
      {isActive && currentLog && (
        <View style={styles.timerSection}>
          <TimerDisplay
            startTime={currentLog.startTime}
            pauseIntervals={currentLog.pauseIntervals}
            isPaused={isPaused}
            style={styles.timer}
          />
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={styles.statusText}>{statusText}</ThemedText>
          </View>
        </View>
      )}

      {!isActive && !instance.completed && accumulatedDuration > 0 && (
        <View style={styles.accumulatedTimeSection}>
          <ThemedText style={styles.accumulatedTimeLabel}>Total time:</ThemedText>
          <ThemedText style={styles.accumulatedTime}>{formatDuration(accumulatedDuration)}</ThemedText>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Start/Resume/Pause buttons */}
        {!instance.completed && (
          <>
            {!isActive && onStart && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: tintColor }]}
                onPress={onStart}>
                <IconSymbol name="play.fill" size={16} color={tintContrastColor} />
                <ThemedText style={[styles.actionButtonText, { color: tintContrastColor }]}>
                  {accumulatedDuration > 0 ? 'Resume' : 'Start'}
                </ThemedText>
              </TouchableOpacity>
            )}
            {isActive && !isPaused && onPause && (
              <TouchableOpacity
                style={[styles.actionButton, styles.pauseButton]}
                onPress={onPause}>
                <IconSymbol name="pause.fill" size={16} color="#fff" />
                <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>Pause</ThemedText>
              </TouchableOpacity>
            )}
            {isActive && isPaused && onStart && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: tintColor }]}
                onPress={onStart}>
                <IconSymbol name="play.fill" size={16} color={tintContrastColor} />
                <ThemedText style={[styles.actionButtonText, { color: tintContrastColor }]}>Resume</ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Complete button */}
        {!instance.completed && onComplete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={onComplete}>
            <IconSymbol name="checkmark.circle" size={16} color="#fff" />
            <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>Complete</ThemedText>
          </TouchableOpacity>
        )}

        {/* Restart button (only for completed instances from today) */}
        {instance.completed && canRestart && onRestart && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: tintColor }]}
            onPress={onRestart}>
            <IconSymbol name="arrow.counterclockwise" size={16} color={tintContrastColor} />
            <ThemedText style={[styles.actionButtonText, { color: tintContrastColor }]}>Restart</ThemedText>
          </TouchableOpacity>
        )}

        {/* Edit and Delete buttons */}
        <View style={styles.secondaryActions}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: borderColor }]}
              onPress={onEdit}>
              <IconSymbol name="pencil" size={18} color={tintColor} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: borderColor }]}
              onPress={onDelete}>
              <IconSymbol name="trash" size={18} color="#DC3545" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completedContainer: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  typeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  typeName: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timer: {
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accumulatedTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  accumulatedTimeLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginRight: 8,
  },
  accumulatedTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  pauseButton: {
    backgroundColor: '#FFA500',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
